/**
 * 토스 OAuth client 반환형 픽스처 (BL-001 auth.service 단위용).
 * tossClient.generateToken / getMe 의 "반환형" 기준 (client 내부 언래핑 결과).
 * 매핑 출처: toss.client.js generateToken/getMe (03-api-spec §5.4).
 *
 * ⚠️ service 단위에서는 이 값들을 목 반환값으로 사용. mTLS·실호출은 범위 밖.
 */

// ① generateToken 반환형 (success 래퍼 언래핑 후). 토스 토큰은 서버 전용.
export const TOSS_TOKEN = {
  accessToken: 'toss-access-token',
  refreshToken: 'toss-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  scope: ['user_key'],
};

// ② getMe 반환형. userKey 는 number, 개인정보(name)는 암호문. (03-api-spec §5.4-②)
export const TOSS_ME = {
  userKey: 443731104,
  name: 'enc:base64-ciphertext', // 암호문 자리표시 — decryptPII 목이 평문 반환
  scope: ['user_key'],
  agreedTerms: [],
};

// PII 미확보(복호화 실패/미동의) 시 getMe 반환형 — name 누락
export const TOSS_ME_NO_NAME = {
  userKey: 443731104,
  scope: ['user_key'],
};
