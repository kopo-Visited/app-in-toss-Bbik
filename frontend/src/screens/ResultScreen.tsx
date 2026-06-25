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
import { useResultActions } from '../hooks/useResultActions';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { formatPrice } from '../lib/product';
import type { Product } from '../lib/product';

/**
 * S-5 결과 (result, F-003/F-004/F-006) — _web-reference/src/screens/ResultScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   SafeAreaView/div→SafeAreaView·View, 스크롤 div→ScrollView, span→Text, img→Image,
 *   onClick→onPress(Pressable), objectFit:"fill"→resizeMode:"stretch", objectFit:"cover"→resizeMode:"cover".
 * 한 화면 3변형: lookupType(barcode/keyword/ai) + price(null/0/값). "라쿠텐 참고가"는 비AI+가격 있을 때만,
 * AI 안내 배너는 AI 결과일 때만 표시. SVG 정보 아이콘은 RN 불가 → View+Text 원형 근사.
 * 상품 이미지 없을 때 placeholder. 로컬 PNG가 기기에서 렌더 안 돼 원격 URL 유지.
 * TODO: placeholder SVG/로컬화 (만료 URL).
 */
const PLACEHOLDER_IMG =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/g8y00kk9_expires_30_days.png';

export function ResultScreen({ product }: { product: Product }) {
  const navigation = useNavigation();
  const { save, share } = useResultActions();
  const toast = useToast();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  const isAi = product.lookupType === 'ai';
  const hasPrice = product.price != null && product.price !== 0;
  const hasImage = product.imageUrl != null && product.imageUrl !== '';
  const brandKo = product.brandNameKo ?? product.brandNameOriginal ?? '';
  const brandJp = product.brandNameKo && product.brandNameOriginal ? ` (${product.brandNameOriginal})` : '';

  const onSave = async () => toast.show(await save(product));
  const onShare = async () => toast.show(await share(product));

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
        {/* 이미지 카드 */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: hasImage ? (product.imageUrl as string) : PLACEHOLDER_IMG }}
            style={styles.productImage}
            resizeMode={hasImage ? 'cover' : 'stretch'}
          />
        </View>

        {/* 텍스트 블록 */}
        <View style={[styles.textBlock, { marginBottom: isAi ? 24 : 139 }]}>
          <Text style={styles.nameKo}>{product.nameKo}</Text>
          <Text style={styles.nameJp}>{product.nameOriginal}</Text>
          {brandKo ? <Text style={styles.brand}>{`${brandKo}${brandJp}`}</Text> : null}
          {!isAi && hasPrice ? <Text style={styles.priceLabel}>{'라쿠텐 참고가'}</Text> : null}
          <Text style={[styles.price, { fontSize: hasPrice ? 32 : 16 }]}>{formatPrice(product.price)}</Text>
        </View>

        {/* AI 안내 배너 (AI 결과일 때만) */}
        {isAi ? (
          <View style={styles.aiBanner}>
            {/* TODO(빌드 단계): 정보 아이콘은 현재 SVG → View+Text 원형 근사.
                _web-reference 원본(인라인 SVG)과 대조해 react-native-svg 또는 TDS Icon(icn-info-line)으로 교체 검토.
                원본 SVG fill=#3182F6(아이콘) / 배너 텍스트=#007AFF — 현 구현이 원본과 일치하는지 빌드 때 재확인. */}
            {/* SVG 정보 아이콘 → View+Text 원형 근사 (불가피한 변환) */}
            <View style={styles.aiIcon}>
              <Text style={styles.aiIconText}>{'i'}</Text>
            </View>
            <Text style={styles.aiText}>{'AI 분석 기반 참고 정보예요.\n실제와 다를 수 있어요.'}</Text>
          </View>
        ) : null}

        {/* 공유 / 저장 */}
        <View style={styles.buttonRow}>
          <Pressable onPress={onShare} style={[styles.button, styles.shareButton]}>
            <Text style={styles.shareText}>{'공유'}</Text>
          </Pressable>
          <Pressable onPress={onSave} style={[styles.button, styles.saveButton]}>
            <Text style={styles.saveText}>{'저장'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Toast message={toast.message} />
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
    color: '#212529',
    fontSize: 30,
    lineHeight: 30,
  },
  scrollContent: {
    // 배너(94 + 47) 제거분을 네이티브 헤더(닫기 버튼) 높이만큼만 보존: 콘텐츠가 버튼 아래로 자연스럽게 시작.
    paddingTop: 104,
    paddingBottom: 94,
  },
  imageCard: {
    alignItems: 'center',
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    paddingTop: 46,
    paddingBottom: 46,
    marginBottom: 25,
    marginLeft: 34,
    marginRight: 34,
    overflow: 'hidden',
  },
  productImage: {
    width: 100,
    height: 100,
  },
  textBlock: {
    paddingRight: 33,
    marginLeft: 31,
    marginRight: 31,
  },
  nameKo: {
    color: '#212529',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  nameJp: {
    color: '#8B95A1',
    fontSize: 14,
    marginBottom: 7,
  },
  brand: {
    color: '#4E5968',
    fontSize: 20,
    marginBottom: 11,
  },
  priceLabel: {
    color: '#4E5968',
    fontSize: 16,
    marginBottom: 8,
  },
  price: {
    color: '#212529',
    fontWeight: '600',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 16,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 8,
  },
  aiIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiIconText: {
    color: '#3182F6',
    fontWeight: 'bold',
  },
  aiText: {
    flex: 1,
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 22,
    marginRight: 22,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingTop: 17,
    paddingBottom: 17,
  },
  shareButton: {
    backgroundColor: '#07194C0D',
    marginRight: 8,
  },
  shareText: {
    color: '#031228',
    fontSize: 17,
  },
  saveButton: {
    backgroundColor: '#3182F6',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
