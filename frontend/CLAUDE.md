# frontend/CLAUDE.md — 삑 프론트엔드 (React Native · 앱인토스 Granite)

> `frontend/` 작업 시 항상 로드되는 상시 규칙. **폴더구조·계층·스택·절대규칙의 단일 출처(SSOT).**
> 화면 명세·SDK·API 등 외부 문서 참조 목록은 `.claude/agents/frontend-engineer.md`의 "시작 전 필수 참조" 참고.

## 1. 기술 스택 (고정)
- React Native + 앱인토스 **Granite**: `@apps-in-toss/framework` + `@toss/tds-react-native`
- 파일 기반 라우팅: `app/*.tsx`
- 프로젝트 생성/진입점/라우팅/SDK 사용법은 **`@docs/context/05-appsintoss-refs.md`**에 정리됨.
  그 문서에 없는 세부는 추측 말고 apps-in-toss MCP 또는 05 문서의 공식 URL(llms.txt 등) 참조.
- ⚠️ 웹(div/span) 구현·앱빌더 export는 **참고용**(그대로 쓰지 말고 RN으로 변환).
  변환 원본 위치: **`docs/design/appbuilder-ref/_web-reference/`** 아래의 화면 코드.
- 화면 명세는 `@docs/design/01-screen-design-spec.md`, 정밀 색·치수는 `@docs/design/design-tokens.md`.

## 2. 폴더 구조
```
frontend/
├── app/                      # 파일 기반 라우팅 (얇게 = src/screens import만)
│   ├── index.tsx             #   메인
│   ├── login.tsx             #   로그인 (F-001)
│   ├── scan.tsx              #   바코드 스캔 (F-002)
│   ├── capture.tsx           #   상품 촬영 폴백 (F-003)
│   ├── manual-input.tsx      #   바코드 직접 입력 (F-003-E6) — 또는 모달
│   ├── result/[barcode].tsx  #   결과 3변형 (F-003)
│   └── saved/index.tsx       #   저장목록 (F-005)
├── src/
│   ├── screens/              # 화면 조립(얇게)
│   ├── features/             # 기능 단위 흐름·상태 오케스트레이션
│   ├── components/           # TDS-RN 순수 프레젠테이션 컴포넌트
│   ├── hooks/                # 상태·사이드이펙트 (useScan/useLookup ...)
│   ├── api/                  # 백엔드 호출 + 에러코드→메시지
│   └── lib/                  # 순수 유틸 (바코드 검증·가격 포맷 등)
├── __tests__/                # 단위 / 통합 테스트
├── ait.config.ts             # 앱인토스 빌드 설정
└── package.json              # test 스크립트는 "echo no tests yet && exit 0" 유지(pre-push 통과용)
```

## 3. 계층 책임 (단방향, 절대 경계)
```
app/*.tsx(라우트) → src/screens → src/features → src/hooks → src/api → src/lib
                                   src/components(말단 프레젠테이션)
```
| 계층 | 위치 | 하는 일 | 절대 안 하는 일 |
| --- | --- | --- | --- |
| 라우트 | `app/*.tsx` | `src/screens` import만 (얇게) | UI 직접 작성 |
| Screen | `src/screens` | 화면 조립 | 직접 fetch·비즈니스 분기 |
| Feature | `src/features` | 기능 흐름·상태 오케스트레이션 | 프레젠테이션 |
| Hook | `src/hooks` | 상태·사이드이펙트 | UI 렌더 |
| ApiClient | `src/api` | 백엔드 호출 + 에러코드→메시지 매핑 | 비즈니스 분기 |
| Component | `src/components` | TDS-RN 순수 UI | 데이터 호출 |
| lib | `src/lib` | 순수 유틸 | API·상태 |

## 4. 라우트 ↔ 화면
| 라우트/형태 | 화면 |
| --- | --- |
| `app/index.tsx` | 메인 |
| `app/login.tsx` | 로그인 (appLogin → 인가코드 → 서버 토큰교환) |
| `app/scan.tsx` | 바코드 스캔(다크) |
| `app/capture.tsx` | 상품 촬영(다크, 조회 실패 폴백) |
| `app/result/[barcode].tsx` | 결과(3변형) |
| `app/saved/index.tsx` | 저장목록(리스트/빈) |
| `app/manual-input.tsx` 또는 모달 | 바코드 직접 입력(F-003-E6) |
| `<LoadingOverlay/>` / `<NoInternet/>` | 로딩 / 네트워크오류 (라우트 X, 오버레이) |

## 5. 절대 규칙
- **외부 API 직접 호출·키 보유 금지.** 모든 통신은 backend(`/api/...`) 경유.
- **카메라 JAN 디코딩은 프론트**(네이티브/RN 라이브러리). 추출한 숫자만 `POST /api/products/lookup`.
  - 라이브러리는 `@docs/context/01-functional-spec.md` F-002의 후보(`expo-camera` / `react-native-vision-camera`, iOS Vision·Android ML Kit 기반) 중에서 선택.
  - ⚠️ **Granite 환경 호환 여부를 먼저 확인**한다. 앱인토스가 자체 카메라/스캔 API를 제공하면 그것을 우선 사용 → `@docs/context/05-appsintoss-refs.md` 및 공식 문서(llms.txt 등)에서 확인. 불확실하면 멈추고 질문.
- **로딩·인터넷오류는 라우트 아님** → 컴포넌트/오버레이.
- **결과 화면은 한 화면에서 3변형 분기**: lookupType(barcode/keyword/ai) + price(null/0/값).
- 상품 표시는 상품명(한/일)·브랜드(한/일)·가격·이미지만 (설명/요약 없음, BR-007).
- API 응답은 `{success,data}` / `{success:false,error}` envelope. 에러는 error.code→메시지, nextAction으로 화면 분기.
- **파괴적·되돌릴 수 없는 작업**(전체 삭제·개별 삭제 등)은 반드시 **확인 다이얼로그**를 거친다.
- **다크패턴 금지**(앱인토스 검수 규칙): 진입 즉시 팝업·뒤로가기 방해·오해 유도 UI 금지. 토스와 명확히 구분(브랜드 로고·이름·컬러 노출).
- **디자인을 임의로 바꾸지 않는다.** 색·레이아웃·구성요소는 `@docs/design/design-tokens.md`와 `@docs/design/01-screen-design-spec.md`를 그대로 따른다. 웹→RN 변환에 따른 불가피한 차이(CSS→StyleSheet, TDS 컴포넌트 교체 등)만 허용하고, "개선·미화"를 이유로 색·배치·요소를 추가·삭제·변경하지 않는다. 변환 결과는 `_web-reference/` 원본과 대조해 검증한다.

## 6. Git
- develop에서 `feat/fe/<F-ID>-<요약>` 분기 (예: `feat/fe/F-002-scan`). 기능당 1브랜치.
- `/commit` → push(확인 후) → develop PR. main·develop 직접 push 금지.
- 상세: `@.claude/skills/git-workflow/SKILL.md`.