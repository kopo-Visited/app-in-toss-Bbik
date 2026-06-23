import { ValidationError } from '../errors/AppError.js';

/**
 * zod 스키마로 요청을 검증해 req.validated 에 정제 결과를 싣는다.
 * 실패 시 throw 만 한다(400). 분기·DB 없음.
 *
 * @param {import('zod').ZodType} schema  { query, body, params, file } 형태를 파싱하는 스키마
 * @param {string} [errorCode]  실패 시 코드. 바코드 스키마면 'INVALID_BARCODE' 전달 (BR-001/BL-002)
 */
export const validate = (schema, errorCode = 'INVALID_REQUEST') => (req, _res, next) => {
  const parsed = schema.safeParse({
    query: req.query,
    body: req.body,
    params: req.params,
    file: req.file,
  });
  if (!parsed.success) return next(new ValidationError(errorCode, { cause: parsed.error }));
  req.validated = parsed.data;
  next();
};
