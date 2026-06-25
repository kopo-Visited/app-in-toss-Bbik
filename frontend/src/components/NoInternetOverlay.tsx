import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { HomeTopNavBar } from './HomeTopNavBar';
import { WifiSlashIcon } from './WifiSlashIcon';

/**
 * 전체화면 인터넷 연결 오류 오버레이 (라우트 아님).
 * 상단 내비바 + wifi-slash 아이콘(SVG) + 안내 문구 + 다시시도 버튼.
 *
 * 이 오버레이는 nav 컨텍스트가 있는 화면(Scan/Capture/ManualInput) 안에서만 렌더되므로
 * useNavigation 사용이 안전하다. 바가 상단을 차지하고, 콘텐츠는 남은 영역에서 세로 중앙 정렬.
 */
export function NoInternetOverlay({ onRetry }: { onRetry: () => void }) {
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
      <HomeTopNavBar onBack={goBack} onClose={goHome} onHeart={noop} onMore={noop} />

      <View style={styles.center}>
        <View style={styles.iconBox}>
          <WifiSlashIcon size={130} />
        </View>

        <Text style={styles.message}>{'인터넷 연결이 불안정해요\n잠시 후 다시 시도해주세요'}</Text>

        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>{'다시시도'}</Text>
        </Pressable>
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
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
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
