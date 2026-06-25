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
import { HomeTopNavBar } from '../components/HomeTopNavBar';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { getUserName } from '../api/session';
import { TrashIcon } from '../components/TrashIcon';
import { BookmarkIcon } from '../components/BookmarkIcon';
import { formatPrice, type SavedProduct } from '../lib/product';

/**
 * S-6 저장 목록 (saved, F-005) — _web-reference/src/screens/SavedScreen.tsx 를 RN으로 변환.
 * 색·치수는 원본 값 1순위 그대로. 매핑:
 *   SafeAreaView div→SafeAreaView, 스크롤 div→ScrollView, div→View, span→Text, img→Image,
 *   onClick→onPress(Pressable), objectFit:"fill"→resizeMode:"stretch", "cover"→"cover".
 * 데이터는 web SavedStore 대신 백엔드 API(useSavedProducts)로 대체.
 * 다이얼로그(useDialog)는 RN에 없어 Alert로 재작성.
 */

// 썸네일 fallback(상품 이미지 없을 때). 로컬 PNG가 기기에서 렌더 안 돼 원격 URL 유지.
// TODO: 이 placeholder도 SVG/로컬화 — 현재는 거의 빈 흰 사각형이라 원격 유지.
const ROW_ICON =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/eofnlaqp_expires_30_days.png';

export function SavedScreen() {
  const navigation = useNavigation();
  const { items, loading, error, remove, removeAll } = useSavedProducts();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('/');
    }
  };
  const goHome = () => navigation.navigate('/');
  const noop = () => {};

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

  // F-005 전체 삭제 — 실수 방지를 위해 반드시 확인 팝업을 거친다(§5 다크패턴 금지/파괴적 작업 규칙).
  const handleDeleteAll = () => {
    Alert.alert('전체 삭제', '저장한 상품을 모두 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '전체 삭제',
        style: 'destructive',
        onPress: () => {
          removeAll().catch(() =>
            Alert.alert('삭제 실패', '전체 삭제에 실패했어요. 잠시 후 다시 시도해주세요.'),
          );
        },
      },
    ]);
  };

  // 디자인 스펙 S-6: 전체삭제는 저장 상품 1개 이상일 때만 노출(로딩/에러 중 제외).
  const showDeleteAll = !loading && !error && items.length >= 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeTopNavBar onBack={goBack} onClose={goHome} onHeart={noop} onMore={noop} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 로그인 응답의 name 바인딩(세션). 미확보 시 '회원'으로 폴백. */}
        <Text style={styles.title}>{`${getUserName() ?? '회원'}님의 저장한 상품`}</Text>

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
                source={{ uri: item.imageUrl || ROW_ICON }}
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
                  <TrashIcon />
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* 하단 전체삭제 — 스캔하기와 동일한 하단 풀폭 파란 버튼. 저장 상품 1개 이상일 때만 노출(스펙 S-6). */}
      {showDeleteAll ? (
        <Pressable
          onPress={handleDeleteAll}
          style={styles.deleteAllButton}
          accessibilityRole="button"
          accessibilityLabel="전체 삭제"
        >
          <Text style={styles.deleteAllText}>{'전체삭제'}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

/** 빈 상태: 북마크 이미지 + 문구 + 스캔하러 가기 (원본 그대로) */
function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <>
      <View style={styles.emptyIconWrap}>
        <BookmarkIcon />
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
  deleteAllButton: {
    // 스캔하기와 동일: 하단 고정 풀폭 토스 파란 버튼.
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 90,
    backgroundColor: '#3182F6',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  deleteAllText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  scrollContent: {
    paddingBottom: 388,
  },
  title: {
    color: '#031228',
    fontSize: 22,
    fontWeight: 'bold',
    // 상단 내비바(HomeTopNavBar, 높이 56)가 일반 흐름에서 자리를 차지하므로 여백은 최소만 둔다.
    marginTop: 16,
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
