import * as tossClient from '../clients/toss.client.js';
import * as userRepo from '../repositories/user.repository.js';
import { decryptPII } from '../crypto/pii.js';
import { issueToken } from '../utils/jwt.js';
import { config } from '../config/env.js';

// ⚠️ 임시(실기기 테스트용) — 토스 mTLS 인증서 미발급 동안 로그인 통과시키는 우회 유저.
//    config.devAuthBypass(=DEV_AUTH_BYPASS) 가 true 일 때만 사용. 인증서 발급되면 제거.
const DEV_BYPASS_TOSS_KEY = 'dev-bypass-user';
const DEV_BYPASS_NAME = '정원치';

async function devBypassLogin() {
  // 토스 호출·PII 복호화를 건너뛰고 고정 테스트 유저로 자체 JWT 발급.
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ [DEV_AUTH_BYPASS] 로그인 우회 활성 — 토스 인증 없이 테스트 유저로 통과. 운영 배포 금지.',
  );
  let user = await userRepo.findByTossKey(DEV_BYPASS_TOSS_KEY);
  const isNewUser = !user;
  if (!user) user = await userRepo.insert({ tossUserKey: DEV_BYPASS_TOSS_KEY, name: DEV_BYPASS_NAME });
  return { userId: user.id, isNewUser, accessToken: issueToken(user.id), name: DEV_BYPASS_NAME };
}

/**
 * BL-001 사용자 식별 판정 (F-001).
 * ⚠️ 클라이언트가 보낸 값을 그대로 신뢰하지 않는다. 인가코드를 토스와 교환해
 *    서버가 userKey 를 직접 확보한 뒤 식별/등록한다 (05-appsintoss-refs).
 *
 * @param {{authorizationCode:string, referrer:'DEFAULT'|'SANDBOX'}} input
 * @returns {Promise<{userId:string, isNewUser:boolean, accessToken:string, name:string}>}
 */
export async function login({ authorizationCode, referrer }) {
  // ⚠️ 실기기 테스트 임시 우회 (인증서 미발급 동안만). DEV_AUTH_BYPASS=true 일 때 토스 인증 생략.
  if (config.devAuthBypass) return devBypassLogin();

  // ① 토큰 발급 (mTLS) — 토스 accessToken/refreshToken 은 서버에서만 사용, 클라이언트 전달 금지.
  const token = await tossClient.generateToken(authorizationCode, referrer);

  // ② 사용자 정보 조회 (userKey + 암호문 PII)
  const me = await tossClient.getMe(token.accessToken);

  // userKey 는 number → 문자열로 보관 (04-erd users.toss_user_key)
  const tossUserKey = String(me.userKey);
  // ③ 개인정보 복호화 — name 만 사용. NOT NULL 컬럼이라 미확보 시 fallback.
  const name = decryptPII(me.name) ?? '토스사용자';

  // ④ 식별/등록 (BL-001 의사코드)
  let user = await userRepo.findByTossKey(tossUserKey);
  const isNewUser = !user;
  if (!user) user = await userRepo.insert({ tossUserKey, name });

  // 자체 JWT 발급 (토스 토큰이 아님)
  return {
    userId: user.id,
    isNewUser,
    accessToken: issueToken(user.id),
    // F-005 저장목록 타이틀용. 본인에게 본인 복호화 이름만 반환(인증된 응답이라 PII 노출 안전).
    // 미확보 시 위에서 '토스사용자' fallback 적용됨.
    name,
  };
}
