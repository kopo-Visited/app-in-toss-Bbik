# 삑(Bbik) — 앱인토스 해외 상품 바코드 스캐너

일본 상품 JAN 바코드를 스캔 → 라쿠텐 조회 → Gemini 한국어 분석 후 안내하는
**앱인토스 미니앱**. FE: React Native(Granite) / BE: Node.js 프록시 / DB: Supabase.

> 이 파일은 매 세션 자동 로드된다. **항상 지켜야 할 것**만 담고, 큰 스펙은 `@docs/...`로 참조한다.

---

## 1. 아키텍처 (절대 원칙)
- **모든 비즈니스 로직은 backend(Node.js 프록시)에서 수행.** FE는 표현·호출만.
- **외부 API 키(라쿠텐/Gemini)는 절대 클라이언트에 노출 금지.** backend 환경변수로만.
- FE: React Native + 앱인토스 Granite (`@apps-in-toss/framework`, `@toss/tds-react-native`)
- DB: Supabase(PostgreSQL) + RLS로 사용자별 접근 제어
- 처리 흐름 단일 출처: `@docs/context/02-business-logic.md` (BL-001~BL-007)

### 계층 (경계 엄수)
- BE: `Controller → Service → (Repository | Client)` (단방향). controller=HTTP만, service=BL/BR, repository=Supabase, client=외부API.
- FE: `Screen → Feature → Hook → ApiClient → lib`. Component는 말단 프레젠테이션. api에 외부 키 금지.

---

## 2. 핵심 도메인 규칙 (요약 — 전체는 02 문서 BR-001~BR-012)
- 바코드는 EAN-13 / EAN-8 숫자만 허용. 그 외 거부(INVALID_BARCODE).
- 상품 조회 2단계 폴백: ①라쿠텐 productCode 조회 → ②사진→상품명추출→재조회 → ③사진 AI 직접분석(ai_vision, 참고정보).
- 한국어 번역·요약은 Gemini 전담. 라쿠텐은 일본어 원문만.
- 동일 바코드는 캐시 우선(라쿠텐 레이트리밋 + Gemini 분당 15회 대응). **ai_vision 결과는 캐시 금지.**
- 저장 중복은 (user_id + barcode). barcode가 NULL이면 중복검사 제외.
- source는 rakuten / ai_vision / cache 중 하나로 scan_history에 기록.

---

## 3. 앱인토스 프로젝트 셋업

### 도구 설치 (머신 1회)
```bash
# 앱인토스 CLI (MCP 서버도 겸함)
brew tap toss/tap && brew install ax            # macOS
# Windows: scoop bucket add toss https://github.com/toss/scoop-bucket.git && scoop install ax
npm i -g @anthropic-ai/claude-code              # Claude Code
```

### 프로젝트 생성
```bash
npm create granite-app@latest bbik-frontend     # FE 골격(Granite)
cd bbik-frontend && npx ait init                # 앱인토스 설정 초기화
# backend/ 는 같은 레포에 별도 생성: npm init
```

### 핵심 사실
- 앱 진입점 `AppsInToss.registerApp(...)`, 네이티브 초기데이터는 `InitialProps`로 전달.
- 토스 로그인: 앱인토스 로그인/유저 식별키 API로 tossUserKey 확보 → backend BL-001로 전달.
- 출시 Origin 허용 등록 필수: 실제 `https://<appName>.apps.tossmini.com` / QR `https://<appName>.private-apps.tossmini.com`.
- ⚠️ 테스트 환경이 정상이어도 실제 환경 CORS가 다를 수 있음 → 출시 전 재검증.

---

## 4. MCP 서버 (★ AI가 공식 문서·도구를 참조)

프로젝트 루트 `.mcp.json` (팀 공유). 인증은 각자 1회.
```json
{
  "mcpServers": {
    "apps-in-toss": { "command": "ax", "args": ["mcp", "start"] },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase", "--read-only"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    },
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" }
  }
}
```

### 연결·인증
```bash
# apps-in-toss (ax 설치돼 있으면 자동, 수동 등록은)
claude mcp add --transport stdio apps-in-toss ax mcp start
# figma (원격, OAuth 1회)
claude plugin install figma@claude-plugins-official
/mcp        # → figma 선택 → Authenticate → 브라우저 Allow access
# 앱인토스 공식 docs-search 스킬
/plugin marketplace add toss/apps-in-toss-skills
/plugin install knowledge-skills@apps-in-toss-skills
```

### 사용 규칙
- 앱인토스 SDK·API 작성 전 **반드시** `apps-in-toss` MCP 또는 `docs-search`로 정확한 API 확인
  ("토스 MCP를 정확히 참조해서 구현해"라고 명시하면 디테일 누락이 준다).
- 공식 문서: 기본 `https://developers-apps-in-toss.toss.im/llms.txt`,
  전체 `.../llms-full.txt`, TDS-RN `https://tossmini-docs.toss.im/tds-react-native/llms-full.txt`.

---

## 5. 디자인 → 코드 파이프라인 (소스 둘로 분리, 섞지 않음)
- **Figma = 화면 전환·흐름(스토리보드)만** → `@docs/design/00-storyboard.md` (Figma MCP로 읽음). 화면 라우팅의 기준.
- **앱빌더(Deus) = 개별 화면 설계 전부** → `docs/design/appbuilder-ref/<screen>/code.tsx` + `0X-<screen>.md`.
- 앱빌더 코드는 **WebView 스택(`@toss/tds-mobile`)이라 RN에 드롭인 금지.** `@toss/tds-react-native`로 매핑해 재작성.
- 알려진 차이(버그 아님): 폰트 SF Pro→Toss Product Sans(자동), Semantic Color는 코드 토큰이 정답, 375px·라이트모드.
- 추출·변환 절차: `docs/design/appbuilder-ref/README.md`.

---

## 6. 작업 규칙 (하네스)
- 기능 구현 전 반드시 `bbik-spec-lookup` 스킬로 해당 F-ID/BL-ID/BR 확인.
- 코드 작성 → 같은 PR에 **단위 + 통합 테스트 동반**(테스트 없는 머지 금지). 외부 API는 항상 목(mock), 실호출 0.
- 각 예외코드(F-xxx-Ex)마다 음성 테스트 1개 이상.
- FE/BE 경계를 넘는 작업은 서브에이전트로 위임(frontend-engineer / backend-engineer / test-engineer).
- UI 한국어 + 상품 일본어 원문/AI 번역 병행 표시, 단계별 로딩(8~10초).

---

## 7. Git 규칙
- 브랜치 전략: **feature/* → develop → main** (Git Flow 기반).
  - 기능은 develop에서 분기: `feat/F-003-lookup`, `fix/F-002-scan`.
  - PR은 **항상 develop으로**. main은 develop → main 릴리스 PR로만 머지.
  - **main·develop 직접 커밋/푸시 금지.** feature→main 직접 PR 금지. force-push 금지.
- 커밋: `<type>(<F-ID|BL-ID>): <요약>` 예) `feat(F-003): 라쿠텐 2단계 폴백 구현`
  (type: feat/fix/refactor/test/docs/chore)
- push 전 테스트 통과 필수(husky pre-push + settings 훅). **push는 사용자 확인 후, feature 브랜치만.**
- 키·시크릿 커밋 금지(`.env`, `*.key`). 1커밋=1관심사.
- `/commit` 커맨드가 점검→테스트→커밋까지 수행. 상세: `@.claude/skills/git-workflow/SKILL.md`.

---

## 8. 시크릿 / 보안
- 라쿠텐/Gemini 키는 **backend `.env`**에만. `${SUPABASE_ACCESS_TOKEN}`은 셸 환경변수.
- `.env`/키 파일은 `.gitignore` + `.claude/settings.json` deny로 이중 차단(AI가 못 읽음).
- 팀원은 `.env.example` 복사해 각자 채움(키는 git 아닌 별도 채널로 전달).

---

## 9. 명령어
- FE: `cd frontend && npm run dev | npm test | npm run lint`
- BE: `cd backend && npm run dev | npm test | npm run test:integration`
- 전체 테스트 `/run-tests` · 기능 구현 `/implement-feature F-00X` · 커밋 `/commit`

---

## 10. 참조 문서 (@로 필요할 때 로드)
- 기능: `@docs/context/01-functional-spec.md`
- 로직: `@docs/context/02-business-logic.md`
- API: `@docs/context/03-api-spec.md`
- ERD: `@docs/context/04-erd.md`
- 앱인토스 공식: `@docs/context/05-appsintoss-refs.md`
- 화면 흐름: `@docs/design/00-storyboard.md` · 앱빌더 추출: `@docs/design/appbuilder-ref/README.md`
- 에이전트/스킬/커맨드: `@.claude/agents/` `@.claude/skills/` `@.claude/commands/`

---

### 검수·품질 필수 체크 (출시 전)
- 키는 backend에만, FE 0개(settings deny로 이중 차단).
- 앱인토스 SDK는 항상 MCP/docs-search 참조해 작성.
- 모든 기능 PR = 코드 + 단위 + 통합 + 예외코드 음성 테스트.
- 실제환경 CORS/Origin 재확인(테스트환경과 다름).
- 토스와 구분되는 브랜드 노출(다크패턴 금지), 일/한 병행 표시.