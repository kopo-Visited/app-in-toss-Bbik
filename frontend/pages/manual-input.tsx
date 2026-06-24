import { createRoute } from '@granite-js/react-native';
import { ManualInputScreen } from '../src/screens/ManualInputScreen';

export const Route = createRoute('/manual-input', {
  validateParams: (params) => params,
  component: ManualInputScreen,
  screenOptions: { headerShown: false },
});
