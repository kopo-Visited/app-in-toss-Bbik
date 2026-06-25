import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * ScanScreen 스모크 테스트.
 * - @granite-js/react-native(useNavigation): navigate 검증용 가짜.
 * - useBarcodeScan: 내부에서 openCamera/api(products) 실호출 → 통째로 mock(실호출 0).
 * - useToast: 실제 사용 가능하나 일관성·안정성 위해 가짜 처리.
 * "직접 입력" 경로(가이드 박스 + 직접입력 버튼) 동작만 확인하는 스모크 수준.
 */

const mockNavigate = jest.fn();
const mockScan = jest.fn();
const mockShow = jest.fn();

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useBarcodeScan', () => ({
  __esModule: true,
  useBarcodeScan: () => ({ scan: mockScan, loading: false, networkError: false }),
}));

jest.mock('../../src/hooks/useToast', () => ({
  __esModule: true,
  useToast: () => ({ message: null, show: mockShow }),
}));

import { ScanScreen } from '../../src/screens/ScanScreen';

describe('ScanScreen (S-3 바코드 스캔)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockScan.mockClear();
  });

  it('크래시 없이 렌더되고 가이드 문구가 존재한다', () => {
    render(<ScanScreen />);
    expect(screen.getByText('바코드를 사각형 안에 맞춰 촬영해주세요')).toBeTruthy();
    expect(screen.getByText('바코드 직접 입력기')).toBeTruthy();
  });

  it('"바코드 직접 입력기" 탭 → /manual-input 으로 이동한다', () => {
    render(<ScanScreen />);
    fireEvent.press(screen.getByText('바코드 직접 입력기'));
    expect(mockNavigate).toHaveBeenCalledWith('/manual-input');
  });
});
