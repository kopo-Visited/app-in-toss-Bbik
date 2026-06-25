import { env } from '@granite-js/plugin-env';
import { router } from '@granite-js/plugin-router';
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'bbik',
  plugins: [
    appsInToss({
      // 권한: openCamera(F-002 바코드 촬영 / F-003 상품 촬영) + setClipboardText(F-006 공유 복사).
      permissions: [
        { name: 'camera', access: 'access' },
        { name: 'clipboard', access: 'write' },
      ],
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
      // ⚠️ 임시(실기기 테스트용) 로그인 우회 플래그. 토스 mTLS 인증서 발급되면 제거(false/삭제).
      DEV_AUTH_BYPASS: 'true',
    }),
    router(),
  ],
});
