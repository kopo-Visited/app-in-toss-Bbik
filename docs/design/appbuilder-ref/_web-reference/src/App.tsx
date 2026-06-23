import { RouterProvider, useNavigation } from "./lib/router/Router";
import type { Route, ScreenName } from "./lib/router/types";
import { SavedStoreProvider } from "./features/saved/SavedStore";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { CaptureScreen } from "./screens/CaptureScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { ManualInputScreen } from "./screens/ManualInputScreen";
import { NoInternetScreen } from "./screens/NoInternetScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { DUMMY_PRODUCT_BARCODE, DUMMY_PRODUCT_AI, DUMMY_PRODUCT_AI_PRICED } from "./api/products";

const VALID_SCREENS: ScreenName[] = [
  "login",
  "home",
  "scan",
  "capture",
  "result",
  "saved",
  "manualInput",
  "noInternet",
  "loading",
];

/**
 * URL의 `?screen=<이름>` 쿼리로 시작 화면을 정해요. (딥링크/피그마 캡처용)
 * - result: 더미 상품을 끼워 넣어 바로 결과를 보여줘요
 * - capture: 빈 파라미터로 진입
 * - 그 외/없음: undefined → 기본 login
 */
function getInitialRoute(): Route | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const raw = new URLSearchParams(window.location.search).get("screen");
  // 결과 화면 3가지 미리보기 별칭 (라쿠텐 / AI+가격 / AI+가격없음)
  if (raw === "resultAiPrice") {
    return { name: "result", params: { product: DUMMY_PRODUCT_AI_PRICED } };
  }
  if (raw === "resultAiNoPrice") {
    return { name: "result", params: { product: DUMMY_PRODUCT_AI } };
  }
  if (raw == null || !VALID_SCREENS.includes(raw as ScreenName)) {
    return undefined;
  }
  const screen = raw as ScreenName;
  switch (screen) {
    case "result":
      return { name: "result", params: { product: DUMMY_PRODUCT_BARCODE } };
    case "capture":
      return { name: "capture", params: {} };
    default:
      return { name: screen, params: undefined } as Route;
  }
}

/**
 * 현재 라우트에 맞는 화면을 렌더링.
 * (기획서 3번 화면 흐름)
 */
function ScreenRenderer() {
  const { route } = useNavigation();

  switch (route.name) {
    case "login":
      return <LoginScreen />;
    case "home":
      return <HomeScreen />;
    case "scan":
      return <ScanScreen />;
    case "capture":
      return <CaptureScreen params={route.params} />;
    case "result":
      return <ResultScreen product={route.params.product} />;
    case "saved":
      return <SavedScreen />;
    case "manualInput":
      return <ManualInputScreen />;
    case "noInternet":
      return <NoInternetScreen />;
    case "loading":
      return <LoadingScreen />;
    default:
      return <LoginScreen />;
  }
}

function App() {
  return (
    <SavedStoreProvider>
      <RouterProvider initialScreen="login" initialRoute={getInitialRoute()}>
        <ScreenRenderer />
      </RouterProvider>
    </SavedStoreProvider>
  );
}

export default App;
