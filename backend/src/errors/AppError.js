import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * 도메인 에러 기반 클래스. service/client/repository 는 throw 만 하고,
 * errorHandler 가 이 정보를 공통 envelope({ success:false, error, data }) 로 변환한다.
 *
 * @param {string} code        ERROR_CODES 키
 * @param {string} [message]   기본 메시지 override (없으면 코드 기본 메시지)
 * @param {object} [opts]
 * @param {string} [opts.nextAction]  override (없으면 코드 기본 nextAction)
 * @param {object} [opts.data]        실패 응답 data 에 실릴 부가정보 (예: { scanHistoryId, barcode })
 * @param {Error}  [opts.cause]       원인 에러 (로깅용, 응답에는 노출 안 함)
 */
export class AppError extends Error {
  constructor(code, message, { nextAction, data, cause } = {}) {
    const meta = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
    super(message || meta.message);
    this.name = this.constructor.name;
    this.code = ERROR_CODES[code] ? code : 'INTERNAL_ERROR';
    this.statusCode = meta.status;
    this.nextAction = nextAction || meta.nextAction;
    this.data = data;
    if (cause) this.cause = cause;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// 400 — 일반 요청 검증 실패 또는 바코드 형식 오류(BR-001). code 로 구분.
export class ValidationError extends AppError {
  constructor(code = 'INVALID_REQUEST', opts) {
    super(code === 'INVALID_BARCODE' ? 'INVALID_BARCODE' : 'INVALID_REQUEST', undefined, opts);
  }
}

// 401
export class UnauthorizedError extends AppError {
  constructor(message, opts) {
    super('UNAUTHORIZED', message, opts);
  }
}

// 404 — 상품 미조회 (nextAction=CAPTURE_PRODUCT_IMAGE, data={scanHistoryId, barcode})
export class NotFoundError extends AppError {
  constructor(message, opts) {
    super('PRODUCT_NOT_FOUND', message, opts);
  }
}

// 422 — 사진에서 바코드 미검출 (F-002/BL-002). nextAction=MANUAL_INPUT → FE 직접입력 폴백.
export class BarcodeNotDetectedError extends AppError {
  constructor(message, opts) {
    super('BARCODE_NOT_DETECTED', message, opts);
  }
}

// 429 — 외부 API/우리 서버 호출 한도 초과
export class RateLimitError extends AppError {
  constructor(message, opts) {
    super('RATE_LIMIT_EXCEEDED', message, opts);
  }
}

// 504 — 외부 API 타임아웃
export class TimeoutError extends AppError {
  constructor(message, opts) {
    super('TIMEOUT', message, opts);
  }
}

// 502 — 외부 API 호출 실패
export class ExternalApiError extends AppError {
  constructor(message, opts) {
    super('EXTERNAL_API_ERROR', message, opts);
  }
}

// 502 — Gemini 분석 실패
export class AnalysisError extends AppError {
  constructor(message, opts) {
    super('AI_ANALYSIS_FAILED', message, opts);
  }
}

// 500 — DB 처리 실패
export class DatabaseError extends AppError {
  constructor(message, opts) {
    super('DATABASE_ERROR', message, opts);
  }
}
