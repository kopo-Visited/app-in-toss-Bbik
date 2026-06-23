import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { shareProductSchema } from '../schemas/share.schema.js';
import { shareProduct } from '../controllers/share.controller.js';

const router = Router();

// POST /api/share/products — 공유 문구 생성 (F-006)
router.post('/products', auth, validate(shareProductSchema), shareProduct);

export default router;
