---
name: rakuten-api
description: >
  라쿠텐 Product Search API 연동 코드를 작성·수정할 때 사용한다.
  상품 조회(F-003/BL-003), JAN productCode 1차 조회, keyword 2차 재조회, 응답 매핑, 타임아웃/429 처리 시 사용.
---

# 라쿠텐 Product Search API 연동 규칙 (v1.1)

## 엔드포인트
`GET https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801`
- 공통 파라미터: `format=json`, `applicationId`, `accessKey`
- 키는 backend 환경변수에서만. 클라이언트 노출 금지.

## 1차 조회 (barcode)
- `productCode = {JAN}` 으로 조회 (BR-002, keyword 아님).
- 타임아웃 **5초**(BR-003). 초과 시 조회 실패 → 촬영 흐름(F-003-E1).
- 성공 시 `lookupType = barcode`.

## 2차 재조회 (keyword)
- 사진에서 Gemini가 추출한 **일본어 상품명·브랜드 원문**으로 `keyword` 검색(BR-004).
  라쿠텐은 일본 마켓이므로 **일본어 그대로 검색한다(한국어 번역 금지).** 번역(nameKo/brandNameKo)은
  검색이 아니라 화면 표시용으로 결과에만 적용한다(BR-006).
- ⚠️ 라쿠텐 keyword 는 **공백=AND** 라 어절이 많으면(브랜드+상품명+색/용량) 0건이 잦다(검증: 4어→0건, 2어→17건).
  → **브랜드+상품명 위주로 구성**하고, 0건이고 3어 이상이면 **앞 2어로 좁혀 1회 재시도**(뒤쪽 색/용량 수식어 제거).
  재시도 사이엔 rate limit(~1req/s) 회피용 간격을 둔다.
- ⚠️ 2차에는 최초 바코드를 조회 파라미터로 쓰지 않는다. 단 결과는 **최초 바코드와 매칭해 DB 저장**.
- 성공 시 `lookupType = keyword`.

## 응답 필드 매핑
| 라쿠텐 | 내부 | 비고 |
| --- | --- | --- |
| productName | nameOriginal | 일본어 원문 |
| brandName | brandNameOriginal | 일본어 브랜드 |
| salesMinPrice | price | 라쿠텐 참고가(BR-010), 없으면 null |
| mediumImageUrl | imageUrl | null 빈번 → smallImageUrl → 촬영본 순 폴백 |
| smallImageUrl | thumbnailImageUrl | - |
| productCaption | (사용 안 함) | 상품 설명 미제공(BR-007) |

> 번역(nameKo/brandNameKo)은 라쿠텐이 아니라 **번역 API** 담당(BR-006). 여기선 일본어 원문만 매핑.

## 예외
- 429 → 캐시 활용 + 재시도 안내(F-003-E2).
- 타임아웃/네트워크 → F-003-E1 / E3.

## 테스트 시 필수 케이스
- mediumImageUrl·salesMinPrice **null** 케이스(라쿠텐 응답에서 빈번).
- 1차 실패 → 촬영 흐름 전환, 2차(keyword) 성공/실패 분기.