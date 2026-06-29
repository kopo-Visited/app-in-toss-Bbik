import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// DB 는 목 (supabase 실인스턴스 금지). 외부 HTTP 없음.
vi.mock('../../src/repositories/communityProduct.repository.js');
vi.mock('../../src/repositories/savedProduct.repository.js');

import { createApp } from '../../src/app.js';
import { issueToken } from '../../src/utils/jwt.js';
import * as communityProductRepo from '../../src/repositories/communityProduct.repository.js';
import * as savedProductRepo from '../../src/repositories/savedProduct.repository.js';
import { DatabaseError } from '../../src/errors/AppError.js';

import { SAVE_INPUT, COMMUNITY_DTO } from '../fixtures/savedProduct.js';

const app = createApp();
const ENDPOINT = '/api/saved-products';
const BEARER = `Bearer ${issueToken('user-1')}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/saved-products (F-004 / BL-006)', () => {
  it('S-1: 신규 저장 → 200, saved:true', async () => {
    communityProductRepo.findByBarcode.mockResolvedValue(COMMUNITY_DTO);
    savedProductRepo.findByUserAndProduct.mockResolvedValue(null);
    savedProductRepo.insert.mockResolvedValue({ id: 'sp-1' });

    const res = await request(app).post(ENDPOINT).set('Authorization', BEARER).send(SAVE_INPUT);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(true);
    expect(res.body.data.savedProductId).toBe('sp-1');
    expect(res.body.data.message).toBe('저장되었습니다.');
    expect(savedProductRepo.insert).toHaveBeenCalledTimes(1);
  });

  it('S-2: 중복 저장 → 200, saved:false', async () => {
    communityProductRepo.findByBarcode.mockResolvedValue(COMMUNITY_DTO);
    savedProductRepo.findByUserAndProduct.mockResolvedValue({ id: 'sp-1' });

    const res = await request(app).post(ENDPOINT).set('Authorization', BEARER).send(SAVE_INPUT);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.saved).toBe(false);
    expect(res.body.data.savedProductId).toBe('sp-1');
    expect(res.body.data.message).toBe('이미 저장된 상품입니다.');
    expect(savedProductRepo.insert).not.toHaveBeenCalled();
  });

  it('S-3: barcode 없음 → 400 INVALID_REQUEST (service 거부)', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .set('Authorization', BEARER)
      .send({ ...SAVE_INPUT, barcode: null, lookupType: 'ai' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(communityProductRepo.findByBarcode).not.toHaveBeenCalled();
  });

  it('S-4: nameKo 누락 → 400 INVALID_REQUEST (스키마)', async () => {
    const { nameKo, ...rest } = SAVE_INPUT;
    const res = await request(app).post(ENDPOINT).set('Authorization', BEARER).send(rest);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('S-5: DB 오류 (findByBarcode throw) → 500 DATABASE_ERROR', async () => {
    communityProductRepo.findByBarcode.mockRejectedValue(new DatabaseError('select failed'));

    const res = await request(app).post(ENDPOINT).set('Authorization', BEARER).send(SAVE_INPUT);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
  });

  it('S-6: 인증 없음 → 401 UNAUTHORIZED', async () => {
    const res = await request(app).post(ENDPOINT).send(SAVE_INPUT);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.nextAction).toBe('NONE');
  });
});
