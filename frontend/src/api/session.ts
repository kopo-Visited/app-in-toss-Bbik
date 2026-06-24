// TODO: 영속 저장(AsyncStorage 또는 Granite 보안 저장소)로 교체 — SDK API 확정 후. 현재는 세션 한정 인메모리.
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearSession() {
  accessToken = null;
}
