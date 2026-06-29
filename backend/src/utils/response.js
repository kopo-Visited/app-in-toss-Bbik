import { AppError } from '../errors/AppError.js';

/** 성공 envelope — 03-api-spec.md §4.1 */
export function toSuccess(data = {}) {
  return { success: true, data };
}

/** 실패 envelope — 03-api-spec.md §4.2. data 는 있을 때만 포함. */
export function toFailure(err) {
  const appErr = err instanceof AppError ? err : new AppError('INTERNAL_ERROR');
  const body = {
    success: false,
    error: {
      code: appErr.code,
      message: appErr.message,
      nextAction: appErr.nextAction,
    },
  };
  if (appErr.data !== undefined && appErr.data !== null) body.data = appErr.data;
  return body;
}
