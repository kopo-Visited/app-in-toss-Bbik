import { useNavigation } from "../lib/router/Router";

/**
 * S-2 메인/홈 (home) — 주신 React Native export 코드를 웹(react-dom)으로 1:1 변환.
 * - SafeAreaView→div, ScrollView→스크롤 div, View→div, Text→span, Image→img,
 *   TouchableOpacity→div(onClick), resizeMode:"stretch"→objectFit:"fill".
 * - 버튼만 연결: 스캔하기→scan / 저장목록→saved.
 * - 이미지는 주신 외부 URL 그대로예요(약 30일 후 만료될 수 있어요).
 */
export function HomeScreen() {
  const { navigate } = useNavigation();

  return (
    // SafeAreaView
    <div style={{ flex: 1, minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* ScrollView */}
      <div style={{ flex: 1, backgroundColor: "#FFFFFF", overflowY: "auto" }}>
        {/* View */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 66 }}>
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/4h7f7fiz_expires_30_days.png"
            alt=""
            style={{ height: 94, marginBottom: 204 }}
          />
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/f9laddj5_expires_30_days.png"
            alt=""
            style={{ width: 239, height: 217, marginBottom: 53, objectFit: "fill" }}
          />
          <span style={{ color: "#8B95A1", fontSize: 19, fontWeight: "bold", marginBottom: 32 }}>
            {"일본 상품 바코드를 찍어보세요"}
          </span>
          {/* 버튼 컨테이너 (View, marginHorizontal:21) */}
          <div style={{ alignSelf: "stretch", marginLeft: 21, marginRight: 21, display: "flex", flexDirection: "column" }}>
            <div
              onClick={() => navigate("scan")}
              role="button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3182F6", borderRadius: 16, paddingTop: 17, paddingBottom: 17, marginBottom: 8, cursor: "pointer" }}
            >
              <span style={{ color: "#FFFFFF", fontSize: 17 }}>
                {"스캔하기"}
              </span>
            </div>
            <div
              onClick={() => navigate("saved")}
              role="button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3182F626", borderRadius: 16, paddingTop: 17, paddingBottom: 17, cursor: "pointer" }}
            >
              <span style={{ color: "#2272EB", fontSize: 17 }}>
                {"저장목록"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
