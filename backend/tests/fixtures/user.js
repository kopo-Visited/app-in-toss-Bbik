/**
 * users repository 반환형 픽스처 (BL-001 auth.service 단위용).
 * userRepo.findByTossKey 의 반환 DTO 기준.
 * 매핑 출처: user.repository.js toDTO (04-erd §1: user_id↔id, toss_user_key↔tossUserKey).
 */

// 기존 사용자 — findByTossKey 반환 DTO (toss_user_key 는 문자열 보관)
export const USER_ROW = {
  id: 'user-1',
  name: '홍길동',
  tossUserKey: '443731104',
  createdAt: '2026-06-24T00:00:00.000Z',
};

// userRepo.insert 반환형 (신규 등록)
export const INSERTED_USER = { id: 'user-2' };
