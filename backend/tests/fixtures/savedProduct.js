/**
 * 상품 저장(BL-006 savedProducts.service.save) 단위용 픽스처.
 * - SAVE_INPUT: 03-api-spec §12.3 요청 body 형태 (service 의 product 인자)
 * - COMMUNITY_DTO: communityProductRepo.findByBarcode 반환 DTO (productId 사용)
 * 매핑 출처: 03-api-spec §12.3 / communityProduct.repository.js toDTO.
 */

const BARCODE = '4901234567894';

// 저장 요청 입력 (barcode 보유) — BR-009~012
export const SAVE_INPUT = {
  barcode: BARCODE,
  nameOriginal: '緑茶 500ml',
  nameKo: '녹차 500ml',
  brandNameOriginal: '伊藤園',
  brandNameKo: '이토엔',
  price: 150, // null=정보없음 / 0=실제 0원 (BR-010)
  currency: 'JPY', // BR-012
  imageUrl: null,
  country: 'JP', // BR-012
  lookupType: 'barcode', // BR-011
};

// barcode 미보유 입력 (ai 결과 등) — BL-006-C 거부 대상
export const SAVE_INPUT_NO_BARCODE = {
  ...SAVE_INPUT,
  barcode: null,
  lookupType: 'ai',
};

// findByBarcode 반환 DTO (productId 만 사용)
export const COMMUNITY_DTO = {
  productId: 'product-1',
  barcode: BARCODE,
  nameOriginal: '緑茶 500ml',
  nameKo: '녹차 500ml',
  brandNameOriginal: '伊藤園',
  brandNameKo: '이토엔',
  price: 150,
  imageUrl: null,
  lookupType: 'barcode',
};

export const SAVE_BARCODE = BARCODE;
