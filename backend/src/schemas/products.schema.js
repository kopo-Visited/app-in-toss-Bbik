import { z } from 'zod';

// EAN-13 / EAN-8 숫자만 (BR-001 / BL-002)
const barcode = z.string().regex(/^(\d{13}|\d{8})$/);

/** GET /api/products/lookup?barcode= (검증 실패 → INVALID_BARCODE) */
export const lookupQuerySchema = z.object({
  query: z.object({ barcode }),
});

// 이미지 입력 = 멀티파트 파일(req.file) 또는 JSON body 의 base64 문자열(body.image).
// 앱인토스 openCamera 가 file:// 가 아닌 base64/dataUri 를 줘서 JSON 경로를 함께 받는다(F-002/F-003).
const imageFile = z.object({ mimetype: z.string().startsWith('image/'), buffer: z.any() }).optional();
const imageBase64 = z.string().min(1).optional();
const hasImage = (d) => Boolean(d.file) || Boolean(d.body?.image);
const IMAGE_REQUIRED = { message: 'image(파일 또는 base64)가 필요합니다' };

/**
 * POST /api/products/analyze-image (multipart 또는 JSON base64, 03-api-spec §10.3).
 * image: 멀티파트 파일 또는 body.image(base64). barcode 는 /lookup 에서 검증된 최초 스캔 코드.
 */
export const analyzeImageSchema = z
  .object({
    body: z.object({
      scanHistoryId: z.string().min(1),
      barcode,
      image: imageBase64,
    }),
    file: imageFile,
  })
  .refine(hasImage, IMAGE_REQUIRED);

/**
 * POST /api/products/decode-barcode (multipart 또는 JSON base64, F-002/BL-002).
 * image: 멀티파트 파일 또는 body.image(base64). 둘 다 없으면 INVALID_REQUEST.
 */
export const decodeBarcodeSchema = z
  .object({
    body: z.object({ image: imageBase64 }).default({}),
    file: imageFile,
  })
  .refine(hasImage, IMAGE_REQUIRED);
