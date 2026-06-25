import { renderHook, act, waitFor } from '@testing-library/react-native';

/**
 * useBarcodeScan 단위 테스트 (회귀 방지).
 *
 * 핵심: openCamera 는 반드시 `base64: true` 로 호출돼야 한다.
 *   앱인토스 openCamera 타입상 dataUri 는 base64 옵션이 true 일 때만 Base64 문자열이고,
 *   false 면 base64 가 아닌 데이터/파일 URI 참조라 백엔드 디코드가 항상 실패한다.
 *   (실제로 이 한 줄이 false 여서 카메라 바코드 인식이 계속 실패했음.)
 *
 * 외부 의존(openCamera/products api/navigation)은 전부 mock → 실호출 0.
 */

const mockNavigate = jest.fn();
const mockOpenCamera = jest.fn();
const mockGetPermission = jest.fn();
const mockOpenPermissionDialog = jest.fn();
const mockDecodeBarcode = jest.fn();
const mockLookupProduct = jest.fn();

jest.mock('@granite-js/react-native', () => ({
  __esModule: true,
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@apps-in-toss/framework', () => {
  const openCamera = (...args: unknown[]) => mockOpenCamera(...args);
  openCamera.getPermission = (...args: unknown[]) => mockGetPermission(...args);
  openCamera.openPermissionDialog = (...args: unknown[]) =>
    mockOpenPermissionDialog(...args);
  class OpenCameraPermissionError extends Error {}
  return { __esModule: true, openCamera, OpenCameraPermissionError };
});

jest.mock('../../src/api/products', () => ({
  __esModule: true,
  decodeBarcode: (...args: unknown[]) => mockDecodeBarcode(...args),
  lookupProduct: (...args: unknown[]) => mockLookupProduct(...args),
}));

import { useBarcodeScan } from '../../src/hooks/useBarcodeScan';

describe('useBarcodeScan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermission.mockResolvedValue('granted');
  });

  it('openCamera 를 base64: true 로 호출한다 (이게 false 면 디코드가 항상 실패)', async () => {
    mockOpenCamera.mockResolvedValue({
      id: '1',
      dataUri: 'data:image/jpeg;base64,QUJD',
    });
    mockDecodeBarcode.mockResolvedValue('4901234567894');
    mockLookupProduct.mockResolvedValue({
      kind: 'found',
      product: { barcode: '4901234567894' },
      scanHistoryId: 's1',
    });

    const { result } = renderHook(() => useBarcodeScan());
    await act(async () => {
      await result.current.scan();
    });

    expect(mockOpenCamera).toHaveBeenCalledTimes(1);
    // base64:true(디코드 필수) + maxWidth:720(업로드 페이로드 축소 — 디코드엔 충분)
    expect(mockOpenCamera.mock.calls[0][0]).toMatchObject({
      base64: true,
      maxWidth: 720,
    });
  });

  it('촬영한 dataUri 를 decodeBarcode 로 넘기고, found 면 /result 로 이동한다', async () => {
    mockOpenCamera.mockResolvedValue({
      id: '1',
      dataUri: 'data:image/jpeg;base64,QUJD',
    });
    mockDecodeBarcode.mockResolvedValue('4901234567894');
    const product = { barcode: '4901234567894' };
    mockLookupProduct.mockResolvedValue({
      kind: 'found',
      product,
      scanHistoryId: 's1',
    });

    const { result } = renderHook(() => useBarcodeScan());
    await act(async () => {
      await result.current.scan();
    });

    expect(mockDecodeBarcode).toHaveBeenCalledWith({
      uri: 'data:image/jpeg;base64,QUJD',
    });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/result', { product }),
    );
  });

  it('촬영 취소(dataUri 없음) 시 디코드/이동을 하지 않는다', async () => {
    mockOpenCamera.mockResolvedValue({ id: '1', dataUri: '' });

    const { result } = renderHook(() => useBarcodeScan());
    await act(async () => {
      await result.current.scan();
    });

    expect(mockDecodeBarcode).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
