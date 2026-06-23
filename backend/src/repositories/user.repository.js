import { getSupabase } from '../clients/supabase.client.js';
import { DatabaseError } from '../errors/AppError.js';

/**
 * users 테이블 CRUD (04-erd §1). 컬럼↔DTO: user_id↔id, toss_user_key↔tossUserKey.
 */
const TABLE = 'users';

/** toss_user_key 로 사용자 조회 → DTO | null */
export async function findByTossKey(tossUserKey) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select('user_id, name, toss_user_key, created_at')
    .eq('toss_user_key', tossUserKey)
    .maybeSingle();
  if (error) throw new DatabaseError(error.message, { cause: error });
  return data ? toDTO(data) : null;
}

/** 신규 사용자 등록 → { id }. name 은 NOT NULL(04-erd). */
export async function insert({ tossUserKey, name }) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ toss_user_key: tossUserKey, name })
    .select('user_id')
    .single();
  if (error) throw new DatabaseError(error.message, { cause: error });
  return { id: data.user_id };
}

function toDTO(row) {
  return {
    id: row.user_id,
    name: row.name,
    tossUserKey: row.toss_user_key,
    createdAt: row.created_at,
  };
}
