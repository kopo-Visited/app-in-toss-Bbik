import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * ManualInputScreen 스모크 테스트.
 * - @granite-js/react-native(useNavigation): 가짜.
 * - useProductLookup: 내부 api(products) 실호출 → mock. run 호출 여부로 제출 동작 확인.
 * 입력 필드 렌더 + 숫자 외 입력 거름(replace(/[^0-9]/g)) + 유효 길이에서 제출 동작을 확인.
 */

const mockRun = jest.fn();

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: jest.fn(),
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useProductLookup', () => ({
  __esModule: true,
  useProductLookup: () => ({ run: mockRun, loading: false, networkError: false }),
}));

import { ManualInputScreen } from '../../src/screens/ManualInputScreen';

describe('ManualInputScreen (S-3a 직접 입력)', () => {
  beforeEach(() => {
    mockRun.mockClear();
  });

  it('제목·입력 필드·CTA가 렌더된다', () => {
    render(<ManualInputScreen />);
    expect(screen.getByText('바코드 직접 입력')).toBeTruthy();
    expect(screen.getByPlaceholderText('바코드 숫자 입력')).toBeTruthy();
    expect(screen.getByText('조회하기')).toBeTruthy();
  });

  it('숫자 외 입력은 걸러지고 헬퍼에 자릿수가 반영된다', () => {
    render(<ManualInputScreen />);
    const input = screen.getByPlaceholderText('바코드 숫자 입력');
    fireEvent.changeText(input, '49a01b234'); // 숫자 7자리만 남아야 함
    expect(screen.getByText('13자리 숫자 (7/13)')).toBeTruthy();
  });

  it('유효하지 않은 길이에서는 조회(run)가 호출되지 않는다', () => {
    render(<ManualInputScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('바코드 숫자 입력'), '123');
    fireEvent.press(screen.getByText('조회하기'));
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('JAN-13 입력 후 조회 탭 → run(코드)이 호출된다', () => {
    render(<ManualInputScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('바코드 숫자 입력'), '4901234567894');
    fireEvent.press(screen.getByText('조회하기'));
    expect(mockRun).toHaveBeenCalledWith('4901234567894');
  });
});
