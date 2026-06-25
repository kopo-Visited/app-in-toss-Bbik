import { get, post } from './client';
import { getAccessToken } from './session';
import { ApiError } from './errors';
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
 * F-002 POST /api/products/decode-barcode (base64 JSON) — ⚠️ 임시 계약 (BE 확정 전, 필드명/형식 바뀔 수 있음).
 *
 * 배경: 앱인토스는 실시간 바코드 스캐너 API/네이티브 모듈을 제공하지 않고 `openCamera`(사진 촬영)만 있다.
 *       그래서 촬영한 바코드 사진을 백엔드로 보내 이미지에서 JAN/EAN 숫자를 디코드받고,
 *       그 숫자로 기존 lookup(F-003) 흐름을 탄다.
 *
 * ⚠️ 전송 방식 전환: 멀티파트 파일 업로드는 실기기에서 안 된다.
 *    openCamera({ base64: true })는 파일(file://)이 아니라 순수 base64 문자열(dataUri)을 주므로
 *    RN FormData 파일 업로드 규약(uri/name/type)에 맞는 파일이 없어 BE가 유효 이미지를 못 받았다.
 *    → base64 JSON 전송으로 전환.
 *
 * 이 엔드포인트는 아직 BE에 없다(임시 계약, BE 확정 전). BE는 아래 계약에 맞춰 구현한다:
 *  - 요청: POST /api/products/decode-barcode
 *          Content-Type: application/json
 *          body `{ "image": "<순수 base64 문자열>" }`  // data:image/...;base64, 접두사 없음
 *          Authorization: Bearer <accessToken>
 *  - 성공: { success: true, data: { barcode: string } }   // 디코드된 EAN-13/EAN-8 숫자
 *  - 미검출: { success: false, error: { code: 'BARCODE_NOT_DETECTED', nextAction: 'MANUAL_INPUT' } }
 *  - 그 외 실패(이미지 손상 등)도 envelope error로 반환.
 *
 * ⚠️ BE 확정 시 바꿀 지점: 요청 필드명(`image`)·base64 형식(접두사 유무) 합의되면 여기 body 키만 수정.
 *
 * FE는 미검출/실패를 모두 ApiError로 받아 직접입력(/manual-input) 폴백으로 처리한다.
 * (post가 envelope error를 ApiError로 throw → 호출부에서 폴백; 미검출이면 nextAction=MANUAL_INPUT.)
 */
export async function decodeBarcode(params: { imageBase64: string }): Promise<string> {
  const data = await post<DecodeBarcodeData>('/api/products/decode-barcode', {
    body: { image: params.imageBase64 },
    token: getAccessToken() ?? undefined,
  });
  return data.barcode;
}

/**
 * F-003 POST /api/products/analyze-image (base64 JSON) — ⚠️ 임시 계약 (BE 확정 전, 필드명/형식 바뀔 수 있음).
 *
 * decodeBarcode와 동일한 이유로 멀티파트 → base64 JSON 전환.
 *  - 요청: POST /api/products/analyze-image
 *          Content-Type: application/json
 *          body `{ "image": "<순수 base64>", "barcode": "...", "scanHistoryId": "..." }`
 *          Authorization: Bearer <accessToken>
 *  - 성공/실패 envelope·에러코드는 기존 그대로.
 *
 * ⚠️ BE 확정 시 바꿀 지점: 요청 필드명(`image`)·base64 형식(접두사 유무) 합의되면 여기 body 키만 수정.
 */
export async function analyzeImage(params: {
  imageBase64: string;
  barcode: string;
  scanHistoryId: string;
}): Promise<{ product: Product; scanHistoryId: string }> {
  const data = await post<LookupSuccessData>('/api/products/analyze-image', {
    body: {
      image: params.imageBase64,
      barcode: params.barcode,
      scanHistoryId: params.scanHistoryId,
    },
    token: getAccessToken() ?? undefined,
  });
  return { product: toProduct(data), scanHistoryId: data.scanHistoryId };
}
