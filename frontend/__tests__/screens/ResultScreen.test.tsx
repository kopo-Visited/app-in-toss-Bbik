import React from 'react';
import { render, screen } from '@testing-library/react-native';

/**
 * ResultScreen 스모크 테스트.
 * - @granite-js/react-native(useNavigation): 가짜.
 * - useResultActions: 내부 save/share(api + setClipboardText) 실호출 → mock.
 * - useToast: 가짜.
 * 더미 product param을 주입해 상품명·가격(라쿠텐 참고가 변형)이 렌더되는지만 확인.
 */

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({
    navigate: jest.fn(),
    canGoBack: () => false,
    goBack: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useResultActions', () => ({
  __esModule: true,
  useResultActions: () => ({ save: jest.fn(), share: jest.fn() }),
}));

jest.mock('../../src/hooks/useToast', () => ({
  __esModule: true,
  useToast: () => ({ message: null, show: jest.fn() }),
}));

import { ResultScreen } from '../../src/screens/ResultScreen';
import type { Product } from '../../src/lib/product';

const product: Product = {
  barcode: '4901234567894',
  nameOriginal: 'カラムーチョ',
  nameKo: '카라무쵸 감자칩',
  brandNameOriginal: 'コイケヤ',
  brandNameKo: '코이케야',
  price: 150,
  imageUrl: null,
  lookupType: 'barcode',
};

describe('ResultScreen (S-5 결과)', () => {
  it('더미 product 주입 시 상품명·가격이 렌더된다 (barcode 변형)', () => {
    render(<ResultScreen product={product} />);
    expect(screen.getByText('카라무쵸 감자칩')).toBeTruthy();
    expect(screen.getByText('カラムーチョ')).toBeTruthy();
    // 비AI + 가격 있음 → "라쿠텐 참고가" 라벨 + 포맷된 가격.
    expect(screen.getByText('라쿠텐 참고가')).toBeTruthy();
    expect(screen.getByText('약 ¥150')).toBeTruthy();
    // 저장/공유 버튼 존재.
    expect(screen.getByText('저장')).toBeTruthy();
    expect(screen.getByText('공유')).toBeTruthy();
  });
});
