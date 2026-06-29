import { formatPrice } from '../../src/lib/product';

describe('formatPrice (기획서 7 표시 규칙)', () => {
  it('가격이 있으면 "약 ¥{가격}" (천단위 구분)', () => {
    expect(formatPrice(150)).toBe('약 ¥150');
    expect(formatPrice(861)).toBe('약 ¥861');
    expect(formatPrice(12345)).toBe('약 ¥12,345');
  });

  it('null 이면 "가격 정보 없음"', () => {
    expect(formatPrice(null)).toBe('가격 정보 없음');
  });

  it('0 이면 "가격 정보 없음" (실제 0원도 정보 없음으로 표시)', () => {
    expect(formatPrice(0)).toBe('가격 정보 없음');
  });
});
