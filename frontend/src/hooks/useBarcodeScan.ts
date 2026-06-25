import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { openCamera, OpenCameraPermissionError } from '@apps-in-toss/framework';
import { decodeBarcode, lookupProduct } from '../api/products';
import { ApiError } from '../api/errors';

/**
 * F-002 바코드 스캔 오케스트레이션.
 *
 * 앱인토스는 실시간 스캐너 API가 없어 `openCamera`(사진 촬영)만 쓸 수 있다.
 * 흐름: (권한 확인/요청) → openCamera 촬영 → decodeBarcode(이미지→숫자) → lookup(F-003).
 *  - 디코드 성공 → 성공 토스트 후 lookup: found→/result, notFound→/capture (촬영 폴백).
 *  - 미검출/디코드 실패/엔드포인트 없음(404) → 직접입력(/manual-input) 폴백 (막다른 길 X).
 *  - 카메라 권한 거부(OpenCameraPermissionError) → 권한 설정 안내 다이얼로그.
 *  - 네트워크 오류 → NoInternetOverlay 노출(networkError).
 */
export function useBarcodeScan() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // lookup 단계: found→/result, notFound→/capture. (useProductLookup과 동일한 분기)
  const lookup = useCallback(
    async (barcode: string) => {
      const r = await lookupProduct(barcode);
      if (r.kind === 'found') {
        navigation.navigate('/result', { product: r.product });
      } else {
        navigation.navigate('/capture', { barcode: r.barcode, scanHistoryId: r.scanHistoryId });
      }
    },
    [navigation],
  );

  // 직접입력 폴백 안내 후 /manual-input 이동.
  const fallbackToManual = useCallback(
    (message: string) => {
      Alert.alert('바코드 인식 실패', message, [
        { text: '직접 입력', onPress: () => navigation.navigate('/manual-input') },
        { text: '다시 시도', style: 'cancel' },
      ]);
    },
    [navigation],
  );

  /**
   * 촬영 → 디코드 → lookup 전체 흐름.
   * @param onScanned 디코드 성공 직후(lookup 이동 전) 호출. 성공 토스트 표시용.
   */
  const scan = useCallback(
    async (onScanned?: (barcode: string) => void) => {
      // 1) 카메라 권한 확인/요청.
      try {
        const status = await openCamera.getPermission();
        if (status === 'denied') {
          // 이미 거부된 상태 → 설정 유도 다이얼로그.
          await openCamera.openPermissionDialog();
          // 다이얼로그 후에도 허용 안 됐을 수 있으나, 아래 openCamera에서 다시 막힌다.
        }
      } catch {
        // 권한 조회 실패는 무시하고 촬영 시도(거부면 openCamera가 에러를 던진다).
      }

      setLoading(true);
      setNetworkError(false);
      try {
        // 2) 사진 촬영 (CaptureScreen과 동일 옵션).
        //    base64:true → dataUri가 순수 base64 문자열로 반환됨(SDK: "base64가 true면 Base64 문자열").
        //    실기기에서 멀티파트 파일 업로드가 안 돼 base64 JSON 전송으로 전환했다.
        const image = await openCamera({ base64: true, maxWidth: 1024 });
        if (!image?.dataUri) {
          // 사용자가 촬영 취소.
          return;
        }
        // 3) 백엔드 디코드 (base64 JSON 전송).
        const barcode = await decodeBarcode({ imageBase64: image.dataUri });
        // 4) 성공 토스트 후 lookup.
        onScanned?.(barcode);
        await lookup(barcode);
      } catch (e) {
        if (e instanceof OpenCameraPermissionError) {
          Alert.alert(
            '카메라 권한 필요',
            '바코드를 촬영하려면 카메라 권한이 필요해요. 설정에서 권한을 허용해주세요.',
          );
          return;
        }
        if (e instanceof ApiError && e.code === 'NETWORK_ERROR') {
          setNetworkError(true);
          return;
        }
        // 미검출/디코드 실패/엔드포인트 없음 → 직접입력 폴백.
        if (e instanceof ApiError) {
          fallbackToManual(`${e.message}\n바코드 숫자를 직접 입력해주세요.`);
          return;
        }
        // openCamera 자체 실패 등 알 수 없는 오류 → 폴백.
        fallbackToManual('바코드를 인식하지 못했어요.\n바코드 숫자를 직접 입력해주세요.');
      } finally {
        setLoading(false);
      }
    },
    [lookup, fallbackToManual],
  );

  return { scan, loading, networkError };
}
