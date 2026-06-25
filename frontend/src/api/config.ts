export const baseURL = import.meta.env.SERVER_BASE_URL ?? 'http://localhost:3000';

// ⚠️ 임시(실기기 테스트용) 로그인 우회. 토스 mTLS 인증서 발급되면 제거.
export const devAuthBypass = import.meta.env.DEV_AUTH_BYPASS === 'true';
