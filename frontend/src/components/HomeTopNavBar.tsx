import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { BbikLogo } from './BbikLogo';

/**
 * S-2 홈 상단 내비게이션 바 (Figma export: TopNavigationAppInToss).
 *
 * 왜 커스텀 바인가:
 * - 앱인토스 `useTopNavigation()`은 네이티브 헤더에 accessoryButton(아이콘 name 또는 remote uri)만
 *   추가할 수 있어, export의 커스텀 하트/더보기/구분선/닫기 SVG와 로고+이름 타이틀을 그대로 재현 불가.
 * - TDS-RN `PageNavbar`/`AccessoryIconButton`은 React Navigation 네이티브 헤더로 렌더되어
 *   `headerShown: false`(pages/index.tsx)와 충돌하고, 아이콘은 TDS 아이콘 카탈로그(name)만 받아
 *   export의 임의 SVG path·구분선을 그릴 수 없음.
 * → export 디자인을 1:1로 살리기 위해 react-native-svg(설치됨 15.15.3)로 path를 직접 그린
 *   화면 내부 바로 구현. (headerShown:false 유지)
 *
 * 색·치수는 export 값 1순위.
 */

const ICON_FILL = 'rgba(0, 19, 43, 0.58)'; // export dynamic/fixed icon (#00132B 58%)
const DIVIDER = 'rgba(0, 27, 55, 0.1)';

interface Props {
  /** 좌측 뒤로가기 */
  onBack: () => void;
  /** 우측 닫기(X) */
  onClose: () => void;
  /** 우측 하트 (동작 미정 → no-op TODO) */
  onHeart?: () => void;
  /** 우측 더보기(…) (동작 미정 → no-op TODO) */
  onMore?: () => void;
}

function BackIcon() {
  return (
    <Svg width={11} height={18} viewBox="0 0 11 18" fill="none">
      <Path
        d="M8.675 17.475C8.375 17.475 8.075 17.375 7.875 17.075L0.375 9.575C-0.125 9.075 -0.125 8.375 0.375 7.875L7.875 0.375C8.375 -0.125 9.075 -0.125 9.575 0.375C10.075 0.875 10.075 1.575 9.575 2.075L2.775 8.775L9.475 15.475C9.975 15.975 9.975 16.675 9.475 17.175C9.275 17.375 8.975 17.475 8.675 17.475Z"
        fill="#191F28"
      />
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={18} height={16} viewBox="0 0 18 16" fill="none">
      <Path
        d="M8.05985 15.255C8.61485 15.6217 9.33068 15.6217 9.88485 15.255C11.6474 14.0917 15.4849 11.3108 17.1382 8.19917C19.3174 4.09417 16.7582 0 13.3749 0C11.4465 0 10.2865 1.0075 9.64485 1.87333C9.37485 2.24417 8.85569 2.32667 8.48402 2.05667C8.41319 2.00583 8.35152 1.94333 8.30068 1.87333C7.65902 1.0075 6.49902 0 4.57068 0C1.18735 0 -1.37181 4.09417 0.808185 8.19917C2.45985 11.3108 6.29902 14.0917 8.05985 15.255Z"
        fill={ICON_FILL}
      />
    </Svg>
  );
}

function MoreIcon() {
  // 더보기: 점 3개 (export 의미 재현)
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M4.5 9C4.5 9.82843 3.82843 10.5 3 10.5C2.17157 10.5 1.5 9.82843 1.5 9C1.5 8.17157 2.17157 7.5 3 7.5C3.82843 7.5 4.5 8.17157 4.5 9ZM10.5 9C10.5 9.82843 9.82843 10.5 9 10.5C8.17157 10.5 7.5 9.82843 7.5 9C7.5 8.17157 8.17157 7.5 9 7.5C9.82843 7.5 10.5 8.17157 10.5 9ZM16.5 9C16.5 9.82843 15.8284 10.5 15 10.5C14.1716 10.5 13.5 9.82843 13.5 9C13.5 8.17157 14.1716 7.5 15 7.5C15.8284 7.5 16.5 8.17157 16.5 9Z"
        fill={ICON_FILL}
      />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M1.04 1.04C1.36 0.72 1.88 0.72 2.2 1.04L8 6.84L13.8 1.04C14.12 0.72 14.64 0.72 14.96 1.04C15.28 1.36 15.28 1.88 14.96 2.2L9.16 8L14.96 13.8C15.28 14.12 15.28 14.64 14.96 14.96C14.64 15.28 14.12 15.28 13.8 14.96L8 9.16L2.2 14.96C1.88 15.28 1.36 15.28 1.04 14.96C0.72 14.64 0.72 14.12 1.04 13.8L6.84 8L1.04 2.2C0.72 1.88 0.72 1.36 1.04 1.04Z"
        fill={ICON_FILL}
      />
    </Svg>
  );
}

export function HomeTopNavBar({
  onBack,
  onClose,
  onHeart,
  onMore,
}: Props) {
  return (
    <View style={styles.bar}>
      {/* 좌: 뒤로가기 + 로고 + 이름 */}
      <View style={styles.left}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          style={styles.backButton}
        >
          <BackIcon />
        </Pressable>
        <View style={styles.titleArea}>
          {/* 로컬 PNG가 기기에서 렌더 안 돼 SVG 로고로 교체. 둥근 모서리는 View로 클립. */}
          <View style={styles.logo}>
            <BbikLogo size={18} />
          </View>
          <Text style={styles.name}>{'삑'}</Text>
        </View>
      </View>

      {/* 우: 하트 + 더보기 + 구분선 + 닫기 */}
      <View style={styles.right}>
        <Pressable
          onPress={onHeart}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="찜하기"
          style={styles.iconButton}
        >
          <HeartIcon />
        </Pressable>
        <Pressable
          onPress={onMore}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="더보기"
          style={styles.iconButton}
        >
          <MoreIcon />
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="닫기"
          style={styles.iconButton}
        >
          <CloseIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 18,
    height: 18,
    borderRadius: 6,
    overflow: 'hidden',
  },
  name: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#191F28',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: DIVIDER,
    marginHorizontal: 6,
  },
});
