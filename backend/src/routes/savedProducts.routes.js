import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  saveProductSchema,
  listQuerySchema,
  deleteParamsSchema,
} from '../schemas/savedProducts.schema.js';
import {
  saveProduct,
  listSavedProducts,
  deleteSavedProduct,
  deleteAllSavedProducts,
} from '../controllers/savedProducts.controller.js';

const router = Router();

router.post('/', auth, validate(saveProductSchema), saveProduct); // F-004 저장
router.get('/', auth, validate(listQuerySchema), listSavedProducts); // F-005 목록
router.delete('/', auth, deleteAllSavedProducts); // F-005 전체 삭제
router.delete('/:savedProductId', auth, validate(deleteParamsSchema), deleteSavedProduct); // F-005 개별 삭제

export default router;
