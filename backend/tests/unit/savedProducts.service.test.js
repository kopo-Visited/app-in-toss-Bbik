import { describe, it, expect, vi, beforeEach } from 'vitest';

// 모듈 레벨 import repository 의존성 → 모듈 경로로 목 (DI 아님)
vi.mock('../../src/repositories/communityProduct.repository.js');
vi.mock('../../src/repositories/savedProduct.repository.js');

import { save } from '../../src/services/savedProducts.service.js';
import * as communityProductRepo from '../../src/repositories/communityProduct.repository.js';
import * as savedProductRepo from '../../src/repositories/savedProduct.repository.js';
import { AppError } from '../../src/errors/AppError.js'; // 실제 클래스로 검증 (목 아님)

import {
  SAVE_INPUT,
  SAVE_INPUT_NO_BARCODE,
  COMMUNITY_DTO,
  SAVE_BARCODE,
} from '../fixtures/savedProduct.js';

const USER_ID = 'user-1';
const PRODUCT_ID = 'product-1';

beforeEach(() => {
  vi.clearAllMocks();
  // 기본 happy-path: community 기존 존재 + saved 신규
  communityProductRepo.findByBarcode.mockResolvedValue(COMMUNITY_DTO);
  communityProductRepo.insert.mockResolvedValue('product-new');
  savedProductRepo.findByUserAndProduct.mockResolvedValue(null);
  savedProductRepo.insert.mockResolvedValue({ id: 'saved-1' });
});

describe('save() — BL-006 상품 저장·중복 판정 (F-004) / BR-009~012', () => {
  it('BL-006-A: 신규 저장(community 기존 product 재사용) -> {saved:true}, savedProductRepo.insert 1회', async () => {
    communityProductRepo.findByBarcode.mockResolvedValue(COMMUNITY_DTO);
    savedProductRepo.findByUserAndProduct.mockResolvedValue(null);
    savedProductRepo.insert.mockResolvedValue({ id: 'saved-1' });

    const result = await save(USER_ID, SAVE_INPUT);

    // 기존 product 재사용 → community insert 미호출 (BL-006 절차4)
    expect(communityProductRepo.findByBarcode).toHaveBeenCalledWith(SAVE_BARCODE);
    expect(communityProductRepo.insert).not.toHaveBeenCalled();
    // 중복 검사 후 연결 저장 (BL-006 절차5·7 / BR-009)
    expect(savedProductRepo.findByUserAndProduct).toHaveBeenCalledWith(USER_ID, PRODUCT_ID);
    expect(savedProductRepo.insert).toHaveBeenCalledTimes(1);
    expect(savedProductRepo.insert).toHaveBeenCalledWith(USER_ID, PRODUCT_ID);

    expect(result).toEqual({
      saved: true,
      savedProductId: 'saved-1',
      message: '저장되었습니다.',
    });
  });

  it('BL-006-A2: community 신규 생성 분기 -> communityProductRepo.insert 1회({userId,barcode}), 연결 저장', async () => {
    communityProductRepo.findByBarcode.mockResolvedValue(null);
    communityProductRepo.insert.mockResolvedValue('product-9');
    savedProductRepo.findByUserAndProduct.mockResolvedValue(null);
    savedProductRepo.insert.mockResolvedValue({ id: 'saved-9' });

    const result = await save(USER_ID, SAVE_INPUT);

    // find-or-create: 없으면 insert (BL-006 절차3), product 정보 + userId 전달
    expect(communityProductRepo.insert).toHaveBeenCalledTimes(1);
    expect(communityProductRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ barcode: SAVE_BARCODE, userId: USER_ID }),
    );
    expect(savedProductRepo.findByUserAndProduct).toHaveBeenCalledWith(USER_ID, 'product-9');
    expect(savedProductRepo.insert).toHaveBeenCalledWith(USER_ID, 'product-9');

    expect(result).toEqual({
      saved: true,
      savedProductId: 'saved-9',
      message: '저장되었습니다.',
    });
  });

  it('BL-006-B: 중복(user_id+product_id) -> {saved:false}, savedProductRepo.insert 미호출', async () => {
    communityProductRepo.findByBarcode.mockResolvedValue(COMMUNITY_DTO);
    // 이미 연결 존재 → 중복 신호 (BR-009)
    savedProductRepo.findByUserAndProduct.mockResolvedValue({ id: 'saved-existing' });

    const result = await save(USER_ID, SAVE_INPUT);

    // 중복이면 신규 연결 저장하지 않는다 (BL-006 절차6)
    expect(savedProductRepo.insert).not.toHaveBeenCalled();
    // 03-api-spec §12.6 계약: {saved:false, savedProductId, message}
    expect(result).toEqual({
      saved: false,
      savedProductId: 'saved-existing',
      message: '이미 저장된 상품입니다.',
    });
  });

  it('BL-006-C: barcode 없음 -> AppError(INVALID_REQUEST, 400) throw, repo 호출 0회', async () => {
    const call = () => save(USER_ID, SAVE_INPUT_NO_BARCODE);

    await expect(call()).rejects.toBeInstanceOf(AppError);
    await expect(call()).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
      statusCode: 400,
    });

    // 거부 시 어떤 repo 도 건드리지 않는다
    expect(communityProductRepo.findByBarcode).not.toHaveBeenCalled();
    expect(communityProductRepo.insert).not.toHaveBeenCalled();
    expect(savedProductRepo.findByUserAndProduct).not.toHaveBeenCalled();
    expect(savedProductRepo.insert).not.toHaveBeenCalled();
  });
});
