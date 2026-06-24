import { createRoute } from '@granite-js/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';

export const Route = createRoute('/login', {
  validateParams: (params) => params,
  component: LoginScreen,
  screenOptions: { headerShown: false },
});
