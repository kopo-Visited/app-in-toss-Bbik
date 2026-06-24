import * as barcodeClient from '../clients/barcode.client.js';
import { BarcodeNotDetectedError } from '../errors/AppError.js';

/**
 * BL-002 바코드 디코딩 (F-002). 적용 BR: BR-001.
 *
 * 앱인토스 Granite 에 실시간 바코드 스캐너가 없어, 촬영 이미지를 받아 백엔드에서
 * JAN/EAN 숫자를 디코드한다. DB·캐시·scan_history 는 건드리지 않는 무상태 유틸이며,
 * 반환된 barcode 로 이후 F-003 lookup 흐름을 탄다.
 *
 * @param {{ photo: { buffer: Buffer, mimetype: string } }} params
 * @returns {Promise<{ barcode: string }>}
 * @throws {BarcodeNotDetectedError} 유효한 EAN 미검출 (FE → 직접입력 폴백)
 */
export async function decodeBarcode({ photo }) {
  const barcode = await barcodeClient.decodeEan(photo.buffer);
  if (!barcode) throw new BarcodeNotDetectedError(); // F-002 미검출 → MANUAL_INPUT
  return { barcode };
}
