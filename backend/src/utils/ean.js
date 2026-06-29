/**
 * EAN-13 / EAN-8(JAN) 체크디지트 검증 (BR-001 / BL-002).
 * 디코더(zbar)가 1차로 검증하지만, 오인식 차단을 위해 백엔드에서 한 번 더 확정한다.
 *
 * 가중치: 마지막 자리(체크디지트) 직전부터 오른쪽→왼쪽으로 3,1,3,1... 을 적용하면
 *         EAN-13/EAN-8 모두 동일 규칙으로 처리된다.
 *
 * @param {string} code  숫자 문자열
 * @returns {boolean} 형식(8/13자리 숫자) + 체크디지트가 모두 유효하면 true
 */
export function isValidEan(code) {
  if (typeof code !== 'string' || !/^(\d{8}|\d{13})$/.test(code)) return false;

  const digits = code.split('').map(Number);
  const check = digits.pop();

  // 체크디지트 바로 왼쪽 자리에 3, 그다음 1, … 교대 적용 (오른쪽 기준)
  let sum = 0;
  for (let i = digits.length - 1, weight = 3; i >= 0; i -= 1, weight = weight === 3 ? 1 : 3) {
    sum += digits[i] * weight;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === check;
}
