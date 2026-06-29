// TODO: 영속 저장(AsyncStorage 또는 Granite 보안 저장소)로 교체 — SDK API 확정 후. 현재는 세션 한정 인메모리.
let accessToken: string | null = null;
let userName: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** 사용자 이름(로그인 응답의 name). 화면 인사/타이틀 표시용. 인메모리 — 재시작 시 사라짐. */
export function getUserName() {
  return userName;
}

export function setUserName(name: string | null) {
  userName = name;
}

export function clearSession() {
  accessToken = null;
  userName = null;
}
