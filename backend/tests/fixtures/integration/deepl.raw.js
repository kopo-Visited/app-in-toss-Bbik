/**
 * DeepL /v2/translate raw 응답 픽스처 (통합 테스트용).
 * deepl.client.js translateBatch 가 파싱: json.translations[i].text (입력 순서 1:1).
 * 입력 = [nameOriginal, brandNameOriginal] → [nameKo, brandNameKo].
 */

// [緑茶 500ml, 伊藤園] → [녹차 500ml, 이토엔]
export const DEEPL_RAW_BATCH = {
  translations: [{ text: '녹차 500ml' }, { text: '이토엔' }],
};

// ai 경로: [name_jp, brand_jp] = [緑茶, 伊藤園] → [녹차, 이토엔]
export const DEEPL_RAW_BATCH_AI = {
  translations: [{ text: '녹차' }, { text: '이토엔' }],
};
