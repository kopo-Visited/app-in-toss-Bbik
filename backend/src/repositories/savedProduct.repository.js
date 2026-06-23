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
