import { post, get, del } from './client';
import { getAccessToken } from './session';
import type { Product, SavedProduct } from '../lib/product';

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

interface SavedListResponse {
  page: number;
  limit: number;
  items: Array<{
    savedProductId: string;
    productId: string;
    barcode: string | null;
    nameOriginal: string | null;
    nameKo: string;
    brandNameOriginal: string | null;
    brandNameKo: string | null;
    price: number | null;
    currency: string;
    imageUrl: string | null;
    country: string;
    lookupType: 'barcode' | 'keyword' | 'ai';
    createdAt: string;
  }>;
}

/**
 * F-005 저장 목록 조회. GET /api/saved-products (Authorization: Bearer {accessToken}).
 * API item → SavedProduct 매핑(savedProductId→id, createdAt→savedAt).
 */
export async function getSavedProducts(): Promise<SavedProduct[]> {
  const data = await get<SavedListResponse>('/api/saved-products', {
    token: getAccessToken() ?? undefined,
  });
  return data.items.map((it) => ({
    id: it.savedProductId,
    savedAt: it.createdAt,
    barcode: it.barcode ?? '',
    nameOriginal: it.nameOriginal ?? '',
    nameKo: it.nameKo,
    brandNameOriginal: it.brandNameOriginal,
    brandNameKo: it.brandNameKo,
    price: it.price,
    imageUrl: it.imageUrl,
    lookupType: it.lookupType,
  }));
}

/**
 * F-005 개별 삭제. DELETE /api/saved-products/{savedProductId} (Authorization: Bearer {accessToken}).
 */
export async function deleteSavedProduct(id: string): Promise<void> {
  await del<{ deleted: boolean; savedProductId: string; message: string }>(
    `/api/saved-products/${id}`,
    { token: getAccessToken() ?? undefined },
  );
}
