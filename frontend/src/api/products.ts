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

interface DecodeBarcodeData {
  /** 이미지에서 디코드한 JAN/EAN 숫자 (EAN-13 또는 EAN-8). */
  barcode: string;
}

/**
 * F-002 POST /api/products/decode-barcode (multipart) — ⚠️ 임시 계약 (BE 확정 전).
 *
 * 배경: 앱인토스는 실시간 바코드 스캐너 API/네이티브 모듈을 제공하지 않고 `openCamera`(사진 촬영)만 있다.
 *       그래서 촬영한 바코드 사진을 백엔드로 보내 이미지에서 JAN/EAN 숫자를 디코드받고,
 *       그 숫자로 기존 lookup(F-003) 흐름을 탄다.
 *
 * 이 엔드포인트는 아직 BE에 없다. BE는 아래 계약에 맞춰 구현한다:
 *  - 요청: POST /api/products/decode-barcode
 *          Content-Type: multipart/form-data
 *          field `image`: 촬영 이미지 (analyzeImage와 동일 방식)
 *          Authorization: Bearer <accessToken> (analyzeImage와 동일 토큰)
 *  - 성공: { success: true, data: { barcode: string } }   // 디코드된 EAN-13/EAN-8 숫자
 *  - 미검출: { success: false, error: { code: 'BARCODE_NOT_DETECTED', nextAction: 'MANUAL_INPUT' } }
 *  - 그 외 실패(이미지 손상 등)도 envelope error로 반환.
 *
 * FE는 미검출/실패/엔드포인트 없음(404)을 모두 ApiError로 받아 직접입력(/manual-input) 폴백으로 처리한다.
 *
 * client.request는 JSON 전용이라 multipart는 여기서 직접 fetch (analyzeImage와 동일 패턴).
 */
export async function decodeBarcode(params: { uri: string }): Promise<string> {
  const token = getAccessToken();
  let res: Response;
  try {
    // openCamera dataUri(= data:image/...;base64,...)를 JSON으로 그대로 전송. 백엔드가 파싱한다.
    // RN FormData 파일 업로드는 file:// 경로여야 동작 → data URI는 멀티파트로 못 올려 백엔드가 빈 이미지를 받았음.
    res = await fetch(`${baseURL}/api/products/decode-barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ image: params.uri }),
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', '네트워크를 확인해주세요.');
  }
  // 엔드포인트 미구현(404) 등 JSON이 아닐 수 있어 방어적으로 파싱.
  let json: ApiEnvelope<DecodeBarcodeData> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<DecodeBarcodeData>;
  } catch {
    throw new ApiError('BARCODE_NOT_DETECTED', '바코드를 인식하지 못했어요.', 'MANUAL_INPUT');
  }
  if (json?.success === true) {
    return json.data.barcode;
  }
  throw new ApiError(
    json?.error?.code ?? 'BARCODE_NOT_DETECTED',
    messageForCode(json?.error?.code, json?.error?.message),
    json?.error?.nextAction ?? 'MANUAL_INPUT',
    json?.data,
  );
}

/** F-003 POST /api/products/analyze-image. openCamera dataUri(base64)를 JSON으로 전송. */
export async function analyzeImage(params: {
  uri: string;
  barcode: string;
  scanHistoryId: string;
}): Promise<{ product: Product; scanHistoryId: string }> {
  const token = getAccessToken();
  let res: Response;
  try {
    // openCamera dataUri(= data:image/...;base64,...)를 JSON으로 그대로 전송. 백엔드가 파싱한다.
    res = await fetch(`${baseURL}/api/products/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        image: params.uri,
        barcode: params.barcode,
        scanHistoryId: params.scanHistoryId,
      }),
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
