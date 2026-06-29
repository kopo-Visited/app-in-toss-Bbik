/**
 * BL-007 공유 텍스트 생성 (F-006). 적용 BR: BR-010.
 * 형식(03-api-spec §15.3): "[삑] {brandNameKo} {nameKo} / {priceText} — 삑으로 스캔한 상품 정보"
 * - price: 양수 → "약 ¥{price}", null/0 → "가격 정보 없음" (BR-010)
 * - brandNameKo 가 null 이면 브랜드명 생략
 */
export function shareText({ nameKo, brandNameKo, price }) {
  const priceText = price != null && price > 0 ? `약 ¥${price}` : '가격 정보 없음';
  const namePart = brandNameKo ? `${brandNameKo} ${nameKo}` : nameKo;
  return { shareText: `[삑] ${namePart} / ${priceText} — 삑으로 스캔한 상품 정보` };
}
