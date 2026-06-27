// TODO(빌드): 원본 커스텀 arc 스피너(react-native-svg) → 현재 ActivityIndicator로 근사. 교체 검토.
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@granite-js/react-native';

/**
 * 전체화면 로딩 오버레이 (라우트 아님). 상단 내비바 + 스피너 + 안내 문구.
 * position:'absolute'로 화면 전체를 덮는다. message로 단계별 문구 주입 가능.
 *
 * 이 오버레이는 nav 컨텍스트가 있는 화면(Scan/Capture/ManualInput) 안에서만 렌더되므로
 * useNavigation 사용이 안전하다. 바가 상단을 차지하고, 스피너+문구는 남은 영역에서 세로 중앙 정렬.
 */
export function LoadingOverlay({ message = '상품 정보를\n불러오는 중 ...' }: { message?: string }) {
  const navigation = useNavigation();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };
  const goHome = () => navigation.navigate('/');
  const noop = () => {};

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182F6" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 1000,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: 'rgba(3, 18, 40, 0.7)',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    textAlign: 'center',
    marginTop: 24,
  },
});
