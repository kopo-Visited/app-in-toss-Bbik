# 비즈니스 로직 정의서 (Business Logic Specification)

## 문서 정보

| 항목 | 내용 |
| --- | --- |
| 문서명 | 삑(Bbik) 비즈니스 로직 정의서 |
| 프로젝트 | 앱인토스 미니앱 — 삑(Bbik) / 해외 상품 바코드 스캐너 (일본 타겟) |
| 문서 버전 | v1.0 |
| 작성일 | 2026-06-21 |
| 관련 문서 | 기능 요구사항 정의서 v1.3, API 명세서 v1.0, 테이블 정의서(ERD) |
| 처리 계층 | Backend (프록시 서버) |

## 개정 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
| --- | --- | --- | --- |
| v1.0 | 2026-06-21 | 최초 작성 (기능 요구사항 정의서 v1.3 기준) | - |
| v1.1 | 2026-06-22 | lookupType 3값(barcode/keyword/ai) 통일, 캐시 내부처리화, 번역 주체를 번역 API로, ERD 정규화(community_products) 반영 | - |

---

## 1. 개요

### 1.1 목적

본 문서는 미니앱 "삑(Bbik)"의 핵심 처리 로직을 정의한다. 기능 요구사항 정의서가 '무엇을(What)'을, API 명세서가 '어떻게 주고받는지(Interface)'를 정의한다면, 본 문서는 '입력된 데이터를 어떤 규칙과 절차로 처리·판정하는지(How)'를 정의한다.

### 1.2 범위

- 포함: 사용자 식별, 바코드 디코딩·검증, 상품 조회(2단계 폴백), 한국어 번역, 캐시, 상품 저장·중복 판정, 공유 데이터 생성
- 제외: UI 렌더링, 화면 전환, 네이티브 카메라 제어 등 프론트엔드 표현 로직

---

## 2. 처리 공통 원칙

| No | 원칙 | 내용 |
| --- | --- | --- |
| P-1 | 처리 계층 단일화 | 모든 비즈니스 로직은 백엔드(프록시 서버)에서 수행한다. 외부 API 키·AI 호출은 클라이언트에 노출하지 않는다. |
| P-2 | 저장 최소화 | Supabase DB에는 사용자 데이터와 처리 결과만 저장한다. |
| P-3 | 결과 보장(폴백) | 조회 실패 시 단계적 폴백으로 어떤 상품이든 결과가 나오도록 한다. |
| P-4 | 정확도 우선 | 공식 데이터(라쿠텐)를 우선 확보하고, AI 추론은 최후 수단으로 사용하여 환각을 최소화한다. |
| P-5 | 추적성 | 모든 조회는 `scan_history`에 성공 여부·출처와 함께 기록한다. 1회 스캔은 1개 row로 관리하며, 폴백(재조회·AI 분석)을 거쳐도 새 row를 만들지 않고 해당 row를 UPDATE하여 최종 상태(found·lookupType)를 갱신한다. |

### 2.1 공통 처리 성능 기준

- 바코드 인식 → 결과 표시: 8~10초 이내 (단계별 로딩 표시)
- 라쿠텐 1차 조회 타임아웃: 5초
- 동일 바코드 재조회 시 서버 메모리 캐시를 우선 확인하여 외부 API·AI 호출을 줄인다. (Gemini 분당 15회 제한 및 라쿠텐 레이트리밋 대응)

---

## 3. 업무 규칙 (Business Rules)

각 로직에서 참조하는 업무 규칙을 식별자(BR)로 정의한다.

| 규칙 ID | 업무 규칙 |
| --- | --- |
| BR-001 | 바코드는 EAN-13(13자리) 또는 EAN-8(8자리) 숫자만 허용한다. 그 외 형식은 거부한다. |
| BR-002 | 라쿠텐 1차 조회는 `productCode` 파라미터에 JAN을 입력하여 수행한다. (keyword 검색 아님) |
| BR-003 | 라쿠텐 1차 조회 타임아웃은 5초이며, 초과 시 조회 실패로 처리한다. |
| BR-004 | 사진 기반 재조회는 AI가 추출한 상품명·브랜드를 `keyword`로 사용한다. |
| BR-005 | AI 직접 분석 결과는 '참고 정보'로 표시하며, 가격 등 미검증 항목은 신뢰하지 않는다(null 허용). |
| BR-006 | 상품명·브랜드명 한국어 번역은 번역 API가 수행한다. (라쿠텐은 일본어 상품명만 제공) AI(Gemini)는 번역하지 않으며, 사진에서 상품명·브랜드명을 추출하거나 최종 이미지 판단(ai)에만 사용한다. |
| BR-007 | 별도 상품 설명·요약은 제공하지 않는다. 결과 화면은 상품명(일/한)·브랜드명(일/한)·가격·이미지로 구성한다. AI(Gemini)는 사진 상품명·브랜드명 추출과 최종 이미지 판단(ai)에만 제한적으로 사용한다(토큰 절약). 번역은 번역 API가 담당한다. |
| BR-008 | 동일 바코드 조회 결과는 서버 메모리 캐시를 우선 확인하여 외부 API·AI 호출을 줄인다. 캐시는 백엔드 내부 최적화 처리이며, 키는 JAN 코드, 서버 재시작 시 초기화될 수 있다. 캐시 사용 여부는 응답에 포함하지 않는다. |
| BR-009 | 상품 정보는 공용 상품 테이블 `community_products`에 저장하며, JAN 바코드 기준으로 중복 없이 관리한다(UNIQUE barcode). 사용자 저장은 `saved_products`에 (user_id + product_id) 연결로 기록하며, 같은 사용자가 같은 상품을 중복 저장하지 않도록 (user_id + product_id) 기준으로 판정한다. |
| BR-010 | 가격은 '라쿠텐 참고가'로 표기한다. (현지 매장가와 다를 수 있음) 가격 정보 없음은 `null`, 실제 0원은 `0`으로 구분한다. |
| BR-011 | 데이터 출처는 `lookupType` 값으로 기록한다. `barcode`(바코드로 라쿠텐 조회) / `keyword`(사진→상품명·브랜드명 추출→키워드로 라쿠텐 재조회) / `ai`(라쿠텐 조회·재조회 모두 실패 후 AI 이미지 판단) 3값 중 하나. 캐시는 출처가 아닌 속도 최적화이므로 `lookupType`에 포함하지 않으며, 캐시에서 반환하더라도 원래 출처값(barcode/keyword/ai)을 유지한다. |
| BR-012 | 통화는 JPY, 국가는 JP를 기본값으로 하며, 다국가 확장에 대비해 컬럼으로 관리한다. |

---

## 4. 비즈니스 로직 목록

| 로직 ID | 로직명 | 관련 기능 | 처리 계층 | 입력 → 출력 |
| --- | --- | --- | --- | --- |
| BL-001 | 사용자 식별 판정 | F-001 | Backend | tossUserKey → userId, isNewUser |
| BL-002 | 바코드 디코딩·검증 | F-002 | Front + Backend | 카메라 영상/입력 → JAN |
| BL-003 | 상품 조회 폴백 판정 | F-003 | Backend | JAN(+이미지) → 상품정보, lookupType |
| BL-004 | 한국어 번역 | F-003 | Backend | 상품정보/이미지 → nameKo, brandNameKo |
| BL-005 | 캐시 판정 | F-003 | Backend | JAN → HIT/MISS |
| BL-006 | 상품 저장·중복 판정 | F-004 | Backend | user_id, 상품정보 → 저장 결과 |
| BL-007 | 공유 텍스트 생성 | F-006 | Backend | 상품정보 → 공유 문구 |

> F-005(저장 목록 조회·삭제)는 단순 CRUD로 별도 판정 로직이 없어 본 명세에서 제외한다.
> 

---

## 5. 로직 상세 명세

### BL-001 사용자 식별 판정

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-001 토스 로그인 |
| 처리 계층 | Backend |
| 입력 | tossUserKey (토스 SDK 인증 결과) |
| 출력 | userId, isNewUser, accessToken |
| 선행조건 | 토스 SDK 인증이 정상 완료되어 tossUserKey가 확보됨 |
| 후행조건 | `users` 테이블에 해당 사용자 레코드가 존재함 |
| 적용 규칙 | - |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | tossUserKey 수신 |
| 2 | `users`에서 tossUserKey로 사용자 조회 |
| 3 | 존재 시 → 기존 사용자로 식별 (isNewUser=false) |
| 4 | 미존재 시 → 신규 사용자 등록 (isNewUser=true) |
| 5 | 사용자 토큰(accessToken) 발급 후 반환 |

**의사코드**

```
function identifyUser(tossUserKey):
    user = users.findByTossKey(tossUserKey)
    if user == null:
        user = users.insert(tossUserKey, created_at = now())
        isNew = true
    else:
        isNew = false
    return { userId: user.id, isNewUser: isNew, accessToken: issueToken(user.id) }
```

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-001-E1 | 토스 앱 미설치 | 설치 유도 팝업 |
| F-001-E2 | 네트워크 오류 | 네트워크 확인 안내 |
| F-001-E3 | 인증 취소 | 로그인 화면 복귀 |

**관련 테이블 / API**: `users` / 토스 SDK

---

### BL-002 바코드 디코딩·검증

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-002 바코드 스캔 |
| 처리 계층 | Front(디코딩) + Backend(검증) |
| 입력 | 카메라 영상 또는 직접 입력 문자열 |
| 출력 | JAN 코드(문자열) 또는 형식 오류 |
| 선행조건 | 카메라 권한 허용 (직접 입력 시 불필요) |
| 후행조건 | 검증된 JAN이 BL-003으로 전달됨 |
| 적용 규칙 | BR-001 |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | RN 네이티브 디코더(iOS Vision / Android ML Kit)로 바코드 인식 |
| 2 | 미인식 시 가이드 표시 후 재시도, 반복 실패 시 직접 입력 유도 |
| 3 | 인식값 포맷 검증 (EAN-13 / EAN-8, 숫자) — BR-001 |
| 4 | 검증 통과 시 JAN 반환, 실패 시 오류 반환 |

**의사코드**

```
function decodeBarcode(input):
    result = NativeBarcodeScanner.scan(input)        // iOS Vision / Android ML Kit
    if result.isEmpty(): return null                 // 계속 스캔
    if result.format not in ['EAN_13', 'EAN_8']:     // BR-001
        return { error: 'INVALID_BARCODE' }          // F-002-E3
    return normalize(result.value)                   // 숫자 JAN
```

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-002-E1 | 카메라 권한 거부 | 권한 안내 후 설정 이동 유도 |
| F-002-E2 | 인식 불가 | 일정 시간 미인식 시 직접 입력 유도 |
| F-002-E3 | 지원 외 코드 | '인식할 수 없는 바코드입니다' 표시 |

**관련 테이블 / API**: - / RN 네이티브 디코더

---

### BL-003 상품 조회 폴백 판정 ★핵심

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-003 상품 정보 조회 |
| 처리 계층 | Backend |
| 입력 | JAN 코드, (폴백 시) 상품 이미지 |
| 출력 | 상품 정보 객체, lookupType(`barcode`/`keyword`/`ai`) |
| 선행조건 | BL-002에서 검증된 JAN 확보 |
| 후행조건 | `scan_history` 기록 생성 |
| 적용 규칙 | BR-002, BR-003, BR-004, BR-005, BR-008, BR-011, BR-012 |

**처리 절차 (2단계 폴백)**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | JAN 수신 → `scan_history` 기록 시작 |
| 2 | 메모리 캐시 조회 (BL-005). HIT 시 즉시 반환 (lookupType은 원래 출처값 유지) |
| 3 | [1차] 라쿠텐 제품검색 API 호출 — `productCode`에 JAN 입력 (BR-002), 타임아웃 5초 (BR-003) |
| 4 | 1차 결과 ≥ 1건 → 상품 파싱, lookupType=barcode → BL-004 |
| 5 | 1차 결과 없음/실패 → 사용자에게 상품 전면 촬영 요청 |
| 6 | [2차] 촬영 이미지를 AI로 분석해 상품명·브랜드 추출 → 번역 → 해당 keyword로 라쿠텐 재조회 (BR-004) |
| 7 | 2차 결과 ≥ 1건 → 상품 파싱, lookupType=keyword → BL-004 |
| 8 | 2차 결과 없음 → 촬영 이미지를 AI로 직접 판단, lookupType=ai (참고 정보, BR-005) → BL-004 |
| 9 | 최종 결과의 `found`·`lookupType`을 `scan_history`에 UPDATE 반영 (BR-011, P-5) |

**의사코드**

```
function lookupProduct(user_id, jan, photo = null):
    scan = scanHistory.start(user_id, jan)            // 스캔 1회 = 1 row (P-5)

    cached = getCache(jan)                            // BL-005 (메모리 캐시)
    if cached:
        // 캐시는 원래 출처값(barcode/keyword/ai)을 그대로 유지
        scanHistory.update(scan, found=true, lookupType=cached.lookupType)
        return cached

    // [1차] 라쿠텐 productCode 조회
    if photo == null:
        res = callRakuten(productCode = jan, timeout = 5s)    // BR-002, BR-003
        if res.count >= 1:
            product = parse(res.Products[0]); product.lookupType = 'barcode'
            scanHistory.update(scan, found=true, lookupType='barcode')
            return product
        return { needPhoto: true }                    // 촬영 요청

    // [2차] 사진 → 상품명·브랜드명 추출 → 번역 → 라쿠텐 재조회
    extracted = Gemini.extractProductName(photo)      // 상품명·브랜드명 추출
    if extracted == null:
        return { error: 'F-003-E4' }
    keyword = TranslationAPI.translate(extracted)     // 번역 API (BR-006)
    res2 = callRakuten(keyword = keyword)             // BR-004
    if res2.count >= 1:
        product = parse(res2.Products[0]); product.lookupType = 'keyword'
        scanHistory.update(scan, found=true, lookupType='keyword')
        return product

    // [폴백] 사진 직접 판단 (참고 정보)
    product = Gemini.analyzeImage(photo)              // BR-005
    product.lookupType = 'ai'
    scanHistory.update(scan, found=false, lookupType='ai')
    return product
```

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-003-E1 | 라쿠텐 타임아웃 | 5초 초과 시 사진 촬영·재조회 흐름 전환 |
| F-003-E2 | 라쿠텐 429 한도 초과 | 캐시 활용, 잠시 후 재시도 안내 |
| F-003-E3 | 네트워크 없음 | 인터넷 연결 확인 안내 |
| F-003-E4 | 상품명 추출 실패 | '상품명이 잘 보이게 다시 촬영' 안내 |
| F-003-E5 | 재조회 결과 없음 | 사진 직접 분석으로 전환 |
| F-003-E6 | 이미지 분석 실패 | 다시 촬영 안내, 반복 시 직접 입력 유도 |
| F-003-E7 | Gemini 한도 초과 | 대기열 처리 또는 잠시 후 재시도 안내 |

**관련 테이블 / API**: `scan_history` / 라쿠텐 제품검색 API, Gemini API

> 비고: 라쿠텐 응답의 `mediumImageUrl`·`productCaption`은 null인 경우가 많다. 이미지는 기본 이미지/촬영본으로 보완하며, 별도 상품 설명은 제공하지 않는다(BR-007).
> 

---

### BL-004 한국어 번역

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-003 상품 정보 조회 |
| 처리 계층 | Backend |
| 입력 | 상품 정보(일본어 상품명·브랜드명) 또는 상품 이미지 |
| 출력 | nameKo, brandNameKo (상품명·브랜드명 한국어) |
| 선행조건 | BL-003에서 상품 정보 또는 분석 대상 이미지 확보 |
| 후행조건 | 번역된 상품명이 결과 화면으로 전달됨 |
| 적용 규칙 | BR-006, BR-007 |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | 라쿠텐 조회 성공(barcode/keyword) → 일본어 상품명(nameOriginal)·브랜드명(brandNameOriginal)을 번역 API로 한국어 번역 (BR-006) |
| 2 | AI 직접 판단(ai) → 이미지에서 추출·판단한 상품명·브랜드명을 한국어로 제공 |
| 3 | 별도 설명·요약은 생성하지 않음 (BR-007) |
| 4 | nameKo·brandNameKo 반환 → 결과 화면은 상품명(일/한)·브랜드명(일/한)·가격·이미지로 구성 |

**의사코드**

```
function translateKorean(product, image = null):
    if product.nameOriginal != null:                          // 라쿠텐 조회 성공(barcode/keyword)
        product.nameKo = TranslationAPI.translate(product.nameOriginal)        // 상품명 일→한
        product.brandNameKo = TranslationAPI.translate(product.brandNameOriginal)  // 브랜드명 일→한
    else:                                                     // ai 경로 (Gemini가 판단 시 한국어 함께 제공)
        product.nameKo = product.nameKo
    return product        // 요약·설명 없음 (BR-007)
```

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-003-E6 | 분석 실패 | 재시도 안내 |
| F-003-E7 | Gemini 한도 초과 | 대기열 처리 또는 잠시 후 재시도 |

**관련 테이블 / API**: - / 번역 API (Gemini는 사진 추출·ai 판단 시)

---

### BL-005 캐시 판정

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-003 (성능·한도 대응) |
| 처리 계층 | Backend |
| 입력 | JAN 코드 |
| 출력 | 캐시 HIT(상품 정보) / MISS |
| 선행조건 | - |
| 후행조건 | HIT 시 외부 API·AI 호출 생략 |
| 적용 규칙 | BR-008 |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | 동일 바코드(JAN)의 조회 결과가 서버 메모리 캐시에 있는지 확인 |
| 2 | 존재 시 HIT → 캐시된 상품 정보 반환 (외부 API·AI 미호출). lookupType은 캐시 이전 원래 출처값(barcode/keyword/ai) 유지 |
| 3 | 없으면 MISS → BL-003 정상 조회 진행 |

**의사코드**

```
function getCache(jan):
    if memoryCache.has(jan):          // 서버 메모리에 동일 바코드 결과 존재
        return memoryCache.get(jan)   // HIT (원래 lookupType 유지)
    return null                       // MISS → 정상 조회
```

> 비고: 캐시는 DB가 아닌 서버 메모리에 임시 저장하는 백엔드 내부 최적화 처리이며, 서버 재시작 시 초기화될 수 있다. 캐시 사용 여부는 API 응답에 포함하지 않는다.
> 

**관련 테이블 / API**: 메모리 캐시(서버 내부) / -

---

### BL-006 상품 저장·중복 판정

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-004 상품 저장 |
| 처리 계층 | Backend |
| 입력 | user_id, 상품 정보(lookupType 포함) |
| 출력 | 저장 결과(saved / duplicated) |
| 선행조건 | 사용자 인증(accessToken) 완료, 분석 결과 존재 |
| 후행조건 | `community_products`에 상품 존재, `saved_products`에 연결 레코드 생성(중복 아닌 경우) |
| 적용 규칙 | BR-009, BR-010, BR-011, BR-012 |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | 상품 정보 수신 |
| 2 | barcode로 `community_products`에 해당 상품이 있는지 확인 |
| 3 | 없으면 → `community_products`에 상품 정보 저장(상품명·브랜드명·가격·이미지·lookupType 등), product_id 확보 |
| 4 | 있으면 → 기존 product_id 사용 |
| 5 | (user_id + product_id)로 `saved_products` 중복 검사 (BR-009) |
| 6 | 중복이면 duplicated 반환 |
| 7 | 미중복이면 `saved_products`에 (user_id, product_id) 연결 저장 |

**의사코드**

```
function saveProduct(user_id, product):
    // 1) 공용 상품 테이블에서 상품 확보 (없으면 생성)
    existing = community_products.findByBarcode(product.barcode)
    if existing != null:
        product_id = existing.product_id
    else:
        product_id = community_products.insert(
            product_id = uuid(), barcode,                    // UNIQUE(barcode)
            name_jp, name_kr, brand_jp, brand_kr,
            price, image_url, lookup_type,                   // BR-011, BR-012
            created_at = now()
        )

    // 2) 사용자-상품 연결 저장 (중복 방지)
    if saved_products.exists(user_id, product_id):           // BR-009
        return { duplicated: true }
    saved_products.insert(
        saved_product_id = uuid(), user_id, product_id,      // UNIQUE(user_id, product_id)
        created_at = now()
    )
    return { saved: true }
```

**무결성 제약**

- `community_products`: 기본키 `product_id`(uuid), `UNIQUE(barcode)` — 같은 바코드 상품은 1건만
- `saved_products`: 기본키 `saved_product_id`(uuid), `UNIQUE(user_id, product_id)` — 같은 사용자가 같은 상품 중복 저장 방지

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-004-E1 | DB 저장 실패 | 저장 실패 안내 |
| F-004-E2 | 네트워크 오류 | 네트워크 확인 안내 |

**관련 테이블 / API**: `community_products`, `saved_products` / -

---

### BL-007 공유 텍스트 생성

| 항목 | 내용 |
| --- | --- |
| 관련 기능 | F-006 공유하기 |
| 처리 계층 | Backend (문구 생성 시) |
| 입력 | 상품 정보(상품명·가격) |
| 출력 | 공유용 텍스트 문자열 |
| 선행조건 | 분석 결과 존재 |
| 후행조건 | 클라이언트가 클립보드 복사 또는 이미지 저장에 사용 |
| 적용 규칙 | BR-010 |

**처리 절차**

| 순서 | 처리 내용 |
| --- | --- |
| 1 | 상품명(한/일)·가격 조합 |
| 2 | 가격은 '라쿠텐 참고가'로 표기 (BR-010) |
| 3 | 앱 출처 문구 추가 후 반환 |

**출력 예시**

```
[삑] 호로요이 복숭아맛 (ほろよい もも) / 약 ¥150 — 삑으로 스캔한 상품 정보
```

**예외 처리**

| 코드 | 원인 | 처리 |
| --- | --- | --- |
| F-006-E1 | 클립보드 복사 실패 | 복사 실패 안내 |
| F-006-E2 | 이미지 저장 실패 | 저장 실패 안내 |
| F-006-E3 | 사진 저장 권한 거부 | 권한 안내 후 설정 이동 유도 |

**관련 테이블 / API**: - / -

---

## 6. 로직 흐름도

```
[BL-002] 바코드 디코딩·검증
   │ JAN
   ▼
[BL-003] 상품 조회 폴백 ──(메모리 캐시)──▶ [BL-005] 캐시 판정
   │  1차: 라쿠텐 productCode 조회 (성공 → barcode)
   │   └ 실패 → 사진 촬영 → 상품명·브랜드명 추출 → 번역 → 라쿠텐 재조회(keyword)
   │              └ 재조회 실패 → 사진 직접 판단(ai)
   ▼
[BL-004] 한국어 번역(번역 API) ──▶ 결과 화면 표시
   │
   └─(사용자 저장)─▶ [BL-006] 상품 저장·중복 판정
                         → community_products(상품) + saved_products(연결)

[BL-001] 사용자 식별 판정 → (앱 진입 시 선행)
[BL-007] 공유 텍스트 생성 → (결과 화면에서 공유 시)
```

---

## 7. 요구사항 추적 매트릭스 (Traceability Matrix)

| 기능 ID | 기능명 | 관련 비즈니스 로직 | 적용 업무규칙 |
| --- | --- | --- | --- |
| F-001 | 토스 로그인 | BL-001 | - |
| F-002 | 바코드 스캔 | BL-002 | BR-001 |
| F-003 | 상품 정보 조회 및 한국어 분석 | BL-003, BL-004, BL-005 | BR-002~008, BR-011, BR-012 |
| F-004 | 상품 저장 | BL-006 | BR-009~012 |
| F-005 | 저장 목록 조회 | (단순 CRUD, 로직 없음) | - |
| F-006 | 공유하기 | BL-007 | BR-010 |

---

## 부록. 정보 출처 매핑

| 정보 | 출처 | 비고 |
| --- | --- | --- |
| 상품명(일)·브랜드명(일)·가격 | 라쿠텐 API | productCode 조회 |
| 상품명(한국어)·브랜드명(한국어) | 번역 API | BR-006 (Gemini는 사진 추출·ai 판단만) |
| 상품 설명·요약 | 제공 안 함 | BR-007 (상품명·브랜드명·가격·이미지만) |
| 상품 이미지 | 라쿠텐 API → 없으면 기본이미지/촬영 | API null 빈번 |
| 상품 정보(공용) | community_products | PK=product_id, UNIQUE(barcode) |
| 저장 상품(연결) | saved_products | PK=saved_product_id, UNIQUE(user_id, product_id) |
| 스캔 이력 | scan_history | found·lookupType 기록 (1스캔=1row, UPDATE) |