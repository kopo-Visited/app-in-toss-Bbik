import { getSupabase } from '../clients/supabase.client.js';
import { DatabaseError } from '../errors/AppError.js';

/**
 * community_products (공용 상품 마스터, UNIQUE barcode) — 04-erd §2.
 * 컬럼↔DTO: name_jp↔nameOriginal, name_kr↔nameKo, brand_jp↔brandNameOriginal,
 *           brand_kr↔brandNameKo, image_url↔imageUrl, lookup_type↔lookupType.
 */
const TABLE = 'community_products';
const COLUMNS =
  'product_id, barcode, name_jp, name_kr, brand_jp, brand_kr, price, image_url, lookup_type';

// name_jp 는 NOT NULL 이라 미상 시 넣는 플레이스홀더. enrich 에서 "비어있음" 판정에도 쓴다.
const PLACEHOLDER_NAME = '(상품명 미상)';

/** barcode 로 상품 조회 → DTO(productId 포함) | null */
export async function findByBarcode(barcode) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(COLUMNS)
    .eq('barcode', barcode)
    .maybeSingle();
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-004-E1
  return data ? toDTO(data) : null;
}

/** 상품 신규 등록 → productId. name_jp 는 NOT NULL 이라 미상 fallback. */
export async function insert(product) {
  const row = {
    barcode: product.barcode,
    name_jp: product.nameOriginal ?? PLACEHOLDER_NAME,
    name_kr: product.nameKo ?? null,
    brand_jp: product.brandNameOriginal ?? null,
    brand_kr: product.brandNameKo ?? null,
    price: product.price ?? null, // null=정보없음 / 0=실제 0원 (BR-010)
    image_url: product.imageUrl ?? null,
    lookup_type: product.lookupType, // barcode / keyword / ai (BR-011)
    user_id: product.userId ?? null, // 사진/AI 등록자. 순수 라쿠텐 바코드는 NULL(04-erd)
  };
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert(row)
    .select('product_id')
    .single();
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-004-E1
  return data.product_id;
}

/**
 * 기존 공용 상품 레코드를 보강(enrich)한다 — 빈약하게 먼저 등록된 마스터를 더 충실한 값으로 채운다.
 * community_products 는 사용자 공용 마스터이므로 **기존 실값은 덮어쓰지 않고**,
 * 비어있는(NULL, name_jp 는 플레이스홀더) 컬럼만 incoming 값으로 채운다(가산적 보강).
 * find-or-create 가 빈약한 기존 레코드를 그대로 재사용하던 버그의 근본 수정.
 *
 * @param {object} existing  findByBarcode 가 돌려준 DTO(productId 포함)
 * @param {object} incoming  더 충실할 수 있는 상품 DTO(저장 요청/조회 결과)
 * @returns {Promise<boolean>} 실제 UPDATE 가 발생했으면 true
 */
export async function enrich(existing, incoming) {
  const patch = {};
  const nameEmpty = existing.nameOriginal == null || existing.nameOriginal === PLACEHOLDER_NAME;
  if (nameEmpty && incoming.nameOriginal != null) patch.name_jp = incoming.nameOriginal;
  if (existing.nameKo == null && incoming.nameKo != null) patch.name_kr = incoming.nameKo;
  if (existing.brandNameOriginal == null && incoming.brandNameOriginal != null)
    patch.brand_jp = incoming.brandNameOriginal;
  if (existing.brandNameKo == null && incoming.brandNameKo != null)
    patch.brand_kr = incoming.brandNameKo;
  if (existing.price == null && incoming.price != null) patch.price = incoming.price; // 0=실제 0원 보존
  if (existing.imageUrl == null && incoming.imageUrl != null) patch.image_url = incoming.imageUrl;

  if (Object.keys(patch).length === 0) return false; // 채울 것 없음 → DB 왕복 생략

  const { error } = await getSupabase().from(TABLE).update(patch).eq('product_id', existing.productId);
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-004-E1
  return true;
}

function toDTO(row) {
  return {
    productId: row.product_id,
    barcode: row.barcode,
    nameOriginal: row.name_jp,
    nameKo: row.name_kr,
    brandNameOriginal: row.brand_jp,
    brandNameKo: row.brand_kr,
    price: row.price,
    imageUrl: row.image_url,
    lookupType: row.lookup_type,
  };
}
