import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { useBarcodeScan } from '../hooks/useBarcodeScan';
import { useToast } from '../hooks/useToast';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NoInternetOverlay } from '../components/NoInternetOverlay';
import { Toast } from '../components/Toast';

/**
 * S-3 바코드 스캔(다크 뷰파인더) — _web-reference/src/screens/ScanScreen.tsx 기준.
 * 색·치수는 원본 1순위 그대로. 가짜 상태바·토스 내비바는 생략(이전 단계 정책).
 *
 * 앱인토스는 실시간 스캐너가 없어 `openCamera`(사진 촬영)만 쓴다. (useBarcodeScan)
 * 가이드 박스/하단 버튼 탭 → 권한 확인 → 촬영 → 백엔드 디코드 → lookup(F-003).
 * 디코드 성공 시 성공 토스트 후 결과로 이동, 미검출/실패는 직접입력(/manual-input) 폴백.
 */
// 바코드 막대 근사 폭(원본 SVG 바코드 아이콘 대체). // TODO(빌드): 원본 바코드 SVG → react-native-svg/TDS Icon 교체 검토.
const BARS = [3, 2, 4, 2, 3, 5, 2, 3];

export function ScanScreen() {
  const navigation = useNavigation();
  const { scan, loading, networkError } = useBarcodeScan();
  const { message, show } = useToast();

  const close = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  // F-002 5단계: 인식 성공 시 Toast로 성공 메시지를 띄운 뒤 조회(F-003)로 이동.
  const onScan = () => scan(() => show('바코드를 인식했어요'));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 좌상단 닫기(원본 흰 뒤로 화살표 근사) */}
      <Pressable onPress={close} style={styles.closeButton}>
        <Text style={styles.closeIcon}>{'✕'}</Text>
      </Pressable>

      <View style={styles.center}>
        {/* 가이드 박스(원본 331x184). 탭 시 촬영→디코드 시작. */}
        <Pressable onPress={onScan} style={styles.guideBox}>
          <View style={styles.barcodeRow}>
            {BARS.map((w, i) => (
              <View key={i} style={[styles.bar, { width: w }]} />
            ))}
          </View>
        </Pressable>

        <Text style={styles.guideText}>{'바코드를 사각형 안에 맞춰 촬영해주세요'}</Text>
      </View>

      {/* 하단: 바코드 직접 입력기 */}
      <Pressable onPress={() => navigation.navigate('/manual-input')} style={styles.manualButton}>
        <Text style={styles.manualText}>{'바코드 직접 입력기'}</Text>
      </Pressable>

      {loading ? <LoadingOverlay message={'바코드를 인식하는 중...'} /> : null}
      {networkError ? <NoInternetOverlay onRetry={onScan} /> : null}
      <Toast message={message} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(2, 9, 19, 0.91)',
  },
  closeButton: {
    position: 'absolute',
    left: 6,
    top: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: 331,
    height: 184,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 60,
    backgroundColor: '#B0B8C1',
    marginHorizontal: 2,
  },
  guideText: {
    marginTop: 24,
    color: '#F9FAFB',
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  manualButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    minHeight: 56,
    backgroundColor: '#4E5968',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
