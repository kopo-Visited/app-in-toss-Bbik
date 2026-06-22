---
description: 커밋·푸시 전 변경분을 code-reviewer로 검토 (보안·계층·BR·테스트)
---

현재 변경분(staged + unstaged)을 code-reviewer 서브에이전트로 검토하라.

1. `git diff` 와 `git diff --staged` 로 변경 파일·라인 확인.
2. code-reviewer에게 위임해 다음을 점검:
   - 보안(키 노출), 아키텍처 경계, 도메인 규칙(BR, v1.1), 예외 완전성, 테스트 동반, API 계약 일치.
3. 결과를 [BLOCK]/[WARN]/[OK]로 분류해 보고.
4. BLOCK이 있으면 "머지 불가"로 결론하고 수정안 제시. 없으면 커밋/푸시 진행 가능 안내.