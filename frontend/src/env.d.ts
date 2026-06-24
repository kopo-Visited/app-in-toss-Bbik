// 빌드 시 env 플러그인이 주입하는 환경변수 타입
type Env = {
  SERVER_BASE_URL: string;
};

interface ImportMeta {
  readonly env: Env;
}
