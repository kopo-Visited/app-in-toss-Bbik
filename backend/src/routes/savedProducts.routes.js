import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { saveProductSchema } from '../schemas/savedProducts.schema.js';
import { saveProduct } from '../controllers/savedProducts.controller.js';

const router = Router();

// POST /api/saved-products — 저장 (F-004). 조회·삭제(F-005)는 5단계에서 추가.
router.post('/', auth, validate(saveProductSchema), saveProduct);

export default router;
