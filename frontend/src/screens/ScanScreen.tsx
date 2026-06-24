// TODO(보류): Granite 바코드 스캔 수단 미확정 → 실제 디코드 미구현. 현재는 직접입력 유도 셸.
//   vision-camera Granite 검증/팀확인 후 구현.
import { SafeAreaView, View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@granite-js/react-native';

/**
 * S-3 바코드 스캔(다크 뷰파인더 셸) — _web-reference/src/screens/ScanScreen.tsx 기준.
 * 가짜 상태바·토스 내비바(하트/점/X)는 생략(이전 단계 정책). 색·치수는 원본 1순위 그대로.
 * 자동 디코드는 보류 상태라 가이드 박스 탭 시 안내, 하단 버튼으로 직접 입력 유도.
 */
// 바코드 막대 근사 폭(원본 SVG 바코드 아이콘 대체). // TODO(빌드): 원본 바코드 SVG → react-native-svg/TDS Icon 교체 검토.
const BARS = [3, 2, 4, 2, 3, 5, 2, 3];

export function ScanScreen() {
  const navigation = useNavigation();

  const close = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 좌상단 닫기(원본 흰 뒤로 화살표 근사) */}
      <Pressable onPress={close} style={styles.closeButton}>
        <Text style={styles.closeIcon}>{'✕'}</Text>
      </Pressable>

      <View style={styles.center}>
        {/* 가이드 박스(원본 331x184). 탭 시 자동 인식 준비 중 안내. */}
        <Pressable
          onPress={() =>
            Alert.alert(
              '바코드 자동 인식 준비 중',
              "자동 스캔은 준비 중이에요.\n'바코드 직접 입력기'로 입력해주세요.",
            )
          }
          style={styles.guideBox}
        >
          <View style={styles.barcodeRow}>
            {BARS.map((w, i) => (
              <View key={i} style={[styles.bar, { width: w }]} />
            ))}
          </View>
        </Pressable>

        <Text style={styles.guideText}>{'바코드를 사각형 안에 맞춰주세요'}</Text>
      </View>

      {/* 하단: 바코드 직접 입력기 */}
      <Pressable onPress={() => navigation.navigate('/manual-input')} style={styles.manualButton}>
        <Text style={styles.manualText}>{'바코드 직접 입력기'}</Text>
      </Pressable>
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
