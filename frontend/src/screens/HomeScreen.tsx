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

/**
 * S-2 메인/홈 (home, F-002) — 사용자 제공 Figma export(/tmp/home-figma-export.tsx)대로 재구성.
 *
 * 구성(위→아래): 상단 내비바(뒤로/삑로고+이름/하트/더보기/구분선/닫기) → 바코드 일러스트
 *   → 안내문구 → 스캔/저장 버튼(하단). 색·치수는 export 값 1순위.
 *
 * 제외: 가짜 iOS 상태바(iOSStatusbariPhoneXornewer) — 진짜 상태바와 중복이라 SafeAreaView가 처리.
 * 제거: 이전 "안녕하세요"/"무엇을 스캔해볼까요?" 인사 — export에 없음.
 *
 * 상단 바는 화면 내부 컴포넌트(HomeTopNavBar)로 렌더. pages/index.tsx의 headerShown:false 유지
 *   (사유는 HomeTopNavBar.tsx 주석 참조 — 네이티브 헤더/accessoryButton API로는 export 재현 불가).
 */
export function HomeScreen() {
  const navigation = useNavigation();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeTopNavBar
        onBack={goBack}
        onClose={goBack}
        onHeart={noop}
        onMore={noop}
      />

      <View style={styles.body}>
        {/* 바코드 스캔 일러스트 — 기존 f9laddj5 이미지(동일 그림) 그대로 사용.
            TODO: 로컬 에셋화 (외부 URL 약 30일 후 만료 가능). */}
        <Image
          source={{
            uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/f9laddj5_expires_30_days.png',
          }}
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
  hero: {
    width: 239,
    height: 217,
    // 일러스트를 화면 중앙 즈음에 배치(상단 바 아래 여유).
    marginTop: 80,
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
    marginBottom: 8,
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
