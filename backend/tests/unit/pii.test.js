import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { decryptPII } from '../../src/crypto/pii.js';
import { config } from '../../src/config/env.js';

/**
 * decryptPII 단위 — 복호화는 부가정보(이름)라 실패해도 throw 금지(null 반환 → fallback).
 * 출처: pii.js (03-api-spec §5.4-③). 키/AAD 는 config.toss 를 직접 주입해 제어.
 */
const KEY = Buffer.alloc(32, 7); // 32B AES-256 키
const KEY_B64 = KEY.toString('base64');

// 표준 GCM 포맷으로 평문을 암호화: base64( iv(12) || ciphertext || tag(16) )
function encrypt(plain, { aad } = {}) {
  const iv = Buffer.alloc(12, 3);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, ct, cipher.getAuthTag()]).toString('base64');
}

describe('decryptPII (PII 복호화 — 실패해도 로그인 안 막음)', () => {
  let origKey, origAad;
  beforeEach(() => {
    origKey = config.toss.piiDecryptKey;
    origAad = config.toss.piiAad;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    config.toss.piiDecryptKey = origKey;
    config.toss.piiAad = origAad;
    vi.restoreAllMocks();
  });

  it('키가 있으면 정상 복호화 (round-trip)', () => {
    config.toss.piiDecryptKey = KEY_B64;
    config.toss.piiAad = undefined;
    expect(decryptPII(encrypt('정원치'))).toBe('정원치');
  });

  it('AAD 가 일치하면 복호화 (round-trip)', () => {
    config.toss.piiDecryptKey = KEY_B64;
    config.toss.piiAad = 'bbik-aad';
    expect(decryptPII(encrypt('홍길동', { aad: 'bbik-aad' }))).toBe('홍길동');
  });

  it('입력이 null/빈문자열이면 null', () => {
    config.toss.piiDecryptKey = KEY_B64;
    expect(decryptPII(null)).toBeNull();
    expect(decryptPII('')).toBeNull();
    expect(decryptPII(undefined)).toBeNull();
  });

  it('키 미설정 → throw 대신 null (샌드박스 fallback)', () => {
    config.toss.piiDecryptKey = undefined;
    expect(() => decryptPII(encrypt('정원치'))).not.toThrow();
    expect(decryptPII(encrypt('정원치'))).toBeNull();
  });

  it('태그 검증 실패(잘못된 암호문) → throw 대신 null', () => {
    config.toss.piiDecryptKey = KEY_B64;
    config.toss.piiAad = undefined;
    // AAD 불일치로 태그 검증 실패하도록 암호화
    expect(() => decryptPII(encrypt('정원치', { aad: 'wrong-aad' }))).not.toThrow();
    expect(decryptPII(encrypt('정원치', { aad: 'wrong-aad' }))).toBeNull();
  });

  it('포맷 깨진 base64 → throw 대신 null', () => {
    config.toss.piiDecryptKey = KEY_B64;
    expect(() => decryptPII('!!!not-valid!!!')).not.toThrow();
    expect(decryptPII('!!!not-valid!!!')).toBeNull();
  });
});
