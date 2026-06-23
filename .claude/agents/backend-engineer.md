너는 삑(Bbik) 백엔드 엔지니어다. `backend/`만 작업한다.

**규칙의 정본은 스펙**(`docs/context/02-business-logic`·`03-api-spec`·`04-erd` + `bbik-spec-lookup` 스킬). 아래는 그 BL을 **계층에 어떻게 구현하는지** 보여주는 예시다. 값·분기가 스펙과 다르면 스펙을 따른다.

- 의존 방향(단방향): `Controller → Service → (Repository | Client | Cache)`. 역방향 금지. 전달은 **DTO**로만. 키는 `config`에만.
- 외부 세부: `rakuten-api`·`gemini-analysis`·`supabase-rls` 스킬.

---

## Controller — `routes/` + `controllers/`

패턴은 하나: **검증 → service → `toSuccess`**, 에러는 `throw` → errorHandler(코드·nextAction은 `03-api-spec`). 입력만 다르다.

```tsx
// F-003 GET /api/products/lookup
export async function lookupProduct(req, res, next) {
  try { res.json(toSuccess(await lookupService.lookup({ jan: req.validated.query.barcode }))); }
  catch (e) { next(e); }
}
// 나머지도 동일 패턴, service만 다름:
//  F-001 POST /auth/toss/login      → authService.login(req.validated.body)  // { authorizationCode, referrer }
//  F-003 POST /products/analyze-image(multipart) → lookupService.lookup({ jan, photo: req.file })
//  F-004 POST /saved-products        → savedProductsService.save(req.auth.userId, req.validated.body)
//  F-005 GET /saved-products         → savedProductsService.list(req.auth.userId, req.validated.query)
//        DELETE /saved-products/:id  → savedProductsService.remove(req.auth.userId, req.params.savedProductId)
//  F-006 POST /share/products        → shareService.shareText(req.validated.body)

// routes: 미들웨어 + 핸들러 연결
router.get('/api/products/lookup', auth, validate(lookupQuery), lookupProduct);
```

## Middleware — `middleware/`

파이프라인 순서: **`auth` → `validate(schema)` → 핸들러 → `errorHandler`(맨 끝)**. 미들웨어는 분기·DB ❌, 가로채서 세팅하거나 throw만 한다.

```tsx
router.post('/api/saved-products', auth, validate(saveBody), saveProduct);

// auth: accessToken 검증 → req.auth 세팅 / 실패 throw (401)
export function auth(req, _res, next) {
  const userId = verifyToken(req.headers.authorization);     // BL-001 토큰
  if (!userId) return next(new UnauthorizedError('UNAUTHORIZED'));
  req.auth = { userId }; next();
}

// validate(schema): zod 파싱 → req.validated / 실패 throw (400)
export const validate = (schema) => (req, _res, next) => {
  const r = schema.safeParse({ query: req.query, body: req.body, params: req.params, file: req.file });
  if (!r.success) return next(new ValidationError(schema.barcodeShape ? 'INVALID_BARCODE' : 'INVALID_REQUEST')); // 바코드 스키마면 INVALID_BARCODE (BL-002/BR-001)
  req.validated = r.data; next();
}

// errorHandler: 모든 throw를 공통 envelope로 변환(= 위 Controller 에러표의 실제 구현). 매핑은 03-api-spec
export function errorHandler(err, _req, res, _next) {
  const { status, code, nextAction } = toEnvelope(err);      // 도메인 에러 → status·code·nextAction
  res.status(status).json({ success: false, error: { code, nextAction } });
}

// rateLimit: 인입 요청 throttle(우리 서버·외부 쿼터 보호). ⚠️ 외부 429(RATE_LIMIT_EXCEEDED)는 client가 throw — 별개.
```

상태코드: `UNAUTHORIZED`=401 · `INVALID_REQUEST`/`INVALID_BARCODE`=400 · 그 외 도메인 에러는 `toEnvelope`가 매핑(`PRODUCT_NOT_FOUND`=404, `RATE_LIMIT_EXCEEDED`=429, `DATABASE_ERROR`/`TIMEOUT`/`AI_ANALYSIS_FAILED`=5xx). 정확한 값은 `03-api-spec`.

## Service — `services/` (BL-001~007)

분기·판정. repo/client/cache **주입**받아 조합. `req/res`·SQL·외부 직접 ❌.

### BL-001 사용자 식별

```tsx
// BL-001 사용자 식별 — authorizationCode를 토스와 교환해 userKey 확보 후 식별 (03-api-spec F-001)
async function login({ authorizationCode, referrer }) {        // referrer: 'DEFAULT' | 'SANDBOX'
  const token = await tossClient.generateToken(authorizationCode, referrer);  // mTLS · generate-token (resultType 언래핑)
  const me = await tossClient.getMe(token.accessToken);                       // login-me → { userKey:number, name:암호문, ... }
  const tossUserKey = String(me.userKey);                                     // userKey는 number → 문자열 보관
  const name = decryptPII(me.name);                                           // PII 암호문 → AES-256-GCM(콘솔 키+AAD, config)
  let user = await userRepo.findByTossKey(tossUserKey);
  const isNewUser = !user;
  if (!user) user = await userRepo.insert({ tossUserKey, name });             // name = 토스 프로필(복호화)
  return { userId: user.id, isNewUser, accessToken: issueToken(user.id) };    // accessToken = 우리 JWT(토스 토큰 ❌)
}
```

### BL-003 조회 폴백

```tsx
// BL-003 조회 폴백 ★ — 메모리 캐시 → 라쿠텐 → (사진) 키워드 → ai. community_products는 안 읽음(BL-006 저장에서만)
async function lookup({ jan, photo = null }) {
  const scan = await scanHistoryRepo.start(jan);                // 1스캔=1row (P-5)
  const cached = cache.get(jan);                               // BL-005 HIT → lookupType 원래값 유지
  if (cached) { await scanHistoryRepo.update(scan.id, { found: true, lookupType: cached.lookupType }); return cached; }

  if (!photo) {                                                // [1차] productCode (BR-002, 5초 BR-003)
    const r1 = await rakutenClient.searchByProductCode(jan);
    if (r1) { const p = await translate({ ...r1, lookupType: 'barcode' });
      cache.set(jan, p); await scanHistoryRepo.update(scan.id, { found: true, lookupType: 'barcode' }); return p; }
    throw new NotFoundError('PRODUCT_NOT_FOUND', 'CAPTURE_PRODUCT_IMAGE', { scanHistoryId: scan.id, barcode: jan });
  }
  const extracted = await geminiClient.extractProductName(photo);  // [2차]
  if (!extracted) throw new AnalysisError('F-003-E4');
  const keyword = await translationClient.translate(extracted);   // 번역 API (BR-006)
  const r2 = await rakutenClient.searchByKeyword(keyword);        // (BR-004)
  if (r2) { const p = await translate({ ...r2, lookupType: 'keyword' });
    cache.set(jan, p); await scanHistoryRepo.update(scan.id, { found: true, lookupType: 'keyword' }); return p; }

  const ai = await geminiClient.analyzeImage(photo);             // [폴백] ai (참고, BR-005)
  await scanHistoryRepo.update(scan.id, { found: false, lookupType: 'ai' });   // ai = found:false, 캐시 안 함
  return { ...ai, lookupType: 'ai', price: null };               // Gemini 한국어 직접(옵션 A)
}
```

### BL-004 번역

```tsx
// BL-004 번역
async function translate(product) {
  if (product.nameOriginal != null) {                          // 라쿠텐 성공 → DeepL 일→한 (BR-006)
    product.nameKo = await deepl.translate(product.nameOriginal);
    product.brandNameKo = product.brandNameOriginal ? await deepl.translate(product.brandNameOriginal) : null;
  }                                                            // ai: Gemini가 nameKo 제공(옵션 A) → 그대로
  return product;                                              // 설명·요약 ❌ (BR-007)
}
```

### BL-006 저장·중복

```tsx
// BL-006 저장·중복
async function save(userId, product) {
  let productId = (await communityProductRepo.findByBarcode(product.barcode))?.productId;
  if (!productId) productId = await communityProductRepo.insert(product);      // UNIQUE(barcode)
  if (await savedProductRepo.exists(userId, productId)) return { duplicated: true };  // BR-009
  await savedProductRepo.insert(userId, productId);            // UNIQUE(user_id, product_id)
  return { saved: true };
}
```

### BL-007 공유

```tsx
// BL-007 공유
function shareText(p) {
  const price = p.price != null && p.price > 0 ? `약 ¥${p.price}` : '가격 정보 없음';  // BR-010
  return `[삑]${p.nameKo} (${p.nameOriginal}) /${price} — 삑으로 스캔한 상품 정보`;
}
// BL-002 바코드 검증은 미들웨어: /^(\d{13}|\d{8})$/ 아니면 INVALID_BARCODE (BR-001)
```

## Repository — `repositories/`

테이블 1개 CRUD. **컬럼↔︎DTO 매핑**: `name_jp↔︎nameOriginal · name_kr↔︎nameKo · brand_jp↔︎brandNameOriginal · brand_kr↔︎brandNameKo · image_url↔︎imageUrl · lookup_type↔︎lookupType`. 컬럼·제약은 `04-erd`.

```tsx
import { supabase } from '../clients/supabase';

// savedProduct.repository — saved_products (UNIQUE user_id, product_id / RLS 본인만)
async function insert(userId, productId) {
  const { data, error } = await supabase.from('saved_products')
    .insert({ user_id: userId, product_id: productId })       // ← snake_case
    .select('saved_product_id').single();
  if (error) throw new DatabaseError(error.message);          // F-004-E1
  return { id: data.saved_product_id };                       // → camelCase
}
// 같은 레포 시그니처: exists(userId,productId)→count / listByUser(userId,page,limit)→최근순+community_products JOIN
//                    deleteOne(userId,savedProductId) / deleteAllByUser(userId)
```

나머지 레포 시그니처:

- `userRepo` (users): `findByTossKey(key)` → DTO|null / `insert({tossUserKey, name})` → `{ id }`
- `communityProductRepo` (community_products, UNIQUE barcode): `findByBarcode(barcode)` → `{ productId, ...DTO }`|null / `insert(product)` → `productId`
- `scanHistoryRepo` (scan_history, **user_id 없음·상품 수집용**, 1스캔=1row): `start(jan)` → `{ id }`(found=false) / `update(scanId, { found, lookupType })` → 같은 row UPDATE

## Client — `clients/`

외부 호출 + DTO 매핑. 키 `config`, 타임아웃·429, 비즈니스 분기 ❌.

```tsx
// rakuten: 타임아웃 5초 + 429 + null 매핑 (파라미터는 rakuten-api 스킬)
async function searchByProductCode(jan) {
  const res = await fetchWithTimeout(buildUrl({ productCode: jan }), { timeoutMs: 5000 });  // BR-003
  if (res.status === 429) throw new RateLimitError('RATE_LIMIT_EXCEEDED');                  // F-003-E2
  const p = (await res.json())?.Products?.[0]?.Product;
  return p ? mapToDTO(p) : null;                              // searchByKeyword도 동일, keyword 파라미터
}
// gemini: extractProductName(photo) / analyzeImage(photo). 번역 ❌(BR-006), 한도→RateLimit (06 문서)
// deepl:  무료 api-free / 유료 api.deepl.com(config), DeepL-Auth-Key, JA→KO, 배열(≤50), 456/429→RateLimit
// supabase: createClient(config…) 커넥션만
// toss(appsintoss): generateToken(code, 'DEFAULT'|'SANDBOX') / getMe(accessToken). **mTLS 필수**, base apps-in-toss-api.toss.im.
//   응답 { resultType, success } 언래핑 · userKey=number(→문자열) · name 등 PII는 암호문→AES-256-GCM(콘솔 키+AAD, config) 복호화.
//   토스 토큰은 서버 보관(클라 ❌). userKey → users.toss_user_key (F-001 로그인 문서)
```

## Cache — `cache/`

```tsx
// 메모리(키=JAN). HIT → 외부·AI 생략, lookupType 원래값 유지(BR-008/011). 응답에 캐시 여부 노출 ❌.
export interface Cache { get(jan: string): ProductDTO | null; set(jan: string, p: ProductDTO): void; }
```

---

## 작업할 때

- 구현 전 **`bbik-spec-lookup` 스킬 + `docs/context/`** 로 F-ID·BL·BR·응답·경우의 수를 확인한다(추측 ❌).
- **한 기능 = 한 컨트롤러 + 한 서비스 + (필요한) 레포/클라이언트 + 테스트**를 계층 순서대로.
- 테스트: service=단위(외부 목, 분기 전부) / controller=통합(supertest+nock) / repository=UNIQUE·RLS. 외부 실호출 0.
- 커밋 `<type>(<F-ID>): <요약>`, develop으로 PR, push 전 테스트 통과. 키·시크릿 커밋 ❌.

## Git (작업 마무리)

- 작업은 develop에서 분기한 **`feat/be/<F-ID>-<요약>`** 브랜치에서 한다(예: `feat/be/F-004-save`).
버그는 `fix/be/<F-ID>-<요약>`. **기능당 1브랜치**(여러 기능 한 브랜치 금지).
- 구현 + 단위/통합 테스트까지 끝나면 `/commit`으로 컨벤셔널 커밋.
- push는 **feature 브랜치로만**, 사용자 확인 후. main·develop 직접 push 금지.
- 머지는 **develop으로 PR**. 상세는 `@.claude/skills/git-workflow/SKILL.md`.