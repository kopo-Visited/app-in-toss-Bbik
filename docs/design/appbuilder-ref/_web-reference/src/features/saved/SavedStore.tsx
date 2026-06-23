import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, SavedProduct } from "../../lib/product";
import { DUMMY_SAVED_PRODUCTS } from "../../api/products";

/**
 * 저장한 상품을 관리하는 클라이언트 상태.
 * 지금은 메모리(+더미)로 동작하고, 백엔드 연결 단계에서
 * saved-products API 호출로 교체합니다.
 *
 * 중복 저장 방지: barcode 기준 (백엔드는 user_id+product_id UNIQUE)
 */

type SaveResult = "saved" | "already";

interface SavedStoreValue {
  items: SavedProduct[];
  /** 저장. 이미 있으면 "already" 반환 */
  save: (product: Product) => SaveResult;
  /** id로 삭제 */
  remove: (id: string) => void;
  /** barcode가 이미 저장됐는지 */
  isSaved: (barcode: string) => boolean;
}

const SavedStoreContext = createContext<SavedStoreValue | null>(null);

let idSeq = 1000;
function nextId() {
  idSeq += 1;
  return `saved-${idSeq}`;
}

export function SavedStoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedProduct[]>(DUMMY_SAVED_PRODUCTS);

  const isSaved = useCallback(
    (barcode: string) => items.some((it) => it.barcode === barcode),
    [items],
  );

  const save = useCallback(
    (product: Product): SaveResult => {
      if (items.some((it) => it.barcode === product.barcode)) {
        return "already";
      }
      const saved: SavedProduct = {
        ...product,
        id: nextId(),
        // Date.now가 막혀 있어 ISO 문자열만 임시로 둠. 정렬은 추가 순서로도 충분.
        savedAt: new Date(0).toISOString(),
      };
      // 최근순: 맨 앞에 추가
      setItems((prev) => [saved, ...prev]);
      return "saved";
    },
    [items],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const value = useMemo<SavedStoreValue>(
    () => ({ items, save, remove, isSaved }),
    [items, save, remove, isSaved],
  );

  return (
    <SavedStoreContext.Provider value={value}>
      {children}
    </SavedStoreContext.Provider>
  );
}

export function useSavedStore() {
  const ctx = useContext(SavedStoreContext);
  if (ctx == null) {
    throw new Error(
      "useSavedStore는 SavedStoreProvider 안에서만 사용할 수 있어요.",
    );
  }
  return ctx;
}
