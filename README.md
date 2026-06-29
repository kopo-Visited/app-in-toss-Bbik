# 삑 (Bbik) — 앱인토스 해외 상품 바코드 스캐너

일본 여행 중 상품 바코드(JAN)를 스캔하면 라쿠텐에서 상품을 조회하고, 번역 API가 한국어로 번역해
보여주는 **앱인토스 미니앱**입니다. 라쿠텐에 없으면 사진을 찍어 Gemini가 정보를 추출하고, 위시리스트로 저장할 수 있습니다.

> 이 문서는 프로젝트에 처음 합류한 사람이 **구조·역할·동작 흐름**을 한 번에 파악하도록 작성했습니다.
> 세부 스펙은 `docs/`, AI 협업 규칙은 `CLAUDE.md`·`.claude/`를 참고하세요.

---

## 1. 한눈에 보기

| 구분 | 내용 |
| --- | --- |
| 플랫폼 | 앱인토스 미니앱 (토스 안에서 실행) |
| 프론트엔드 | React Native + 앱인토스 **Granite** (`@apps-in-toss/framework`, `@toss/tds-react-native`) |
| 백엔드 | **Node.js 프록시 서버** (모든 비즈니스 로직·외부 API 키 보관) |
| DB | Supabase (PostgreSQL) + RLS, 정규화 v2(community_products) |
| 외부 | 라쿠텐 Product Search, Gemini(사진 추출·ai 판단), 번역 API(일→한), 토스 SDK |
| 개발 방식 | Claude Code 하네스 엔지니어링 (`CLAUDE.md` + `.claude/`) |

**절대 원칙**
- 비즈니스 로직·외부 API 키는 **백엔드에만**. 프론트엔드는 화면·호출만.
- 모든 기능 변경은 **코드 + 단위/통합 테스트** 동반(테스트 없는 머지 금지).

---

## 2. 전반적인 동작 흐름 (제품 흐름)

```mermaid
flowchart TD
  L[로그인 · 토스 SDK] --> SC[바코드 스캔 · F-002]
  SC --> LK[상품 조회 · F-003]
  LK --> C1{메모리 캐시}
  C1 -->|HIT| RES[결과 화면 · 상품명·브랜드·가격·이미지]
  C1 -->|MISS| C2{community_products DB}
  C2 -->|있음| RES
  C2 -->|없음| RK{라쿠텐 productCode}
  RK -->|성공 barcode| TR[번역 API 일→한] --> RES
  RK -->|실패| CAP[제품 정보/성분 촬영]
  CAP --> GM[Gemini 사진 텍스트 추출 · 일본어 원문]
  GM --> KW{search_keywords로 라쿠텐 재조회}
  KW -->|성공 keyword| TR
  KW -->|실패 ai| TR
  RES --> SV[저장 · F-004] --> SH[공유 · F-006]
```

핵심 규칙(요약):
- **조회 폴백 순서**: 메모리 캐시 → community_products(DB) → 라쿠텐 → Gemini. 같은 바코드가 DB에 있으면 외부 호출·Gemini 없이 재사용.
- **lookupType 3값**: `barcode`(라쿠텐 JAN) / `keyword`(사진→추출→재조회) / `ai`(둘 다 실패 후 AI 판단).
- **번역은 번역 API**가 담당, Gemini는 사진 텍스트 추출과 ai 판단만(번역 X).
- 상품 설명/요약 없음 — 상품명(일/한)·브랜드(일/한)·가격·이미지만 표시.

---

## 3. 폴더 구조 + 각 폴더 역할

```
bbik/
├── .claude/                   # ── AI 하네스 ──
│   ├── settings.json          #   권한·훅(키 차단, main/develop push 차단, push 전 테스트)
│   ├── agents/                #   역할별 서브에이전트(frontend/backend/test/code-reviewer 등)
│   ├── commands/              #   슬래시 커맨드(/implement-feature, /commit, /run-tests ...)
│   └── skills/                #   프로젝트 스킬(스펙확인·라쿠텐·gemini·번역·supabase·git ...)
│
├── .github/                   # GitHub 관련 설정 및 템플릿 (PR, 이슈 등)
│
├── .husky/                    # git 훅(검문소) — 누가 커밋하든 강제
│   ├── commit-msg             #   커밋 메시지 형식 검사(commitlint)
│   └── pre-push               #   push 전 FE/BE 테스트 실행
│
├── backend/                   # ── Node.js 프록시(모든 로직·키) ──
│   ├── src/
│   │   ├── cache/             # 바코드 메모리 캐시(키=JAN)
│   │   ├── clients/           # 외부 API 연결(라쿠텐/gemini/번역/supabase 등)
│   │   ├── config/            # 환경변수 로딩 및 전역 설정
│   │   ├── constants/         # 공통 상수 관리 (상태 코드, 고정값 등)
│   │   ├── controllers/       # HTTP 입출력만(검증·응답 포맷)
│   │   ├── crypto/            # 암호화, 해싱, 서명 등 보안 관련 로직
│   │   ├── errors/            # 커스텀 에러 클래스 및 에러 핸들링 정의
│   │   ├── middleware/        # auth/error/validate/ratelimit
│   │   ├── repositories/      # Supabase 접근(users/community_products/saved/scan)
│   │   ├── routes/            # 엔드포인트 ↔ controller 연결
│   │   ├── schemas/           # db schema
│   │   ├── utils/             # 공통 유틸리티 함수 모음
│   │   ├── app.js             # Express 애플리케이션 세팅 및 미들웨어 등록
│   │   └── server.js          # 서버 실행 (포트 바인딩 및 시작)
│   ├── tests/                 # 단위(unit) 및 통합(integration) 테스트 로직
│   ├── .dockerignore          # Docker 빌드 시 제외할 파일 목록
│   ├── .env.example           # 환경변수(Env) 템플릿 파일
│   ├── Dockerfile             # Docker 컨테이너 이미지 빌드 설정
│   ├── fly.toml               # Fly.io 배포 환경 설정 파일
│   ├── package-lock.json      # 패키지 의존성 버전 잠금 파일
│   ├── package.json           # 프로젝트 메타데이터 및 스크립트, 패키지 목록
│   └── vitest.config.js       # Vitest 테스트 러너 설정 파일
│
├── docs/                      # ── 문서(스펙·설계·결정) ──
│   ├── context/               #   AI가 참조하는 스펙 원본
│   │   ├── 00-index.md        #     문서 목차 + 공통 전제(v1.1)
│   │   ├── 01-functional-spec.md #  기능 요구사항(F-001~006·예외)
│   │   ├── 02-business-logic.md  #  비즈니스 로직(BL/BR·의사코드)
│   │   ├── 03-api-spec.md        #  API 명세(엔드포인트·응답·에러코드)
│   │   ├── 04-erd.md             #  DB 테이블 정의(4테이블·관계도)
│   │   ├── 05-appsintoss-refs.md #  앱인토스 SDK·테스트·출시·문서 URL
│   │   └── 06-gemini-extraction-spec.md  # Gemini 추출 프롬프트·스키마·저장 매핑
│   ├── adr/                   #   아키텍처 결정 기록(왜 이렇게 정했나)
│   │   ├── 0001-backend-proxy-layer.md   # 백엔드 프록시를 둔 이유
│   │   └── 0002-2step-fallback-lookup.md # 2단계 폴백 조회 결정
│   └── design/                #   디자인 시안 및 코드
│       ├── 01-screen-design-spec.md#    # 화면 설계서
│       ├── design-token.md    # 디자인 참고 사항
│       └── appbuilder-ref/    #     [앱빌더] 추출 코드(참조용, RN으로 변환해 사용)
│
├── frontend/                  # ── React Native (Granite) ──
│   ├── __tests__/             #   단위(unit) / 통합(integration) 테스트
│   ├── .granite/              #   Granite 프레임워크 자동 생성 파일
│   ├── .swc/                  #   SWC 컴파일러 캐시
│   ├── pages/                 #   파일 기반 라우팅 (= 00-storyboard 흐름)
│   ├── scripts/               #   빌드 및 유틸리티 스크립트
│   ├── src/
│   │   ├── api/               #   백엔드 호출 + 에러코드→메시지
│   │   ├── components/        #   TDS-RN 순수 프레젠테이션 컴포넌트
│   │   ├── features/          #   기능 단위 흐름·상태 오케스트레이션
│   │   ├── hooks/             #   상태·사이드이펙트(useScan/useLookup ...)
│   │   ├── lib/               #   순수 유틸(바코드 검증 등)
│   │   ├── screens/           #   화면 조립(얇게)
│   │   ├── utils/             #   기타 유틸리티 함수 모음
│   │   ├── _app.tsx           #   앱 전역 설정 및 레이아웃
│   │   ├── env.d.ts           #   환경 변수 타입 정의
│   │   └── router.gen.ts      #   자동 생성된 라우터 타입
│   ├── babel.config.js        #   Babel 설정 파일
│   ├── CLAUDE.md              #   프론트엔드 전용 AI 작업 기억 및 규칙
│   ├── granite.config.ts      #   앱인토스 Granite 프레임워크 빌드 설정
│   ├── index.ts               #   애플리케이션 진입점(Entry Point)
│   ├── jest.config.js         #   Jest 테스트 러너 설정 파일
│   ├── jest.setup.ts          #   Jest 테스트 환경 초기화 설정
│   ├── require.context.ts     #   동적 모듈 로딩 설정
│   └── tsconfig.json          #   TypeScript 컴파일러 설정
│
├── .env                       # 로컬 환경변수 (커밋 금지)
├── .gitignore                 # .env, *.key, *.pem 등 시크릿 제외
├── .mcp.json                  # MCP 서버 연결: apps-in-toss(ax) + supabase + figma
├── CLAUDE.md                  # AI 작업 기억(항상 로드): 아키텍처·도메인규칙·MCP·git·보안
├── commitlint.config.js       # 커밋 메시지 규칙(type + F-ID scope 필수)
└── README.md                  # 이 파일 — 프로젝트 전체 안내
```

### 백엔드 계층 (단방향)
`Controller → Service → (Repository | Client)`
controller=HTTP만, service=비즈니스 로직/규칙, repository=DB 접근, client=외부 API. 외부 키는 config에만.

### 프론트엔드 계층 (단방향)
`Screen → Feature → Hook → ApiClient → lib`, Component는 말단 프레젠테이션.
외부 API 직접 호출 금지(전부 backend 경유), 카메라/바코드 디코딩은 네이티브(iOS Vision/Android ML Kit).

---

## 4. 앱인토스 셋업 & 실행

```bash
# 도구(머신 1회)
brew tap toss/tap && brew install ax        # 앱인토스 CLI(=MCP 서버)
npm i -g @anthropic-ai/claude-code          # Claude Code

# 환경변수
cp .env.example backend/.env                # 그 다음 라쿠텐/Gemini/번역/Supabase 키 채우기

# 실행
cd backend && npm install && npm run dev    # 백엔드
cd frontend && npm install && npm run dev   # 프론트(Granite)
```

- 콘솔에 미니앱 등록, Origin 허용: 실제 `https://<appName>.apps.tossmini.com` / QR `https://<appName>.private-apps.tossmini.com`.
- 토스 로그인 → tossUserKey 확보 → 백엔드 `/api/auth/toss/login`으로 사용자 식별.
- 출시: 샌드박스 → QR 실제환경 CORS 재검증 → 콘솔 검토 요청 → 출시. (상세: `docs/context/05-appsintoss-refs.md`)

---

## 5. MCP 연결 (AI가 공식 문서·도구 참조)

`.mcp.json`에 등록됨. 인증은 각자 1회.
```bash
# apps-in-toss (ax 설치돼 있으면 자동)
claude mcp add --transport stdio apps-in-toss ax mcp start
# figma (원격, OAuth 1회)
claude plugin install figma@claude-plugins-official  # → /mcp 에서 인증
# 앱인토스 공식 docs-search
/plugin marketplace add toss/apps-in-toss-skills
/plugin install knowledge-skills@apps-in-toss-skills
```

---

## 6. 디자인 → 코드 파이프라인
- **Figma = 화면 전환 흐름**(스토리보드) → `docs/design/00-storyboard.md`.
- **앱빌더 = 개별 화면 설계** → `docs/design/appbuilder-ref/<screen>/code.tsx`(참조용).
- 앱빌더 코드는 WebView 스택이라 그대로 못 씀 → frontend-engineer가 `tds-react-native`로 변환해 `frontend/src`에 작성.

---

## 7. Git 워크플로 (feature → develop → main)
```
feat/be/F-003-lookup ──PR──▶ develop ──릴리스 PR──▶ main
```
- 기능은 develop에서 분기, PR은 **develop으로**. main은 릴리스 PR로만.
- **main·develop 직접 push 금지**(settings deny + GitHub branch protection). force-push 금지.
- push 전 테스트 통과 필수(husky pre-push). 키·시크릿 커밋 금지.

### 7.1 커밋·브랜치 타입 (feat / fix / docs / chore)
| 타입 | 뜻 | 언제 쓰나 | 예시 |
| --- | --- | --- | --- |
| `feat` | 기능 추가 | 새로운 기능을 만들 때 | `feat(F-004): 저장 기능 추가` |
| `fix` | 버그 수정 | 잘못 동작하는 걸 고칠 때 | `fix(F-003): 라쿠텐 타임아웃 처리` |
| `docs` | 문서 | README·스펙 등 문서만 바꿀 때 | `docs(readme): 구조 설명 추가` |
| `chore` | 잡일·설정 | 빌드·설정·템플릿 등 코드 기능과 무관한 작업 | `chore(template): 이슈 템플릿 추가` |
| `test` | 테스트 실행 | 각 기능 테스트 시  | `test(fe): 화면 렌더 스모크 추가` |
| `style` | 스티일 추가 및 변경 | style 변경 시   | `style(fe): 레이아웃 수정` |

> `feat` vs `fix` → 새로 만들면 feat, 있던 걸 고치면 fix /
> `docs` vs `chore` → 문서 내용이면 docs, 설정·빌드·템플릿이면 chore

### 7.2 브랜치 네이밍

**AI(에이전트)가 기능 구현 시** — 영역(be/fe) + 기능ID, 기능당 1브랜치
| 작업 | 형식 | 예시 |
| --- | --- | --- |
| 백엔드 기능 | `feat/be/<F-ID>-<요약>` | `feat/be/F-004-save` |
| 프론트 기능 | `feat/fe/<F-ID>-<요약>` | `feat/fe/F-002-scan` |
| 버그 | `fix/be\|fe/<F-ID>-<요약>` | `fix/be/F-003-timeout` |

**사람이 직접 작업 시** — 문서·설정 등 F-ID 없는 작업은 `<타입>/<주제>`
| 작업 종류 | 형식 | 예시 |
| --- | --- | --- |
| 문서 작성·수정 | `docs/<주제>` | `docs/erd-update`, `docs/readme-fix` |
| 설정·잡일 | `chore/<주제>` | `chore/github-templates`, `chore/husky-config` |
| 기능 추가 | `feat/<주제>` | `feat/login-flow` |
| 버그 수정 | `fix/<주제>` | `fix/scan-error` |

> `<주제>`는 무슨 작업인지 짧게(영어 소문자, 단어는 `-`로 연결). 사람 작업은 `be/fe`·F-ID 생략 가능.

### 7.3 커밋 메시지 규칙
- 형식: `<type>(<scope>): <요약>` (scope = F-ID/BL-ID 또는 주제)
- type: `feat` `fix` `refactor` `test` `docs` `chore`
- ⚠️ 콜론은 붙여서(`chore:` O, `chore :` X), scope 필수.
- 예시:
  - `feat(F-004): 저장 중복 판정(BR-009) 추가`
  - `fix(F-003): 라쿠텐 429 시 캐시 폴백 처리`
  - `docs(readme): 프로젝트 구조·동작 흐름 작성`
  - `chore(template): 이슈 템플릿에 프론트매터 추가`

### 7.4 사람이 직접 작업하는 법 (팀원용 — 표만 보고 따라하기)

**A. 이슈로 시작하는 경우 (기능·버그)** — 브랜치는 이슈에서 만든다
> 이슈 화면 우측 **Development → Create a branch**를 누르면 GitHub이 브랜치를 만들고
> `git fetch`+`git switch` 체크아웃 명령어를 제공한다. 그걸 복사해 실행하면 끝(직접 생성 불필요).

| 순서 | 무엇을 | 명령어 |
| --- | --- | --- |
| 1 | 이슈에서 브랜치 생성 후 제공된 명령 실행 | `git fetch origin && git switch <이슈가 만든 브랜치>` |
| 2 | 변경 확인(키 섞였나) | `git status` |
| 3 | 스테이징 | `git add .` |
| 4 | 커밋(규칙대로) | `git commit -m "feat(F-004): 저장 기능 추가"` |
| 5 | 원격 push | `git push` |
| 6 | PR 생성 | GitHub에서 base=`develop`로 PR (본문에 `closes #이슈번호`) |

**B. 이슈 없이 바로 작업하는 경우 (문서·설정)** — 브랜치를 직접 판다

| 순서 | 무엇을 | 명령어 |
| --- | --- | --- |
| 1 | develop으로 이동 | `git switch develop` |
| 2 | 최신 내려받기 | `git pull` |
| 3 | 작업 브랜치 생성 | `git switch -c docs/erd-update` |
| 4 | 변경 확인(키 섞였나) | `git status` |
| 5 | 스테이징 | `git add .` |
| 6 | 커밋(규칙대로) | `git commit -m "docs(erd): 관계도 추가"` |
| 7 | 원격 push | `git push -u origin docs/erd-update` |
| 8 | PR 생성 | GitHub에서 base=`develop`로 PR |

**자주 쓰는 보조 명령**

| 하고 싶은 것 | 명령어 |
| --- | --- |
| 내 브랜치 목록 | `git branch` |
| 브랜치 이동 | `git switch <브랜치명>` |
| 변경 내용 보기 | `git diff` |
| 최근 커밋 5개 | `git log --oneline -5` |
| 수정 취소(스테이징 전) | `git restore <파일>` |
| 스테이징 취소 | `git restore --staged <파일>` |

> 💡 커밋 거부 → 메시지 형식 확인(`<type>(<scope>): `, 콜론 붙여서).
> push 거부 → pre-push 테스트 실패 또는 main·develop 직접 push 시도.

### 7.5 AI(Claude Code)로 작업할 때
- (스펙확인→구현→테스트), `/commit` (점검→테스트→커밋).
- push는 항상 사용자 확인 후. PR은 base=develop. 상세: `@.claude/skills/git-workflow/SKILL.md`.

---

## 8. 테스트
- 백엔드: 단위(services·BL/BR) + 통합(routes E2E, 외부는 nock 목).
- 프론트: 단위(컴포넌트·훅·유틸) + 통합(MSW로 화면 흐름).
- 외부 API는 항상 목(mock), 실호출 0. 예외코드마다 음성 테스트. 전체 실행.

---

## 9. 문서 안내
| 알고 싶은 것 | 보는 곳 |
| --- | --- |
| 기능·예외 | `docs/context/01-functional-spec.md` |
| 처리 로직·규칙 | `docs/context/02-business-logic.md` |
| API 계약 | `docs/context/03-api-spec.md` |
| DB 스키마 | `docs/context/04-erd.md` |
| 앱인토스 연동 | `docs/context/05-appsintoss-refs.md` |
| Gemini 추출 | `docs/context/06-gemini-extraction-spec.md` |
| 설계 결정 배경 | `docs/adr/` |
| 화면 흐름·시안 | `docs/design/` |
| AI 협업 규칙 | `CLAUDE.md`, `.claude/` |