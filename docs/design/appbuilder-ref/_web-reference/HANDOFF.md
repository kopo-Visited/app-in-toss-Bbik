# Bbik 프론트 화면 핸드오프 (→ RN 변환용)

> 화면 UI·동작은 아래에 정리. **실제 RN(tds-react-native) 변환은 FE 엔지니어 파이프라인**에서 진행.
> 웹(div/span) 구현과 앱빌더 tds-mobile export는 **참고용**(픽셀/색/동작 근거).

## 0. 확정된 전제
- 프레임워크: **RN** — `@apps-in-toss/framework` + `@toss/tds-react-native`
- 배치: `app/*.tsx`는 **얇게**(= `src/screens` import만), 실제 UI는 **`src/screens`**
- 계층: **Screen → Feature → Hook → ApiClient → lib**, `__tests__` 포함
- 라우트: `index`=메인, 로그인=`app/login.tsx`, 직접입력=라우트 or 모달, **로딩·인터넷연결=라우트 아님(컴포넌트/오버레이)**
- 카메라: 프론트가 **JAN 숫자 디코딩(네이티브/RN 라이브러리)** → `POST /api/products/lookup`. 촬영(analyze-image)은 조회 실패 시 별도 흐름

## 1. 라우트 ↔ 화면 매핑
| 라우트/형태 | 화면 | 비고 |
|---|---|---|
| `app/login.tsx` | 로그인 | 추가 필요 |
| `app/index.tsx` | 메인 | index = 메인 |
| `app/scan.tsx` | 바코드 스캔 (다크) | |
| `app/capture.tsx` | 상품 촬영 (다크) | |
| `app/result/[barcode].tsx` | 결과 (3 변형) | lookupType·가격으로 분기 |
| `app/saved/index.tsx` | 저장목록 (리스트/빈) | |
| `app/manual-input.tsx` **또는 모달** | 바코드 직접 입력 | 반복 실패 시 유도(F-003-E6) |
| `<LoadingOverlay/>` 컴포넌트 | 로딩 | 라우트 X, 전체 가리는 오버레이 |
| `<NoInternet/>` 컴포넌트/상태 | 인터넷 연결 오류 | 라우트 X |
| 토스트 | 다시 촬영해주세요 / 저장되었습니다 / 상품 정보가 복사되었습니다 | TDS toast |

## 2. 화면별 스펙

### 로그인 (app/login.tsx)
- 구성: 바코드 로고, 타이틀 "삑 (Bbik)", 설명 "일본 상품 바코드를 스캔하면\n한국어로 알려드려요", CTA "토스로 시작하기", 캡션 "토스계정으로 간편하게 시작해요"
- 동작: CTA → `appLogin()` → 성공/실패 모두 메인으로(현재 더미). 인가코드는 일회성 → 서버 토큰교환 예정

### 메인 (app/index.tsx)
- 구성: 가운데 바코드 로고(239×217) + 캡션 "일본 상품 바코드를 찍어보세요"(19 bold #8B95A1)
- 버튼: "스캔하기"(brand) → scan / "저장목록"(brand-weak, text #2272EB) → saved

### 스캔 (app/scan.tsx) — 다크 `rgba(2,9,19,0.91)`
- 구성: 흰 테두리 박스(331×184, radius40) 안 바코드 아이콘, 캡션 "바코드를 사각형 안에 맞춰주세요"(19 bold #F9FAFB), 하단 회색 버튼 "바코드 직접 입력기"(#4E5968) → 직접입력
- 동작: 카메라로 JAN 디코딩 → `/api/products/lookup` → 성공 result / **인식 실패 → "다시 촬영해주세요" 토스트**(화면 유지)
- 좌상단 흰 뒤로 화살표

### 촬영 (app/capture.tsx) — 다크
- 구성: 흰 테두리 박스(238×235) 안 카메라 아이콘, 안내 "상품명과 브랜드명이\n잘 보이게 찍어주세요"(19 bold #F9FAFB), 하단 흰 셔터(70 원형)
- 동작: 셔터 → 사진 analyze-image(백엔드) → result(ai/keyword). 좌상단 흰 뒤로 화살표

### 결과 ★ (app/result/[barcode].tsx) — 3 변형 (한 화면, 데이터 분기)
- 공통: 이미지 카드(#F2F4F6, 308×192; 이미지 없으면 회색 picture placeholder 100), 상품명(한) 20 bold #212529, 원문(일) 14 #8B95A1, 브랜드 "한 (일)" 20 (#4E5968 + #8B95A1)
- **① 라쿠텐**(lookupType barcode/keyword): "라쿠텐 참고가"(16 #4E5968) 라벨 + 가격 "약 ¥861"(32 semibold #212529), 배너 없음
- **② AI+가격**(ai, 가격O): 라벨 없음 + 가격(32) + **AI 배너**
- **③ AI+가격없음**(ai, 가격X): "가격 정보 없음"(**16** #212529) + **AI 배너**
- AI 배너: bg `rgba(0,122,255,0.15)`, info-circle 아이콘, 텍스트 "AI 분석 기반 참고 정보예요.\n실제와 다를 수 있어요."(13 #007AFF)
- 하단 버튼: **공유**(neutral-weak `rgba(7,25,76,0.05)`, text `rgba(3,18,40,0.7)`) / **저장**(brand)
  - 공유 → 클립보드 복사(best-effort) + 토스트 "상품 정보가 복사되었습니다"(체크 아이콘)
  - 저장 → 토스트 "저장되었습니다"(이미 있으면 "이미 저장된 상품입니다")

### 저장목록 (app/saved/index.tsx) — 리스트/빈
- 제목 "OO님의 저장한 상품"(22 bold)
- **리스트**: 행 = 아이콘(30 squircle/상품이미지) + 상품명(17 bold) + 가격(13) + 휴지통(19). 행 탭 → 결과 / 휴지통 → 삭제 확인 다이얼로그
- **빈 상태**: 북마크 아이콘(66×83) + "저장한 상품이 없어요"(20 bold) + "스캔하러 가기"(brand) → scan

### 바코드 직접 입력 (app/manual-input.tsx 또는 모달)
- 큰 제목 "바코드 직접 입력"(24 bold), 안내 "상품 바코드 숫자를 입력해주세요\n(JAN-13 또는 JAN-8)", 숫자 입력칸 + 헬퍼 "13자리 숫자(n/13)", 하단 "조회하기"(brand, 13/8자리일 때 활성)
- 동작: 조회하기 → `/api/products/lookup`

### 로딩 (컴포넌트 <LoadingOverlay/>)
- 회전 스피너 + "상품 정보를 불러오는 중 ..."(22 bold). 조회 중 전체 오버레이

### 인터넷 연결 오류 (컴포넌트 <NoInternet/>)
- wifi-slash 아이콘(파랑+빨간 사선) + "인터넷 연결이 불안정해요\n잠시 후 다시 시도해주세요"(17 #6B7684) + "다시시도"(brand)

## 3. 데이터 모델 (참고: lib/product.ts)
```ts
type LookupType = "barcode" | "keyword" | "ai";
interface Product {
  barcode: string; nameOriginal: string; nameKo: string;
  brandNameOriginal?: string|null; brandNameKo?: string|null;
  price: number|null; imageUrl?: string|null; lookupType: LookupType;
}
// 가격 표시: 값 있으면 "약 ¥{toLocaleString}", null/0 이면 "가격 정보 없음"
```
- `lookupType` + `price` 로 결과 3변형 분기, `imageUrl` 유무로 이미지/placeholder 분기

## 4. 디자인 토큰 (요약 — 정확값은 앱빌더 export 참고)
- brand `#3182F6`, brand-weak `rgba(49,130,246,0.16)` / text `#2272EB`
- 다크 배경 `rgba(2,9,19,0.91)`, 밝은 회색 텍스트 `#F9FAFB`
- 결과: 상품명 #212529 / 원문·보조 #8B95A1 / 브랜드 #4E5968 / 가격 #212529
- AI 배너 `rgba(0,122,255,0.15)` + `#007AFF`
- 토스트 배경 `#8B95A1` + 흰 텍스트

## 5. 참고 코드 위치
- **웹 구현(동작·분기·토스트 로직 그대로 참고)**: `~/Desktop/Bbik/bbik/src/screens/*.tsx`
  - LoginScreen / HomeScreen / ScanScreen / CaptureScreen / ResultScreen / SavedScreen / ManualInputScreen / LoadingScreen / NoInternetScreen
- 더미 데이터·타입: `~/Desktop/Bbik/bbik/src/api/products.ts`, `src/lib/product.ts`
- 웹 라우터(참고): `src/lib/router/` → RN에선 `app/` 파일 라우팅으로 대체
- 원본 RN/앱빌더 export: 사용자 보유(피그마 앱빌더에서 추출)

## 6. 카메라/백엔드 플로우
1. 스캔: 카메라로 JAN 디코딩(네이티브/RN lib) → `POST /api/products/lookup` → Product → 결과
2. 조회 실패 → 촬영(analyze-image): 사진 → 백엔드 분석 → 결과(ai/keyword)
3. 인식 실패 → "다시 촬영해주세요" 토스트 / 네트워크 오류 → NoInternet 오버레이 / 조회 중 → Loading 오버레이

## 7. 통합 시 주의
- `main` 직접 수정 X → **새 브랜치 → PR**
- `package.json`/`ait.config.ts` 초기화(곧 진행) 후 프레임워크 deps 채워지면 작업 시작
