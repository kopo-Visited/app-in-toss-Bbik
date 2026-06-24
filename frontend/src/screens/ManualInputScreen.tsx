import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';

/**
 * S-3a 바코드 직접 입력 (manual-input, F-003-E6) —
 * _web-reference/src/screens/ManualInputScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   div→View/SafeAreaView, span→Text, input→TextInput, onClick→onPress(Pressable),
 *   objectFit:"fill"→resizeMode:"stretch".
 * 이 단계는 검증 + UI만. lookup(F-003) 연결은 Step 8 — submit은 TODO.
 */

// TODO: 로컬 에셋화 (만료 URL)
const HEADER_IMG =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/3wby27ee_expires_30_days.png';

export function ManualInputScreen() {
  const navigation = useNavigation();
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
    // TODO(Step 8): F-003 lookup 연결 — 입력 바코드로 조회 →
    //   성공 시 navigation.navigate('/result', { product }),
    //   PRODUCT_NOT_FOUND(nextAction CAPTURE_PRODUCT_IMAGE) 시
    //   navigation.navigate('/capture', { barcode: code, scanHistoryId }).
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 바 이미지의 뒤로 화살표 위치에 투명 버튼 */}
      <Pressable onPress={goBack} style={styles.backButton} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image source={{ uri: HEADER_IMG }} style={styles.header} resizeMode="stretch" />

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
    zIndex: 20,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    width: '100%',
    height: 94,
    marginBottom: 24,
  },
  titleWrap: {
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
