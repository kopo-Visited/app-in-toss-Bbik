import { View, Text, StyleSheet } from 'react-native';

/**
 * 하단 검은 토스트 (메시지 + ✓). message가 null이면 렌더하지 않는다.
 * position:'absolute' 라 부모 위치와 무관하게 화면 하단 중앙에 고정된다.
 */
export function Toast({ message }: { message: string | null }) {
  if (message == null) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.check}>{'✓'}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
  },
  check: {
    color: '#FFFFFF',
    marginRight: 6,
  },
  message: {
    color: '#FFFFFF',
  },
});
