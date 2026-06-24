/**
 * 번역 client translateBatch() 반환형 픽스처 (BL-004).
 * getTranslationClient().translateBatch(texts) 반환: 입력 순서와 1:1 정렬 (deepl.client.js).
 */

// [nameOriginal, brandNameOriginal] → [nameKo, brandNameKo]
export const DEEPL_BATCH_RESULT = ['녹차 500ml', '이토엔'];

// ai 경로: [name_jp, brand_jp] → [nameKo, brandNameKo]
export const DEEPL_BATCH_AI_RESULT = ['녹차', '이토엔'];
