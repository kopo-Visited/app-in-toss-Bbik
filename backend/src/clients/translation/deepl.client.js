import { config, requireConfig } from '../../config/env.js';
import { fetchWithTimeout } from '../../utils/fetchTimeout.js';
import { RateLimitError, ExternalApiError } from '../../errors/AppError.js';

/**
 * DeepL 번역 구현체 (일본어 → 한국어, BR-006).
 * - 무료: api-free.deepl.com / 유료: api.deepl.com (config.translation.deeplBaseUrl)
 * - 헤더 Authorization: DeepL-Auth-Key {key}
 * - 429/456(한도) → RateLimitError (F-003-E7)
 */
const SOURCE_LANG = 'JA';
const TARGET_LANG = 'KO';

export function createDeeplClient() {
  return { translate, translateBatch };
}

/**
 * 여러 문자열을 한 번에 번역. 입력 순서와 1:1 정렬해 반환. null/'' 입력은 번역하지 않고 null 반환.
 * @param {(string|null|undefined)[]} texts
 * @returns {Promise<(string|null)[]>}
 */
async function translateBatch(texts) {
  const inputs = texts.map((t) => (t == null ? '' : String(t)));
  if (inputs.every((t) => t === '')) return inputs.map(() => null); // 호출 생략

  const apiKey = requireConfig('translation.deeplApiKey');
  let res;
  try {
    res = await fetchWithTimeout(
      `${config.translation.deeplBaseUrl}/v2/translate`,
      {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputs, source_lang: SOURCE_LANG, target_lang: TARGET_LANG }),
      },
      8000, // 번역 8초 타임아웃 — 무한 대기 방지
    );
  } catch (e) {
    throw new ExternalApiError('번역 API 호출에 실패했습니다.', { cause: e });
  }

  if (res.status === 429 || res.status === 456) {
    throw new RateLimitError('번역 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'); // F-003-E7
  }
  if (!res.ok) {
    throw new ExternalApiError('번역 API 오류가 발생했습니다.', {
      cause: await res.text().catch(() => null),
    });
  }

  const json = await res.json().catch(() => ({}));
  const translations = json.translations || [];
  return inputs.map((t, i) => (t === '' ? null : (translations[i]?.text ?? null)));
}

/** 단일 문자열 번역 (null/'' → null). */
async function translate(text) {
  if (text == null || text === '') return null;
  const [result] = await translateBatch([text]);
  return result;
}
