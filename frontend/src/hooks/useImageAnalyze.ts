import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { analyzeImage } from '../api/products';
import { ApiError } from '../api/errors';

/** F-003 촬영 이미지 분석 오케스트레이션. 성공→/result(keyword|ai). */
export function useImageAnalyze() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const run = useCallback(
    async (params: { imageBase64: string; barcode: string; scanHistoryId: string }) => {
      setLoading(true);
      setNetworkError(false);
      try {
        const { product } = await analyzeImage(params);
        navigation.navigate('/result', { product });
      } catch (e) {
        if (e instanceof ApiError && e.code === 'NETWORK_ERROR') {
          setNetworkError(true);
        } else {
          Alert.alert('분석 실패', e instanceof ApiError ? e.message : '다시 촬영해주세요.');
        }
      } finally {
        setLoading(false);
      }
    },
    [navigation],
  );

  return { run, loading, networkError };
}
