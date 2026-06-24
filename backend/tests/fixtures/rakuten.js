/**
 * 라쿠텐 client DTO 픽스처 (BL-003 LookupService 단위용).
 * rakutenClient.searchByProductCode / searchByKeyword 의 "반환형(DTO)" 기준.
 * (client 내부 mapToDTO 결과 — service 단위에서는 이 DTO를 목 반환값으로 사용)
 * 매핑 출처: rakuten.client.js mapToDTO (03-api-spec §7.5).
 */

// 1차(productCode) 조회 성공 반환형
export const RAKUTEN_BARCODE_DTO = {
  rakutenProductId: 'rk-p1',
  barcode: '4901234567894',
  nameOriginal: '緑茶 500ml',
  brandNameOriginal: '伊藤園',
  price: 150, // null=정보없음 / 0=실제 0원 (BR-010)
  imageUrl: 'https://image.rakuten.co.jp/p1_medium.jpg',
  currency: 'JPY', // BR-012
};

// 2차(keyword) 재조회 성공 반환형
export const RAKUTEN_KEYWORD_DTO = {
  rakutenProductId: 'rk-p2',
  barcode: '4901234567894',
  nameOriginal: '緑茶 500ml',
  brandNameOriginal: '伊藤園',
  price: 150,
  imageUrl: 'https://image.rakuten.co.jp/p2_medium.jpg',
  currency: 'JPY',
};
