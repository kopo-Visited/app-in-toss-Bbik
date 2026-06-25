import {
  SafeAreaView,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { HomeTopNavBar } from '../components/HomeTopNavBar';
import { useAuthGate } from '../hooks/useAuthGate';

/**
 * S-2 메인/홈 (home, F-002) — 사용자 제공 Figma export(/tmp/home-figma-export.tsx)대로 재구성.
 *
 * 구성(위→아래): 상단 내비바(뒤로/삑로고+이름/하트/더보기/구분선/닫기) → 상단 인사
 *   ("안녕하세요"/"무엇을 스캔해볼까요?", 디자인 스펙 S-2) → 바코드 일러스트 → 안내문구
 *   → 스캔/저장 버튼(하단). 색·치수는 export/디자인토큰 1순위.
 *
 * 제외: 가짜 iOS 상태바(iOSStatusbariPhoneXornewer) — 진짜 상태바와 중복이라 SafeAreaView가 처리.
 *
 * 상단 바는 화면 내부 컴포넌트(HomeTopNavBar)로 렌더. pages/index.tsx의 headerShown:false 유지
 *   (사유는 HomeTopNavBar.tsx 주석 참조 — 네이티브 헤더/accessoryButton API로는 export 재현 불가).
 */
export function HomeScreen() {
  const navigation = useNavigation();
  // 로그인 게이트: 미로그인이면 /login으로 보내고(useAuthGate 내부), 그동안 홈 본문은 렌더하지 않는다.
  const { authed } = useAuthGate();

  // ScanScreen close 패턴과 동일: 스택 있으면 뒤로, 없으면 홈.
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  // 하트/더보기는 export에 동작 명세 없음 → 임의 기능 만들지 않고 no-op.
  // TODO: 하트(찜)·더보기(메뉴) 동작 명세 확정 시 연결.
  const noop = () => {};

  // 미로그인: 로그인 화면으로 리다이렉트 진행 중 → 홈 본문을 그리지 않아 번쩍임을 막는다.
  if (!authed) {
    return <SafeAreaView style={styles.safeArea} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeTopNavBar
        logoSource={require('../../bbik-logo.png')}
        onBack={goBack}
        onClose={goBack}
        onHeart={noop}
        onMore={noop}
      />

      <View style={styles.body}>
        {/* 상단 인사 (디자인 스펙 S-2 "상단 인사"): "안녕하세요"(큰 글씨) + "무엇을 스캔해볼까요?" */}
        <View style={styles.greeting}>
          <Text style={styles.greetingHello}>{'안녕하세요'}</Text>
          <Text style={styles.greetingQuestion}>{'무엇을 스캔해볼까요?'}</Text>
        </View>

        {/* 바코드 스캔 일러스트 — 만료 외부 URL(f9laddj5)을 동일 이미지 로컬 에셋으로 교체. */}
        <Image
          source={require('../../home-barcode-illust.png')}
          style={styles.hero}
          resizeMode="stretch"
        />
        <Text style={styles.guide}>{'일본 상품 바코드를 찍어보세요'}</Text>

        {/* 신축 스페이서로 버튼을 화면 하단으로 밀어냄. */}
        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={() => navigation.navigate('/scan')}
            style={styles.scanButton}
          >
            <Text style={styles.scanButtonText}>{'스캔하기'}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('/saved')}
            style={styles.savedButton}
          >
            <Text style={styles.savedButtonText}>{'저장목록'}</Text>
          </Pressable>
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
  body: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  greeting: {
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  greetingHello: {
    color: '#191F28',
    fontSize: 28,
    fontWeight: '700',
  },
  greetingQuestion: {
    color: '#4E5968', // TDS grey700
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16, // "안녕하세요"와 줄 간격(공백)
  },
  hero: {
    width: 239,
    height: 217,
    // 인사 아래, 일러스트를 조금 더 아래로.
    marginTop: 72,
    marginBottom: 24,
  },
  guide: {
    color: '#8B95A1',
    fontSize: 19,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingVertical: 17,
    marginBottom: 4,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  savedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(49, 130, 246, 0.16)',
    borderRadius: 16,
    paddingVertical: 17,
  },
  savedButtonText: {
    color: '#2272EB',
    fontSize: 17,
  },
});
