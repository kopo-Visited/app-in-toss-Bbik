import { UnauthorizedError } from '../errors/AppError.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * 인증 미들웨어 — Authorization: Bearer {우리 JWT} 검증 후 req.auth.userId 세팅.
 * 분기·DB 없음. 실패 시 throw(401)만 한다. (backend-engineer.md Middleware)
 */
export function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
  const payload = verifyToken(token);
  if (!payload?.sub) return next(new UnauthorizedError());
  req.auth = { userId: payload.sub };
  next();
}
