# API 명세서

## 1. 문서 개요

본 문서는 앱인토스 미니앱 ‘삑(Bbik)’의 API 명세를 정의한다. 본 서비스는 사용자가 상품 바코드(JAN)를 스캔하면 라쿠텐 Product Search API를 통해 상품 정보를 조회하고, 번역 API를 활용하여 조회 결과를 한국어로 번역하여 제공한다.

라쿠텐에서 상품 정보가 조회되지 않는 경우에는 사용자가 상품 전면을 촬영하고, Gemini API가 이미지에서 상품명과 브랜드명을 추출한 뒤 해당 키워드로 라쿠텐 재조회를 수행한다. 재조회까지 실패하는 경우에는 촬영 이미지를 기반으로 AI 분석 결과를 참고 정보로 제공한다.

---

## 2. 전체 API 목록

| No | 기능ID | API명 | Method | Endpoint | 설명 | 우선순위 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | F-001 | 토스 로그인 API | POST | `/api/auth/toss/login` | 토스 SDK 인증 결과 기반 사용자 식별 | 필수 |
| 2 | F-002 | 바코드 이미지 디코딩 API | POST | `/api/products/decode-barcode` | 앱인토스에 실시간 바코드 스캐너가 없어, 촬영 이미지에서 JAN/EAN 숫자를 백엔드가 디코드한다(EAN 체크디지트 검증). 미검출 시 직접 입력 유도. | 필수 |
| 3 | F-003 | 상품 정보 조회 API | GET | `/api/products/lookup` | 바코드 기반 메모리 캐시 확인 후 라쿠텐 JAN 조회 | 필수 |
| 4 | F-003 | 상품 이미지 기반 보완 조회 API | POST | `/api/products/analyze-image` | JAN 조회 실패 시 상품명·브랜드명 이미지를 촬영하고, 추출·번역된 키워드로 라쿠텐 재조회를 수행한다. 키워드 재조회 실패 시에만 AI 이미지 인식 결과를 반환한다. | 필수 |
| 5 | F-004 | 상품 저장 API | POST | `/api/saved-products` | 사용자가 선택한 상품을 저장 목록에 추가 | 권장 |
| 6 | F-005 | 저장 목록 조회 API | GET | `/api/saved-products` | 저장 상품 목록 조회 | 권장 |
| 7 | F-005 | 저장 상품 개별 삭제 API | DELETE | `/api/saved-products/{savedProductId}` | 저장 상품 개별 삭제 | 권장 |
| 8 | F-005 | 저장 상품 전체 삭제 API | DELETE | `/api/saved-products` | 사용자 저장 상품 전체 삭제 | 권장 |
| 9 | F-006 | 공유 데이터 생성 API | POST | `/api/share/products` | 공유용 텍스트 또는 이미지 데이터 생성 | 선택 |

※ F-002 바코드 스캔은 원래 RN 네이티브 디코더 기반 FE 기능으로 설계되었으나, 앱인토스 Granite 환경에 실시간 스캐너 API가 없어 **촬영 이미지를 백엔드가 디코드하는 방식**(`POST /api/products/decode-barcode`)으로 보완한다. FE는 `openCamera` 촬영 → 본 API로 JAN 확보 → F-003 흐름 진입. 직접 입력 경로는 그대로 유지한다.

---

## 3. 외부 API 목록

| 번호 | API명 | 용도 | 비고 | 무료여부 | 구분 |
| --- | --- | --- | --- | --- | --- |
| 1 | 라쿠텐 Product Search API | 상품 정보 조회 | JAN 코드 기반 상품 검색, applicationId/accessKey 인증 | 무료 | 조회 |
| 2 | Gemini API | 이미지 기반 상품명·브랜드명 추출, 최종 AI 이미지 판단 | 키워드 재조회 실패 시에만 상품 판단 용도로 사용 | 무료 플랜 | AI |
| + | 번역 API | 추출된 상품명·브랜드명 한국어 번역 | 화면 표시 및 keyword 재조회 보조용 |  | 번역 |
| 3 | 토스 SDK | 로그인·사용자 식별 | 앱인토스 간편 로그인 | 무료 | 인증 |
| 4 | Supabase | 사용자·저장 상품·스캔 이력 저장 | PostgreSQL 기반 DB·인증 | 무료 플랜 | DB |

---

## 4. 공통 응답 형식

### 4.1 성공 응답

```json
{
  "success": true,
  "data": {}
}
```

### 4.2 실패 응답

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "상품을 찾을 수 없습니다. 상품명과 브랜드명이 보이도록 촬영해주세요.",
    "nextAction": "CAPTURE_PRODUCT_IMAGE"
  },
  "data": {
    "scanHistoryId": "{scan_history_id}",
    "barcode": "{JAN_CODE}"
  }
}
```

### 4.3 공통 Error Code

| 코드 | 설명 |
| --- | --- |
| `INVALID_REQUEST` | 요청 형식이 올바르지 않음 |
| `UNAUTHORIZED` | 사용자 인증 실패 |
| `INVALID_BARCODE` | 바코드 형식이 올바르지 않음 |
| `BARCODE_NOT_DETECTED` | 촬영 이미지에서 바코드를 검출하지 못함 (F-002, 422) |
| `PRODUCT_NOT_FOUND` | 상품 조회 결과 없음 |
| `EXTERNAL_API_ERROR` | 외부 API 호출 실패 |
| `AI_ANALYSIS_FAILED` | Gemini 분석 실패 |
| `DATABASE_ERROR` | DB 처리 실패 |
| `RATE_LIMIT_EXCEEDED` | API 호출 한도 초과 |
| `TIMEOUT` | API 응답 시간 초과 |

### 4.4 nextAction 값

| nextAction | 의미 | 후속 API |
| --- | --- | --- |
| `CAPTURE_PRODUCT_IMAGE` | 상품명·브랜드명이 보이도록 촬영 화면으로 이동 | `POST /api/products/analyze-image` |
| `RETRY_SCAN` | 바코드 재스캔 유도 | 프론트 처리 |
| `MANUAL_INPUT` | 바코드 직접 입력 화면으로 이동 (F-002 디코드 실패) | 프론트 처리 |
| `NONE` | 별도 후속 동작 없음 | 없음 |

---

## 5. F-001 토스 로그인 API

토스 SDK 인증 결과를 서버로 전달하여 사용자를 식별한다. 서버는 전달받은 사용자 식별값을 기준으로 기존 사용자를 조회하거나 신규 사용자를 등록한다.

### 5.1 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기능ID | F-001 |
| API명 | 토스 로그인 API |
| Method | POST |
| Endpoint | `/api/auth/toss/login` |
| 인증 필요 여부 | 불필요(이 API가 우리 인증을 발급) |
| 연동 | 앱인토스 OAuth(`generate-token`·`login-me`, mTLS), Supabase |

### 5.2 Request

```
POST /api/auth/toss/login
```

```json
{
  "authorizationCode": "{authorization_code}",
  "referrer": "DEFAULT"
}
```

### 5.3 Request Body

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `authorizationCode` | String | 필수 | 토스 SDK `appLogin()`이 반환한 인가코드. **유효 10분·일회성**(재사용 시 `invalid_grant`) |
| `referrer` | String(enum) | 필수 | `appLogin()`이 함께 반환한 referrer. **`'DEFAULT'` 제 토스앱** `generate-token`에 그대로 전달 |

> 변경: 기존 `tossUserKey`(프론트 전달)는 불가. userKey는 백엔드가 `login-me`로만 얻으므로 요청은 `authorizationCode`를 전달한다.
> 

### 5.4 내부 처리 흐름 (서버 ↔ 앱인토스, **mTLS 필수**)

Base URL: `https://apps-in-toss-api.toss.im`

1. **토큰 발급** — `POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token`, body `{ authorizationCode, referrer }`
→ `{ resultType: "SUCCESS", success: { accessToken(1h), refreshToken(14d), tokenType, expiresIn, scope } }` (응답은 `resultType`/`success` 래퍼 → `success` 언래핑)
2. **사용자 조회** — `GET /api-partner/v1/apps-in-toss/user/oauth2/login-me`, header `Authorization: Bearer {accessToken}`
→ `{ userKey(number), scope, agreedTerms, name, phone, birthday, ci, gender ... }` (개인정보 필드는 **암호문**)
3. **개인정보 복호화** — `name`을 콘솔 발급 키 + AAD로 **AES-256-GCM 복호화** → `users.name`에 저장
4. **식별/등록(BL-001)** — `String(userKey)`로 `users` 조회/등록(`users.toss_user_key`) → **자체 JWT** 발급

주의사항:

- **mTLS 인증서 필수** — 없으면 `generate-token` 호출 불가(integration-process 문서의 발급 절차).
- **응답 래퍼** — `generate-token`은 `{ resultType, success }` 구조. `success`를 까서 매핑한다.
- **`userKey`는 number** — 예: `443731104`. `users.toss_user_key`에는 **문자열로 보관** 권장.
- **개인정보는 전부 암호문** — `name`/`phone`/`birthday`/`ci` 등은 암호화 제공. **복호화 키·AAD는 콘솔 발급분을 `config`(환경변수)로 보관**, AES-256-GCM 복호화. (삑은 `name`만 채움)
- 토스 `accessToken`/`refreshToken`은 **서버에서만** 보관, 클라이언트 전달 금지.
- `scope`에 정의되지 않은 값이 와도 예외 없이 처리(2026-01-02 `user_key` 추가 등 전방호환).

### 5.5 Response

```json
{
  "success": true,
  "data": {
    "userId": "{user_id}",
    "isNewUser": false,
    "accessToken": "{our_jwt_access_token}",
    "name": "{decrypted_user_name}"
  }
}
```

- `name`: 복호화된 사용자 이름 (F-005 저장목록 타이틀 `OO님의 저장한 상품`용). **본인에게 본인 이름만** 반환하므로 PII 노출 안전(인증된 응답). 미확보 시 `토스사용자`. dev-bypass 경로는 `테스트사용자`.

### 5.6 예외 처리

| 코드 | 원인 | 처리 방법 |
| --- | --- | --- |
| `F-001-E1` | 토스 앱 미설치 | 토스 앱 설치 유도 |
| `F-001-E2` | 네트워크 오류 | 네트워크 확인 메시지 표시 |
| `F-001-E3` | 인증 취소 | 로그인 화면으로 복귀 |
| `F-001-E4` | 인가코드 만료·재사용(`invalid_grant`) | 재로그인 유도 |
| `UNAUTHORIZED` | `generate-token`/`login-me` 실패 | 인증 실패 응답 |

---

## 6. F-003 상품 정보 조회 API

상품 정보 조회 API는 스캔된 JAN 코드를 기준으로 서버 메모리 캐시를 먼저 확인한다. 메모리 캐시에 동일 바코드 조회 결과가 있으면 해당 결과를 반환한다. 캐시 사용 여부는 백엔드 내부 처리로 관리하며, API 응답에는 별도 캐시 여부 필드를 포함하지 않는다. 캐시 결과가 없을 경우 라쿠텐 Product Search API의 `productCode` 파라미터를 사용하여 JAN 코드 기반 조회를 수행한다. 라쿠텐에 상품 정보가 있으면 해당 정보를 사용하고 결과를 서버 메모리 캐시에 임시 저장한다. 조회 결과가 없을 경우 `scanHistoryId`와 `nextAction`을 반환하여 상품명·브랜드명 촬영 흐름으로 전환한다.

### 6.1 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기능ID | F-003 |
| API명 | 상품 정보 조회 API |
| Method | GET |
| Endpoint | `/api/products/lookup` |
| 주요 외부 API | 라쿠텐 Product Search API, Gemini API |
| 입력값 | JAN-13 또는 JAN-8 |
| 출력값 | 상품명(일본어), 상품명(한국어), 브랜드명(일본어), 브랜드명(한국어), 가격, 이미지 |

### 6.2 Request

```
GET /api/products/lookup?barcode={JAN_CODE}
```

### 6.3 Query Parameters

| 파라미터 | 타입 | 필수 여부 | 설명 | 예시 |
| --- | --- | --- | --- | --- |
| `barcode` | String | 필수 | 바코드에서 추출한 JAN 코드 | `{JAN_CODE}` |

### 6.4 바코드 검증 기준

| 항목 | 기준 |
| --- | --- |
| 허용 형식 | JAN-13, JAN-8 |
| 허용 문자 | 숫자 |
| 저장 방식 | 문자열 |
| 실패 처리 | `INVALID_BARCODE` 반환 |

---

## 7. 라쿠텐 Product Search API 연동

라쿠텐 상품 조회는 Product Search API의 `productCode` 파라미터에 JAN 코드를 입력하여 수행한다.

### 7.1 외부 API 정보

| 항목 | 내용 |
| --- | --- |
| API명 | Rakuten Product Search API |
| API Path | `Product/Search/20250801` |
| Method | GET |
| Domain | `https://openapi.rakuten.co.jp/` |
| 주요 파라미터 | `productCode` |
| 용도 | JAN 코드 기반 제품 정보 조회 |

### 7.2 External Request

```
GET https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801
```

### 7.3 External Request Parameters

| 파라미터 | 사용 시점 | 설명 |
| --- | --- | --- |
| `productCode` | 1차 조회 | 바코드에서 추출한 JAN 코드로 조회 |
| `keyword` | 2차 재조회 | 촬영 이미지에서 추출·번역한 상품명/브랜드명을 기반으로 키워드 조회 |
| `applicationId` | 공통 | 라쿠텐 애플리케이션 ID |
| `accessKey` | 공통 | 라쿠텐 Access Key |
| `affiliateId` | 선택 | 제휴 링크 생성을 위한 ID |
| `format` | 공통 | 응답 형식 |

### 7.4 Request Example

### 7.4.1 바코드 기반 조회

```
GET https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801?format=json&productCode={JAN_CODE}&applicationId={RAKUTEN_APPLICATION_ID}&accessKey={RAKUTEN_ACCESS_KEY}
```

### 7.4.2 키워드 기반 재조회

```
GET https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801?format=json&keyword={KEYWORD}&applicationId={RAKUTEN_APPLICATION_ID}&accessKey={RAKUTEN_ACCESS_KEY}
```

> 키워드 재조회 시에는 최초 스캔한 바코드를 라쿠텐 조회 파라미터로 사용하지 않고, 촬영 이미지에서 추출·번역한 상품명과 브랜드명을 기반으로 `keyword` 검색을 수행한다. 단, 재조회 결과는 최초 스캔한 바코드와 매칭하여 DB에 저장한다.
> 

### 7.5 주요 응답 필드 매핑

| 라쿠텐 응답 필드 | 서비스 내부 필드 | 설명 |
| --- | --- | --- |
| `Products[].Product.productId` | `productId` | 라쿠텐 제품 ID |
| `Products[].Product.productCode` | `barcode` | JAN 코드 |
| `Products[].Product.productName` | `nameOriginal` | 원문 상품명 |
| 번역 결과 | `nameKo` | 한국어 상품명 |
| `Products[].Product.brandName` | `brandNameOriginal` | 원문 브랜드명 |
| 번역 결과 | `brandNameKo`  | 한국어 브랜드명 |
| `Products[].Product.salesMinPrice` | `price` | 일본 엔화 가격 |
| `Products[].Product.mediumImageUrl` | `imageUrl` | 대표 이미지 후보 |
| `Products[].Product.smallImageUrl` | `thumbnailImageUrl` | 썸네일 이미지 후보 |
| `Products[].Product.productCaption` | `descriptionOriginal` | 라쿠텐 상품 설명, null 가능 |

---

## 8. F-003 내부 처리 흐름

본 기능은 하나의 API 호출로 전체 과정이 완료되는 구조가 아니라, `GET /api/products/lookup` 호출 후 결과에 따라 `POST /api/products/analyze-image`가 추가로 호출되는 구조이다.

---

### 8.1 바코드 기반 상품 조회 흐름

`GET /api/products/lookup`

| 단계 | 액션 | 시스템 동작 |
| --- | --- | --- |
| 1 | 바코드 번호 수신 | F-002에서 전달받은 JAN 코드를 기준으로 조회를 시작한다. |
| 2 | 스캔 기록 생성 | `scan_history`에 사용자, 바코드, 조회 상태를 기록한다. |
| 3 | 메모리 캐시 확인 | 서버 메모리에 동일 바코드 조회 결과가 있는지 확인한다. |
| 4 | 캐시 결과 있음 | 메모리 캐시에 저장된 기존 조회 결과를 반환한다. 이때 응답의 `lookupType`은 캐시 이전의 원래 조회 방식인 `barcode`, `keyword`, `ai` 중 하나를 유지한다. |
| 5 | 캐시 결과 없음 | 라쿠텐 Product Search API에 `productCode={JAN_CODE}`로 조회를 요청한다. |
| 6 | 라쿠텐 조회 성공 | 조회된 상품 정보를 사용하고, 해당 결과를 서버 메모리 캐시에 임시 저장한다. |
| 7 | 라쿠텐 조회 실패 | `scanHistoryId`, `barcode`, `nextAction: CAPTURE_PRODUCT_IMAGE`를 포함한 실패 응답을 반환한다. |

## 8.2 상품명/브랜드명 촬영 및 재조회 흐름

`POST /api/products/analyze-image`

| 단계 | 액션 | 시스템 동작 |
| --- | --- | --- |
| 8 | 상품명/브랜드명 이미지 수신 | 사용자가 촬영한 이미지, 최초 바코드, `scanHistoryId`를 전달받는다. |
| 9 | 상품명·브랜드명 추출 | 이미지에서 상품명과 브랜드명을 추출한다. |
| 10 | 번역 처리 | 상품명·브랜드명 번역 |
| 11 | 라쿠텐 키워드 재조회 | 번역/추출 키워드 기반 라쿠텐 재조회 |
| 12 | 재조회 성공 | 라쿠텐 상품 정보를 사용하고 `lookupType=keyword`로 응답한다. 해당 결과는 최초 바코드와 매칭하여 DB에 저장한다. |
| 13 | 재조회 실패 | keyword 재조회 실패 |
| 14 | AI 판단 결과 생성 | AI 이미지 인식 결과 생성 |
| 15 | 결과 반환 | 최종 조회 또는 판단 결과를 JSON 형식으로 반환한다. |

> keyword 재조회까지 실패한 경우에만 AI 이미지 인식을 수행한다.
> 

## 8.3 흐름 요약

```
━━━ GET /api/products/lookup 호출 ━━━
1~3   바코드 수신 → scan_history 기록 → 메모리 캐시 확인
4     캐시 있음 → 기존 결과 반환
※ 메모리 캐시는 백엔드 내부 최적화 처리이며, 응답 필드에는 별도로 포함하지 않는
5~6 캐시 없음 → 라쿠텐 productCode 조회 → 성공 시 barcode 반환 + 메모리 캐시 저장
7     조회 실패 → scanHistoryId + barcode + nextAction 반환 후 종료

──── 여기서 API 호출이 한 번 종료됨 ────

클라이언트가 상품명/브랜드명 촬영 화면으로 이동
촬영 후 새 API 호출

━━━ POST /api/products/analyze-image 호출 ━━━
8~10   이미지 수신 → 상품명/브랜드명 추출 → 번역
11~12 라쿠텐 keyword 재조회 → 성공 시 keyword 반환 + 최초 바코드와 매칭해 DB 저장
13~15 재조회 실패 → AI 판단 → ai 반환 + 최초 바코드와 매칭해 DB 저장
```

---

## 9. F-003 Response

### 9.1 조회 성공 Response

```json
{
  "success": true,
  "data": {
    "lookupType": "barcode",
    "scanHistoryId": "{scan_history_id}",
    "barcode": "{JAN_CODE}",
    "product": {
      "nameOriginal": "{product_name_original_or_null}",
      "nameKo": "{product_name_ko_or_null}",
      "brandNameOriginal": "{brand_name_original_or_null}",
      "brandNameKo": "{brand_name_ko_or_null}",
      "price": null,
      "currency": "JPY",
      "imageUrl": "{image_url_or_null}"
    }
  }
}
```

### 9.2 메모리 캐시 사용 시 응답 기준

동일 바코드에 대한 조회 결과가 서버 메모리 캐시에 존재하는 경우, 백엔드는 외부 API를 호출하지 않고 캐시에 저장된 기존 결과를 반환한다. 메모리 캐시 사용 여부는 API 응답 필드에 포함하지 않는다.

캐시 결과를 반환하더라도 lookupType은 기존 결과가 생성된 방식을 유지한다. 예를 들어 바코드 기반 라쿠텐 조회 결과는 barcode, 상품명·브랜드명 기반 키워드 재조회 결과는 keyword, AI 이미지 판단 결과는 ai로 반환한다.

### 9.3 조회 실패 Response

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "상품을 찾을 수 없습니다. 상품명과 브랜드명이 보이도록 촬영해주세요.",
    "nextAction": "CAPTURE_PRODUCT_IMAGE"
  },
  "data": {
    "scanHistoryId": "{scan_history_id}",
    "barcode": "{JAN_CODE}"
  }
}
```

### 9.4 이미지 처리 기준

| 상황 | 처리 |
| --- | --- |
| `mediumImageUrl` 존재 | 대표 이미지로 사용 |
| `mediumImageUrl` 없음, `smallImageUrl` 존재 | 썸네일 이미지 사용 |
| 두 값 모두 없음 | 사용자 촬영 이미지 사용 또는 이미지 없이 표시 |
| 2차 이미지 보완 | 추후 확장 |

---

## 10. 상품 이미지 기반 보완 조회 API

본 API는 `/api/products/lookup`에서 바코드 기반 라쿠텐 JAN 조회가 실패한 경우 호출된다. 본 API의 1차 목적은 AI가 상품을 바로 판단하는 것이 아니라, 상품 이미지에서 상품명과 브랜드명을 추출하고 이를 한국어로 번역한 뒤 라쿠텐 keyword 재조회를 수행하는 것이다. 라쿠텐 keyword 재조회에 성공하면 `lookupType=keyword`로 결과를 반환하고, 재조회까지 실패한 경우에만 촬영 이미지를 기반으로 AI가 상품 정보를 판단하여 `lookupType=ai`로 결과를 반환한다.

### 10.1 기본 정보

| 항목 | 수정 내용 |
| --- | --- |
| API명 | 상품 이미지 기반 보완 조회 API |
| 주요 외부 API | Gemini API, 번역 API, 라쿠텐 Product Search API |
| 입력값 | 상품명·브랜드명이 보이는 상품 이미지, 최초 스캔 바코드, 스캔 기록 ID |
| 출력값 | keyword 재조회 결과 또는 AI 판단 결과 |

### 10.2 Request

두 가지 형식을 모두 받는다. 앱인토스 `openCamera`는 file:// 가 아닌 base64/데이터 URI를 주므로 RN 멀티파트 업로드가 불안정 → **JSON base64 권장**.

```
POST /api/products/analyze-image
Content-Type: multipart/form-data        # (1) 멀티파트 파일
# 또는
Content-Type: application/json           # (2) JSON base64
{ "image": "<base64 또는 dataURI>", "barcode": "...", "scanHistoryId": "..." }
```

### 10.3 Request Body

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `image` | File 또는 String(base64) | 필수 | 상품명·브랜드명이 보이는 상품 이미지. 멀티파트 파일 또는 base64 문자열(순수 base64/`data:image/...;base64,` 둘 다 허용) |
| `scanHistoryId` | String | 필수 | `/lookup` 실패 응답에서 전달받은 스캔 기록 ID |
| `barcode` | String | 필수 | 최초 스캔한 JAN 코드 |

### 10.4 Response: 라쿠텐 재조회 성공

라쿠텐 keyword 재조회에 성공한 경우의 응답이다. 이 경우 AI 이미지 인식 결과가 아니라, 라쿠텐 keyword 검색 결과를 사용한다.

```json
{
  "success": true,
  "data": {
    "lookupType": "keyword",
    "scanHistoryId": "{scan_history_id}",
    "barcode": "{JAN_CODE}",
    "product": {
      "nameOriginal": "{product_name_original_or_null}",
      "nameKo": "{product_name_ko_or_null}",
      "brandNameOriginal": "{brand_name_original_or_null}",
      "brandNameKo": "{brand_name_ko_or_null}",
      "price": null,
      "currency": "JPY",
      "imageUrl": "{image_url_or_null}"
    }
  }
}
```

### 10.5 Response: AI 판단 결과

바코드 기반 JAN 조회와 라쿠텐 keyword 재조회가 모두 실패한 경우의 응답이다. 이 경우에만 촬영 이미지를 기반으로 AI가 상품 정보를 판단한다.

```json
{
  "success": true,
  "data": {
    "lookupType": "ai",
    "scanHistoryId": "{scan_history_id}",
    "barcode": "{JAN_CODE}",
    "product": {
      "nameOriginal": "{product_name_original_or_null}",
      "nameKo": "{product_name_ko_or_null}",
      "brandNameOriginal": "{brand_name_original_or_null}",
      "brandNameKo": "{brand_name_ko_or_null}",
      "price": null,
      "currency": "JPY",
      "imageUrl": "{uploaded_image_url_or_null}"
    },
    "notice": "AI 이미지 판단 기반 참고 정보"
  }
}
```

---

## 11. F-003 예외 처리

| 코드 | 원인 | 처리 방법 |
| --- | --- | --- |
| `F-003-E1` | 라쿠텐 API 타임아웃 | 라쿠텐 JAN 조회가 실패하거나 타임아웃될 경우, 상품명·브랜드명 촬영 흐름으로 전환한다. |
| `F-003-E2` | 라쿠텐 429 한도 초과 | 캐시 활용, 잠시 후 재시도 안내 |
| `F-003-E3` | 네트워크 없음 | 인터넷 연결 확인 메시지 표시 |
| `F-003-E4` | 사진에서 상품명 추출 실패 | 상품명이 잘 보이게 다시 촬영 안내 |
| `F-003-E5` | 재조회 결과 없음 | 라쿠텐 키워드 재조회 결과가 없으면 촬영 이미지를 AI로 판단하고, 판단 결과를 lookupType=ai로 설정하여 최초 스캔 바코드와 매칭해 DB에 저장한다. |
| `F-003-E6` | 촬영 이미지 분석 실패 | 다시 촬영 안내, 반복 실패 시 상품명 직접 입력 유도 |
| `F-003-E7` | 번역 API / Gemini API 한도 초과 | 번역 API 또는 AI 판단 API 호출 한도 초과 시 잠시 후 재시도 안내 |

---

## 12. F-004 상품 저장 API

본 API는 사용자가 조회 결과 화면에서 저장 버튼을 눌렀을 때 저장 목록에 추가하기 위한 API이다. F-003 처리 과정에서 수행되는 최초 바코드-상품 결과 매칭 DB 저장과는 구분된다.

| 구분 | 발생 시점 | 저장 목적 |
| --- | --- | --- |
| F-003 내부 DB 저장 | `keyword`, `ai` 결과 생성 시 | 라쿠텐 미등록 바코드와 결과 매칭 |
| F-004 상품 저장 | 사용자가 저장 버튼 클릭 시 | 사용자 저장 목록 관리 |

### 12.1 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기능ID | F-004 |
| API명 | 상품 저장 API |
| Method | POST |
| Endpoint | `/api/saved-products` |
| 저장소 | Supabase `saved_products` |
| 인증 필요 여부 | 필요 |

### 12.2 Request

```
POST /api/saved-products
Authorization: Bearer {accessToken}
```

### 12.3 Request Body

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `scanHistoryId` | String | 선택 | 상품 조회 또는 이미지 분석 시 생성된 스캔 기록 ID |
| `barcode` | String / null | 선택 | JAN 코드, 미확보 시 null |
| `nameOriginal` | String / null | 선택 | 일본어 원문 상품명 |
| `nameKo` | String | 필수 | 한국어 상품명 |
| `brandNameOriginal` | String / null | 선택 | 일본어 원문 브랜드 |
| `brandNameKo` | String / null | 선택 | 한국어 브랜드 |
| `price` | Number / null | 선택 | 상품 가격 |
| `currency` | String | 선택 | 기본 JPY |
| `imageUrl` | String / null | 선택 | API 이미지 또는 촬영 이미지 |
| `country` | String | 선택 | 기본 JP |
| `lookupType` | String | 필수 | `barcode`, `keyword`, `ai` |

### 12.4 Request Example

```json
{
  "scanHistoryId": "{scan_history_id}",
  "barcode": "{JAN_CODE_OR_NULL}",
  "nameOriginal": "{product_name_original_or_null}",
  "nameKo": "{product_name_ko}",
  "brandNameOriginal": "{brand_name_original_or_null}",
  "brandNameKo": "{brand_name_ko_or_null}",
  "price": null,
  "currency": "JPY",
  "imageUrl": "{image_url_or_null}",
  "country": "JP",
  "lookupType": "barcode"
}
```

### 12.5 Response

```json
{
  "success": true,
  "data": {
    "saved": true,
    "savedProductId": "{saved_product_id}",
    "message": "저장되었습니다."
  }
}
```

### 12.6 중복 저장 Response

```json
{
  "success": true,
  "data": {
    "saved": false,
    "savedProductId": "{saved_product_id}",
    "message": "이미 저장된 상품입니다."
  }
}
```

### 12.7 중복 저장 기준

| 상황 | 기준 |
| --- | --- |
| 바코드 있음 | `user_id + product_id` 기준 중복 방지 |
| 바코드 없음 | 중복 판단이 어려우므로 중복 허용 또는 별도 기준 추후 정의 |

### 12.8 예외 처리

| 코드 | 원인 | 처리 방법 |
| --- | --- | --- |
| `F-004-E1` | DB 저장 실패 | 저장 실패 메시지 표시 |
| `F-004-E2` | 네트워크 오류 | 네트워크 확인 안내 |

---

## 13. F-005 저장 목록 조회 API

사용자가 저장한 상품 목록을 최근순으로 조회한다.

### 13.1 기본 정보

| 항목 | 내용 |
| --- | --- |
| 기능ID | F-005 |
| API명 | 저장 목록 조회 API |
| Method | GET |
| Endpoint | `/api/saved-products` |
| 인증 필요 여부 | 필요 |

### 13.2 Request

```
GET /api/saved-products
Authorization: Bearer {accessToken}
```

### 13.3 Query Parameters

| 파라미터 | 타입 | 필수 여부 | 설명 | 기본값 |
| --- | --- | --- | --- | --- |
| `page` | Number | 선택 | 페이지 번호 | 1 |
| `limit` | Number | 선택 | 조회 개수 | 20 |

### 13.4 Response

```json
{
  "success": true,
  "data": {
    "page": 1,
    "limit": 20,
    "items": [
      {
        "savedProductId": "{saved_product_id}",
        "productId": "{product_id}",
        "barcode": "{JAN_CODE_OR_NULL}",
        "nameOriginal": "{product_name_original_or_null}",
        "nameKo": "{product_name_ko}",
        "brandNameOriginal": "{brand_name_original_or_null}",
        "brandNameKo": "{brand_name_ko_or_null}",
        "price": null,
        "currency": "JPY",
        "imageUrl": "{image_url_or_null}",
        "country": "JP",
        "lookupType": "barcode",
        "createdAt": "{created_at}"
      }
    ]
  }
}
```

### 13.5 예외 처리

| 코드 | 원인 | 처리 방법 |
| --- | --- | --- |
| `F-005-E1` | 저장 목록 없음 | 저장 상품 없음 안내 및 스캔 화면 이동 버튼 표시 |
| `F-005-E2` | 삭제 실패 | 삭제 실패 메시지 표시 |

---

## 14. F-005 저장 상품 삭제 API

저장된 상품을 개별 또는 전체 삭제한다.

### 14.1 개별 삭제

| 항목 | 내용 |
| --- | --- |
| Method | DELETE |
| Endpoint | `/api/saved-products/{savedProductId}` |
| 인증 필요 여부 | 필요 |

```
DELETE /api/saved-products/{savedProductId}
```

### 14.2 개별 삭제 Response

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "savedProductId": "{saved_product_id}",
    "message": "삭제되었습니다."
  }
}
```

### 14.3 전체 삭제

| 항목 | 내용 |
| --- | --- |
| Method | DELETE |
| Endpoint | `/api/saved-products` |
| 인증 필요 여부 | 필요 |

```
DELETE /api/saved-products
```

### 14.4 전체 삭제 Response

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "전체 저장 상품이 삭제되었습니다."
  }
}
```

---

## 15. F-006 공유하기

공유하기는 상품 정보를 외부 앱으로 공유하거나 텍스트로 복사하는 기능이다. 기본 처리는 클라이언트에서 수행하며, 서버 API는 공유 문구 생성이 필요한 경우에만 사용한다.

### 15.1 공유 데이터 생성 API

| 항목 | 내용 |
| --- | --- |
| 기능ID | F-006 |
| API명 | 공유 데이터 생성 API |
| Method | POST |
| Endpoint | `/api/share/products` |
| 우선순위 | 선택 |

### 15.2 Request Body

| 필드 | 타입 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `nameOriginal` | String / null | 선택 | 일본어 상품명 |
| `nameKo` | String | 필수 | 한국어 상품명 |
| `brandNameOriginal` | String / null | 선택 | 일본어 브랜드명 |
| `brandNameKo` | String / null | 선택 | 한국어 브랜드명 |
| `price` | Number / null | 선택 | 가격 |
| `currency` | String | 선택 | 통화 |
| `imageUrl` | String / null | 선택 | 공유 이미지 |
| `lookupType` | String | 선택 | `barcode`, `keyword`, `ai` |

### 15.3 Response

```json
{ "success": true, "data": { "shareText": "[삑] {brand_name_ko} {product_name_ko} / {price_text} — 삑으로 스캔한 상품 정보" } }
```

| price 값 | 표시 |
| --- | --- |
| `150` | `약 ¥150` |
| `null` | `가격 정보 없음` |
| `0` | `가격 정보 없음` |

`brandNameKo`가 null인 경우 공유 문구에서는 브랜드명을 생략한다.

### 15.4 예외 처리

| 코드 | 원인 | 처리 방법 |
| --- | --- | --- |
| `F-006-E1` | 클립보드 복사 실패 | 복사 실패 메시지 표시 |
| `F-006-E2` | 이미지 저장 실패 | 이미지 저장 실패 메시지 표시 |
| `F-006-E3` | 사진 저장 권한 거부 | 권한 필요 안내 후 설정 이동 유도 |

---

## 16. lookupType 값 정의

| lookupType 값 | 의미 | 사용 위치 |
| --- | --- | --- |
| `barcode` | 바코드로 라쿠텐 JAN 조회 성공 | `GET /api/products/lookup` |
| `keyword` | 상품명·브랜드명 촬영 후 번역·키워드 검색으로 라쿠텐 재조회 성공 | `POST /api/products/analyze-image` |
| `ai` | 라쿠텐 JAN 조회와 키워드 재조회 모두 실패 후 AI 이미지 판단 | `POST /api/products/analyze-image` |

캐시는 DB에 저장하지 않고 백엔드 서버의 메모리에 임시 저장한다. 캐시 키는 최초 스캔한 JAN 코드이며, 값은 상품 조회 결과이다. 서버 재시작 시 메모리 캐시는 초기화될 수 있다. 캐시는 외부 API 호출량을 줄이기 위한 백엔드 내부 최적화 처리이며, API 응답 필드에는 포함하지 않는다.

메모리 캐시 결과를 반환하더라도 lookupType은 기존 결과가 생성된 방식을 유지한다. 예를 들어 바코드 기반 라쿠텐 조회 결과는 barcode, 상품명·브랜드명 기반 키워드 재조회 결과는 keyword, AI 이미지 판단 결과는 ai로 반환한다.

---

## 17. 비기능 요구사항

| 항목 | 기준 |
| --- | --- |
| 응답 속도 | 바코드 인식 후 결과 표시까지 8~10초 이내 |
| 보안 | 외부 API Key는 백엔드 환경변수 관리 |
| 데이터 | Supabase 저장, 사용자별 접근 제어 적용 |
| 캐시 | 동일 바코드 조회 결과는 서버 메모리에 임시 캐싱한다. 메모리 캐시는 외부 API 호출량을 줄이기 위한 백엔드 내부 처리이며, 서버 재시작 시 초기화될 수 있다. 캐시 사용 여부는 API 응답 필드에 포함하지 않는다. |
| 오프라인 | 네트워크 미연결 시 스캔 비활성화 및 안내 표시 |

---

## 18. F-002 바코드 이미지 디코딩 API

앱인토스 Granite 환경에는 실시간 바코드 스캐너 API/네이티브 모듈이 없고 `openCamera`(사진 촬영)만 제공된다. 따라서 촬영한 바코드 이미지를 백엔드로 전송하면, 백엔드가 이미지에서 JAN/EAN 숫자를 디코드해 반환한다. 반환된 바코드로 이후 F-003(`/api/products/lookup`) 흐름을 진행한다.

본 API는 DB·메모리 캐시·`scan_history`를 건드리지 않는 **무상태 유틸**이다. 스캔 이력은 후속 `/api/products/lookup` 호출 시점에 생성된다.

### 18.1 기본 정보

| 항목 | 값 |
| --- | --- |
| Endpoint | `/api/products/decode-barcode` |
| Method | POST |
| 인증 | 필요 (`Authorization: Bearer {accessToken}`) |
| Content-Type | `multipart/form-data` |

### 18.2 Request Body (multipart 또는 JSON base64)

멀티파트 파일 또는 JSON base64 둘 다 받는다. 앱인토스 `openCamera`가 file:// 가 아닌 base64를 주므로 **JSON base64 권장**.

```
Content-Type: multipart/form-data    # (1) field `image`: 이미지 파일
# 또는
Content-Type: application/json       # (2) { "image": "<base64 또는 dataURI>" }
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `image` | file 또는 String(base64) | O | 바코드 촬영 이미지. 멀티파트 파일(≤10MB) 또는 base64 문자열(순수/`data:image/...;base64,` 둘 다) |

### 18.3 처리 절차

| 순서 | 처리 내용 |
| --- | --- |
| 0 | 이미지 입력 정규화: 멀티파트 파일 또는 JSON `image`(base64/dataURI) → 버퍼 |
| 1 | 이미지 수신(multer 메모리/base64 디코드) → 이미지 디코딩 라이브러리로 그레이스케일/픽셀 변환 |
| 2 | zbar(WASM)로 1D 바코드 심볼 검출, EAN-13 / EAN-8 만 채택 (BR-001) |
| 3 | 검출값 EAN 체크디지트 검증으로 오인식 차단 (BR-001) |
| 4 | 유효값 → 성공 응답, 미검출 → `BARCODE_NOT_DETECTED` (직접 입력 유도) |

### 18.4 Response

성공:

```json
{
  "success": true,
  "data": { "barcode": "4901008315997" }
}
```

미검출(직접 입력 폴백):

```json
{
  "success": false,
  "error": {
    "code": "BARCODE_NOT_DETECTED",
    "message": "바코드를 인식하지 못했어요. 직접 입력해주세요.",
    "nextAction": "MANUAL_INPUT"
  }
}
```

### 18.5 예외 처리

| 코드 | 원인 | HTTP | nextAction |
| --- | --- | --- | --- |
| `INVALID_REQUEST` | `image` 파일 누락 / 이미지 아님 | 400 | NONE |
| `UNAUTHORIZED` | 토큰 없음·만료 | 401 | NONE |
| `BARCODE_NOT_DETECTED` | 이미지에서 유효한 EAN 미검출(손상 이미지 포함) | 422 | MANUAL_INPUT |