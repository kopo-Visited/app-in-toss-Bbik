/**
 * Gemini generateContent raw 응답 픽스처 (통합 테스트용).
 * gemini.client.js 가 파싱하는 구조:
 *   json.candidates[0].content.parts[0].text → JSON.parse → 추출 객체 (06 §4 responseSchema).
 * ⚠️ text 는 "JSON 문자열" 이어야 한다 (client 가 JSON.parse 함).
 */

// 추출 성공 — name_jp + search_keywords 존재 (keyword 재조회/ai 폴백 진입 가능)
export const GEMINI_RAW_OK = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              found: true,
              name_jp: '緑茶',
              brand_jp: '伊藤園',
              search_keywords: ['伊藤園 緑茶'],
              price: null, // BR-005 AI 가격 미신뢰
              currency: 'JPY',
              confidence: 'high',
            }),
          },
        ],
      },
    },
  ],
};

// 추출 실패 — found=false, 키워드/상품명 없음 (F-003-E4 → service 가 AnalysisError)
export const GEMINI_RAW_FAIL = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              found: false,
              name_jp: null,
              brand_jp: null,
              search_keywords: [],
              price: null,
              currency: 'JPY',
              confidence: 'low',
            }),
          },
        ],
      },
    },
  ],
};
