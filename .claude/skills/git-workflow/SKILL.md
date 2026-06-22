---
name: git-workflow
description: >
  삑 프로젝트에서 변경을 커밋·푸시하거나 PR을 만들 때 사용한다.
  브랜치 생성, 커밋 메시지 작성, 푸시, PR 본문 작성, 머지 전 점검 시 발동.
---

# 삑 Git 워크플로

## 브랜치 전략 (Git Flow 기반: feature → develop → main)
```
feat/F-003-lookup ──PR──▶ develop ──릴리스 PR──▶ main
   (기능 작업)            (통합·테스트)          (배포)
```
- 기준 브랜치는 **develop**. 기능 작업은 develop에서 분기한다: `feat/F-003-lookup`, `fix/F-002-scan`.
- PR 대상은 **항상 develop** (feature를 main으로 직접 PR 금지).
- **main은 릴리스 시점에 develop → main PR로만** 머지한다.
- 절대 금지: main·develop 직접 커밋/푸시, feature를 main으로 바로 PR, force-push.

## 커밋 메시지 (Conventional Commits + 기능ID)
- 형식: `<type>(<scope>): <요약>` / scope = F-ID 또는 BL-ID
- type: feat, fix, refactor, test, docs, chore
- 예:
  - `feat(F-004): 저장 중복 판정(BR-009) 추가`
  - `fix(F-003): 라쿠텐 429 시 캐시 폴백 처리`
  - `test(BL-003): 2단계 폴백 ai 음성 테스트`
- 본문(선택): 무엇을/왜 + 관련 BR·예외코드. 예) `Refs: F-003, BR-002`

## 절차
1. 변경 범위의 F-ID/BL-ID/BR을 `bbik-spec-lookup`으로 확인.
2. **develop 최신화** 후 분기: `git switch develop && git pull && git switch -c feat/F-003-lookup`.
3. 스테이징 전 점검: `.env`·키·토큰 포함 여부를 `git status`로 확인.
4. 테스트 통과 확인: 백엔드 `npm test && npm run test:integration` / 프론트 `npm test`.
5. 커밋(위 형식). 1커밋=1관심사.
6. push 전: 대상이 main/develop이면 **중단**(직접 push 금지). feature 브랜치로만 push.
7. **PR은 develop으로** 생성. 본문에 변경 요약 + 관련 F-ID/BR + 테스트 결과 + 시안 대조 체크리스트.
8. 릴리스: 별도로 **develop → main PR**을 만들어 배포(릴리스 담당이 수행).

## 금지
- 키·시크릿 커밋, force-push, 테스트 미통과 push.
- **main·develop 직접 커밋/푸시.** feature→main 직접 PR.
- 무관한 변경 한 커밋에 섞기.

## PR 체크리스트(본문에 포함)
- [ ] base 브랜치가 develop인가 (릴리스 PR만 main)
- [ ] 관련 F-ID/BL/BR 명시
- [ ] 단위 + 통합 테스트 포함, 전부 통과
- [ ] 예외코드 음성 테스트 포함
- [ ] (FE) 앱빌더 시안 대조 / tds-mobile→tds-react-native 매핑 확인
- [ ] 키·시크릿 미포함