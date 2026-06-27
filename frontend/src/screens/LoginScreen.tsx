import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useLogin } from '../hooks/useLogin';

/**
 * S-1 로그인 (login, F-001) — 사용자 제공 Figma export 기준으로 재구성.
 * 핵심: 중앙 일러스트를 bbik-logo.png(이미지) → 바코드 스캔 SVG로 교체.
 *
 * 구성(위→아래): 상단 내비바(HomeTopNavBar) → 바코드 스캔 일러스트 → "삑 (Bbik)" 타이틀 → 부제
 *   → (여백) → CTA "토스로 시작하기"(login/loading 유지) → 푸터.
 * 색·치수는 export 값 1순위. iOS 가짜 상태바는 넣지 않음(SafeAreaView가 처리).
 */

/** 바코드 스캔 일러스트 — 회색 프레임(#D1D6DB) 4모서리 + 파란 막대(#3182F6) 4개. */
function BarcodeScanIllustration() {
  return (
    <Svg width={106} height={88} viewBox="0 0 106 89" fill="none">
      {/* 프레임 4모서리 (#D1D6DB) */}
      <Path
        d="M90.1 0H79.0583C76.8633 0 75.0833 1.77992 75.0833 3.975C75.0833 6.17008 76.8633 7.95 79.0583 7.95H90.1C94.4902 7.95 98.05 11.5098 98.05 15.9V22.525C98.05 24.7201 99.8299 26.5 102.025 26.5C104.22 26.5 106 24.7201 106 22.525V15.9C106 7.11967 98.8803 0 90.1 0Z"
        fill="#D1D6DB"
      />
      <Path
        d="M3.975 26.5C6.17008 26.5 7.95 24.7201 7.95 22.525V15.9C7.95 11.5098 11.5098 7.95 15.9 7.95H26.9417C29.1367 7.95 30.9167 6.17008 30.9167 3.975C30.9167 1.77992 29.1367 0 26.9417 0H15.9C7.11967 0 0 7.11967 0 15.9V22.525C0 24.7201 1.77992 26.5 3.975 26.5Z"
        fill="#D1D6DB"
      />
      <Path
        d="M102.025 61.8333C99.8299 61.8333 98.05 63.6132 98.05 65.8083V72.4333C98.05 76.8235 94.4902 80.3833 90.1 80.3833H79.0583C76.8633 80.3833 75.0833 82.1632 75.0833 84.3583C75.0833 86.5534 76.8633 88.3333 79.0583 88.3333H90.1C98.8803 88.3333 106 81.2136 106 72.4333V65.8083C106 63.6132 104.22 61.8333 102.025 61.8333Z"
        fill="#D1D6DB"
      />
      <Path
        d="M26.9417 80.3833H15.9C11.5098 80.3833 7.95 76.8235 7.95 72.4333V65.8083C7.95 63.6132 6.17008 61.8333 3.975 61.8333C1.77992 61.8333 0 63.6132 0 65.8083V72.4333C0 81.2136 7.11967 88.3333 15.9 88.3333H26.9417C29.1367 88.3333 30.9167 86.5534 30.9167 84.3583C30.9167 82.1632 29.1367 80.3833 26.9417 80.3833Z"
        fill="#D1D6DB"
      />
      {/* 막대 4개 (#3182F6) */}
      <Path
        d="M31.4599 19.9545H20.5993C18.6251 19.9545 17.0218 21.783 17.0218 24.0355V64.3774C17.0218 66.6299 18.6207 68.4584 20.5993 68.4584H31.4599C33.4342 68.4584 35.0374 66.6299 35.0374 64.3774V24.0355C35.0374 21.783 33.4386 19.9545 31.4599 19.9545Z"
        fill="#3182F6"
      />
      <Path
        d="M62.8933 19.9545H59.3158C57.3416 19.9545 55.7383 21.783 55.7383 24.0355V64.3774C55.7383 66.6299 57.3372 68.4584 59.3158 68.4584H62.8933C64.8676 68.4584 66.4708 66.6299 66.4708 64.3774V24.0355C66.4708 21.783 64.872 19.9545 62.8933 19.9545Z"
        fill="#3182F6"
      />
      <Path
        d="M45.2929 19.9545C43.3187 19.9545 41.7154 21.783 41.7154 24.0355V64.3774C41.7154 66.6299 43.3143 68.4584 45.2929 68.4584C47.2716 68.4584 48.8704 66.6299 48.8704 64.3774V24.0355C48.8704 21.783 47.2716 19.9545 45.2929 19.9545Z"
        fill="#3182F6"
      />
      <Path
        d="M85.4007 68.4584C87.3749 68.4584 88.9782 66.6299 88.9782 64.3774V24.0355C88.9782 21.783 87.3793 19.9545 85.4007 19.9545H76.8323C74.8581 19.9545 73.2548 21.783 73.2548 24.0355V64.3774C73.2548 66.6299 74.8537 68.4584 76.8323 68.4584H85.4007Z"
        fill="#3182F6"
      />
    </Svg>
  );
}

export function LoginScreen() {
  const { login, loading } = useLogin();

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.content}>
        {/* 상단: 바코드 스캔 일러스트 + 타이틀 + 부제 */}
        <View style={styles.hero}>
          <View style={styles.illustration}>
            <BarcodeScanIllustration />
          </View>
          <Text style={styles.title}>{'삑 (Bbik)'}</Text>
          <Text style={styles.subtitle}>
            {'일본 상품 바코드를 스캔하면\n한국어로 알려드려요'}
          </Text>
        </View>

        {/* 하단: CTA 버튼 + 푸터 */}
        <View style={styles.cta}>
          <Pressable
            onPress={login}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{'토스로 시작하기'}</Text>
            )}
          </Pressable>
          <Text style={styles.footer}>{'토스계정으로 간편하게 시작해요'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 23,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  // 일러스트+타이틀+부제 그룹을 화면 상·중단에 배치(export 세로 비율 느낌).
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    marginBottom: 31,
  },
  title: {
    color: '#333D4B',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    color: '#6B7684',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  cta: {
    alignItems: 'center',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingVertical: 17,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  footer: {
    color: '#6B7684',
    fontSize: 15,
  },
});
