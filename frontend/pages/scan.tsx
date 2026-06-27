import { createRoute } from '@granite-js/react-native';
import { ScanScreen } from '../src/screens/ScanScreen';

export const Route = createRoute('/scan', {
  validateParams: (params) => params,
  component: ScanScreen,
  screenOptions: { headerShown: true },
});
