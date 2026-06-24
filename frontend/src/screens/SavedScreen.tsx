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

// TODO: 로컬 에셋화 (만료 URL)
const ROW_ICON =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/eofnlaqp_expires_30_days.png';
const TRASH_ICON =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/e7ufhp8v_expires_30_days.png';
const BOOKMARK_ICON =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/noj3a7ap_expires_30_days.png';
const HEADER_IMG =
  'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/cvmz905x_expires_30_days.png';

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
      {/* 상단 바 이미지 뒤로 화살표 위치에 투명 버튼 */}
      <Pressable onPress={goBack} style={styles.backButton} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image source={{ uri: HEADER_IMG }} style={styles.header} resizeMode="stretch" />
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
                  <Image source={{ uri: TRASH_ICON }} style={styles.trashIcon} />
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
        {/* TODO: 로컬 에셋화 (만료 URL) */}
        <Image source={{ uri: BOOKMARK_ICON }} style={styles.bookmark} resizeMode="stretch" />
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
    zIndex: 20,
  },
  scrollContent: {
    paddingBottom: 388,
  },
  header: {
    width: '100%',
    height: 94,
    marginBottom: 16,
  },
  title: {
    color: '#031228',
    fontSize: 22,
    fontWeight: 'bold',
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
