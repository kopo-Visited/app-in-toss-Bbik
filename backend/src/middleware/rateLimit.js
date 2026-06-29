import { RateLimitError } from '../errors/AppError.js';

/**
 * 인입 요청 throttle — 우리 서버·외부 쿼터(라쿠텐/Gemini 분당 15회) 보호용 (BL-005 배경).
 * ⚠️ 외부 API 가 돌려주는 429(RATE_LIMIT_EXCEEDED)는 각 client 가 throw 하는 별개 경로다.
 *
 * 단순 고정 윈도우(in-memory). 다중 인스턴스 배포 시 공유 저장소(Redis 등)로 교체 필요.
 */
export function rateLimit({ windowMs = 60_000, max = 60, keyFn } = {}) {
  const hits = new Map();
  return (req, _res, next) => {
    const id = (keyFn && keyFn(req)) || req.auth?.userId || req.ip || 'global';
    const now = Date.now();
    const entry = hits.get(id);
    if (!entry || now > entry.reset) {
      hits.set(id, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) return next(new RateLimitError());
    next();
  };
}
