import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // 전역 셋업: 테스트 env 주입(config 로드 전) + nock disableNetConnect.
    // 단위 테스트는 전부 vi.mock 이라 env/nock 영향 없음(무해).
    setupFiles: ['tests/setup.integration.js'],
  },
});
