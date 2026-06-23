import { z } from 'zod';

// EAN-13 / EAN-8 숫자만 (BR-001 / BL-002)
const barcode = z.string().regex(/^(\d{13}|\d{8})$/);

/** GET /api/products/lookup?barcode= (검증 실패 → INVALID_BARCODE) */
export const lookupQuerySchema = z.object({
  query: z.object({ barcode }),
});

/**
 * POST /api/products/analyze-image (multipart, 03-api-spec §10.3).
 * image 파일은 multer 가 req.file 에 채운 뒤 검증한다(없으면 INVALID_REQUEST).
 * barcode 는 /lookup 에서 이미 검증된 최초 스캔 코드.
 */
export const analyzeImageSchema = z.object({
  body: z.object({
    scanHistoryId: z.string().min(1),
    barcode,
  }),
  file: z.object({
    mimetype: z.string().startsWith('image/'),
    buffer: z.any(),
  }),
});
