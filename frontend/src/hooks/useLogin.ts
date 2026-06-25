import { useState } from 'react';
import { Alert } from 'react-native';
import { appLogin } from '@apps-in-toss/framework';
import { useNavigation } from '@granite-js/react-native';
import { login } from '../api/auth';
import { setAccessToken } from '../api/session';
import { ApiError } from '../api/errors';
import { devAuthBypass } from '../api/config';

/**
 * F-001 로그인 흐름 훅.
 * appLogin() → 인가코드 확보 → 백엔드 토큰교환 → 우리 JWT 보관 → 홈('/') 이동.
 * 예외: E1 미설치 / E2 네트워크 / E3 취소 / E4 인가코드 만료·재사용.
 */
export function useLogin() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // ⚠️ 임시 우회(실기기 테스트용): 토스 SDK appLogin 생략하고 백엔드 우회 로그인 직접 호출.
      //    authorizationCode/referrer 는 백엔드 우회가 무시하지만 검증 통과용 더미값. 인증서 발급되면 제거.
      if (devAuthBypass) {
        const res = await login({ authorizationCode: 'dev-bypass', referrer: 'DEFAULT' });
        setAccessToken(res.accessToken);
        navigation.navigate('/');
        return;
      }

      const { authorizationCode, referrer } = await appLogin();
      const res = await login({ authorizationCode, referrer });
      setAccessToken(res.accessToken);
      navigation.navigate('/');
    } catch (err) {
      // E3 인증 취소: appLogin이 취소 시 던지는 에러를 명확히 구분하기 어려우므로
      // 네트워크/만료 외 일반 케이스로 흡수해 사용자에게 과한 알림을 띄우지 않는다.
      if (err instanceof ApiError) {
        if (err.code === 'NETWORK_ERROR') {
          // E2 네트워크
          Alert.alert('네트워크 오류', '네트워크를 확인해주세요.');
        } else if (err.code === 'invalid_grant') {
          // E4 인가코드 만료·재사용
          Alert.alert('다시 시도', '로그인 정보가 만료되었어요. 다시 시도해주세요.');
        } else {
          Alert.alert('로그인 실패', err.message ?? '다시 시도해주세요.');
        }
      } else {
        // appLogin 단계 예외(취소·미설치 등 코드 미확정) → 일반 실패 처리.
        // E1 토스앱 미설치 가능성을 안내에 포함.
        Alert.alert('로그인 실패', '토스 앱에서 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { login: handleLogin, loading };
}
