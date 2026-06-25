import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * LoginScreen 스모크 테스트.
 * - useLogin 훅을 통째로 mock(내부 appLogin/api/auth/session 실호출 0).
 *   화면은 login·loading 만 사용하므로 가짜 login 함수 호출 여부만 검증한다.
 */

const mockLogin = jest.fn();

jest.mock('../../src/hooks/useLogin', () => ({
  __esModule: true,
  useLogin: () => ({ login: mockLogin, loading: false }),
}));

import { LoginScreen } from '../../src/screens/LoginScreen';

describe('LoginScreen (S-1 로그인)', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('브랜드 타이틀과 시작 버튼이 렌더된다', () => {
    render(<LoginScreen />);
    expect(screen.getByText('삑 (Bbik)')).toBeTruthy();
    expect(screen.getByText('토스로 시작하기')).toBeTruthy();
  });

  it('"토스로 시작하기" 탭 → useLogin의 login이 호출된다', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText('토스로 시작하기'));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
});
