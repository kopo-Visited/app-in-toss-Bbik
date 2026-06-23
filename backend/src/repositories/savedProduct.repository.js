import { getSupabase } from '../clients/supabase.client.js';
import { DatabaseError } from '../errors/AppError.js';

/**
 * saved_products (사용자↔상품 연결, UNIQUE(user_id, product_id)) — 04-erd §3.
 * 상품 상세는 community_products 참조. RLS 로 본인 행만 접근(supabase-rls).
 */
const TABLE = 'saved_products';

/** (user_id, product_id) 중복 확인 → { id } | null (BR-009) */
export async function findByUserAndProduct(userId, productId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('saved_product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw new DatabaseError(error.message, { cause: error });
  return data ? { id: data.saved_product_id } : null;
}

/** 연결 저장 → { id } */
export async function insert(userId, productId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ user_id: userId, product_id: productId })
    .select('saved_product_id')
    .single();
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-004-E1
  return { id: data.saved_product_id };
}

/** 사용자 저장 목록(최근순, 페이징). community_products JOIN 으로 상품 상세 포함 (F-005). */
export async function listByUser(userId, { page = 1, limit = 20 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(
      'saved_product_id, product_id, created_at, ' +
        'community_products ( barcode, name_jp, name_kr, brand_jp, brand_kr, price, image_url, lookup_type )',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw new DatabaseError(error.message, { cause: error });
  return (data || []).map(toItemDTO);
}

/** 개별 삭제(본인 행만). 실제 삭제된 경우 true. */
export async function deleteOne(userId, savedProductId) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .delete()
    .eq('saved_product_id', savedProductId)
    .eq('user_id', userId)
    .select('saved_product_id');
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-005-E2
  return (data || []).length > 0;
}

/** 사용자 전체 삭제. */
export async function deleteAllByUser(userId) {
  const { error } = await getSupabase().from(TABLE).delete().eq('user_id', userId);
  if (error) throw new DatabaseError(error.message, { cause: error }); // F-005-E2
}

// 03-api-spec §13.4 목록 아이템. currency/country 는 community_products 컬럼이 없어 기본값(BR-012).
function toItemDTO(row) {
  const cp = Array.isArray(row.community_products)
    ? row.community_products[0]
    : row.community_products || {};
  return {
    savedProductId: row.saved_product_id,
    productId: row.product_id,
    barcode: cp.barcode ?? null,
    nameOriginal: cp.name_jp ?? null,
    nameKo: cp.name_kr ?? null,
    brandNameOriginal: cp.brand_jp ?? null,
    brandNameKo: cp.brand_kr ?? null,
    price: cp.price ?? null,
    currency: 'JPY',
    imageUrl: cp.image_url ?? null,
    country: 'JP',
    lookupType: cp.lookup_type ?? null,
    createdAt: row.created_at,
  };
}
