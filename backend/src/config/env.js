import 'dotenv/config';

/**
 * 환경변수 단일 로딩 지점. 외부 API 키는 오직 여기(config)에만 존재한다 (P-1, CLAUDE.md §8).
 * 키가 비어 있어도 부팅은 막지 않는다 — 실제 호출 시점에 각 client/util 이 "키/인증서 필요"로 처리.
 */
function get(name, fallback = undefined) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const config = {
  env: get('NODE_ENV', 'development'),
  port: Number(get('PORT', '3000')),

  jwt: {
    secret: get('JWT_SECRET'),
    accessExpiresIn: get('JWT_ACCESS_EXPIRES_IN', '1h'),
    refreshExpiresIn: get('JWT_REFRESH_EXPIRES_IN', '14d'),
  },

  // 토스 앱인토스 OAuth (mTLS 필수)
  toss: {
    baseUrl: get('TOSS_API_BASE_URL', 'https://apps-in-toss-api.toss.im'),
    mtlsCertPath: get('TOSS_MTLS_CERT_PATH'),
    mtlsKeyPath: get('TOSS_MTLS_KEY_PATH'),
    mtlsCaPath: get('TOSS_MTLS_CA_PATH'),
    piiDecryptKey: get('TOSS_PII_DECRYPT_KEY'),
    piiAad: get('TOSS_PII_AAD'),
  },

  rakuten: {
    baseUrl: get(
      'RAKUTEN_API_BASE_URL',
      'https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801',
    ),
    applicationId: get('RAKUTEN_APPLICATION_ID'),
    accessKey: get('RAKUTEN_ACCESS_KEY'),
    affiliateId: get('RAKUTEN_AFFILIATE_ID'),
    referer: get('RAKUTEN_REFERER', 'https://bbik-api.fly.dev/'),
    timeoutMs: Number(get('RAKUTEN_TIMEOUT_MS', '5000')),
  },

  gemini: {
    apiKey: get('GEMINI_API_KEY'),
    model: get('GEMINI_MODEL', 'gemini-2.0-flash'),
    baseUrl: get('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com'),
  },

  translation: {
    provider: get('TRANSLATION_PROVIDER', 'deepl'),
    deeplApiKey: get('DEEPL_API_KEY'),
    deeplBaseUrl: get('DEEPL_API_BASE_URL', 'https://api-free.deepl.com'),
  },

  supabase: {
    url: get('SUPABASE_URL'),
    serviceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY'),
  },
};

/** 필수 키 누락 시 명확한 에러로 던진다 (실제 호출 시점에 호출). */
export function requireConfig(path) {
  const value = path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), config);
  if (value === undefined || value === null || value === '') {
    throw new Error(`환경변수 누락: config.${path} (키/인증서 필요 — .env 확인)`);
  }
  return value;
}
