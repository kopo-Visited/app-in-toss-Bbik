import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// 외부 의존성 목 (mTLS/복호화/DB 우회) — 통합은 controller→service→envelope 검증에 집중.
vi.mock('../../src/clients/toss.client.js');
vi.mock('../../src/repositories/user.repository.js');

const { decryptPIIMock } = vi.hoisted(() => ({ decryptPIIMock: vi.fn() }));
vi.mock('../../src/crypto/pii.js', () => ({ decryptPII: decryptPIIMock }));

import { createApp } from '../../src/app.js';
import * as tossClient from '../../src/clients/toss.client.js';
import * as userRepo from '../../src/repositories/user.repository.js';
import { UnauthorizedError, ExternalApiError } from '../../src/errors/AppError.js';

import { TOSS_TOKEN, TOSS_ME } from '../fixtures/toss.js';
import { USER_ROW, INSERTED_USER } from '../fixtures/user.js';

const app = createApp();
const ENDPOINT = '/api/auth/toss/login';
const BODY = { authorizationCode: 'auth-code', referrer: 'DEFAULT' };

beforeEach(() => {
  vi.clearAllMocks();
  // happy-path 기본 목 (각 케이스에서 분기만 override)
  tossClient.generateToken.mockResolvedValue(TOSS_TOKEN);
  tossClient.getMe.mockResolvedValue(TOSS_ME);
  decryptPIIMock.mockReturnValue('홍길동');
});

describe('POST /api/auth/toss/login (F-001 / BL-001)', () => {
  it('A-1: 기존 사용자 → 200 success envelope, isNewUser:false, accessToken(JWT)', async () => {
    userRepo.findByTossKey.mockResolvedValue(USER_ROW);

    const res = await request(app).post(ENDPOINT).send(BODY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(USER_ROW.id);
    expect(res.body.data.isNewUser).toBe(false);
    // 자체 JWT — 비어있지 않은 문자열 (issueToken 실호출, JWT_SECRET=test-secret)
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.accessToken.length).toBeGreaterThan(0);
    expect(userRepo.insert).not.toHaveBeenCalled();
  });

  it('A-2: 신규 사용자 → 200, isNewUser:true, userRepo.insert 1회', async () => {
    userRepo.findByTossKey.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(INSERTED_USER);

    const res = await request(app).post(ENDPOINT).send(BODY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(INSERTED_USER.id);
    expect(res.body.data.isNewUser).toBe(true);
    expect(userRepo.insert).toHaveBeenCalledTimes(1);
  });

  it('A-3: 검증 실패(referrer enum 위반) → 400 INVALID_REQUEST, nextAction:NONE', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ authorizationCode: 'c', referrer: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.nextAction).toBe('NONE');
    // 검증 단계 차단 → 토스 호출 안 함
    expect(tossClient.generateToken).not.toHaveBeenCalled();
  });

  it('A-4: 인가코드 만료·재사용(invalid_grant) → 401 UNAUTHORIZED', async () => {
    tossClient.generateToken.mockRejectedValue(
      new UnauthorizedError('인가코드가 만료되었거나 이미 사용되었습니다.'),
    );

    const res = await request(app).post(ENDPOINT).send(BODY);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('A-5: 토스 토큰 발급 호출 실패 → 502 EXTERNAL_API_ERROR', async () => {
    tossClient.generateToken.mockRejectedValue(new ExternalApiError('토스 토큰 발급 호출 실패'));

    const res = await request(app).post(ENDPOINT).send(BODY);

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EXTERNAL_API_ERROR');
  });
});
