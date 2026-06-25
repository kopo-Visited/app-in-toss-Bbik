import { post } from './client';

export interface LoginResult {
  userId: string;
  isNewUser: boolean;
  accessToken: string;
  /** 사용자 이름(토스 계정명). dev-bypass면 테스트 이름. 미확보 시 백엔드 fallback('토스사용자'). */
  name: string;
}

/**
 * F-001 — appLogin이 발급한 authorizationCode/referrer를 백엔드에 넘겨
 * 우리 서비스의 JWT(accessToken)와 사용자 정보를 교환한다.
 * (토스 토큰 교환·검증은 서버 전용.)
 */
export async function login(params: {
  authorizationCode: string;
  referrer: string;
}): Promise<LoginResult> {
  return post<LoginResult>('/api/auth/toss/login', { body: params });
}
