import { toSuccess } from '../utils/response.js';
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

/** POST /api/products/decode-barcode (F-002, multipart) — 이미지 → JAN 숫자 */
export async function decodeBarcode(req, res, next) {
  try {
    res.json(toSuccess(await barcodeService.decodeBarcode({ photo: req.file })));
  } catch (e) {
    next(e);
  }
}

/** POST /api/products/analyze-image (F-003, multipart) */
export async function analyzeImage(req, res, next) {
  try {
    const { scanHistoryId, barcode } = req.validated.body;
    res.json(
      toSuccess(
        await lookupService.analyzeImage({
          jan: barcode,
          scanHistoryId,
          photo: req.file, // multer memoryStorage → { buffer, mimetype }
          userId: req.auth.userId,
        }),
      ),
    );
  } catch (e) {
    next(e);
  }
}
