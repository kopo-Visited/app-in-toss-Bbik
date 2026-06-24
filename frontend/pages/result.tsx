import { createRoute } from '@granite-js/react-native';
import { ResultScreen } from '../src/screens/ResultScreen';
import type { Product } from '../src/lib/product';

export const Route = createRoute('/result', {
  validateParams: (params) => params as { product: Product },
  component: ResultPage,
  screenOptions: { headerShown: false },
});

function ResultPage() {
  const { product } = Route.useParams();
  return <ResultScreen product={product} />;
}
