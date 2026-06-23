import type { Product } from "../product";

/**
 * 화면 ID (기획서 2번 화면 목록)
 * S-1 login / S-2 home / S-3 scan / S-4 capture / S-5 result / S-6 saved
 */
export type ScreenName =
  | "login"
  | "home"
  | "scan"
  | "capture"
  | "result"
  | "saved"
  | "manualInput"
  | "noInternet"
  | "loading";

/**
 * 각 화면이 받는 파라미터 정의.
 * 파라미터가 없는 화면은 undefined.
 */
export interface ScreenParams {
  login: undefined;
  home: undefined;
  scan: undefined;
  capture: { barcode?: string }; // 조회 실패한 바코드(있으면)를 들고 촬영으로
  result: { product: Product }; // 결과 화면은 상품 객체를 받아 표시
  saved: undefined;
  manualInput: undefined; // 바코드 직접 입력 화면
  noInternet: undefined; // 인터넷 연결 오류 화면
  loading: undefined; // 로딩 화면
}

/** 현재 화면 + 그 화면의 파라미터를 묶은 라우트 */
export type Route = {
  [K in ScreenName]: { name: K; params: ScreenParams[K] };
}[ScreenName];
