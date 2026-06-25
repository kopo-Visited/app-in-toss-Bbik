import { SafeAreaView, View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { openCamera } from '@apps-in-toss/framework';
import { useImageAnalyze } from '../hooks/useImageAnalyze';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NoInternetOverlay } from '../components/NoInternetOverlay';

/**
 * S-4 상품 촬영(다크, 조회 실패 폴백) — _web-reference/src/screens/CaptureScreen.tsx 기준.
 * 가짜 상태바·토스 내비바 생략(이전 단계 정책). 색·치수는 원본 1순위 그대로.
 * 셔터 → openCamera(사진) → analyze-image → /result(keyword|ai).
 */
export function CaptureScreen({
  barcode,
  scanHistoryId,
}: {
  barcode?: string;
  scanHistoryId?: string;
}) {
  const navigation = useNavigation();
  const { run, loading, networkError } = useImageAnalyze();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  const onShutter = async () => {
    if (!barcode || !scanHistoryId) {
      Alert.alert('다시 시도', '바코드 정보가 없어요. 처음부터 다시 시도해주세요.');
      return;
    }
    try {
      // ⚠️ base64: true 필수 — false면 dataUri 가 base64 가 아니어서 백엔드 이미지 디코드가 실패한다.
      const image = await openCamera({ base64: true, maxWidth: 1024 });
      if (!image?.dataUri) {
        return;
      }
      await run({ uri: image.dataUri, barcode, scanHistoryId });
    } catch {
      // 권한 거부/취소 등
      // TODO(빌드): 권한 거부 UX(openCamera.openPermissionDialog) 정교화
      Alert.alert('카메라', '카메라를 사용할 수 없어요. 권한을 확인해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 좌상단 뒤로(원본 흰 뒤로 화살표 근사) */}
      <Pressable onPress={goBack} style={styles.backButton}>
        <Text style={styles.backIcon}>{'‹'}</Text>
      </Pressable>

      <View style={styles.center}>
        {/* 가이드 박스(원본 238x235) + 카메라 아이콘 근사 */}
        <View style={styles.guideBox}>
          {/* TODO(빌드): 원본 카메라 SVG → react-native-svg/TDS Icon 교체 검토. */}
          <Text style={styles.cameraIcon}>{'📷'}</Text>
        </View>

        <Text style={styles.guideText}>{'상품명과 브랜드명이\n잘 보이게 찍어주세요'}</Text>
      </View>

      {/* 셔터 */}
      <Pressable onPress={onShutter} style={styles.shutter} />

      {loading ? <LoadingOverlay message={'상품을 분석하는 중...'} /> : null}
      {networkError ? <NoInternetOverlay onRetry={onShutter} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(2, 9, 19, 0.91)',
  },
  backButton: {
    position: 'absolute',
    left: 6,
    top: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: 238,
    height: 235,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 56,
  },
  guideText: {
    marginTop: 24,
    color: '#F9FAFB',
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  shutter: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 40,
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});
