import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@granite-js/react-native';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { formatPrice, type SavedProduct } from '../lib/product';

/**
 * S-6 저장 목록 (saved, F-005) — _web-reference/src/screens/SavedScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   SafeAreaView div→SafeAreaView, 스크롤 div→ScrollView, div→View, span→Text, img→Image,
 *   onClick→onPress(Pressable), objectFit:"fill"→resizeMode:"stretch", "cover"→"cover".
 * 데이터는 web SavedStore 대신 백엔드 API(useSavedProducts)로 대체.
 * 다이얼로그(useDialog)는 RN에 없어 Alert로 재작성.
 */

// 만료 외부 URL을 동일 이미지 로컬 에셋으로 교체. (eofnlaqp/e7ufhp8v/noj3a7ap)
const ROW_ICON = require('../../saved-row-icon.png'); // 썸네일 fallback(상품 이미지 없을 때)
const TRASH_ICON = require('../../saved-trash-icon.png');
const BOOKMARK_ICON = require('../../saved-bookmark-icon.png');

export function SavedScreen() {
  const navigation = useNavigation();
  const { items, loading, error, remove } = useSavedProducts();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };

  const handleDelete = (item: SavedProduct) => {
    Alert.alert('삭제할까요?', `${item.nameKo}을(를) 저장 목록에서 지워요.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          remove(item.id).catch(() =>
            Alert.alert('삭제 실패', '삭제에 실패했어요. 잠시 후 다시 시도해주세요.'),
          );
        },
      },
    ]);
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
        {/* TODO: 사용자 이름 바인딩(프로필 연동 후) */}
        <Text style={styles.title}>{'OO님의 저장한 상품'}</Text>

        {loading ? (
          <ActivityIndicator style={styles.loading} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <EmptyState onScan={() => navigation.navigate('/scan')} />
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate('/result', { product: item })}
              style={styles.row}
            >
              <Image
                source={item.imageUrl ? { uri: item.imageUrl } : ROW_ICON}
                style={styles.thumb}
                resizeMode="cover"
              />
              <View style={styles.rowCenter}>
                <View style={styles.textWrap}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.nameKo}
                  </Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                </View>
                <Pressable onPress={() => handleDelete(item)} style={styles.trashButton}>
                  <Image source={TRASH_ICON} style={styles.trashIcon} />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** 빈 상태: 북마크 이미지 + 문구 + 스캔하러 가기 (원본 그대로) */
function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <>
      <View style={styles.emptyIconWrap}>
        <Image source={BOOKMARK_ICON} style={styles.bookmark} resizeMode="stretch" />
      </View>
      <View style={styles.emptyTextWrap}>
        <Text style={styles.emptyText}>{'저장한 상품이 없어요'}</Text>
      </View>
      <View style={styles.emptyButtonWrap}>
        <Pressable onPress={onScan} style={styles.scanButton}>
          <Text style={styles.scanButtonText}>{'스캔하러 가기'}</Text>
        </Pressable>
      </View>
    </>
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
    color: '#031228',
    fontSize: 30,
    lineHeight: 30,
  },
  scrollContent: {
    paddingBottom: 388,
  },
  title: {
    color: '#031228',
    fontSize: 22,
    fontWeight: 'bold',
    // 배너(94 + 16) 제거분을 네이티브 헤더(닫기 버튼) 높이만큼만 보존: 콘텐츠가 버튼 아래로 자연스럽게 시작.
    marginTop: 104,
    marginBottom: 24,
    marginLeft: 24,
  },
  loading: {
    marginTop: 80,
  },
  errorText: {
    color: '#8B95A1',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 24,
    paddingRight: 24,
  },
  thumb: {
    width: 30,
    height: 30,
    marginRight: 12,
    borderRadius: 8,
    flexShrink: 0,
  },
  rowCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textWrap: {
    flexShrink: 1,
  },
  name: {
    color: '#000C1E',
    fontSize: 17,
    fontWeight: 'bold',
  },
  price: {
    color: '#00132B',
    fontSize: 13,
  },
  trashButton: {
    marginLeft: 12,
  },
  trashIcon: {
    width: 19,
    height: 19,
  },
  emptyIconWrap: {
    alignItems: 'center',
    marginTop: 106,
    marginBottom: 26,
  },
  bookmark: {
    width: 66,
    height: 83,
  },
  emptyTextWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#031228',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyButtonWrap: {
    alignItems: 'center',
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingTop: 17,
    paddingBottom: 17,
    paddingLeft: 33,
    paddingRight: 33,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
