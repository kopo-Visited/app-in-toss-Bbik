import { env } from '@granite-js/plugin-env';
import { router } from '@granite-js/plugin-router';
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'bbik',
  plugins: [
    appsInToss({
      permissions: [],
      brand: {
        displayName: '삑',
        icon: '', // 콘솔 업로드 후 URL로 교체 (출시 전)
        primaryColor: '#3182F6', // 브랜드 primary (docs/design/design-tokens.md §1 brand)
        // bridgeColorMode: SDK 2.x brand 스키마에서 제거됨(framework 2.4.1 / @apps-in-toss/plugins).
        // 새 스키마는 { displayName, primaryColor, icon }만 허용 — 대체 속성 없음.
      },
    }),
    env({
      // 배포 백엔드(Fly.io). 로컬 백엔드로 테스트하려면 'http://localhost:3000' 으로 교체.
      SERVER_BASE_URL: 'https://bbik-api.fly.dev',
    }),
    router(),
  ],
});
