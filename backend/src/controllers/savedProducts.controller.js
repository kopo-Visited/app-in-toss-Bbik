import { toSuccess } from '../utils/response.js';
import * as savedProductsService from '../services/savedProducts.service.js';

/** POST /api/saved-products (F-004) */
export async function saveProduct(req, res, next) {
  try {
    res.json(toSuccess(await savedProductsService.save(req.auth.userId, req.validated.body)));
  } catch (e) {
    next(e);
  }
}
