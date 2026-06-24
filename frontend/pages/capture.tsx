import { createRoute } from '@granite-js/react-native';
import { CaptureScreen } from '../src/screens/CaptureScreen';

export const Route = createRoute('/capture', {
  validateParams: (params) => params,
  component: CaptureScreen,
});
