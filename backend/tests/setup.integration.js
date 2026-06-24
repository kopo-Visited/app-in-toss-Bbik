/**
 * 통합 테스트 전역 셋업 (vitest setupFiles).
 *
 * ⚠️ 이 파일은 config/env.js 가 process.env 를 읽기 "전"에 실행돼야 한다.
 *    (config 는 모듈 로드 시점에 1회만 env 를 읽으므로 setupFiles 에서 주입한다.)
 *    여기서 주입하는 더미 키는 외부 client 의 requireConfig() 통과용일 뿐,
 *    실제 외부 호출은 nock(HTTP) / vi.mock(DB·toss·pii·cache) 으로 전부 차단한다.
 *
 * 단위 테스트에도 동일 적용되지만:
 *  - env 더미값은 단위 테스트(전부 vi.mock)에 영향 없음.
 *  - nock.disableNetConnect 는 단위 테스트가 네트워크를 쓰지 않으므로 무해.
 */
import { afterEach, beforeAll, afterAll } from 'vitest';
import nock from 'nock';

// ── 테스트 env (config/jwt 로드 전 주입) ──
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.RAKUTEN_APPLICATION_ID = 'test';
process.env.RAKUTEN_ACCESS_KEY = 'test';
process.env.GEMINI_API_KEY = 'test';
process.env.DEEPL_API_KEY = 'test';

// ── 외부 실호출 0 보장: HTTP 는 전부 nock, 로컬(supertest)만 허용 ──
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
});
