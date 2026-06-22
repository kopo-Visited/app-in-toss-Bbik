---
name: appsintoss-sdk
description: >
  앱인토스 SDK·Granite 연동 코드를 작성·수정할 때 사용한다.
  토스 로그인(tossUserKey), 앱 등록(registerApp), 파일 기반 라우팅, TDS-RN 컴포넌트 사용 시.
---

# 앱인토스 SDK 연동 규칙

## ★ 작성 전 필수
앱인토스 SDK는 변경이 잦고 Claude 기억이 옛것일 수 있다.
**코드 작성 전 반드시 `apps-in-toss` MCP 또는 `docs-search`로 최신 API를 확인**한다.
("토스 MCP를 정확히 참조해서 구현해"라고 명시하면 누락이 준다.)
참고 문서: `@docs/context/05-appsintoss-refs.md`.

## 핵심
- 패키지: `@apps-in-toss/framework` + `@toss/tds-react-native` (Granite).
- 앱 진입점 `AppsInToss.registerApp(...)`, 네이티브 초기데이터는 `InitialProps`.
- 파일 기반 라우팅 → 화면 전환은 `@docs/design/00-storyboard.md` 흐름과 매핑.

## 토스 로그인 (F-001 / BL-001)
1. 앱인토스 로그인/유저 식별키 API로 **tossUserKey** 확보(프론트).
2. tossUserKey를 **백엔드 `POST /api/auth/toss/login`** 으로 전달.
3. 백엔드가 users 조회/등록 후 accessToken 발급(BL-001).
- ⚠️ 토스 인증 검증 방식(서버 토큰 검증 vs tossUserKey 신뢰)은 **확인 필요 항목** — 확정 전 MCP/팀 확인.

## UI 규칙
- TDS-RN 컴포넌트 우선. 미문서 컴포넌트는 MCP/docs-search로 확인 후 대체.
- UI 한국어 + 상품 일본어 원문/한국어 번역 병행 표시.
- 기준 폭 375px, 라이트 모드, 토스와 구분되는 브랜드 노출(검수).

## 출시 전
- Origin 허용 등록(`<appName>.apps.tossmini.com` / `.private-apps.tossmini.com`).
- 샌드박스 → QR 실제환경 CORS 재검증 → 콘솔 검토 요청 → 출시.