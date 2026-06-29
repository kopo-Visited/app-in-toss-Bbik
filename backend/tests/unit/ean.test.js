import { describe, it, expect } from 'vitest';
import { isValidEan } from '../../src/utils/ean.js';

describe('isValidEan() — BR-001 체크디지트', () => {
  it('유효한 EAN-13 → true', () => {
    expect(isValidEan('4901008315997')).toBe(true); // 캔메이크
    expect(isValidEan('4901234567894')).toBe(true);
  });

  it('유효한 EAN-8 → true', () => {
    expect(isValidEan('96385074')).toBe(true);
  });

  it('체크디지트 틀림 → false (오인식 차단)', () => {
    expect(isValidEan('4901008315990')).toBe(false);
    expect(isValidEan('96385070')).toBe(false);
  });

  it('형식 위반(자리수/비숫자/공백) → false', () => {
    expect(isValidEan('123')).toBe(false); // 너무 짧음
    expect(isValidEan('49010083159970')).toBe(false); // 14자리
    expect(isValidEan('49010O8315997')).toBe(false); // 문자 포함
    expect(isValidEan('')).toBe(false);
    expect(isValidEan(null)).toBe(false);
    expect(isValidEan(4901008315997)).toBe(false); // 숫자 타입은 거부
  });
});
