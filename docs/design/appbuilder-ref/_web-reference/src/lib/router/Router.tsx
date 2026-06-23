import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Route, ScreenName, ScreenParams } from "./types";

/**
 * SDK가 웹 모드(Vite + react-dom)에서 별도 라우터를 제공하지 않으므로
 * React state 기반 경량 화면 스택 라우터를 직접 둡니다.
 * - 스택(history)으로 뒤로가기(back)를 지원
 * - navigate(push) / replace / back / reset 제공
 * - 파라미터는 타입(ScreenParams)으로 안전하게 전달
 */

interface NavigationContextValue {
  /** 현재 라우트 */
  route: Route;
  /** 새 화면으로 이동 (스택에 쌓음) */
  navigate: <T extends ScreenName>(
    name: T,
    ...args: ScreenParams[T] extends undefined ? [] : [params: ScreenParams[T]]
  ) => void;
  /** 현재 화면을 새 화면으로 교체 (스택에 안 쌓음) */
  replace: <T extends ScreenName>(
    name: T,
    ...args: ScreenParams[T] extends undefined ? [] : [params: ScreenParams[T]]
  ) => void;
  /** 뒤로가기 (스택이 1개뿐이면 무시) */
  back: () => void;
  /** 스택을 비우고 해당 화면으로 초기화 (로그인/로그아웃 등) */
  reset: <T extends ScreenName>(
    name: T,
    ...args: ScreenParams[T] extends undefined ? [] : [params: ScreenParams[T]]
  ) => void;
  /** 뒤로 갈 화면이 있는지 */
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function makeRoute<T extends ScreenName>(
  name: T,
  params: ScreenParams[T],
): Route {
  return { name, params } as Route;
}

interface RouterProviderProps {
  /** 시작 화면 (기본 login) */
  initialScreen?: ScreenName;
  /**
   * 파라미터까지 지정한 시작 라우트.
   * 주어지면 initialScreen 보다 우선해요. (딥링크/피그마 캡처용)
   */
  initialRoute?: Route;
  children: ReactNode;
}

export function RouterProvider({
  initialScreen = "login",
  initialRoute,
  children,
}: RouterProviderProps) {
  const [stack, setStack] = useState<Route[]>(() => [
    initialRoute ?? makeRoute(initialScreen, undefined as never),
  ]);

  const navigate = useCallback<NavigationContextValue["navigate"]>(
    (name, ...args) => {
      const params = (args[0] ?? undefined) as ScreenParams[typeof name];
      setStack((prev) => [...prev, makeRoute(name, params)]);
    },
    [],
  );

  const replace = useCallback<NavigationContextValue["replace"]>(
    (name, ...args) => {
      const params = (args[0] ?? undefined) as ScreenParams[typeof name];
      setStack((prev) => [...prev.slice(0, -1), makeRoute(name, params)]);
    },
    [],
  );

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback<NavigationContextValue["reset"]>(
    (name, ...args) => {
      const params = (args[0] ?? undefined) as ScreenParams[typeof name];
      setStack([makeRoute(name, params)]);
    },
    [],
  );

  const value = useMemo<NavigationContextValue>(
    () => ({
      route: stack[stack.length - 1],
      navigate,
      replace,
      back,
      reset,
      canGoBack: stack.length > 1,
    }),
    [stack, navigate, replace, back, reset],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

/** 화면에서 네비게이션을 쓰기 위한 훅 */
export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (ctx == null) {
    throw new Error("useNavigation은 RouterProvider 안에서만 사용할 수 있어요.");
  }
  return ctx;
}
