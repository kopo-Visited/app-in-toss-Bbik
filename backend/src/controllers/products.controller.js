import { toSuccess } from '../utils/response.js';
import * as lookupService from '../services/lookup.service.js';

/** GET /api/products/lookup (F-003) */
export async function lookupProduct(req, res, next) {
  try {
    res.json(toSuccess(await lookupService.lookup({ jan: req.validated.query.barcode })));
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
