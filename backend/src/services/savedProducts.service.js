import * as communityProductRepo from '../repositories/communityProduct.repository.js';
import * as savedProductRepo from '../repositories/savedProduct.repository.js';
import { AppError } from '../errors/AppError.js';

/**
 * BL-006 상품 저장·중복 판정 (F-004). 적용 BR: BR-009~012.
 * ① community_products 에서 barcode 로 상품 확보(없으면 insert) → product_id
 * ② (user_id + product_id) 중복 검사 → 중복이면 duplicated, 아니면 연결 저장
 *
 * ⚠️ community_products.barcode 는 NOT NULL UNIQUE(04-erd)라 barcode 미보유 상품은
 *    현 스키마상 저장 불가 → 거부(§12.7 "바코드 없음 추후 정의"는 미확정 영역).
 */
export async function save(userId, product) {
  if (!product.barcode) {
    throw new AppError('INVALID_REQUEST', '바코드 정보가 없어 저장할 수 없습니다.');
  }

  // ① 공용 상품 확보 (find-or-create by barcode). 이미 있으면 기존 product_id 사용.
  let productId = (await communityProductRepo.findByBarcode(product.barcode))?.productId;
  if (!productId) {
    productId = await communityProductRepo.insert({ ...product, userId });
  }

  // ② 중복 판정 (user_id + product_id) — BR-009
  const existing = await savedProductRepo.findByUserAndProduct(userId, productId);
  if (existing) {
    return { saved: false, savedProductId: existing.id, message: '이미 저장된 상품입니다.' };
  }

  const inserted = await savedProductRepo.insert(userId, productId);
  return { saved: true, savedProductId: inserted.id, message: '저장되었습니다.' };
}

/** F-005 저장 목록 조회 (최근순·페이징). 비어 있으면 빈 배열(F-005-E1 은 FE 안내). */
export async function list(userId, { page, limit }) {
  const items = await savedProductRepo.listByUser(userId, { page, limit });
  return { page, limit, items };
}

/** F-005 개별 삭제 */
export async function remove(userId, savedProductId) {
  const deleted = await savedProductRepo.deleteOne(userId, savedProductId);
  return {
    deleted,
    savedProductId,
    message: deleted ? '삭제되었습니다.' : '이미 삭제되었거나 없는 항목입니다.',
  };
}

/** F-005 전체 삭제 */
export async function removeAll(userId) {
  await savedProductRepo.deleteAllByUser(userId);
  return { deleted: true, message: '전체 저장 상품이 삭제되었습니다.' };
}
