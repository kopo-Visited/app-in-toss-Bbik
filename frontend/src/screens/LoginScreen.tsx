import {
  SafeAreaView,
  ScrollView,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLogin } from '../hooks/useLogin';

/**
 * S-1 로그인 (login, F-001) — _web-reference/src/screens/LoginScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   SafeAreaView→SafeAreaView, 바깥 스크롤 div→ScrollView,
 *   span→Text, img→Image, onClick→onPress(Pressable), objectFit:"fill"→resizeMode:"stretch".
 * 이미지는 원본 외부 URL 그대로(약 30일 후 만료될 수 있음).
 */
export function LoginScreen() {
  const { login, loading } = useLogin();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 로고 이미지: 원본은 height:94만 지정. RN Image는 width 없으면 0이 될 수 있어
            resizeMode:'contain' + 충분한 width(220)로 비율 유지하며 표시 (시각 결과 동일 목표). */}
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image
          source={{ uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/bnt06rj8_expires_30_days.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image
          source={{ uri: 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/ye4z00k4_expires_30_days.png' }}
          style={styles.icon}
          resizeMode="stretch"
        />
        <Text style={styles.title}>{'삑 (Bbik)'}</Text>
        <Text style={styles.subtitle}>{'일본 상품 바코드를 스캔하면\n한국어로 알려드려요'}</Text>

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
    paddingBottom: 84,
  },
  logo: {
    width: 220,
    height: 94,
    marginBottom: 171,
  },
  icon: {
    width: 106,
    height: 106,
    marginBottom: 31,
  },
  title: {
    color: '#333D4B',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 31,
  },
  subtitle: {
    color: '#6B7684',
    fontSize: 17,
    textAlign: 'center',
    width: 199,
    marginBottom: 120,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingTop: 17,
    paddingBottom: 17,
    marginBottom: 28,
    marginLeft: 23,
    marginRight: 23,
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
