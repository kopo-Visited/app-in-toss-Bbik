import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import type { SavedProduct } from '../../src/lib/product';

/**
 * SavedScreen 스모크 + 전체삭제(F-005) 테스트.
 * - @granite-js/react-native(useNavigation): 가짜.
 * - useSavedProducts: 내부 api(savedProducts) 실호출 → mock. 반환값을 테스트마다 주입해
 *   빈 목록 / 목록 상태를 각각 렌더 확인.
 */

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: jest.fn(),
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

const mockUseSavedProducts = jest.fn();

jest.mock('../../src/hooks/useSavedProducts', () => ({
  __esModule: true,
  useSavedProducts: () => mockUseSavedProducts(),
}));

// 세션의 사용자 이름(로그인 응답 name) — 타이틀 바인딩 검증용으로 제어.
let mockUserName: string | null = null;
jest.mock('../../src/api/session', () => ({
  __esModule: true,
  getUserName: () => mockUserName,
}));

import { SavedScreen } from '../../src/screens/SavedScreen';

const ITEM: SavedProduct = {
  id: 'sp-1',
  savedAt: '2026-06-24T00:00:00.000Z',
  barcode: '4901234567894',
  nameOriginal: 'カラムーチョ',
  nameKo: '카라무쵸 감자칩',
  brandNameOriginal: null,
  brandNameKo: null,
  price: 150,
  imageUrl: null,
  lookupType: 'barcode',
};

describe('SavedScreen (S-6 저장 목록)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockUserName = null;
  });

  it('타이틀에 로그인 이름을 바인딩한다 (없으면 "회원"으로 폴백)', () => {
    const base = {
      items: [],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll: jest.fn(),
    };
    // 이름 있을 때
    mockUserName = '김토스';
    mockUseSavedProducts.mockReturnValue(base);
    const { rerender } = render(<SavedScreen />);
    expect(screen.getByText('김토스님의 저장한 상품')).toBeTruthy();

    // 이름 없을 때 → 회원 폴백
    mockUserName = null;
    rerender(<SavedScreen />);
    expect(screen.getByText('회원님의 저장한 상품')).toBeTruthy();
  });

  it('빈 목록이면 빈 상태 문구가 렌더된다', () => {
    mockUseSavedProducts.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll: jest.fn(),
    });
    render(<SavedScreen />);
    expect(screen.getByText('저장한 상품이 없어요')).toBeTruthy();
    expect(screen.getByText('스캔하러 가기')).toBeTruthy();
  });

  it('항목이 있으면 상품명이 렌더된다', () => {
    mockUseSavedProducts.mockReturnValue({
      items: [ITEM],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll: jest.fn(),
    });
    render(<SavedScreen />);
    expect(screen.getByText('카라무쵸 감자칩')).toBeTruthy();
    expect(screen.getByText('약 ¥150')).toBeTruthy();
  });

  it('전체삭제 버튼은 저장 상품이 1개 이상일 때만 노출된다', () => {
    // 비어있을 때: 미노출
    mockUseSavedProducts.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll: jest.fn(),
    });
    const { rerender } = render(<SavedScreen />);
    expect(screen.queryByText('전체삭제')).toBeNull();

    // 1개 이상: 노출
    mockUseSavedProducts.mockReturnValue({
      items: [ITEM],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll: jest.fn(),
    });
    rerender(<SavedScreen />);
    expect(screen.getByText('전체삭제')).toBeTruthy();
  });

  it('전체삭제 탭 → 확인 팝업의 "전체 삭제" 확정 시 removeAll 호출', () => {
    const removeAll = jest.fn().mockResolvedValue(undefined);
    mockUseSavedProducts.mockReturnValue({
      items: [ITEM],
      loading: false,
      error: null,
      remove: jest.fn(),
      removeAll,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<SavedScreen />);
    fireEvent.press(screen.getByText('전체삭제'));

    // 확인 팝업이 떴는지(파괴적 작업 §5 — 즉시 삭제 금지)
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const call = alertSpy.mock.calls[0]!;
    const title = call[0];
    const buttons = call[2];
    expect(title).toBe('전체 삭제');
    expect(removeAll).not.toHaveBeenCalled(); // 팝업만 떴고 아직 삭제 안 함

    // 확정 버튼('전체 삭제', destructive)을 눌러야 실제 삭제
    const confirm = (buttons as Array<{ text?: string; onPress?: () => void }>).find(
      (b) => b.text === '전체 삭제',
    );
    confirm?.onPress?.();
    expect(removeAll).toHaveBeenCalledTimes(1);
  });
});
