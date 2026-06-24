import { View, Text, Pressable, StyleSheet } from 'react-native';

/**
 * 전체화면 인터넷 연결 오류 오버레이 (라우트 아님).
 * wifi-off 아이콘(근사) + 안내 문구 + 다시시도 버튼.
 */
export function NoInternetOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.overlay}>
      {/* TODO(빌드): wifi-off 아이콘 — 원본 인라인 SVG(파란 wifi #3182F6 + 빨간 슬래시 #EC4452) → react-native-svg/TDS Icon으로 교체 검토. 현재 이모지+슬래시 근사. */}
      <View style={styles.iconBox}>
        <Text style={styles.iconEmoji}>{'📶'}</Text>
        <View style={styles.iconSlash} />
      </View>

      <Text style={styles.message}>{'인터넷 연결이 불안정해요\n잠시 후 다시 시도해주세요'}</Text>

      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>{'다시시도'}</Text>
      </Pressable>
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
  iconBox: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 64,
  },
  iconSlash: {
    position: 'absolute',
    width: 150,
    height: 3,
    backgroundColor: '#EC4452',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    color: '#6B7684',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
    textAlign: 'center',
    marginTop: 24,
  },
  retryButton: {
    alignSelf: 'stretch',
    marginLeft: 20,
    marginRight: 20,
    marginTop: 40,
    minHeight: 56,
    backgroundColor: '#3182F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
