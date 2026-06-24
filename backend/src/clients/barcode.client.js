import { Jimp } from 'jimp';
import { scanImageData } from '@undecaf/zbar-wasm';
import { isValidEan } from '../utils/ean.js';

/**
 * 촬영 이미지 버퍼에서 JAN/EAN 바코드 숫자를 디코드한다 (BL-002, F-002).
 * 로컬 라이브러리만 사용 — 외부 호출/네트워크 없음.
 *
 * 파이프라인: jimp(JPEG/PNG → RGBA 비트맵) → zbar-wasm(scanImageData) → EAN 심볼 추출.
 * zbar 가 검출한 EAN-13/EAN-8 중 체크디지트까지 유효한 첫 값을 돌려준다(오인식 차단).
 *
 * @param {Buffer} buffer  multer memoryStorage 로 받은 이미지 바이트
 * @returns {Promise<string|null>} 유효한 EAN 숫자 | (검출 실패 시) null
 */
export async function decodeEan(buffer) {
  let bitmap;
  try {
    const image = await Jimp.read(buffer);
    bitmap = image.bitmap; // { data: Buffer(RGBA), width, height }
  } catch {
    // 이미지 자체를 파싱할 수 없음(손상/미지원 포맷) → 검출 실패로 간주(직접입력 폴백)
    return null;
  }

  const imageData = {
    data: new Uint8ClampedArray(bitmap.data),
    width: bitmap.width,
    height: bitmap.height,
  };
  const symbols = await scanImageData(imageData);

  for (const symbol of symbols) {
    // EAN-13 / EAN-8(JAN) 만 채택 (BR-001). 그 외 심볼은 무시.
    if (symbol.typeName !== 'ZBAR_EAN13' && symbol.typeName !== 'ZBAR_EAN8') continue;
    const value = symbol.decode();
    if (isValidEan(value)) return value;
  }
  return null;
}
