import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMtlsMaterial } from '../../src/clients/toss.client.js';

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
