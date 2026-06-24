import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { lookupProduct } from '../api/products';
import { ApiError } from '../api/errors';

/** F-003 바코드 lookup 오케스트레이션. found→/result, notFound→/capture(촬영 폴백). */
export function useProductLookup() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const run = useCallback(
    async (barcode: string) => {
      setLoading(true);
      setNetworkError(false);
      try {
        const r = await lookupProduct(barcode);
        if (r.kind === 'found') {
          navigation.navigate('/result', { product: r.product });
        } else {
          navigation.navigate('/capture', { barcode: r.barcode, scanHistoryId: r.scanHistoryId });
        }
      } catch (e) {
        if (e instanceof ApiError && e.code === 'NETWORK_ERROR') {
          setNetworkError(true);
        } else {
          Alert.alert('조회 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
        }
      } finally {
        setLoading(false);
      }
    },
    [navigation],
  );

  return { run, loading, networkError };
}
