import { memoryCache } from '../cache/memoryCache.js';
import * as scanHistoryRepo from '../repositories/scanHistory.repository.js';
import * as communityProductRepo from '../repositories/communityProduct.repository.js';
import * as rakutenClient from '../clients/rakuten.client.js';
import * as geminiClient from '../clients/gemini.client.js';
import { getTranslationClient } from '../clients/translation/TranslationClient.js';
import { NotFoundError, AnalysisError, TimeoutError } from '../errors/AppError.js';

/**
 * BL-003 상품 조회 폴백 / BL-004 번역 / BL-005 캐시.
 * 폴백 순서: 메모리 캐시 → community_products(DB) → 라쿠텐 productCode
 *           → (analyze-image) Gemini 추출 → 라쿠텐 keyword 재조회 → ai 판단.
 * 적용 BR: BR-002~008, BR-011, BR-012.
 */

// ─── GET /api/products/lookup ───
export async function lookup({ jan }) {
  const scan = await scanHistoryRepo.start(jan); // 1스캔=1row (P-5)

  // [BL-005] 메모리 캐시 — HIT 시 외부 호출 생략, 원래 lookupType 유지(BR-008)
  const cached = memoryCache.get(jan);
  if (cached) {
    await scanHistoryRepo.update(scan.id, {
      found: true,
      lookupType: cached.lookupType,
      productId: cached.productId ?? null,
    });
    return buildResult(scan.id, jan, cached);
  }

  // community_products(DB) — 이전에 keyword/ai 로 등록된 동일 바코드 재사용(06 폴백)
  const dbProduct = await communityProductRepo.findByBarcode(jan);
  if (dbProduct) {
    if (dbProduct.lookupType !== 'ai') memoryCache.set(jan, dbProduct); // ai 캐시 금지
    await scanHistoryRepo.update(scan.id, {
      found: true,
      lookupType: dbProduct.lookupType,
      productId: dbProduct.productId,
    });
    return buildResult(scan.id, jan, dbProduct);
  }

  // [1차] 라쿠텐 productCode 조회 (BR-002, 타임아웃 5초 BR-003)
  let r1 = null;
  try {
    r1 = await rakutenClient.searchByProductCode(jan);
  } catch (e) {
    if (e instanceof TimeoutError) r1 = null; // F-003-E1 → 촬영 전환
    else throw e; // 429(E2)·기타는 그대로 전파
  }
  if (r1) {
    const product = await withTranslation({ ...r1, lookupType: 'barcode' });
    memoryCache.set(jan, product); // barcode 캐시 가능
    // barcode 결과는 DB 저장 안 함(03-api-spec §12: F-003 DB 저장은 keyword/ai 만)
    await scanHistoryRepo.update(scan.id, { found: true, lookupType: 'barcode' });
    return buildResult(scan.id, jan, product);
  }

  // 조회 실패 → 상품 전면 촬영 요청 (scan_history found=false 유지)
  throw new NotFoundError(undefined, { data: { scanHistoryId: scan.id, barcode: jan } });
}

// ─── POST /api/products/analyze-image ───
export async function analyzeImage({ jan, scanHistoryId, photo, userId }) {
  // Gemini 단일 추출 (일본어 원문 + search_keywords + full_text_jp). 번역 X(BR-006).
  const extracted = await geminiClient.extract(photo.buffer, photo.mimetype);

  const hasName = !!extracted?.name_jp;
  const keywords = Array.isArray(extracted?.search_keywords) ? extracted.search_keywords : [];
  if (!extracted || extracted.found === false || (!hasName && keywords.length === 0)) {
    // F-003-E4 상품명 추출 실패
    throw new AnalysisError('상품명이 잘 보이게 다시 촬영해주세요.', {
      nextAction: 'CAPTURE_PRODUCT_IMAGE',
    });
  }

  // [재조회] 라쿠텐 keyword (BR-004) — 키워드 구성·재시도는 keywordSearch 에 위임(과다어 0건 방지).
  const r2 = await keywordSearch(extracted, keywords);

  if (r2) {
    const product = await withTranslation({ ...r2, lookupType: 'keyword' });
    const productId = await persistCommunityProduct({ ...product, barcode: jan, userId });
    product.productId = productId;
    memoryCache.set(jan, product); // keyword 캐시 가능
    await scanHistoryRepo.update(scanHistoryId, {
      found: true,
      lookupType: 'keyword',
      productId,
    });
    return buildResult(scanHistoryId, jan, product);
  }

  // [폴백] ai 판단 (F-003-E5) — 같은 Gemini 추출 재사용, 추가 호출 없음
  const t = getTranslationClient();
  const [nameKo, brandKo] = await t.translateBatch([
    extracted.name_jp ?? null,
    extracted.brand_jp ?? null,
  ]);
  const aiProduct = {
    nameOriginal: extracted.name_jp ?? keywords[0] ?? null,
    nameKo,
    brandNameOriginal: extracted.brand_jp ?? null,
    brandNameKo: brandKo,
    price: null, // BR-005 AI 가격 미신뢰 → null
    currency: 'JPY',
    imageUrl: null, // 촬영 이미지 업로드 미구현(스토리지 키 필요) → null
    lookupType: 'ai',
  };
  const productId = await persistCommunityProduct({ ...aiProduct, barcode: jan, userId });
  aiProduct.productId = productId;
  // ai 결과는 캐시 금지 (CLAUDE.md §2)
  await scanHistoryRepo.update(scanHistoryId, { found: false, lookupType: 'ai', productId });
  return { ...buildResult(scanHistoryId, jan, aiProduct), notice: 'AI 이미지 판단 기반 참고 정보' };
  // full_text_jp 는 저장하지 않음(컬럼 미추가, 06 §5). 표시용 번역은 응답 스키마 외 → 추후 확장.
}

// ─── 내부 헬퍼 ───

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 라쿠텐 keyword 재조회 (BR-004). 라쿠텐 keyword 는 공백=AND 라
 * "브랜드+상품명+색/용량"처럼 어절이 많으면 0건이 잦다(검증: 4어→0건, 2어→17건).
 *  ① 브랜드+상품명(없으면 search_keywords)로 검색
 *  ② 0건이고 3어 이상이면 앞 2어로 좁혀 1회 재시도(뒤쪽 색/용량 수식어 제거)
 * 재시도 사이엔 라쿠텐 rate limit(~1req/s) 회피용 간격을 둔다(테스트 제외).
 * 타임아웃→null(ai 폴백), 429(E2)·기타는 전파(기존 동작 유지).
 */
async function keywordSearch(extracted, keywords) {
  const brand = extracted.brand_jp?.trim() || '';
  const name = extracted.name_jp?.trim() || '';
  const primary = ([brand, name].filter(Boolean).join(' ') || keywords.join(' ')).trim();
  if (!primary) return null;

  const tokens = primary.split(/\s+/).filter(Boolean);
  const broaden = tokens.length > 2 ? tokens.slice(0, 2).join(' ') : null;
  const candidates = [...new Set([primary, broaden].filter(Boolean))];

  for (let i = 0; i < candidates.length; i += 1) {
    if (i > 0 && process.env.NODE_ENV !== 'test') await sleep(1100); // rate limit 회피
    try {
      const r = await rakutenClient.searchByKeyword(candidates[i]);
      if (r) return r;
    } catch (e) {
      if (e instanceof TimeoutError) return null; // 타임아웃 → ai 폴백
      throw e; // 429(E2)·기타 전파
    }
  }
  return null;
}

// BL-004 번역: 라쿠텐 결과(nameOriginal 존재)면 일→한 번역. 설명·요약 없음(BR-007).
async function withTranslation(product) {
  if (product.nameOriginal != null) {
    const t = getTranslationClient();
    const [nameKo, brandKo] = await t.translateBatch([
      product.nameOriginal,
      product.brandNameOriginal ?? null,
    ]);
    product.nameKo = nameKo;
    product.brandNameKo = brandKo;
  }
  return product;
}

// BL-006 일부: barcode 로 find-or-create 해서 productId 확보 (keyword/ai 저장용)
async function persistCommunityProduct(product) {
  const existing = await communityProductRepo.findByBarcode(product.barcode);
  if (existing) {
    await communityProductRepo.enrich(existing, product); // 빈약한 기존 레코드 보강(가산적)
    return existing.productId;
  }
  return communityProductRepo.insert(product);
}

// 03-api-spec §9.1 / §10 응답 형태 (캐시 여부 미노출)
function buildResult(scanHistoryId, barcode, product) {
  return {
    lookupType: product.lookupType,
    scanHistoryId,
    barcode,
    product: {
      nameOriginal: product.nameOriginal ?? null,
      nameKo: product.nameKo ?? null,
      brandNameOriginal: product.brandNameOriginal ?? null,
      brandNameKo: product.brandNameKo ?? null,
      price: product.price ?? null,
      currency: product.currency ?? 'JPY',
      imageUrl: product.imageUrl ?? null,
    },
  };
}
