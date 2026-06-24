import { createRoute } from '@granite-js/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: HomeScreen,
  screenOptions: { headerShown: false },
});
