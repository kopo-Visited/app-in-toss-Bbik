import { post } from './client';
import { getAccessToken } from './session';
import type { Product } from '../lib/product';

export interface ShareResponse {
  shareText: string;
}

/**
 * F-006 공유 문구 생성. POST /api/share/products.
 * 선택 기능 — 실패하면 ResultScreen 측에서 클라이언트 폴백 문구로 진행한다.
 */
export async function createShareText(product: Product): Promise<ShareResponse> {
  return post<ShareResponse>('/api/share/products', {
    token: getAccessToken() ?? undefined,
    body: {
      nameOriginal: product.nameOriginal ?? null,
      nameKo: product.nameKo,
      brandNameOriginal: product.brandNameOriginal ?? null,
      brandNameKo: product.brandNameKo ?? null,
      price: product.price,
      currency: 'JPY',
      imageUrl: product.imageUrl ?? null,
      lookupType: product.lookupType,
    },
  });
}
