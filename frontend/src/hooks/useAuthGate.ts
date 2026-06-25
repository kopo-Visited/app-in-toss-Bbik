import { useEffect, useState } from 'react';
import { useNavigation } from '@granite-js/react-native';
import { getAccessToken } from '../api/session';

/**
 * 로그인 게이트 훅.
 * 인증이 필요한 화면(예: 홈 S-2) 진입 시 토큰이 없으면 로그인 화면(/login)으로 보낸다.
 * 디자인 스펙: S-2 진입 경로 = "로그인 성공 후" / S-1 "이미 로그인된 사용자는 건너뛴다".
 *
 * 동작:
 *  - 마운트 시 getAccessToken()(인메모리)을 확인.
 *  - 없으면 navigation.replace('/login')로 교체 이동(스택에 홈을 남기지 않아 뒤로가기 루프 방지).
 *    replace는 native-stack 내비게이션 API. 미지원 환경 대비 navigate로 폴백.
 *  - authed=false 동안 화면은 본문 대신 null/로딩을 렌더해 미로그인 홈의 플리커를 줄인다.
 *
 * 무한 루프 방지: 이 훅은 인증이 필요한 화면에만 건다. 로그인 화면(/login) 자체에는 걸지 않는다.
 *
 * ⚠️ 토큰은 현재 인메모리(session.ts)라 앱 재시작마다 null → 매 재시작 시 로그인 화면부터 시작한다.
 *    영속 저장 도입 시(session.ts TODO) 자동 통과되도록 getAccessToken만 교체하면 된다.
 */
export function useAuthGate(): { authed: boolean } {
  const navigation = useNavigation();
  // 첫 렌더에서 동기적으로 판단해 미로그인 시 홈 본문을 아예 그리지 않는다(플리커 최소화).
  const [authed] = useState(() => getAccessToken() != null);

  useEffect(() => {
    if (authed) {
      return;
    }
    // 홈을 /login으로 치환: 스택에 홈이 남지 않아 로그인 후 뒤로가기로 미로그인 홈에 돌아가지 않는다.
    if (typeof navigation.replace === 'function') {
      navigation.replace('/login');
    } else {
      navigation.navigate('/login');
    }
    // navigation은 안정적 참조. authed는 마운트 시점 1회 고정값이라 재실행 불필요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { authed };
}
