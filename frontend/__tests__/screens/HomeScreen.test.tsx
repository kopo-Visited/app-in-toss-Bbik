import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * HomeScreen 스모크 테스트.
 * - 외부 의존: @granite-js/react-native(useNavigation), react-native-svg(HomeTopNavBar 내부 아이콘).
 *   useNavigation은 navigate/canGoBack/goBack을 가진 가짜 객체로 대체해 실제 네비게이션·SDK 호출 0.
 *   HomeScreen 자체는 api/SDK를 호출하는 훅을 쓰지 않는다(네비게이션만).
 */

const mockNavigate = jest.fn();

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

import { HomeScreen } from '../../src/screens/HomeScreen';

describe('HomeScreen (S-2 메인/홈)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('인사·안내·버튼 핵심 요소가 렌더된다', () => {
    render(<HomeScreen />);
    expect(screen.getByText('안녕하세요')).toBeTruthy();
    expect(screen.getByText('무엇을 스캔해볼까요?')).toBeTruthy();
    expect(screen.getByText('스캔하기')).toBeTruthy();
    expect(screen.getByText('저장목록')).toBeTruthy();
  });

  it('"스캔하기" 탭 → /scan 으로 이동한다', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('스캔하기'));
    expect(mockNavigate).toHaveBeenCalledWith('/scan');
  });

  it('"저장목록" 탭 → /saved 로 이동한다', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('저장목록'));
    expect(mockNavigate).toHaveBeenCalledWith('/saved');
  });
});
