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
    name_jp: product.nameOriginal ?? '(상품명 미상)',
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
