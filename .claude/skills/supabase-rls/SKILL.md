---
name: supabase-rls
description: >
  Supabase 테이블·RLS 정책·쿼리를 작성·수정할 때 사용한다.
  users/community_products/saved_products/scan_history 접근 제어, 마이그레이션, repository 쿼리 작성 시.
---

# Supabase RLS 규칙 (v1.1, 정규화 v2)

## 테이블
`users`, `community_products`(공용 마스터), `saved_products`(조인), `scan_history`.
상세 스키마는 `@docs/context/04-erd.md`.

## RLS 원칙 (사용자별 접근 제어, 비기능 보안 요구)
- **saved_products / scan_history**: 본인 데이터만 SELECT/INSERT/DELETE.
  - 조건: `user_id = auth.uid()` (또는 백엔드가 user_id를 주입하는 방식이면 서비스 키로 처리).
- **community_products**: 공용 마스터라 SELECT는 전체 허용 가능, INSERT/UPDATE는 백엔드(서비스 롤)만.
- **users**: 본인 레코드만 조회. toss_user_key로 식별.

## 정책 예시 (개념)
```sql
alter table saved_products enable row level security;

create policy "own saved select" on saved_products
  for select using (user_id = auth.uid());
create policy "own saved insert" on saved_products
  for insert with check (user_id = auth.uid());
create policy "own saved delete" on saved_products
  for delete using (user_id = auth.uid());

alter table scan_history enable row level security;
create policy "own scan" on scan_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```
> 백엔드 프록시가 서비스 롤로 접근하는 경우엔 RLS 우회가 가능하므로,
> **백엔드에서 user_id 범위를 반드시 코드로 강제**한다(남의 데이터 접근 차단).

## 무결성 제약 (마이그레이션)
- community_products: `UNIQUE(barcode)` — 같은 바코드 1건만(BR-009).
- saved_products: `UNIQUE(user_id, product_id)` — 같은 사용자 같은 상품 중복 저장 방지(BR-009).
- FK: saved_products.user_id→users, saved_products.product_id→community_products,
  scan_history.product_id→community_products.

## 주의
- 저장은 2단계: community_products 확보(없으면 insert) → saved_products 연결(BL-006).
- 중복 판정은 **(user_id + product_id)** (barcode 아님).
- 키·토큰은 환경변수. 클라이언트가 Supabase에 직접 접근하지 않는다(백엔드 경유).