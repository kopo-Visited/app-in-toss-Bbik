import { toSuccess } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

/**
 * POST /api/auth/toss/login (F-001).
 * 검증 → service → toSuccess. 에러는 next() → errorHandler.
 */
export async function tossLogin(req, res, next) {
  try {
    res.json(toSuccess(await authService.login(req.validated.body)));
  } catch (e) {
    next(e);
  }
}
