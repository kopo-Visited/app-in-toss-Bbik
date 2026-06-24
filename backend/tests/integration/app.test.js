import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import nock from 'nock';
import { createApp } from '../../src/app.js';

// 외부(라쿠텐/Gemini/DeepL/Supabase)는 전부 차단, supertest 로컬(127.0.0.1)만 허용
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});
afterEach(() => nock.cleanAll());
afterAll(() => nock.enableNetConnect());

describe('createApp() 부팅/기본 라우팅', () => {
  const app = createApp();

  it('GET /health → 200 success envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('미존재 라우트 → 404 + {success:false, error.code:INVALID_REQUEST}', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });
});
