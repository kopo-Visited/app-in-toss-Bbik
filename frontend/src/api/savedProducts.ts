import { post } from './client';
import { getAccessToken } from './session';
import type { Product } from '../lib/product';

export interface SaveResponse {
  saved: boolean;
  savedProductId: string;
  message: string;
}

/**
 * F-004 상품 저장. POST /api/saved-products (Authorization: Bearer {accessToken}).
 * saved=false ⇒ 이미 저장된 상품. 중복은 백엔드에서 (user_id + barcode)로 판정.
 */
export async function saveProduct(product: Product): Promise<SaveResponse> {
  return post<SaveResponse>('/api/saved-products', {
    token: getAccessToken() ?? undefined,
    body: {
      barcode: product.barcode ?? null,
      nameOriginal: product.nameOriginal ?? null,
      nameKo: product.nameKo,
      brandNameOriginal: product.brandNameOriginal ?? null,
      brandNameKo: product.brandNameKo ?? null,
      price: product.price,
      currency: 'JPY',
      imageUrl: product.imageUrl ?? null,
      country: 'JP',
      lookupType: product.lookupType,
    },
  });
}
