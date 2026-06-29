import { describe, it, expect, vi, beforeEach } from 'vitest';

// 모듈 레벨 import 의존성 → 모듈 경로로 목 (DI 아님, lookup.service.test 패턴 동일)
vi.mock('../../src/clients/toss.client.js');
vi.mock('../../src/repositories/user.repository.js');

// named export 함수 factory 목. vi.mock 은 호이스팅되므로 목 함수도 vi.hoisted 로 끌어올린다.
const { decryptPIIMock, issueTokenMock } = vi.hoisted(() => ({
  decryptPIIMock: vi.fn(),
  issueTokenMock: vi.fn(),
}));
vi.mock('../../src/crypto/pii.js', () => ({ decryptPII: decryptPIIMock }));
vi.mock('../../src/utils/jwt.js', () => ({ issueToken: issueTokenMock }));

import { login } from '../../src/services/auth.service.js';
import * as tossClient from '../../src/clients/toss.client.js';
import * as userRepo from '../../src/repositories/user.repository.js';

import { TOSS_TOKEN, TOSS_ME, TOSS_ME_NO_NAME } from '../fixtures/toss.js';
import { USER_ROW, INSERTED_USER } from '../fixtures/user.js';

const INPUT = { authorizationCode: 'auth-code', referrer: 'DEFAULT' };
const TOSS_USER_KEY = '443731104'; // String(443731104) — number→string 보관

beforeEach(() => {
  vi.clearAllMocks();
  // 공통 happy-path 기본 목 (각 케이스에서 분기 부분만 override)
  tossClient.generateToken.mockResolvedValue(TOSS_TOKEN);
  tossClient.getMe.mockResolvedValue(TOSS_ME);
  decryptPIIMock.mockReturnValue('홍길동');
  issueTokenMock.mockReturnValue('our-jwt-token');
});

describe('login() — BL-001 사용자 식별 판정 (F-001)', () => {
  it('BL-001-A: 기존 사용자 -> isNewUser:false, userRepo.insert 미호출', async () => {
    userRepo.findByTossKey.mockResolvedValue(USER_ROW);
    issueTokenMock.mockReturnValue('jwt-existing');

    const result = await login(INPUT);

    // 토스 교환은 client 표면 호출만 검증 (mTLS/실호출은 범위 밖)
    expect(tossClient.generateToken).toHaveBeenCalledTimes(1);
    expect(tossClient.generateToken).toHaveBeenCalledWith('auth-code', 'DEFAULT');
    expect(tossClient.getMe).toHaveBeenCalledTimes(1);
    expect(tossClient.getMe).toHaveBeenCalledWith(TOSS_TOKEN.accessToken);

    // userKey number -> String 변환 후 조회 (BL-001 절차2)
    expect(userRepo.findByTossKey).toHaveBeenCalledWith(TOSS_USER_KEY);
    // 기존 사용자 → 등록하지 않는다 (BL-001 절차3)
    expect(userRepo.insert).not.toHaveBeenCalled();

    expect(issueTokenMock).toHaveBeenCalledWith(USER_ROW.id);
    expect(result).toEqual({
      userId: USER_ROW.id,
      isNewUser: false,
      accessToken: 'jwt-existing',
      name: '홍길동',
    });
  });

  it('BL-001-B: 신규 사용자 -> userRepo.insert 1회 + isNewUser:true', async () => {
    userRepo.findByTossKey.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(INSERTED_USER);
    issueTokenMock.mockReturnValue('jwt-new');

    const result = await login(INPUT);

    expect(userRepo.findByTossKey).toHaveBeenCalledWith(TOSS_USER_KEY);
    // 미존재 → 신규 등록 (BL-001 절차4), name 은 복호화 평문
    expect(userRepo.insert).toHaveBeenCalledTimes(1);
    expect(userRepo.insert).toHaveBeenCalledWith({
      tossUserKey: TOSS_USER_KEY,
      name: '홍길동',
    });

    expect(issueTokenMock).toHaveBeenCalledWith(INSERTED_USER.id);
    expect(result).toEqual({
      userId: INSERTED_USER.id,
      isNewUser: true,
      accessToken: 'jwt-new',
      name: '홍길동',
    });
  });

  it('BL-001-C: name 미확보(decryptPII=null) -> insert 인자 name="토스사용자" (NOT NULL fallback)', async () => {
    tossClient.getMe.mockResolvedValue(TOSS_ME_NO_NAME);
    decryptPIIMock.mockReturnValue(null);
    userRepo.findByTossKey.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue(INSERTED_USER);

    const result = await login(INPUT);

    expect(userRepo.insert).toHaveBeenCalledTimes(1);
    expect(userRepo.insert).toHaveBeenCalledWith({
      tossUserKey: TOSS_USER_KEY,
      name: '토스사용자',
    });
    expect(result.isNewUser).toBe(true);
    expect(result.name).toBe('토스사용자'); // 응답에도 fallback 이름이 실린다 (F-005 타이틀용)
  });
});
