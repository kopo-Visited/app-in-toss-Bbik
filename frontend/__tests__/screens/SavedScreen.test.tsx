import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { SavedProduct } from '../../src/lib/product';

/**
 * SavedScreen 스모크 테스트.
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

import { SavedScreen } from '../../src/screens/SavedScreen';

describe('SavedScreen (S-6 저장 목록)', () => {
  it('빈 목록이면 빈 상태 문구가 렌더된다', () => {
    mockUseSavedProducts.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      remove: jest.fn(),
    });
    render(<SavedScreen />);
    expect(screen.getByText('저장한 상품이 없어요')).toBeTruthy();
    expect(screen.getByText('스캔하러 가기')).toBeTruthy();
  });

  it('항목이 있으면 상품명이 렌더된다', () => {
    const item: SavedProduct = {
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
    mockUseSavedProducts.mockReturnValue({
      items: [item],
      loading: false,
      error: null,
      remove: jest.fn(),
    });
    render(<SavedScreen />);
    expect(screen.getByText('카라무쵸 감자칩')).toBeTruthy();
    expect(screen.getByText('약 ¥150')).toBeTruthy();
  });
});
