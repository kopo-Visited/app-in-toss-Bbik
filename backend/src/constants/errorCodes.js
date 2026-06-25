/**
 * 공통 에러코드 → HTTP status · 기본 메시지 · nextAction 매핑.
 * 출처: 03-api-spec.md §4.3(Error Code), §4.4(nextAction).
 * nextAction: CAPTURE_PRODUCT_IMAGE | RETRY_SCAN | MANUAL_INPUT | NONE
 */
export const ERROR_CODES = {
  INVALID_REQUEST: {
    status: 400,
    message: '요청 형식이 올바르지 않습니다.',
    nextAction: 'NONE',
  },
  UNAUTHORIZED: {
    status: 401,
    message: '사용자 인증에 실패했습니다.',
    nextAction: 'NONE',
  },
  INVALID_BARCODE: {
    status: 400,
    message: '인식할 수 없는 바코드입니다.',
    nextAction: 'RETRY_SCAN',
  },
  // F-002 — 사진에서 바코드(JAN/EAN)를 검출하지 못함. FE 는 직접입력으로 폴백한다(BL-002).
  BARCODE_NOT_DETECTED: {
    status: 422,
    message: '바코드를 인식하지 못했어요. 직접 입력해주세요.',
    nextAction: 'MANUAL_INPUT',
  },
  PRODUCT_NOT_FOUND: {
    status: 404,
    message: '상품을 찾을 수 없습니다. 상품명과 브랜드명이 보이도록 촬영해주세요.',
    nextAction: 'CAPTURE_PRODUCT_IMAGE',
  },
  EXTERNAL_API_ERROR: {
    status: 502,
    message: '외부 서비스 호출에 실패했습니다.',
    nextAction: 'NONE',
  },
  AI_ANALYSIS_FAILED: {
    status: 502,
    message: '이미지를 인식할 수 없습니다. 다시 촬영해주세요.',
    nextAction: 'NONE',
  },
  DATABASE_ERROR: {
    status: 500,
    message: '처리 중 오류가 발생했습니다. 다시 시도해주세요.',
    nextAction: 'NONE',
  },
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: '요청이 많아 잠시 후 다시 시도해주세요.',
    nextAction: 'NONE',
  },
  TIMEOUT: {
    status: 504,
    message: '응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
    nextAction: 'NONE',
  },
  // 스펙 외 — 예기치 못한 내부 오류 catch-all (스택 노출 방지, 항상 envelope 로 반환)
  INTERNAL_ERROR: {
    status: 500,
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    nextAction: 'NONE',
  },
};
