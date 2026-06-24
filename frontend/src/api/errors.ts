/**
 * 백엔드 공통 envelope의 error.code → 한국어 메시지 매핑 및 ApiError 클래스.
 * (F-001 화면 단계별 예외 문구는 useLogin에서 별도 처리. 여기선 공통 코드만.)
 */

const MESSAGES: Record<string, string> = {
  INVALID_REQUEST: '요청 형식이 올바르지 않습니다.',
  UNAUTHORIZED: '인증에 실패했습니다. 다시 로그인해주세요.',
  INVALID_BARCODE: '바코드 형식이 올바르지 않습니다.',
  PRODUCT_NOT_FOUND: '상품을 찾을 수 없습니다.',
  EXTERNAL_API_ERROR: '외부 서비스 호출에 실패했습니다.',
  AI_ANALYSIS_FAILED: 'AI 분석에 실패했습니다.',
  DATABASE_ERROR: '저장 처리에 실패했습니다.',
  RATE_LIMIT_EXCEEDED: '잠시 후 다시 시도해주세요.',
  TIMEOUT: '응답 시간이 초과되었습니다.',
};

/**
 * 코드에 대응하는 한국어 메시지를 반환한다.
 * - 매핑에 없으면 서버 message(fallback) 사용
 * - 그것도 없으면 기본 문구
 */
export function messageForCode(code?: string, fallback?: string): string {
  if (code && MESSAGES[code]) {
    return MESSAGES[code];
  }
  return fallback ?? '오류가 발생했습니다.';
}

export class ApiError extends Error {
  readonly code: string;
  readonly nextAction?: string;

  constructor(code: string, message: string, nextAction?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.nextAction = nextAction;
    // TS의 Error 상속 instanceof 보정
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
