import { toSuccess } from '../utils/response.js';
import * as shareService from '../services/share.service.js';

/** POST /api/share/products (F-006) */
export function shareProduct(req, res, next) {
  try {
    res.json(toSuccess(shareService.shareText(req.validated.body)));
  } catch (e) {
    next(e);
  }
}
