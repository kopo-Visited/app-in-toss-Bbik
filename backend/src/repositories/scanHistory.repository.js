import { getSupabase } from '../clients/supabase.client.js';
import { DatabaseError } from '../errors/AppError.js';

/**
 * scan_history (스캔 이력, user_id 없음·상품 수집용) — 04-erd §4.
 * 1스캔=1row. 폴백(재조회·AI)을 거쳐도 새 row 없이 같은 row 를 UPDATE 한다 (P-5).
 */
const TABLE = 'scan_history';

/** 스캔 기록 시작 → { id }. found=false, lookup_type 은 1차 시도값 barcode 로 시작. */
export async function start(jan) {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({ barcode: jan, found: false, lookup_type: 'barcode' })
    .select('scan_id')
    .single();
  if (error) throw new DatabaseError(error.message, { cause: error });
  return { id: data.scan_id };
}

/** 같은 row 의 최종 상태 갱신 (found·lookup_type·product_id). */
export async function update(scanId, { found, lookupType, productId }) {
  const patch = { found, lookup_type: lookupType };
  if (productId !== undefined) patch.product_id = productId;
  const { error } = await getSupabase().from(TABLE).update(patch).eq('scan_id', scanId);
  if (error) throw new DatabaseError(error.message, { cause: error });
}
