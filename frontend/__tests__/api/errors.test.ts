import { ApiError, messageForCode } from '../../src/api/errors';

describe('messageForCode (공통 에러코드 → 한국어 메시지)', () => {
  it('정의된 코드는 매핑 메시지를 반환', () => {
    expect(messageForCode('UNAUTHORIZED')).toBe('인증에 실패했습니다. 다시 로그인해주세요.');
    expect(messageForCode('INVALID_BARCODE')).toBe('바코드 형식이 올바르지 않습니다.');
    expect(messageForCode('RATE_LIMIT_EXCEEDED')).toBe('잠시 후 다시 시도해주세요.');
  });

  it('매핑에 없으면 서버 message(fallback)를 사용', () => {
    expect(messageForCode('SOMETHING_NEW', '서버가 준 메시지')).toBe('서버가 준 메시지');
  });

  it('매핑도 fallback도 없으면 기본 문구', () => {
    expect(messageForCode(undefined)).toBe('오류가 발생했습니다.');
    expect(messageForCode('UNKNOWN_CODE')).toBe('오류가 발생했습니다.');
  });
});

describe('ApiError', () => {
  it('code·nextAction·data를 보관하고 instanceof Error', () => {
    const err = new ApiError('PRODUCT_NOT_FOUND', '상품 없음', 'CAPTURE_PRODUCT_IMAGE', {
      scanHistoryId: 's1',
      barcode: '4901234567894',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('PRODUCT_NOT_FOUND');
    expect(err.message).toBe('상품 없음');
    expect(err.nextAction).toBe('CAPTURE_PRODUCT_IMAGE');
    expect(err.data).toEqual({ scanHistoryId: 's1', barcode: '4901234567894' });
  });
});
