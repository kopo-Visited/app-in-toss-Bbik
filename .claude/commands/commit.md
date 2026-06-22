---
description: 변경을 점검→테스트→컨벤셔널 커밋까지 수행 (feature 브랜치, push는 확인 후)
argument-hint: <F-ID 또는 요약> 예) F-003 라쿠텐 폴백
---

다음 순서로 `$ARGUMENTS` 변경을 커밋하라. `git-workflow` 스킬을 따른다.

1. **현재 브랜치 확인**: main 또는 develop이면 **중단**하고 경고한다
   (feature 브랜치에서 작업해야 함). 필요 시 `git switch -c feat/<F-ID>-<요약>` 제안.
2. `git status`/`git diff`로 변경 확인. **.env·키·토큰 포함 여부 점검**(있으면 중단·경고).
3. 관련 테스트 실행: 백엔드 `npm test && npm run test:integration`, 프론트 `npm test`. 실패 시 중단.
4. 변경의 F-ID/BL-ID 식별 후 Conventional Commit 메시지 작성: `<type>(<F-ID>): <요약>`.
5. 커밋 생성. 1커밋=1관심사가 아니면 분리 제안.
6. push는 자동 실행하지 말 것 — **대상이 feature 브랜치인지 확인** 후, 사용자 확인을 받고 push.
   main·develop으로의 push는 거부한다.
7. 머지는 PR로: **base는 develop** (릴리스만 develop→main). PR 생성 안내.