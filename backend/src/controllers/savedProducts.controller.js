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

/** GET /api/saved-products (F-005) */
export async function listSavedProducts(req, res, next) {
  try {
    res.json(toSuccess(await savedProductsService.list(req.auth.userId, req.validated.query)));
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/saved-products/:savedProductId (F-005) */
export async function deleteSavedProduct(req, res, next) {
  try {
    res.json(
      toSuccess(
        await savedProductsService.remove(req.auth.userId, req.validated.params.savedProductId),
      ),
    );
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/saved-products (F-005, 전체 삭제) */
export async function deleteAllSavedProducts(req, res, next) {
  try {
    res.json(toSuccess(await savedProductsService.removeAll(req.auth.userId)));
  } catch (e) {
    next(e);
  }
}
