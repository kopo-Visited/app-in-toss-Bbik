import { appLogin } from "@apps-in-toss/web-framework";
import { useNavigation } from "../lib/router/Router";

/**
 * S-1 로그인 (login) — 주신 React Native export 코드를 웹(react-dom)으로 1:1 변환.
 * - 이 프로젝트는 웹이라 react-native 컴포넌트를 못 써서 div/span/img 로 매핑했어요(스타일 동일).
 *   SafeAreaView→div, ScrollView→스크롤 div, View→div, Text→span, Image→img,
 *   resizeMode:"stretch"→objectFit:"fill".
 * - "토스로 시작하기" 버튼만 토스 인증(appLogin) → home 으로 연결.
 * - 이미지는 주신 외부 URL 그대로예요(약 30일 후 만료될 수 있어요).
 */
export function LoginScreen() {
  const { reset } = useNavigation();

  const handleStart = async () => {
    try {
      const { authorizationCode } = await appLogin();
      void authorizationCode;
      reset("home");
    } catch (error) {
      console.warn("appLogin 실패(웹 미리보기 등):", error);
      reset("home");
    }
  };

  return (
    // SafeAreaView
    <div style={{ flex: 1, minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* ScrollView */}
      <div style={{ flex: 1, backgroundColor: "#FFFFFF", overflowY: "auto" }}>
        {/* View */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 84 }}>
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/bnt06rj8_expires_30_days.png"
            alt=""
            style={{ height: 94, marginBottom: 171 }}
          />
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/ye4z00k4_expires_30_days.png"
            alt=""
            style={{ width: 106, height: 106, marginBottom: 31, objectFit: "fill" }}
          />
          <span style={{ color: "#333D4B", fontSize: 22, fontWeight: "bold", marginBottom: 31 }}>
            {"삑 (Bbik)"}
          </span>
          <span style={{ color: "#6B7684", fontSize: 17, textAlign: "center", marginBottom: 120, width: 199, whiteSpace: "pre-line" }}>
            {"일본 상품 바코드를 스캔하면\n한국어로 알려드려요"}
          </span>
          {/* 버튼 (View) */}
          <div
            onClick={handleStart}
            role="button"
            style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", alignItems: "center", backgroundColor: "#3182F6", borderRadius: 16, paddingTop: 17, paddingBottom: 17, marginBottom: 28, marginLeft: 23, marginRight: 23, position: "relative", cursor: "pointer" }}
          >
            <span style={{ color: "#FFFFFF", fontSize: 17 }}>
              {"토스로 시작하기"}
            </span>
          </div>
          <span style={{ color: "#6B7684", fontSize: 15 }}>
            {"토스계정으로 간편하게 시작해요"}
          </span>
        </div>
      </div>
    </div>
  );
}
