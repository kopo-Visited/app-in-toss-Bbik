import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

/**
 * HomeScreen 스모크 테스트.
 * - 외부 의존: @granite-js/react-native(useNavigation), react-native-svg(HomeTopNavBar 내부 아이콘).
 *   useNavigation은 navigate/replace/canGoBack/goBack을 가진 가짜 객체로 대체해 실제 네비게이션·SDK 호출 0.
 *   HomeScreen 자체는 api/SDK를 호출하는 훅을 쓰지 않는다(네비게이션만).
 * - 로그인 게이트(useAuthGate)가 getAccessToken()을 확인하므로, 로그인 상태 검증을 위해
 *   session 모듈을 mock해 토큰 유무를 제어한다. 기본(로그인됨)으로 두고 원래 렌더 의도를 유지.
 */

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGetAccessToken = jest.fn<string | null, []>();

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

jest.mock('../../src/api/session', () => ({
  __esModule: true,
  getAccessToken: () => mockGetAccessToken(),
}));

import { HomeScreen } from '../../src/screens/HomeScreen';

describe('HomeScreen (S-2 메인/홈)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockReplace.mockClear();
    // 기본: 로그인 상태(토큰 있음) → 게이트 통과, 홈 본문 렌더.
    mockGetAccessToken.mockReturnValue('test-token');
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

  it('미로그인(토큰 없음) 진입 시 /login 으로 리다이렉트하고 홈 본문을 그리지 않는다', () => {
    mockGetAccessToken.mockReturnValue(null);
    render(<HomeScreen />);
    expect(mockReplace).toHaveBeenCalledWith('/login');
    // 게이트 통과 전: 홈 인사 문구가 렌더되지 않는다(플리커 방지).
    expect(screen.queryByText('안녕하세요')).toBeNull();
  });

  it('로그인 상태(토큰 있음)면 /login 으로 튕기지 않고 홈을 보여준다', () => {
    mockGetAccessToken.mockReturnValue('test-token');
    render(<HomeScreen />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('안녕하세요')).toBeTruthy();
  });
});
