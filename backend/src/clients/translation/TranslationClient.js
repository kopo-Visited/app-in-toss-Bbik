import { config } from '../../config/env.js';
import { createDeeplClient } from './deepl.client.js';

/**
 * 번역 클라이언트 추상 팩토리 (BR-006 — 번역은 번역 API 가 담당, Gemini X).
 * 구현체는 { translate(text):Promise<?string>, translateBatch(texts):Promise<(?string)[]> } 형태.
 * config.translation.provider 로 구현체를 선택한다(현재 deepl).
 */
let instance = null;

export function getTranslationClient() {
  if (instance) return instance;
  switch (config.translation.provider) {
    case 'deepl':
    default:
      instance = createDeeplClient();
  }
  return instance;
}
