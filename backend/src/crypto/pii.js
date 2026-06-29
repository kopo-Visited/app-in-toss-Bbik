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
 * ⚠️ 복호화는 "있으면 좋은" 부가정보(이름)다 — 실패해도 로그인을 막지 않는다.
 *    키 미설정·포맷 불일치·태그 검증 실패 시 throw 대신 null 반환 → 호출부가
 *    '토스사용자' fallback 으로 처리(auth.service.login). 키 발급되면 정상 복호화.
 *
 * @param {string|null|undefined} ciphertextB64
 * @returns {string|null} 평문 (입력·키 없거나 복호화 실패 시 null)
 */
const IV_LEN = 12;
const TAG_LEN = 16;

export function decryptPII(ciphertextB64) {
  if (ciphertextB64 == null || ciphertextB64 === '') return null;

  const keyB64 = config.toss.piiDecryptKey;
  if (!keyB64) {
    // 키 미발급(샌드박스 등) — 로그인 막지 말고 이름 fallback 으로 넘긴다.
    console.warn('⚠️ [PII] TOSS_PII_DECRYPT_KEY 미설정 — 이름 복호화 생략(fallback 사용).');
    return null;
  }

  try {
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
  } catch (e) {
    // 포맷 불일치·태그 검증 실패 등 — 로그인 자체는 막지 않고 fallback.
    console.warn('⚠️ [PII] 이름 복호화 실패 — fallback 사용:', e.message);
    return null;
  }
}
