import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * LoginScreen 스모크 테스트.
 * - useLogin 훅을 통째로 mock(내부 appLogin/api/auth/session 실호출 0).
 *   화면은 login·loading 을 사용하므로 가짜 login 함수 호출 여부를 검증한다.
 * - @granite-js/react-native(useNavigation): 상단 내비바(HomeTopNavBar)의 뒤로/닫기용. 가짜.
 *   HomeTopNavBar 내부 아이콘(react-native-svg)도 함께 렌더된다.
 */

const mockLogin = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockCanGoBack = false;

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    canGoBack: () => mockCanGoBack,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../src/hooks/useLogin', () => ({
  __esModule: true,
  useLogin: () => ({ login: mockLogin, loading: false }),
}));

import { LoginScreen } from '../../src/screens/LoginScreen';

describe('LoginScreen (S-1 로그인)', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    mockCanGoBack = false;
  });

  it('브랜드 타이틀과 시작 버튼이 렌더된다', () => {
    render(<LoginScreen />);
    expect(screen.getByText('삑 (Bbik)')).toBeTruthy();
    expect(screen.getByText('토스로 시작하기')).toBeTruthy();
  });

  it('상단 내비바가 함께 렌더된다 (삑 로고+이름)', () => {
    render(<LoginScreen />);
    // 상단 바 타이틀("삑")과 닫기 버튼(접근성 라벨)이 존재한다.
    expect(screen.getByText('삑')).toBeTruthy();
    expect(screen.getByLabelText('닫기')).toBeTruthy();
  });

  it('상단 바의 닫기(X) 탭 → 홈("/")으로 이동한다', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByLabelText('닫기'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('상단 바의 뒤로 탭 → 스택 없으면 홈("/")으로 이동한다', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByLabelText('뒤로 가기'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('"토스로 시작하기" 탭 → useLogin의 login이 호출된다', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText('토스로 시작하기'));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
