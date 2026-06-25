import { Router } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  lookupQuerySchema,
  analyzeImageSchema,
  decodeBarcodeSchema,
} from '../schemas/products.schema.js';
import {
  lookupProduct,
  analyzeImage,
  decodeBarcode,
} from '../controllers/products.controller.js';

// 촬영 이미지는 메모리에 받아 Gemini 로 전달 (스토리지 미사용)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// GET /api/products/lookup?barcode= — 바코드 검증 실패 시 INVALID_BARCODE (BL-002/BR-001)
router.get('/lookup', auth, validate(lookupQuerySchema, 'INVALID_BARCODE'), lookupProduct);

// POST /api/products/decode-barcode — multer(image) → 디코드(JAN 숫자만 반환) (F-002/BL-002)
router.post('/decode-barcode', auth, upload.single('image'), validate(decodeBarcodeSchema), decodeBarcode);

// POST /api/products/analyze-image — multer(image) → 검증 → 핸들러
router.post('/analyze-image', auth, upload.single('image'), validate(analyzeImageSchema), analyzeImage);

export default router;
