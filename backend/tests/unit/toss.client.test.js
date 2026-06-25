import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMtlsMaterial, interpretTokenResponse } from '../../src/clients/toss.client.js';
import { UnauthorizedError, ExternalApiError } from '../../src/errors/AppError.js';

/**
 * mTLS 자료 해석(resolveMtlsMaterial) 단위 — PEM 내용(env) 우선, 경로 폴백, 미발급 에러.
 * 출처: toss.client.js (F-001 / BL-001, mTLS 필수). 실호출/agent 생성은 범위 밖.
 */
describe('resolveMtlsMaterial (mTLS 자료 해석)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bbik-mtls-'));
  const certFile = path.join(tmp, 'pub.crt');
  const keyFile = path.join(tmp, 'priv.key');
  fs.writeFileSync(certFile, 'FILE-CERT');
  fs.writeFileSync(keyFile, 'FILE-KEY');

  afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('PEM 내용(env)이 있으면 파일 안 읽고 그대로 사용', () => {
    const out = resolveMtlsMaterial({ mtlsCert: 'ENV-CERT', mtlsKey: 'ENV-KEY' });
    expect(out).toEqual({ cert: 'ENV-CERT', key: 'ENV-KEY', ca: undefined });
  });

  it('내용이 경로보다 우선', () => {
    const out = resolveMtlsMaterial({
      mtlsCert: 'ENV-CERT',
      mtlsKey: 'ENV-KEY',
      mtlsCertPath: certFile,
      mtlsKeyPath: keyFile,
    });
    expect(out.cert).toBe('ENV-CERT');
    expect(out.key).toBe('ENV-KEY');
  });

  it('내용 없으면 경로에서 파일을 읽는다 (로컬 dev)', () => {
    const out = resolveMtlsMaterial({ mtlsCertPath: certFile, mtlsKeyPath: keyFile });
    expect(out.cert.toString()).toBe('FILE-CERT');
    expect(out.key.toString()).toBe('FILE-KEY');
  });

  it('ca 는 optional — 없으면 undefined', () => {
    const out = resolveMtlsMaterial({ mtlsCert: 'C', mtlsKey: 'K' });
    expect(out.ca).toBeUndefined();
  });

  it('ca 내용/경로도 해석한다', () => {
    expect(resolveMtlsMaterial({ mtlsCert: 'C', mtlsKey: 'K', mtlsCa: 'ENV-CA' }).ca).toBe('ENV-CA');
  });

  it('cert/key 둘 다 없으면 "인증서 필요" 에러 (미발급)', () => {
    expect(() => resolveMtlsMaterial({})).toThrow(/mTLS 인증서 필요/);
  });

  it('key만 없어도 에러', () => {
    expect(() => resolveMtlsMaterial({ mtlsCert: 'C' })).toThrow(/mTLS 인증서 필요/);
  });
});

describe('interpretTokenResponse (generate-token 응답 해석)', () => {
  // ⚠️ 실제 토스 응답 형태(스모크 테스트로 확인) — 실패는 HTTP 200 + resultType:FAIL.
  const FAIL_INVALID_GRANT = {
    status: 200,
    json: {
      resultType: 'FAIL',
      success: null,
      error: {
        errorType: 0,
        errorCode: 'OAUTH_ISSUE_TOKEN_ERROR',
        reason:
          '400 BAD_REQUEST : invalid_grant. 사유: 1. authorization_code 가 이미 사용되었거나 만료됨.',
        data: {},
      },
    },
  };
  const SUCCESS = {
    status: 200,
    json: {
      resultType: 'SUCCESS',
      success: { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 3600 },
      error: null,
    },
  };

  it('성공 응답 → success 객체 언래핑', () => {
    expect(interpretTokenResponse(SUCCESS)).toEqual(SUCCESS.json.success);
  });

  it('실제 invalid_grant(200+FAIL+error객체) → UnauthorizedError (F-001-E4)', () => {
    // 회귀 방지: error 가 객체라 과거 `error === "invalid_grant"` 비교로는 못 잡던 버그.
    expect(() => interpretTokenResponse(FAIL_INVALID_GRANT)).toThrow(UnauthorizedError);
    expect(() => interpretTokenResponse(FAIL_INVALID_GRANT)).toThrow(/다시 로그인/);
  });

  it('레거시 문자열 error:"invalid_grant" 형태도 UnauthorizedError', () => {
    expect(() =>
      interpretTokenResponse({ status: 400, json: { error: 'invalid_grant' } }),
    ).toThrow(UnauthorizedError);
  });

  it('401/403 → UnauthorizedError', () => {
    expect(() => interpretTokenResponse({ status: 401, json: {} })).toThrow(UnauthorizedError);
  });

  it('그 외 FAIL(다른 errorCode) → ExternalApiError', () => {
    expect(() =>
      interpretTokenResponse({
        status: 200,
        json: { resultType: 'FAIL', success: null, error: { errorCode: 'SERVER_ERROR', reason: 'x' } },
      }),
    ).toThrow(ExternalApiError);
  });

  it('success 누락 → ExternalApiError', () => {
    expect(() => interpretTokenResponse({ status: 200, json: { success: null } })).toThrow(
      ExternalApiError,
    );
  });
});
