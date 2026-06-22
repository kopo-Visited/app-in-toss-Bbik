# 앱인토스 공식 레퍼런스 (삑 프로젝트)

> 앱인토스 연동 코드(로그인/SDK/배포)를 작성하기 전 반드시 이 문서 또는
> `apps-in-toss` MCP / `docs-search` 스킬을 참조한다.

## 핵심 사실
- SDK 코어: **Granite**. 패키지 `@apps-in-toss/framework` + `@toss/tds-react-native`.
- 프로젝트 생성: `npm create granite-app` → `npx ait init`.
- 앱 진입점 `AppsInToss.registerApp(...)`, 네이티브 초기데이터는 `InitialProps`로 전달.
- 토스 로그인: 앱인토스 로그인/유저 식별키 API로 tossUserKey 확보 → backend BL-001로 전달.
- 파일 기반 라우팅(Granite): 화면 전환은 `docs/design/00-storyboard.md` 흐름과 매핑.

## 테스트/출시 환경 (CORS·Origin 주의)
- 샌드박스(테스트앱) 1차 테스트 → QR로 실제 환경 재확인.
- Origin 허용 목록 등록 필수:
  - 실제: `https://<appName>.apps.tossmini.com`
  - QR 테스트: `https://<appName>.private-apps.tossmini.com`
- ⚠️ 테스트 환경 정상이어도 실제 환경 CORS/네트워크가 다를 수 있음 → 출시 전 재검증.
- 출시: 콘솔 '검토 요청' → 승인 후 '출시하기'(즉시 전체 반영).

## 공식 문서 URL (@docs / docs-search 대상)
| 유형 | URL |
| --- | --- |
| 기본 문서(권장) | https://developers-apps-in-toss.toss.im/llms.txt |
| 전체 문서(Full) | https://developers-apps-in-toss.toss.im/llms-full.txt |
| TDS React Native | https://tossmini-docs.toss.im/tds-react-native/llms-full.txt |
| 개발자센터 | https://developers-apps-in-toss.toss.im/ |
| 공식 예제 레포 | https://github.com/toss/apps-in-toss-examples |

## UI/UX 가이드(검수 반려 방지)
- 브랜드 로고·이름·컬러를 노출해 토스와 명확히 구분(다크패턴 금지).
- 리소스 파일은 빌드와 분리, 대용량은 CDN/지연 다운로드.
- UI 한국어, 상품 원문(일본어)+한국어 번역 병행 표시.