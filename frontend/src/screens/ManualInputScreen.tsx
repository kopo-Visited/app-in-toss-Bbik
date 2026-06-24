import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { useProductLookup } from '../hooks/useProductLookup';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NoInternetOverlay } from '../components/NoInternetOverlay';

/**
 * S-3a 바코드 직접 입력 (manual-input, F-003-E6) —
 * _web-reference/src/screens/ManualInputScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   div→View/SafeAreaView, span→Text, input→TextInput, onClick→onPress(Pressable),
 *   objectFit:"fill"→resizeMode:"stretch".
 * submit → F-003 lookup 연결(found→/result, notFound→/capture).
 */

export function ManualInputScreen() {
  const navigation = useNavigation();
  const { run, loading, networkError } = useProductLookup();
  const [code, setCode] = useState('');
  const canSubmit = code.length === 13 || code.length === 8; // JAN-13 / JAN-8

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    run(code);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 좌상단 뒤로가기(네이티브). 가짜 상태바가 박힌 배너 이미지는 제거 — ScanScreen 정책과 동일. */}
      <Pressable
        onPress={goBack}
        style={styles.backButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
      >
        <Text style={styles.backIcon}>{'‹'}</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 큰 제목 */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{'바코드 직접 입력'}</Text>
        </View>

        {/* 안내 문구 */}
        <Text style={styles.guide}>
          {'상품 바코드 숫자를 입력해주세요\n(JAN-13 또는 JAN-8)'}
        </Text>

        {/* 입력칸 + 헬퍼 */}
        <View style={styles.inputWrap}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 13))}
            keyboardType="number-pad"
            placeholder="바코드 숫자 입력"
            placeholderTextColor="#8B95A1"
            style={styles.input}
          />
          <Text style={styles.helper}>{`13자리 숫자 (${code.length}/13)`}</Text>
        </View>
      </ScrollView>

      {/* 하단 CTA: 조회하기 */}
      <View style={styles.ctaWrap}>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.cta, { opacity: canSubmit ? 1 : 0.4 }]}
        >
          <Text style={styles.ctaText}>{'조회하기'}</Text>
        </Pressable>
      </View>

      {loading ? <LoadingOverlay /> : null}
      {networkError ? <NoInternetOverlay onRetry={() => run(code)} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    left: 6,
    top: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  backIcon: {
    color: '#333D4B',
    fontSize: 30,
    lineHeight: 30,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  titleWrap: {
    // 배너(94 + 24) 제거분을 네이티브 헤더(닫기 버튼) 높이만큼만 보존.
    marginTop: 104,
    marginLeft: 24,
    marginRight: 24,
    marginBottom: 8,
  },
  title: {
    color: '#333D4B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  guide: {
    color: '#6B7684',
    fontSize: 17,
    marginLeft: 28,
    width: 231,
  },
  inputWrap: {
    marginLeft: 28,
    marginRight: 28,
    marginTop: 28,
  },
  input: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 4,
    paddingRight: 4,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    borderBottomWidth: 2,
    borderBottomColor: '#3182F6',
  },
  helper: {
    color: '#8B95A1',
    fontSize: 13,
    marginTop: 6,
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
  },
  cta: {
    minHeight: 56,
    backgroundColor: '#3182F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
