import https from 'node:https';
import fs from 'node:fs';
import { config } from '../config/env.js';
import { ExternalApiError, UnauthorizedError } from '../errors/AppError.js';

/**
 * 토스 앱인토스 OAuth 클라이언트 (F-001 / BL-001).
 * Base URL: config.toss.baseUrl (https://apps-in-toss-api.toss.im)
 * ⚠️ mTLS 필수 — 콘솔 발급 cert/key 가 없으면 generate-token 호출 불가(05-appsintoss-refs).
 * 외부 호출 + DTO 매핑만. 비즈니스 분기는 service 가 한다.
 */
const GENERATE_TOKEN_PATH = '/api-partner/v1/apps-in-toss/user/oauth2/generate-token';
const LOGIN_ME_PATH = '/api-partner/v1/apps-in-toss/user/oauth2/login-me';

/**
 * mTLS cert/key/ca 자료 해석. PEM "내용"(env) 우선, 없으면 파일 "경로"에서 읽음.
 *   - 로컬 dev: *_PATH (backend/secrets/)
 *   - Fly 프로덕션: 내용(fly secrets — 휘발성 FS라 파일 못 올림)
 * cert/key 둘 다 없으면 명시적 에러(인증서 필요). ca 는 optional(토스 신뢰체인).
 * @returns {{cert:(string|Buffer), key:(string|Buffer), ca:(string|Buffer|undefined)}}
 */
export function resolveMtlsMaterial(tossConfig = config.toss) {
  const { mtlsCert, mtlsKey, mtlsCa, mtlsCertPath, mtlsKeyPath, mtlsCaPath } = tossConfig;
  const cert = mtlsCert || (mtlsCertPath ? fs.readFileSync(mtlsCertPath) : null);
  const key = mtlsKey || (mtlsKeyPath ? fs.readFileSync(mtlsKeyPath) : null);
  const ca = mtlsCa || (mtlsCaPath ? fs.readFileSync(mtlsCaPath) : undefined);
  // ⚠️ mTLS 인증서 필요: 콘솔 발급분(integration-process 문서). 미발급 시 실호출 불가.
  if (!cert || !key) {
    throw new Error(
      '토스 mTLS 인증서 필요: TOSS_MTLS_CERT(_PATH) / TOSS_MTLS_KEY(_PATH) (콘솔 발급)',
    );
  }
  return { cert, key, ca };
}

// mTLS Agent — 인증서가 있을 때만 생성. 없으면 명시적 에러(인증서 필요).
let agent = null;
function getMtlsAgent() {
  if (agent) return agent;
  const { cert, key, ca } = resolveMtlsMaterial(config.toss);
  agent = new https.Agent({ cert, key, ca, keepAlive: true });
  return agent;
}

// mTLS https 요청 헬퍼 (Node 내장 https — agent 로 클라이언트 인증서 첨부).
function request(method, path, { headers = {}, body } = {}) {
  const url = new URL(path, config.toss.baseUrl);
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        agent: getMtlsAgent(),
        headers: {
          Accept: 'application/json',
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            json = null; // 비 JSON 응답
          }
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * ① AccessToken 발급. 응답 { resultType, success } 래퍼 → success 언래핑.
 * @returns {Promise<{accessToken, refreshToken, tokenType, expiresIn, scope}>}
 */
/**
 * generate-token 응답 해석 → success 언래핑 또는 에러 throw.
 * ⚠️ 토스 실패는 HTTP 200 + { resultType:'FAIL', success:null, error:{errorCode, reason} } 로도 온다
 *    (실제 응답 확인됨). error 는 문자열이 아니라 객체이므로 reason/errorCode 문자열을 본다.
 * @returns {{accessToken, refreshToken, tokenType, expiresIn, scope}}
 */
export function interpretTokenResponse(res) {
  const err = res.json?.error;
  const errText = typeof err === 'string' ? err : `${err?.errorCode ?? ''} ${err?.reason ?? ''}`;
  // 인가코드 만료·재사용·clientId 불일치 → invalid_grant (F-001-E4)
  if (/invalid_grant/i.test(errText)) {
    throw new UnauthorizedError(
      '인가코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.',
      { cause: res.json },
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new UnauthorizedError('토스 인증에 실패했습니다.', { cause: res.json });
  }
  if (res.status >= 400 || res.json?.resultType === 'FAIL' || res.json?.success == null) {
    throw new ExternalApiError('토스 토큰 발급에 실패했습니다.', { cause: res.json });
  }
  return res.json.success;
}

export async function generateToken(authorizationCode, referrer) {
  let res;
  try {
    res = await request('POST', GENERATE_TOKEN_PATH, { body: { authorizationCode, referrer } });
  } catch (e) {
    throw new ExternalApiError('토스 토큰 발급 호출 실패', { cause: e });
  }
  return interpretTokenResponse(res);
}

/**
 * ② 사용자 정보 조회. 개인정보(name/phone/...)는 암호문으로 내려온다.
 * login-me 가 success 래퍼면 언래핑, 아니면 본문 그대로.
 * @returns {Promise<{userKey:number, name?:string, scope?:any, ...}>}
 */
export async function getMe(accessToken) {
  let res;
  try {
    res = await request('GET', LOGIN_ME_PATH, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (e) {
    throw new ExternalApiError('토스 사용자 조회 호출 실패', { cause: e });
  }
  if (res.status === 401 || res.status === 403) {
    throw new UnauthorizedError('토스 사용자 조회 인증에 실패했습니다.', { cause: res.json });
  }
  if (res.status >= 400 || !res.json || res.json.resultType === 'FAIL') {
    throw new ExternalApiError('토스 사용자 조회에 실패했습니다.', { cause: res.json });
  }
  return res.json.success ?? res.json;
}
