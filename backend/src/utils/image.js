/**
 * 이미지 입력 정규화 (F-002/F-003).
 *
 * 앱인토스 `openCamera` 는 file:// 경로가 아니라 base64/데이터 URI 를 돌려줘서,
 * RN 멀티파트 파일 업로드로는 백엔드가 유효한 이미지를 못 받는다. 그래서 JSON body 의
 * base64 도 받아 버퍼로 변환한다. 멀티파트(req.file)도 그대로 지원한다.
 */

/**
 * base64 문자열(순수 base64 또는 `data:image/...;base64,` 데이터 URI)을 버퍼+mimetype 으로.
 * @param {string} input
 * @returns {{ buffer: Buffer, mimetype: string }}
 */
export function decodeBase64Image(input) {
  const match = /^data:(image\/[\w.+-]+);base64,(.*)$/s.exec(input);
  const mimetype = match ? match[1] : 'image/jpeg'; // 순수 base64 면 jpeg 로 가정(openCamera 기본)
  const base64 = match ? match[2] : input;
  return { buffer: Buffer.from(base64, 'base64'), mimetype };
}

/**
 * 요청에서 이미지를 꺼내 `{ buffer, mimetype }` 로 통일한다.
 * 우선순위: 멀티파트 파일(req.file) → JSON body 의 base64(req.validated.body.image).
 * 검증 스키마가 "둘 중 하나"를 보장하므로 보통 null 이 아니다.
 * @returns {{ buffer: Buffer, mimetype: string } | null}
 */
export function photoFromRequest(req) {
  if (req.file?.buffer?.length) {
    return { buffer: req.file.buffer, mimetype: req.file.mimetype };
  }
  const image = req.validated?.body?.image;
  if (typeof image === 'string' && image.length > 0) {
    return decodeBase64Image(image);
  }
  return null;
}
