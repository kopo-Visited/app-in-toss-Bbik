# 컨텍스트 인덱스

> `docs/context/` 의 스펙 원본 라우팅. "어떤 작업엔 어느 문서를 보라" 안내.
> 최신 기준: 비즈니스 로직 v1.1, ERD 정규화 v2(community_products), lookupType = barcode/keyword/ai.

| 파일 | 내용 | 언제 읽나 |
| --- | --- | --- |
| 01-functional-spec.md | F-001~F-006 기능·흐름·예외(E코드) | 화면/기능 구현 시 |
| 02-business-logic.md | BL-001~007, BR-001~012, 의사코드 (처리 흐름 단일 출처) | 로직 구현 시 |
| 03-api-spec.md | 엔드포인트·요청/응답·lookupType·에러코드 | API 구현 시 |
| 04-erd.md | users / community_products / saved_products / scan_history | DB·쿼리 작업 시 |
| 05-appsintoss-refs.md | 앱인토스 SDK·TDS·테스트·출시·문서 URL | 모든 앱인토스 연동 |
| 06-gemini-extraction-spec.md | Gemini 폴백 추출(프롬프트·responseSchema·저장 매핑) | 이미지 분석·analyze-image 구현 시 |

## 공통 전제 (모든 문서에 적용 · v1.1 기준)
> 아래는 01~06 전 문서를 관통하는 약속이다. 구현 전 이 기준부터 깔고 시작한다.

- lookupType 3값: `barcode` / `keyword` / `ai`
- 조회 폴백 순서: 메모리 캐시 → community_products(DB) → 라쿠텐 → Gemini
  (같은 바코드가 DB에 있으면 Gemini 재호출 안 함)
- 상품 마스터 `community_products`(UNIQUE barcode), 저장은 `saved_products`(user_id+product_id)
- 번역은 번역 API(BR-006), Gemini는 사진 텍스트 추출(일본어 원문)·ai 판단만 (번역 X)
- 상품 설명/요약 없음(BR-007): 상품명(일/한)·브랜드(일/한)·가격·이미지
  (Gemini가 읽은 성분·전체텍스트는 화면 표시만, 저장 안 함 — 컬럼 미추가)
- 캐시는 서버 메모리(키=JAN), 캐시 반환 시 원래 lookupType 유지
- scan_history 1스캔=1row, 폴백 시 UPDATE