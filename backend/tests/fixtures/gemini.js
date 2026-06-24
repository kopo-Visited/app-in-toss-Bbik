/**
 * Gemini extract() 반환형 픽스처 (BL-003 analyzeImage 단위용).
 * geminiClient.extract(buffer, mime) 반환 구조 기준 (gemini.client.js / 06 §4 responseSchema).
 * ⚠️ Gemini 는 일본어 원문만 추출. 번역 X (BR-006).
 */

// 추출 성공 — 상품명·브랜드·검색키워드 존재
export const GEMINI_EXTRACTED_OK = {
  found: true,
  name_jp: '緑茶',
  brand_jp: '伊藤園',
  search_keywords: ['伊藤園 緑茶'],
  price: null, // BR-005 AI 가격 미신뢰
  currency: 'JPY',
  confidence: 'high',
};

// 추출 실패 — found=false, 키워드·상품명 없음 (F-003-E4)
export const GEMINI_EXTRACTED_FAIL = {
  found: false,
  name_jp: null,
  brand_jp: null,
  search_keywords: [],
  price: null,
  currency: 'JPY',
  confidence: 'low',
};
