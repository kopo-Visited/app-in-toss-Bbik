import { createRoute } from '@granite-js/react-native';
import { CaptureScreen } from '../src/screens/CaptureScreen';

export const Route = createRoute('/capture', {
  validateParams: (params) => params as { barcode?: string; scanHistoryId?: string },
  component: CapturePage,
});

function CapturePage() {
  const { barcode, scanHistoryId } = Route.useParams();
  return <CaptureScreen barcode={barcode} scanHistoryId={scanHistoryId} />;
}
