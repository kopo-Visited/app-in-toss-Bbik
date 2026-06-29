import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/clients/barcode.client.js');

import { decodeBarcode } from '../../src/services/barcode.service.js';
import * as barcodeClient from '../../src/clients/barcode.client.js';
import { BarcodeNotDetectedError } from '../../src/errors/AppError.js';

const photo = { buffer: Buffer.from('img'), mimetype: 'image/jpeg' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('barcode.service.decodeBarcode() — BL-002 / F-002', () => {
  it('디코드 성공 → { barcode }', async () => {
    barcodeClient.decodeEan.mockResolvedValue('4901008315997');

    const result = await decodeBarcode({ photo });

    expect(result).toEqual({ barcode: '4901008315997' });
    expect(barcodeClient.decodeEan).toHaveBeenCalledWith(photo.buffer);
  });

  it('F-002 미검출(client null) → BarcodeNotDetectedError (MANUAL_INPUT)', async () => {
    barcodeClient.decodeEan.mockResolvedValue(null);

    await expect(decodeBarcode({ photo })).rejects.toBeInstanceOf(BarcodeNotDetectedError);
    await expect(decodeBarcode({ photo })).rejects.toMatchObject({
      code: 'BARCODE_NOT_DETECTED',
      statusCode: 422,
      nextAction: 'MANUAL_INPUT',
    });
  });
});
