import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import bwipjs from 'bwip-js';
import { Jimp } from 'jimp';

// DB / 캐시는 목 (supabase 실인스턴스 / 상태누수 방지). 외부 HTTP 는 nock.
vi.mock('../../src/cache/memoryCache.js');
vi.mock('../../src/repositories/scanHistory.repository.js');
vi.mock('../../src/repositories/communityProduct.repository.js');

import { createApp } from '../../src/app.js';
import { issueToken } from '../../src/utils/jwt.js';
import { memoryCache } from '../../src/cache/memoryCache.js';
import * as scanHistoryRepo from '../../src/repositories/scanHistory.repository.js';
import * as communityProductRepo from '../../src/repositories/communityProduct.repository.js';
import { DatabaseError } from '../../src/errors/AppError.js';

import {
  RAKUTEN_RAW_SUCCESS,
  RAKUTEN_RAW_KEYWORD_SUCCESS,
  RAKUTEN_RAW_EMPTY,
} from '../fixtures/integration/rakuten.raw.js';
import { GEMINI_RAW_OK, GEMINI_RAW_FAIL } from '../fixtures/integration/gemini.raw.js';
import { DEEPL_RAW_BATCH, DEEPL_RAW_BATCH_AI } from '../fixtures/integration/deepl.raw.js';

const app = createApp();
const JAN = '4901234567894';
const SCAN_ID = 's1';
const BEARER = `Bearer ${issueToken('user-1')}`;

const RAKUTEN_HOST = 'https://openapi.rakuten.co.jp';
const RAKUTEN_PATH = '/ichibaproduct/api/Product/Search/20250801';
const GEMINI_HOST = 'https://generativelanguage.googleapis.com';
const DEEPL_HOST = 'https://api-free.deepl.com';

const nockRakuten = (matchQuery, status, body) =>
  nock(RAKUTEN_HOST).get(RAKUTEN_PATH).query(matchQuery).reply(status, body);
const nockGemini = (status, body) =>
  nock(GEMINI_HOST).post(/\/v1beta\/models\/.*:generateContent/).reply(status, body);
const nockDeepl = (status, body) => nock(DEEPL_HOST).post('/v2/translate').reply(status, body);

beforeEach(() => {
  vi.clearAllMocks();
  memoryCache.get.mockReturnValue(null);
  memoryCache.set.mockReturnValue(undefined);
  scanHistoryRepo.start.mockResolvedValue({ id: SCAN_ID });
  scanHistoryRepo.update.mockResolvedValue(undefined);
  communityProductRepo.findByBarcode.mockResolvedValue(null);
});

describe('GET /api/products/lookup (F-003 / BL-003)', () => {
  it('L-1: barcode 조회 성공 → 200 success envelope, lookupType:barcode', async () => {
    nockRakuten(true, 200, RAKUTEN_RAW_SUCCESS);
    nockDeepl(200, DEEPL_RAW_BATCH);

    const res = await request(app)
      .get('/api/products/lookup')
      .set('Authorization', BEARER)
      .query({ barcode: JAN });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lookupType).toBe('barcode');
    expect(res.body.data.scanHistoryId).toBe(SCAN_ID);
    expect(res.body.data.barcode).toBe(JAN);
    expect(res.body.data.product.nameOriginal).toBe('緑茶 500ml');
    expect(res.body.data.product.nameKo).toBe('녹차 500ml');
    expect(res.body.data.product.brandNameKo).toBe('이토엔');
    expect(res.body.data.product.price).toBe(150);
    expect(res.body.data.product.currency).toBe('JPY');
  });

  it('L-2: 라쿠텐 결과 없음 → 404 PRODUCT_NOT_FOUND + CAPTURE_PRODUCT_IMAGE + data', async () => {
    nockRakuten(true, 200, RAKUTEN_RAW_EMPTY);

    const res = await request(app)
      .get('/api/products/lookup')
      .set('Authorization', BEARER)
      .query({ barcode: JAN });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(res.body.error.nextAction).toBe('CAPTURE_PRODUCT_IMAGE');
    expect(res.body.data.scanHistoryId).toBe(SCAN_ID);
    expect(res.body.data.barcode).toBe(JAN);
  });

  it('L-3: 잘못된 바코드 형식 → 400 INVALID_BARCODE + RETRY_SCAN', async () => {
    const res = await request(app)
      .get('/api/products/lookup')
      .set('Authorization', BEARER)
      .query({ barcode: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_BARCODE');
    expect(res.body.error.nextAction).toBe('RETRY_SCAN');
    expect(scanHistoryRepo.start).not.toHaveBeenCalled();
  });

  it('L-4: 라쿠텐 429 → 429 RATE_LIMIT_EXCEEDED', async () => {
    nockRakuten(true, 429, {});

    const res = await request(app)
      .get('/api/products/lookup')
      .set('Authorization', BEARER)
      .query({ barcode: JAN });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('L-5: DB 오류 (scanHistory.start throw) → 500 DATABASE_ERROR', async () => {
    scanHistoryRepo.start.mockRejectedValue(new DatabaseError('insert failed'));

    const res = await request(app)
      .get('/api/products/lookup')
      .set('Authorization', BEARER)
      .query({ barcode: JAN });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_ERROR');
  });

  it('L-7: 인증 없음 → 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/products/lookup').query({ barcode: JAN });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.nextAction).toBe('NONE');
  });
});

describe('POST /api/products/analyze-image (F-003, multipart)', () => {
  const IMG = Buffer.from('fake-image-bytes');
  const attach = (req) =>
    req
      .set('Authorization', BEARER)
      .field('scanHistoryId', SCAN_ID)
      .field('barcode', JAN)
      .attach('image', IMG, { filename: 'p.jpg', contentType: 'image/jpeg' });

  it('AI-1: keyword 재조회 성공 → 200, lookupType:keyword', async () => {
    nockGemini(200, GEMINI_RAW_OK);
    nockRakuten(true, 200, RAKUTEN_RAW_KEYWORD_SUCCESS);
    nockDeepl(200, DEEPL_RAW_BATCH);
    communityProductRepo.findByBarcode.mockResolvedValue(null);
    communityProductRepo.insert.mockResolvedValue('product-1');

    const res = await attach(request(app).post('/api/products/analyze-image'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lookupType).toBe('keyword');
    expect(res.body.data.barcode).toBe(JAN);
    expect(res.body.data.product.nameKo).toBe('녹차 500ml');
    expect(res.body.data.notice).toBeUndefined();
  });

  it('AI-2: keyword 실패 → ai 폴백, 200, lookupType:ai + notice, price:null', async () => {
    nockGemini(200, GEMINI_RAW_OK);
    nockRakuten(true, 200, RAKUTEN_RAW_EMPTY);
    nockDeepl(200, DEEPL_RAW_BATCH_AI);
    communityProductRepo.findByBarcode.mockResolvedValue(null);
    communityProductRepo.insert.mockResolvedValue('product-2');

    const res = await attach(request(app).post('/api/products/analyze-image'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lookupType).toBe('ai');
    expect(res.body.data.notice).toBe('AI 이미지 판단 기반 참고 정보');
    expect(res.body.data.product.price).toBeNull();
    expect(res.body.data.product.nameKo).toBe('녹차');
  });

  it('AI-3: 추출 실패 (found:false) → 502 AI_ANALYSIS_FAILED', async () => {
    nockGemini(200, GEMINI_RAW_FAIL);

    const res = await attach(request(app).post('/api/products/analyze-image'));

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AI_ANALYSIS_FAILED');
  });

  it('AI-4: image 파일 누락 → 400 INVALID_REQUEST', async () => {
    const res = await request(app)
      .post('/api/products/analyze-image')
      .set('Authorization', BEARER)
      .field('scanHistoryId', SCAN_ID)
      .field('barcode', JAN);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('AI-5: Gemini 429 → 429 RATE_LIMIT_EXCEEDED', async () => {
    nockGemini(429, {});

    const res = await attach(request(app).post('/api/products/analyze-image'));

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('AI-6: 인증 없음 → 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/products/analyze-image')
      .field('scanHistoryId', SCAN_ID)
      .field('barcode', JAN)
      .attach('image', IMG, { filename: 'p.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('AI-7: JSON base64 이미지 경로 → keyword 성공, 200 (openCamera 대응)', async () => {
    nockGemini(200, GEMINI_RAW_OK);
    nockRakuten(true, 200, RAKUTEN_RAW_KEYWORD_SUCCESS);
    nockDeepl(200, DEEPL_RAW_BATCH);
    communityProductRepo.findByBarcode.mockResolvedValue(null);
    communityProductRepo.insert.mockResolvedValue('product-3');

    const res = await request(app)
      .post('/api/products/analyze-image')
      .set('Authorization', BEARER)
      .send({ image: IMG.toString('base64'), barcode: JAN, scanHistoryId: SCAN_ID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lookupType).toBe('keyword');
    expect(res.body.data.barcode).toBe(JAN);
  });
});

describe('POST /api/products/decode-barcode (F-002 / BL-002, multipart 또는 JSON base64)', () => {
  // 실제 EAN-13 바코드 PNG 와 바코드 없는 흰 이미지 — 전체 디코드 스택을 실제로 통과시킨다.
  let BARCODE_PNG;
  let BLANK_PNG;
  const DECODED = '4901008315997'; // 디코드되어 나와야 할 정답

  beforeAll(async () => {
    BARCODE_PNG = await bwipjs.toBuffer({
      bcid: 'ean13',
      text: DECODED,
      scale: 4,
      height: 15,
      includetext: true,
      backgroundcolor: 'FFFFFF',
      paddingwidth: 12,
      paddingheight: 12,
    });
    BLANK_PNG = await new Jimp({ width: 200, height: 120, color: 0xffffffff }).getBuffer('image/png');
  });

  it('D-1: 바코드 이미지 → 200, data.barcode 디코드 성공', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER)
      .attach('image', BARCODE_PNG, { filename: 'barcode.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.barcode).toBe(DECODED);
  });

  it('D-2: 바코드 없는 이미지 → 422 BARCODE_NOT_DETECTED + MANUAL_INPUT', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER)
      .attach('image', BLANK_PNG, { filename: 'blank.png', contentType: 'image/png' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BARCODE_NOT_DETECTED');
    expect(res.body.error.nextAction).toBe('MANUAL_INPUT');
  });

  it('D-3: image 파일 누락 → 400 INVALID_REQUEST', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('D-4: 인증 없음 → 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .attach('image', BARCODE_PNG, { filename: 'barcode.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('D-5: JSON 순수 base64 → 200 디코드 성공 (openCamera 대응)', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER)
      .send({ image: BARCODE_PNG.toString('base64') });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.barcode).toBe(DECODED);
  });

  it('D-6: JSON data URI(접두사 포함) → 200 디코드 성공', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER)
      .send({ image: `data:image/png;base64,${BARCODE_PNG.toString('base64')}` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.barcode).toBe(DECODED);
  });

  it('D-7: JSON body 비었음(image 없음) → 400 INVALID_REQUEST', async () => {
    const res = await request(app)
      .post('/api/products/decode-barcode')
      .set('Authorization', BEARER)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });
});
