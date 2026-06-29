import { toSuccess } from '../utils/response.js';
import { photoFromRequest } from '../utils/image.js';
import * as lookupService from '../services/lookup.service.js';
import * as barcodeService from '../services/barcode.service.js';

/** GET /api/products/lookup (F-003) */
export async function lookupProduct(req, res, next) {
  try {
    res.json(toSuccess(await lookupService.lookup({ jan: req.validated.query.barcode })));
  } catch (e) {
    next(e);
  }
}

/** POST /api/products/decode-barcode (F-002, multipart 또는 JSON base64) — 이미지 → JAN 숫자 */
export async function decodeBarcode(req, res, next) {
  try {
    res.json(toSuccess(await barcodeService.decodeBarcode({ photo: photoFromRequest(req) })));
  } catch (e) {
    next(e);
  }
}

/** POST /api/products/analyze-image (F-003, multipart 또는 JSON base64) */
export async function analyzeImage(req, res, next) {
  try {
    const { scanHistoryId, barcode } = req.validated.body;
    res.json(
      toSuccess(
        await lookupService.analyzeImage({
          jan: barcode,
          scanHistoryId,
          photo: photoFromRequest(req), // 멀티파트 파일 또는 base64 → { buffer, mimetype }
          userId: req.auth.userId,
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
}
