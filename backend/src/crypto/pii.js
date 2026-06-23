import crypto from 'node:crypto';
import { config } from '../config/env.js';

/**
 * 토스 개인정보(name 등) AES-256-GCM 복호화 (03-api-spec §5.4-③, 05-appsintoss-refs).
 * ⚠️ 복호화 키/AAD 는 토스 콘솔 발급분(config.toss.piiDecryptKey / piiAad) — 키 필요.
 *
 * 암호문 레이아웃 가정: base64( iv(12B) || ciphertext || authTag(16B) ).
 * 실제 토스 암호문 포맷은 콘솔/문서 확인 후 조정이 필요할 수 있다(현재 표준 GCM 가정).
 * 삑은 name 만 복호화해 users.name 에 저장한다.
 *
 * @param {string|null|undefined} ciphertextB64
 * @returns {string|null} 평문 (입력이 null 이면 null)
 */
const IV_LEN = 12;
const TAG_LEN = 16;

export function decryptPII(ciphertextB64) {
  if (ciphertextB64 == null || ciphertextB64 === '') return null;

  const keyB64 = config.toss.piiDecryptKey;
  if (!keyB64) {
    throw new Error('토스 PII 복호화 키 필요: TOSS_PII_DECRYPT_KEY (콘솔 발급)');
  }

  const key = Buffer.from(keyB64, 'base64');
  const aad = config.toss.piiAad ? Buffer.from(config.toss.piiAad, 'utf8') : null;
  const buf = Buffer.from(ciphertextB64, 'base64');

  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN, buf.length - TAG_LEN);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  if (aad) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
