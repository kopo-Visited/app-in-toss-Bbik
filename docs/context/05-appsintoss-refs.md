# 앱인토스 공식 레퍼런스 (삑 프로젝트)

> 앱인토스 연동 코드(로그인/SDK/배포)를 작성하기 전 반드시 이 문서 또는
> `apps-in-toss` MCP / `docs-search` 스킬을 참조한다.

## 핵심 사실 (프론트)
- SDK 코어: **Granite**. 패키지 `@apps-in-toss/framework` + `@toss/tds-react-native`.
- 프로젝트 생성: `npm create granite-app` → `npx ait init`.
- 앱 진입점 `AppsInToss.registerApp(...)`, 네이티브 초기데이터는 `InitialProps`로 전달.
- 파일 기반 라우팅(Granite): 화면 전환은 `docs/design/00-storyboard.md` 흐름과 매핑.

---

## 백엔드 연동 (★ 우리 Node.js 프록시)

### 토스 로그인 — 백엔드 OAuth 플로우 (BL-001)
> ⚠️ **클라이언트가 보낸 값을 그냥 신뢰하지 않는다.** 인가코드를 받아 **서버가 토스 서버로 토큰을 발급**받고 사용자 정보를 조회한다.
> Base URL: `https://apps-in-toss-api.toss.im`

```
[클라이언트] appLogin() → authorizationCode (유효 10분, 일회성)
      │ authorizationCode + referrer 를 백엔드로 전달
      ▼
[백엔드] ① AccessToken 발급
        POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token
        body: { authorizationCode, referrer }
        → { accessToken(1시간), refreshToken(14일), expiresIn, scope }
      ▼
[백엔드] ② 사용자 정보 조회
        GET /api-partner/v1/apps-in-toss/user/oauth2/login-me
        header: Authorization: Bearer {accessToken}
        → { userKey, scope, agreedTerms, name·phone·birthday·ci·gender ... }
      ▼
[백엔드] ③ userKey로 users 조회/등록 → 자체 JWT(access/refresh) 발행 (BL-001)
```

핵심 주의:
- **mTLS 필수**: generate-token 등 서버↔앱인토스 호출은 **mTLS 인증서**를 설정해야 함
  (`development/integration-process.md`의 "mTLS 인증서 발급 방법"). 없으면 호출 불가.
- **인가코드**: 유효 10분·일회성. 재사용 시 `invalid_grant` 실패. 클라이언트에 장기 저장 금지.
- **userKey는 앱 단위 식별자**: 같은 사용자라도 앱이 다르면 값이 다름. 우리 `users.toss_user_key`로 사용.
- **개인정보는 암호화 제공**: name/phone/birthday/ci 등은 암호문 → 콘솔로 받은 복호화 키+AAD로 AES-256-GCM 복호화. (삑은 식별만 필요하면 userKey만 써도 됨)
- **토큰 보관**: accessToken/refreshToken은 **서버에서만** 안전 보관(클라이언트 금지).
- **scope 예외 주의**: 2026-01-02부터 scope에 `user_key` 추가 → 정의 안 된 값 와도 예외 안 나게 처리.

### 토큰 재발급 / 로그인 끊기
- 재발급: `POST .../user/oauth2/refresh-token` (refreshToken, 유효 14일)
- 연결 끊기: `POST .../oauth2/access/remove-by-access-token` 또는 `.../remove-by-user-key`
- **연결 끊기 콜백**: 사용자가 토스앱에서 직접 연결 해제하면 **우리 백엔드로 콜백**이 옴.
  - 콜백 URL·basic Auth 헤더는 **콘솔에 등록**. body/param에 `userKey`, `referrer` 전달.
  - referrer: `UNLINK`(직접 연결끊기) / `WITHDRAWAL_TERMS`(약관 철회) / `WITHDRAWAL_TOSS`(토스 탈퇴).
  - ⚠️ 서비스가 직접 끊기 API를 호출한 경우엔 콜백이 안 옴. 콜백 수신 시 해당 userKey 사용자 정리 필요.

---

## 테스트/출시 환경 (CORS·Origin 주의)
- 샌드박스(테스트앱) 1차 테스트 → QR로 실제 환경 재확인.
- Origin 허용 목록 등록 필수:
  - 실제: `https://<appName>.apps.tossmini.com`
  - QR 테스트: `https://<appName>.private-apps.tossmini.com`
- ⚠️ 테스트 환경 정상이어도 실제 환경 CORS/네트워크가 다를 수 있음 → 출시 전 재검증.
- 출시: 콘솔 '검토 요청' → 승인 후 '출시하기'(즉시 전체 반영).
- 로컬 인증 에러: 토큰 만료 또는 샌드박스 개발자 로그인 안 됨이 주원인.

## 공식 문서 URL (@docs / docs-search 대상)
| 유형 | URL |
| --- | --- |
| 기본 문서(권장) | https://developers-apps-in-toss.toss.im/llms.txt |
| 전체 문서(Full) | https://developers-apps-in-toss.toss.im/llms-full.txt |
| TDS React Native | https://tossmini-docs.toss.im/tds-react-native/llms-full.txt |
| **토스 로그인(백엔드)** | https://developers-apps-in-toss.toss.im/login/develop.html |
| **API 사용·mTLS** | https://developers-apps-in-toss.toss.im/development/integration-process.html |
| **사용자 식별키** | https://developers-apps-in-toss.toss.im/user-hash-key/develop.html |
| Supabase 연동 | https://developers-apps-in-toss.toss.im/supabase/intro.html |
| 개발자센터 | https://developers-apps-in-toss.toss.im/ |
| 공식 예제 레포 | https://github.com/toss/apps-in-toss-examples |

> 로그인 예제: apps-in-toss-examples 저장소의 `with-app-login`.

## UI/UX 가이드(검수 반려 방지)
- 브랜드 로고·이름·컬러를 노출해 토스와 명확히 구분(다크패턴 금지).
- 리소스 파일은 빌드와 분리, 대용량은 CDN/지연 다운로드.
- UI 한국어, 상품 원문(일본어)+한국어 번역 병행 표시.