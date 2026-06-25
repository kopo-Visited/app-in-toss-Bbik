import { describe, it, expect, vi, beforeEach } from 'vitest';

// ⚠️ 임시(실기기 테스트용) 로그인 우회 검증. config.devAuthBypass=true 로 고정.
vi.mock('../../src/config/env.js', () => ({ config: { devAuthBypass: true } }));
vi.mock('../../src/clients/toss.client.js');
vi.mock('../../src/repositories/user.repository.js');

const { issueTokenMock } = vi.hoisted(() => ({ issueTokenMock: vi.fn() }));
vi.mock('../../src/utils/jwt.js', () => ({ issueToken: issueTokenMock }));

import { login } from '../../src/services/auth.service.js';
import * as tossClient from '../../src/clients/toss.client.js';
import * as userRepo from '../../src/repositories/user.repository.js';

const INPUT = { authorizationCode: 'x', referrer: 'DEFAULT' };

beforeEach(() => {
  vi.clearAllMocks();
  issueTokenMock.mockReturnValue('dev-jwt');
});

describe('login() — DEV_AUTH_BYPASS (임시 우회)', () => {
  it('우회 시 토스 호출 0, 고정 테스트 유저 신규 등록 + JWT 발급', async () => {
    userRepo.findByTossKey.mockResolvedValue(null);
    userRepo.insert.mockResolvedValue({ id: 'dev-user-id' });

    const result = await login(INPUT);

    // 토스 mTLS 교환은 전혀 호출되지 않아야 한다 (인증서 없이 통과)
    expect(tossClient.generateToken).not.toHaveBeenCalled();
    expect(tossClient.getMe).not.toHaveBeenCalled();

    expect(userRepo.findByTossKey).toHaveBeenCalledWith('dev-bypass-user');
    expect(userRepo.insert).toHaveBeenCalledWith({
      tossUserKey: 'dev-bypass-user',
      name: '테스트사용자',
    });
    expect(result).toEqual({
      userId: 'dev-user-id',
      isNewUser: true,
      accessToken: 'dev-jwt',
      name: '테스트사용자',
    });
  });

  it('우회 시 기존 테스트 유저면 insert 미호출, isNewUser:false', async () => {
    userRepo.findByTossKey.mockResolvedValue({ id: 'existing-dev-id' });

    const result = await login(INPUT);

    expect(userRepo.insert).not.toHaveBeenCalled();
    expect(result).toEqual({
      userId: 'existing-dev-id',
      isNewUser: false,
      accessToken: 'dev-jwt',
      name: '테스트사용자',
    });
  });
});
