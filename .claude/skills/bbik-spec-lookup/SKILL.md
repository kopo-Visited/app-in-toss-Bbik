---
name: bbik-spec-lookup
description: >
  삑(Bbik) 기능을 구현·수정·테스트하기 전에 관련 스펙을 확인할 때 사용한다.
  (1) F-001~F-006 기능 구현 전, (2) 예외(E코드) 작성 시, (3) BR/BL 확인 시, (4) API 요청/응답 형식 확인 시.
---

# 삑 스펙 확인 절차 (v1.1 기준)

구현 전 아래를 **반드시** 확인하고 코드에 반영한다.

## 1. 기능 ID로 추적
- F-ID를 `@docs/context/01-functional-spec.md`에서 찾아 흐름·예외 확인.
- 연결 BL-ID를 `@docs/context/02-business-logic.md`에서 찾아 의사코드·BR 확인.
- 적용 BR 번호를 모두 나열하고 코드 주석에 명시.

## 2. 추적 매트릭스
| F-ID | BL | BR |
| --- | --- | --- |
| F-001 로그인 | BL-001 | - |
| F-002 스캔 | BL-002 | BR-001 |
| F-003 조회·번역 | BL-003,004,005 | BR-002~008,011,012 |
| F-004 저장 | BL-006 | BR-009~012 |
| F-006 공유 | BL-007 | BR-010 |

## 3. v1.1 핵심 (틀리기 쉬움 — 꼭 확인)
- **lookupType = barcode / keyword / ai** (예전 direct/retry/cache/ai_vision ❌).
- **번역은 번역 API**가 담당(BR-006). Gemini는 사진 상품명·브랜드 추출 + 최종 ai 판단만.
- **상품 설명/요약 없음**(BR-007): 결과 = 상품명(일/한)·브랜드명(일/한)·가격·이미지.
- 상품 마스터는 `community_products`(UNIQUE barcode), 저장은 `saved_products`(user_id+product_id).
- **중복 판정은 (user_id + product_id)** (예전 user_id+barcode ❌).
- 캐시는 서버 메모리(키=JAN), 응답에 캐시 여부 미포함, 원래 lookupType 유지.
- scan_history 1스캔=1row, 폴백 시 UPDATE(found·lookupType).
- 가격: null=정보없음, 0=실제 0원 구분(BR-010).

## 4. 체크리스트(구현 완료 전)
- [ ] 해당 F의 예외코드(E1~En) 전부 처리
- [ ] 적용 BR을 코드/테스트로 검증
- [ ] 응답이 03 문서의 lookupType·필드와 일치
- [ ] scan_history 기록(found·lookupType) 누락 없음

확인 없이 구현을 시작하지 말 것.