import { createRoute } from '@granite-js/react-native';
import { ResultScreen } from '../src/screens/ResultScreen';

export const Route = createRoute('/result', {
  validateParams: (params) => params,
  component: ResultScreen,
});
