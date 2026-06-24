// TODO(빌드): 원본 커스텀 arc 스피너(react-native-svg) → 현재 ActivityIndicator로 근사. 교체 검토.
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * 전체화면 로딩 오버레이 (라우트 아님). 스피너 + 안내 문구.
 * position:'absolute'로 화면 전체를 덮는다. message로 단계별 문구 주입 가능.
 */
export function LoadingOverlay({ message = '상품 정보를\n불러오는 중 ...' }: { message?: string }) {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#3182F6" />
      <Text style={styles.message}>{message}</Text>
    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
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
