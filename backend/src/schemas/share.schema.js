import { z } from 'zod';

/**
 * POST /api/share/products 요청 본문 (03-api-spec §15.2).
 * nameKo 필수, 나머지 선택/null. 공유 문구 생성에 쓰이는 값만 사용한다.
 */
export const shareProductSchema = z.object({
  body: z.object({
    nameOriginal: z.string().nullable().optional(),
    nameKo: z.string().min(1),
    brandNameOriginal: z.string().nullable().optional(),
    brandNameKo: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    currency: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    lookupType: z.enum(['barcode', 'keyword', 'ai']).optional(),
  }),
});
