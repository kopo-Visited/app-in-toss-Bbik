import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';

/**
 * S-2 메인/홈 (home, F-002) — _web-reference/src/screens/HomeScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   SafeAreaView→SafeAreaView, 스크롤 div→ScrollView, View→View,
 *   span→Text, img→Image, onClick→onPress(Pressable), objectFit:"fill"→resizeMode:"stretch".
 * 버튼만 연결: 스캔하기→/scan / 저장목록→/saved.
 * 이미지는 원본 외부 URL 그대로(약 30일 후 만료될 수 있음).
 */
export function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 로고 이미지: 원본은 height:94만 지정. RN Image는 width 없으면 0이 될 수 있어
            resizeMode:'contain' + 충분한 width(220)로 비율 유지하며 표시 (시각 결과 동일 목표). */}
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image
          source={{ uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/4h7f7fiz_expires_30_days.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image
          source={{ uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/f9laddj5_expires_30_days.png' }}
          style={styles.hero}
          resizeMode="stretch"
        />
        <Text style={styles.guide}>{'일본 상품 바코드를 찍어보세요'}</Text>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 66,
  },
  logo: {
    width: 220,
    height: 94,
    marginBottom: 204,
  },
  hero: {
    width: 239,
    height: 217,
    marginBottom: 53,
  },
  guide: {
    color: '#8B95A1',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    marginLeft: 21,
    marginRight: 21,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingTop: 17,
    paddingBottom: 17,
    marginBottom: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  savedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F626',
    borderRadius: 16,
    paddingTop: 17,
    paddingBottom: 17,
  },
  savedButtonText: {
    color: '#2272EB',
    fontSize: 17,
  },
});
