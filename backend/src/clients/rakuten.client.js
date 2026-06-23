import { config, requireConfig } from '../config/env.js';
import { RateLimitError, TimeoutError, ExternalApiError } from '../errors/AppError.js';

/**
 * 라쿠텐 Product Search API 클라이언트 (F-003 / BL-003, 03-api-spec §7).
 * 외부 호출 + DTO 매핑만. 비즈니스 분기는 service.
 * - 1차: productCode(JAN) 조회 (BR-002)
 * - 2차: keyword(일본어 검색어) 재조회 (BR-004)
 * - 타임아웃 5초(BR-003) → TimeoutError, 429 → RateLimitError(F-003-E2)
 */
export async function searchByProductCode(jan) {
  return search({ productCode: jan });
}

export async function searchByKeyword(keyword) {
  return search({ keyword });
}

async function search(params) {
  const applicationId = requireConfig('rakuten.applicationId');
  const accessKey = requireConfig('rakuten.accessKey');

  const url = new URL(config.rakuten.baseUrl);
  url.searchParams.set('format', 'json');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  if (config.rakuten.affiliateId) url.searchParams.set('affiliateId', config.rakuten.affiliateId);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.rakuten.timeoutMs); // BR-003 (5초)
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new TimeoutError('라쿠텐 조회 시간이 초과되었습니다.', { cause: e }); // F-003-E1
    }
    throw new ExternalApiError('라쿠텐 호출에 실패했습니다.', { cause: e });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 429) {
    throw new RateLimitError('라쿠텐 호출 한도를 초과했습니다.'); // F-003-E2
  }
  if (!res.ok) {
    throw new ExternalApiError('라쿠텐 조회에 실패했습니다.');
  }

  const json = await res.json().catch(() => null);
  const product = json?.Products?.[0]?.Product;
  return product ? mapToDTO(product) : null; // 결과 없으면 null
}

// 03-api-spec §7.5 응답 필드 매핑. 상품 설명(productCaption)은 미사용(BR-007).
function mapToDTO(p) {
  return {
    rakutenProductId: p.productId ?? null,
    barcode: p.productCode ?? null,
    nameOriginal: p.productName ?? null,
    brandNameOriginal: p.brandName ?? null,
    price: p.salesMinPrice ?? null, // null=정보없음 / 0=실제 0원 (BR-010)
    imageUrl: p.mediumImageUrl || p.smallImageUrl || null, // §9.4
    currency: 'JPY', // BR-012
  };
}
