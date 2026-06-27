import { useEffect, type PropsWithChildren } from 'react';
import type { InitialProps } from '@granite-js/react-native';
import { useBackEvent, useNavigation } from '@granite-js/react-native';
import { AppsInToss, homeEvent } from '@apps-in-toss/framework';
import { context } from '../require.context';

function NavigationBarEventHandler() {
  const navigation = useNavigation();
  const backEvent = useBackEvent();

  useEffect(() => {
    const handleBack = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('/');
      }
    };

    backEvent.addEventListener(handleBack);

    return () => {
      backEvent.removeEventListener(handleBack);
    };
  }, [backEvent, navigation]);

  useEffect(() => {
    const unsubscribe = homeEvent.subscribe(() => {
      navigation.navigate('/');
    });

    return () => {
      unsubscribe();
    };
  }, [navigation]);

  return null;
}

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <>
      <NavigationBarEventHandler />
      {children}
    </>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });