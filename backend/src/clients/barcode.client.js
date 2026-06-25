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
  const startedAt = Date.now();
  const bytes = buffer?.length ?? 0;

  let bitmap;
  try {
    const image = await Jimp.read(buffer);
    bitmap = image.bitmap; // { data: Buffer(RGBA), width, height }
  } catch (e) {
    // 이미지 파싱 불가(손상/미지원/빈 업로드) → 검출 실패로 간주(직접입력 폴백)
    console.warn(`[decode-barcode] parse-fail bytes=${bytes} err=${e?.message} ${Date.now() - startedAt}ms`);
    return null;
  }

  const imageData = {
    data: new Uint8ClampedArray(bitmap.data),
    width: bitmap.width,
    height: bitmap.height,
  };
  const symbols = await scanImageData(imageData);

  let picked = null;
  for (const symbol of symbols) {
    // EAN-13 / EAN-8(JAN) 만 채택 (BR-001). 그 외 심볼은 무시.
    if (symbol.typeName !== 'ZBAR_EAN13' && symbol.typeName !== 'ZBAR_EAN8') continue;
    const value = symbol.decode();
    if (isValidEan(value)) {
      picked = value;
      break;
    }
  }

  // 진단 1줄(Fly 로그): 기기가 보낸 이미지 크기/해상도/zbar 가 본 심볼/소요시간.
  // bytes 작음/0 → 업로드 문제 / dims 큼 + 느림 → 고해상도라 처리 지연 / symbols=0 → 바코드 미검출(품질).
  const seen = symbols.map((s) => s.typeName).join(',') || '-';
  console.info(
    `[decode-barcode] bytes=${bytes} dims=${bitmap.width}x${bitmap.height} ` +
      `symbols=${symbols.length} types=[${seen}] picked=${picked ?? 'none'} ${Date.now() - startedAt}ms`,
  );
  return picked;
}
