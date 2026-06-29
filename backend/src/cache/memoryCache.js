/**
 * 서버 메모리 캐시 (BL-005 / BR-008). 키 = JAN 코드, 값 = 상품 조회 결과.
 * - 백엔드 내부 최적화. 응답에 캐시 여부 노출 금지.
 * - HIT 시 lookupType 은 원래 출처값(barcode/keyword) 유지.
 * - ⚠️ ai 결과는 캐시 금지 (CLAUDE.md §2) — set() 호출 측에서 ai 를 넣지 않는다.
 * - 서버 재시작 시 초기화될 수 있다(테이블 아님).
 */
const store = new Map();

export const memoryCache = {
  get(jan) {
    return store.has(jan) ? store.get(jan) : null;
  },
  set(jan, product) {
    store.set(jan, product);
  },
  delete(jan) {
    store.delete(jan);
  },
  clear() {
    store.clear();
  },
  get size() {
    return store.size;
  },
};
