import { createRoute } from '@granite-js/react-native';
import { SavedScreen } from '../src/screens/SavedScreen';

export const Route = createRoute('/saved', {
  validateParams: (params) => params,
  component: SavedScreen,
  screenOptions: { headerShown: false },
});
