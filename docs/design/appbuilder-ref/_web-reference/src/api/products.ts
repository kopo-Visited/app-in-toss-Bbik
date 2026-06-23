import type { Product, SavedProduct } from "../lib/product";

/**
 * 백엔드 연결 전, 결과 화면(S-5)을 먼저 완성하기 위한 더미 상품 데이터.
 * 백엔드 API 연결 단계에서 실제 응답으로 교체합니다.
 */

/** lookupType=barcode: 라쿠텐 조회 성공 (이미지·가격 모두 있음) */
export const DUMMY_PRODUCT_BARCODE: Product = {
  barcode: "4901008412345",
  nameOriginal: "キャンメイク パーフェクトスタイリストアイズ",
  nameKo: "캔메이크 아이섀도우 (퍼펙트 스타일리스트 아이즈)",
  brandNameOriginal: "キャンメイク",
  brandNameKo: "캔메이크",
  price: 861,
  imageUrl: null,
  lookupType: "barcode",
};

/** lookupType=keyword: 사진 분석 후 키워드 재조회 성공 */
export const DUMMY_PRODUCT_KEYWORD: Product = {
  barcode: "4902430735063",
  nameOriginal: "ファブリーズ ダブル除菌 消臭スプレー",
  nameKo: "페브리즈 더블 제균 탈취 스프레이",
  brandNameOriginal: "ファブリーズ",
  brandNameKo: "페브리즈",
  price: 480,
  imageUrl: null,
  lookupType: "keyword",
};

/** lookupType=ai: AI 직접 판단인데 가격은 추정값이 있는 경우 (②) */
export const DUMMY_PRODUCT_AI_PRICED: Product = {
  barcode: "0000000000001",
  nameOriginal: "キャンメイク パーフェクトスタイリストアイズ02",
  nameKo: "캔메이크 플럼뿌꾸 코데아이즈 02",
  brandNameOriginal: "キャンメイク",
  brandNameKo: "캔메이크",
  price: 861,
  imageUrl: null,
  lookupType: "ai",
};

/** lookupType=ai: AI 직접 판단 (참고 정보, 가격 없음) (③) */
export const DUMMY_PRODUCT_AI: Product = {
  barcode: "0000000000000",
  nameOriginal: "（不明な商品）",
  nameKo: "녹차맛 사탕 (추정)",
  brandNameOriginal: null,
  brandNameKo: null,
  price: null,
  imageUrl: null,
  lookupType: "ai",
};

/** 기본 더미 (핵심 동선 확인용) */
export const DUMMY_PRODUCT: Product = DUMMY_PRODUCT_BARCODE;

/** 저장 목록(S-6) 더미 */
export const DUMMY_SAVED_PRODUCTS: SavedProduct[] = [
  {
    ...DUMMY_PRODUCT_BARCODE,
    id: "saved-1",
    savedAt: "2026-06-22T10:30:00.000Z",
  },
  {
    ...DUMMY_PRODUCT_KEYWORD,
    id: "saved-2",
    savedAt: "2026-06-21T18:05:00.000Z",
  },
];
