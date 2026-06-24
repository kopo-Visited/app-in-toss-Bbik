import { describe, it, expect } from 'vitest';
import { toSuccess, toFailure } from '../../src/utils/response.js';
import { AppError } from '../../src/errors/AppError.js';

describe('toSuccess (성공 envelope §4.1)', () => {
  it('data를 감싸 {success:true, data} 반환', () => {
    expect(toSuccess({ a: 1 })).toEqual({ success: true, data: { a: 1 } });
  });
  it('인자 없으면 data는 빈 객체', () => {
    expect(toSuccess()).toEqual({ success: true, data: {} });
  });
});

describe('toFailure (실패 envelope §4.2)', () => {
  it('AppError → success:false + code·message 포함', () => {
    const body = toFailure(new AppError('UNAUTHORIZED'));
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(typeof body.error.message).toBe('string');
  });
  it('AppError.data 있으면 body.data 포함', () => {
    const body = toFailure(
      new AppError('PRODUCT_NOT_FOUND', undefined, { data: { barcode: '4901234567894' } }),
    );
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(body.data).toEqual({ barcode: '4901234567894' });
  });
  it('일반 Error → INTERNAL_ERROR로 마스킹', () => {
    const body = toFailure(new Error('boom'));
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
