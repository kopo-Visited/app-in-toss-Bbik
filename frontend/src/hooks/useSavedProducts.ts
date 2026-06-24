import { useCallback, useEffect, useState } from 'react';
import { getSavedProducts, deleteSavedProduct } from '../api/savedProducts';
import { ApiError } from '../api/errors';
import type { SavedProduct } from '../lib/product';

/**
 * F-005 저장 목록 상태/사이드이펙트. 마운트 시 목록 로드.
 * - remove: 성공 시 로컬에서 제거. 실패 시 throw(화면에서 Alert 처리).
 */
export function useSavedProducts() {
  const [items, setItems] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getSavedProducts());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '목록을 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 성공 시 로컬에서 제거. 실패 시 throw (화면에서 Alert).
  const remove = useCallback(async (id: string) => {
    await deleteSavedProduct(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, loading, error, reload: load, remove };
}
