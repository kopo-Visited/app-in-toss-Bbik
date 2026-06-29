import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cache/memoryCache.js');
vi.mock('../../src/repositories/scanHistory.repository.js');
vi.mock('../../src/repositories/communityProduct.repository.js');
vi.mock('../../src/clients/rakuten.client.js');
vi.mock('../../src/clients/gemini.client.js');

const translateBatchMock = vi.fn();
vi.mock('../../src/clients/translation/TranslationClient.js', () => ({
  getTranslationClient: () => ({ translateBatch: translateBatchMock }),
}));

import { lookup, analyzeImage } from '../../src/services/lookup.service.js';
import { memoryCache } from '../../src/cache/memoryCache.js';
import * as scanHistoryRepo from '../../src/repositories/scanHistory.repository.js';
import * as communityProductRepo from '../../src/repositories/communityProduct.repository.js';
import * as rakutenClient from '../../src/clients/rakuten.client.js';
import * as geminiClient from '../../src/clients/gemini.client.js';
import { NotFoundError, AnalysisError, RateLimitError, TimeoutError } from '../../src/errors/AppError.js';

import { RAKUTEN_BARCODE_DTO, RAKUTEN_KEYWORD_DTO } from '../fixtures/rakuten.js';
import { GEMINI_EXTRACTED_OK, GEMINI_EXTRACTED_FAIL } from '../fixtures/gemini.js';
import { DEEPL_BATCH_RESULT, DEEPL_BATCH_AI_RESULT } from '../fixtures/deepl.js';

const JAN = '4901234567894';
const SCAN_ID = 's1';
const photo = { buffer: Buffer.from('img'), mimetype: 'image/jpeg' };

beforeEach(() => {
  vi.clearAllMocks();
  memoryCache.get.mockReturnValue(null);
  scanHistoryRepo.start.mockResolvedValue({ id: SCAN_ID });
  scanHistoryRepo.update.mockResolvedValue(undefined);
  communityProductRepo.findByBarcode.mockResolvedValue(null);
});

describe('lookup() — BL-003 / BL-005', () => {
  it('case1: cache HIT -> 0 external calls, lookupType(keyword) kept', async () => {
    memoryCache.get.mockReturnValue({
      lookupType: 'keyword',
      productId: 'p1',
      nameOriginal: '緑茶',
      nameKo: '녹차',
      brandNameOriginal: '伊藤園',
      brandNameKo: '이토엔',
      price: 150,
      currency: 'JPY',
      imageUrl: null,
    });

    const result = await lookup({ jan: JAN });

    expect(rakutenClient.searchByProductCode).not.toHaveBeenCalled();
    expect(rakutenClient.searchByKeyword).not.toHaveBeenCalled();
    expect(geminiClient.extract).not.toHaveBeenCalled();
    expect(translateBatchMock).not.toHaveBeenCalled();
    expect(communityProductRepo.findByBarcode).not.toHaveBeenCalled();
    expect(scanHistoryRepo.update).toHaveBeenCalledWith(SCAN_ID, {
      found: true,
      lookupType: 'keyword',
      productId: 'p1',
    });
    expect(result.lookupType).toBe('keyword');
    expect(result.scanHistoryId).toBe(SCAN_ID);
    expect(result.barcode).toBe(JAN);
  });

  it('case2: rakuten 1st success -> lookupType=barcode, translate called, cache set, no DB insert', async () => {
    rakutenClient.searchByProductCode.mockResolvedValue(RAKUTEN_BARCODE_DTO);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_RESULT);

    const result = await lookup({ jan: JAN });

    expect(rakutenClient.searchByProductCode).toHaveBeenCalledTimes(1);
    expect(rakutenClient.searchByProductCode).toHaveBeenCalledWith(JAN);
    expect(rakutenClient.searchByKeyword).not.toHaveBeenCalled();
    expect(geminiClient.extract).not.toHaveBeenCalled();
    expect(translateBatchMock).toHaveBeenCalledTimes(1);
    expect(translateBatchMock).toHaveBeenCalledWith(['緑茶 500ml', '伊藤園']);
    expect(memoryCache.set).toHaveBeenCalledTimes(1);
    expect(communityProductRepo.insert).not.toHaveBeenCalled();
    expect(scanHistoryRepo.update).toHaveBeenCalledWith(SCAN_ID, {
      found: true,
      lookupType: 'barcode',
    });
    expect(result.lookupType).toBe('barcode');
    expect(result.product.nameKo).toBe('녹차 500ml');
    expect(result.product.brandNameKo).toBe('이토엔');
    expect(result.product.price).toBe(150);
  });

  it('case3: rakuten 1st empty -> NotFoundError(PRODUCT_NOT_FOUND, CAPTURE_PRODUCT_IMAGE)', async () => {
    rakutenClient.searchByProductCode.mockResolvedValue(null);

    await expect(lookup({ jan: JAN })).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
      nextAction: 'CAPTURE_PRODUCT_IMAGE',
      data: { scanHistoryId: SCAN_ID, barcode: JAN },
    });
    await expect(lookup({ jan: JAN })).rejects.toBeInstanceOf(NotFoundError);

    expect(scanHistoryRepo.update).not.toHaveBeenCalled();
    expect(memoryCache.set).not.toHaveBeenCalled();
    expect(translateBatchMock).not.toHaveBeenCalled();
  });

  it('case7A: rakuten 1st 429 -> RateLimitError propagated, no scan update', async () => {
    rakutenClient.searchByProductCode.mockRejectedValue(new RateLimitError());

    await expect(lookup({ jan: JAN })).rejects.toMatchObject({
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    });
    await expect(lookup({ jan: JAN })).rejects.toBeInstanceOf(RateLimitError);
    expect(scanHistoryRepo.update).not.toHaveBeenCalled();
  });

  it('case8-absorb: rakuten 1st TimeoutError -> absorbed into NotFoundError(PRODUCT_NOT_FOUND)', async () => {
    rakutenClient.searchByProductCode.mockRejectedValue(new TimeoutError());

    await expect(lookup({ jan: JAN })).rejects.toBeInstanceOf(NotFoundError);
    await expect(lookup({ jan: JAN })).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
  });

  it('case9-lookup: scanHistory.start called once (P-5 one scan = one row)', async () => {
    rakutenClient.searchByProductCode.mockResolvedValue(RAKUTEN_BARCODE_DTO);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_RESULT);

    await lookup({ jan: JAN });

    expect(scanHistoryRepo.start).toHaveBeenCalledTimes(1);
  });
});

describe('analyzeImage() — BL-003 fallback / BL-004', () => {
  it('case4: gemini extract -> keyword re-search success -> lookupType=keyword, DB insert, cache set', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_OK);
    rakutenClient.searchByKeyword.mockResolvedValue(RAKUTEN_KEYWORD_DTO);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_RESULT);
    communityProductRepo.insert.mockResolvedValue('pid-1');

    const result = await analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    expect(geminiClient.extract).toHaveBeenCalledTimes(1);
    expect(rakutenClient.searchByKeyword).toHaveBeenCalledTimes(1);
    expect(rakutenClient.searchByKeyword).toHaveBeenCalledWith('伊藤園 緑茶');
    expect(rakutenClient.searchByProductCode).not.toHaveBeenCalled();
    expect(communityProductRepo.insert).toHaveBeenCalledTimes(1);
    expect(memoryCache.set).toHaveBeenCalledTimes(1);
    expect(scanHistoryRepo.update).toHaveBeenCalledWith(SCAN_ID, {
      found: true,
      lookupType: 'keyword',
      productId: 'pid-1',
    });
    expect(result.lookupType).toBe('keyword');
    expect(result.product.nameKo).toBe('녹차 500ml');
  });

  it('case4b: 과다어 0건 -> 앞 2어로 좁혀 1회 재시도 성공 (lookupType=keyword)', async () => {
    geminiClient.extract.mockResolvedValue({
      found: true,
      name_jp: 'クリーミィタッチライナー 02 ブラック', // 색/번호 포함 과다어
      brand_jp: 'キャンメイク',
      search_keywords: ['キャンメイク クリーミィタッチライナー 02 ブラック'],
      price: null,
      currency: 'JPY',
      confidence: 'high',
    });
    // 1차(브랜드+상품명 전체)=0건 → 2차(앞 2어)=성공
    rakutenClient.searchByKeyword
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(RAKUTEN_KEYWORD_DTO);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_RESULT);
    communityProductRepo.insert.mockResolvedValue('pid-1b');

    const result = await analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    expect(rakutenClient.searchByKeyword).toHaveBeenCalledTimes(2);
    expect(rakutenClient.searchByKeyword).toHaveBeenNthCalledWith(
      1,
      'キャンメイク クリーミィタッチライナー 02 ブラック',
    );
    expect(rakutenClient.searchByKeyword).toHaveBeenNthCalledWith(
      2,
      'キャンメイク クリーミィタッチライナー',
    );
    expect(result.lookupType).toBe('keyword');
  });

  it('case5: keyword re-search empty -> ai fallback (found:false, price:null, translate x1, cache set x0)', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_OK);
    rakutenClient.searchByKeyword.mockResolvedValue(null);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_AI_RESULT);
    communityProductRepo.insert.mockResolvedValue('pid-2');

    const result = await analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    expect(translateBatchMock).toHaveBeenCalledTimes(1);
    expect(translateBatchMock).toHaveBeenCalledWith(['緑茶', '伊藤園']);
    expect(memoryCache.set).not.toHaveBeenCalled();
    expect(communityProductRepo.insert).toHaveBeenCalledTimes(1);
    expect(scanHistoryRepo.update).toHaveBeenCalledWith(SCAN_ID, {
      found: false,
      lookupType: 'ai',
      productId: 'pid-2',
    });
    expect(result.lookupType).toBe('ai');
    expect(result.product.price).toBeNull();
    expect(result.product.nameKo).toBe('녹차');
    expect(result.notice).toBe('AI 이미지 판단 기반 참고 정보');
  });

  it('case6: gemini extract fail(found:false) -> AnalysisError(AI_ANALYSIS_FAILED)', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_FAIL);

    const call = () => analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    await expect(call()).rejects.toBeInstanceOf(AnalysisError);
    await expect(call()).rejects.toMatchObject({
      code: 'AI_ANALYSIS_FAILED',
      statusCode: 502,
      nextAction: 'CAPTURE_PRODUCT_IMAGE',
    });
    expect(rakutenClient.searchByKeyword).not.toHaveBeenCalled();
    expect(communityProductRepo.insert).not.toHaveBeenCalled();
    expect(scanHistoryRepo.update).not.toHaveBeenCalled();
  });

  it('case7B: gemini extract 429 -> RateLimitError propagated', async () => {
    geminiClient.extract.mockRejectedValue(new RateLimitError());

    await expect(
      analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' }),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(rakutenClient.searchByKeyword).not.toHaveBeenCalled();
  });

  it('case7B-2: keyword re-search 429 -> RateLimitError propagated (no ai fallback)', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_OK);
    rakutenClient.searchByKeyword.mockRejectedValue(new RateLimitError());

    await expect(
      analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED' });
    expect(communityProductRepo.insert).not.toHaveBeenCalled();
  });

  it('case8-absorb-analyze: keyword re-search TimeoutError -> absorbed, ai fallback (lookupType=ai)', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_OK);
    rakutenClient.searchByKeyword.mockRejectedValue(new TimeoutError());
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_AI_RESULT);
    communityProductRepo.insert.mockResolvedValue('pid-3');

    const result = await analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    expect(result.lookupType).toBe('ai');
    expect(scanHistoryRepo.update).toHaveBeenCalledWith(SCAN_ID, {
      found: false,
      lookupType: 'ai',
      productId: 'pid-3',
    });
  });

  it('case9-analyze: scanHistory.start NOT called (P-5, reuse lookup row)', async () => {
    geminiClient.extract.mockResolvedValue(GEMINI_EXTRACTED_OK);
    rakutenClient.searchByKeyword.mockResolvedValue(RAKUTEN_KEYWORD_DTO);
    translateBatchMock.mockResolvedValue(DEEPL_BATCH_RESULT);
    communityProductRepo.insert.mockResolvedValue('pid-4');

    await analyzeImage({ jan: JAN, scanHistoryId: SCAN_ID, photo, userId: 'u1' });

    expect(scanHistoryRepo.start).not.toHaveBeenCalled();
  });
});
