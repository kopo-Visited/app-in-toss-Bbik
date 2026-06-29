import { View, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

/**
 * 저장목록 빈 상태(저장한 상품이 없어요) 북마크 아이콘 — 앱빌더 export Iconbookmarkmono… 그대로.
 * 로컬 PNG(기기 미렌더) 대신 react-native-svg. 컨테이너 66x83, Svg 47x66(인셋). fill #ACB6C0.
 */
export function BookmarkIcon() {
  return (
    <View style={styles.container}>
      <Svg style={styles.vector} width="47" height="66" viewBox="0 0 47 66" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 4.15C0 1.72917 1.375 0 3.3 0H43.45C45.375 0 46.75 1.72917 46.75 4.15V63.6333C46.75 65.3625 45.375 66.4 44.275 65.3625L25.025 51.5292C23.925 50.8375 22.825 50.8375 21.725 51.5292L2.475 65.3625C1.375 66.0542 0 65.0167 0 63.6333V4.15Z"
          fill="#ACB6C0"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 66,
    height: 83,
  },
  vector: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
});
