import { get, type ApiEnvelope } from './client';
import { getAccessToken } from './session';
import { baseURL } from './config';
import { ApiError, messageForCode } from './errors';
import type { Product, LookupType } from '../lib/product';

interface LookupSuccessData {
  lookupType: LookupType;
  scanHistoryId: string;
  barcode: string;
  product: {
    nameOriginal: string | null;
    nameKo: string | null;
    brandNameOriginal: string | null;
    brandNameKo: string | null;
    price: number | null;
    currency: string;
    imageUrl: string | null;
  };
}

function toProduct(d: LookupSuccessData): Product {
  return {
    barcode: d.barcode,
    lookupType: d.lookupType,
    nameOriginal: d.product.nameOriginal ?? '',
    nameKo: d.product.nameKo ?? '',
    brandNameOriginal: d.product.brandNameOriginal,
    brandNameKo: d.product.brandNameKo,
    price: d.product.price,
    imageUrl: d.product.imageUrl,
  };
}

export type LookupResult =
  | { kind: 'found'; product: Product; scanHistoryId: string }
  | { kind: 'notFound'; barcode: string; scanHistoryId: string };

/** F-003 GET /api/products/lookup. PRODUCT_NOT_FOUND은 에러가 아닌 분기(notFound)로 반환. */
export async function lookupProduct(barcode: string): Promise<LookupResult> {
  try {
    const data = await get<LookupSuccessData>(
      `/api/products/lookup?barcode=${encodeURIComponent(barcode)}`,
      { token: getAccessToken() ?? undefined },
    );
    return { kind: 'found', product: toProduct(data), scanHistoryId: data.scanHistoryId };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'PRODUCT_NOT_FOUND') {
      const d = (e.data ?? {}) as { scanHistoryId?: string; barcode?: string };
      return { kind: 'notFound', barcode: d.barcode ?? barcode, scanHistoryId: d.scanHistoryId ?? '' };
    }
    throw e;
  }
}

/** F-003 POST /api/products/analyze-image (multipart). client.request는 JSON 전용이라 여기선 직접 fetch. */
export async function analyzeImage(params: {
  uri: string;
  barcode: string;
  scanHistoryId: string;
}): Promise<{ product: Product; scanHistoryId: string }> {
  const form = new FormData();
  // TODO(빌드): openCamera dataUri 형식(file uri 가정). RN FormData 파일 업로드 규약 — 실제 빌드에서 검증.
  form.append('image', { uri: params.uri, name: 'product.jpg', type: 'image/jpeg' } as unknown as Blob);
  form.append('barcode', params.barcode);
  form.append('scanHistoryId', params.scanHistoryId);
  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${baseURL}/api/products/analyze-image`, {
      method: 'POST',
      // Content-Type 미지정(멀티파트 boundary 자동)
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      // RN의 fetch는 FormData 업로드를 지원하지만, @types/node의 전역 FormData와
      // RN BodyInit_가 참조하는 FormData가 서로 다른 타입으로 충돌한다(런타임 영향 없음).
      // 동작은 그대로 두고 타입만 RN RequestInit['body']로 맞춘다.
      body: form as unknown as RequestInit['body'],
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', '네트워크를 확인해주세요.');
  }
  const json = (await res.json()) as ApiEnvelope<LookupSuccessData>;
  if (json?.success === true) {
    return { product: toProduct(json.data), scanHistoryId: json.data.scanHistoryId };
  }
  throw new ApiError(
    json?.error?.code ?? 'UNKNOWN',
    messageForCode(json?.error?.code, json?.error?.message),
    json?.error?.nextAction,
    json?.data,
  );
}
