/**
 * 백엔드가 조회/분석을 끝내고 프론트에 돌려주는 상품 객체.
 * (기획서 7번 "결과 데이터 형태" 참고)
 */

/**
 * 상품 정보의 출처.
 * - barcode: 바코드로 라쿠텐 조회 성공
 * - keyword: 사진 → 상품명·브랜드명 추출 → 번역 → 키워드 재조회 성공
 * - ai: 라쿠텐 조회·재조회 모두 실패 → AI 이미지 판단 (참고 정보)
 */
export type LookupType = "barcode" | "keyword" | "ai";

export interface Product {
  /** JAN 코드 (EAN-13/EAN-8) */
  barcode: string;
  /** 상품명 (일본어, 원문) */
  nameOriginal: string;
  /** 상품명 (한국어, 번역) */
  nameKo: string;
  /** 브랜드명 (일본어). 없을 수 있음 */
  brandNameOriginal?: string | null;
  /** 브랜드명 (한국어). 없을 수 있음 */
  brandNameKo?: string | null;
  /** 가격 (JPY). 정보 없으면 null, 실제 0원이면 0 */
  price: number | null;
  /** 상품 이미지 URL. 없을 수 있음 */
  imageUrl?: string | null;
  /** 정보 출처 */
  lookupType: LookupType;
}

/** 저장 목록에서 쓰는, id가 붙은 상품 */
export interface SavedProduct extends Product {
  /** 저장 레코드 id (백엔드 saved_products.id) */
  id: string;
  /** 저장 시각 (ISO). 최근순 정렬용 */
  savedAt: string;
}

/**
 * 가격 표시 규칙 (기획서 7번 "표시 규칙")
 * - 값 있으면 "약 ¥{가격}"
 * - null 또는 0이면 "가격 정보 없음"
 */
export function formatPrice(price: number | null): string {
  if (price == null || price === 0) {
    return "가격 정보 없음";
  }
  return `약 ¥${price.toLocaleString("ja-JP")}`;
}
