import { z } from 'zod';

/**
 * POST /api/auth/toss/login 요청 본문 (03-api-spec §5.3).
 * authorizationCode: 토스 appLogin() 인가코드 (유효 10분·일회성).
 * referrer: appLogin() 이 함께 반환한 값. generate-token 에 그대로 전달.
 */
export const tossLoginSchema = z.object({
  body: z.object({
    authorizationCode: z.string().min(1),
    referrer: z.enum(['DEFAULT', 'SANDBOX']),
  }),
});
