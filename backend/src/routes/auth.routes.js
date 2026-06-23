import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { tossLoginSchema } from '../schemas/auth.schema.js';
import { tossLogin } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/toss/login — 인증 불필요(이 API 가 우리 인증을 발급, 03-api-spec §5.1)
router.post('/toss/login', validate(tossLoginSchema), tossLogin);

export default router;
