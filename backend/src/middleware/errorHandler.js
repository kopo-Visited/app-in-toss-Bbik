import { AppError } from '../errors/AppError.js';
import { toFailure } from '../utils/response.js';

/**
 * 파이프라인 맨 끝. 모든 throw 를 공통 envelope 로 변환한다 (03-api-spec §4.2).
 * AppError 가 아니면 스택을 로깅하고 500 INTERNAL_ERROR 로 마스킹(노출 방지).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let appErr = err;
  if (!(err instanceof AppError)) {
    console.error('[unhandled error]', err);
    appErr = new AppError('INTERNAL_ERROR');
  } else if (err.cause) {
    console.error(`[${err.code}]`, err.message, '\n  cause:', err.cause);
  }
  res.status(appErr.statusCode).json(toFailure(appErr));
}

/** 매칭되는 라우트가 없을 때 — 404 형태의 일관 응답. */
export function notFoundHandler(_req, res) {
  res.status(404).json(
    toFailure(new AppError('INVALID_REQUEST', '요청한 리소스를 찾을 수 없습니다.')),
  );
}
