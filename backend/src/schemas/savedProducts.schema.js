import { z } from 'zod';

// EAN-13 / EAN-8 (BR-001)
const barcode = z.string().regex(/^(\d{13}|\d{8})$/);

/**
 * POST /api/saved-products 요청 본문 (03-api-spec §12.3).
 * nameKo·lookupType 필수, 나머지는 선택/null 허용.
 * ⚠️ barcode 는 스키마상 null 허용이나, community_products.barcode 가 NOT NULL 이라
 *    service 에서 barcode 미보유 시 저장 거부한다(ERD 제약).
 */
export const saveProductSchema = z.object({
  body: z.object({
    scanHistoryId: z.string().optional(),
    barcode: barcode.nullable().optional(),
    nameOriginal: z.string().nullable().optional(),
    nameKo: z.string().min(1),
    brandNameOriginal: z.string().nullable().optional(),
    brandNameKo: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    currency: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
    country: z.string().optional(),
    lookupType: z.enum(['barcode', 'keyword', 'ai']),
  }),
});
