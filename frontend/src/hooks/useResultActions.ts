import { setClipboardText } from '@apps-in-toss/framework';
import { saveProduct } from '../api/savedProducts';
import { createShareText } from '../api/share';
import { ApiError } from '../api/errors';
import { formatPrice } from '../lib/product';
import type { Product } from '../lib/product';

/**
 * 결과 화면의 저장/공유 오케스트레이션.
 * 각 함수는 토스트에 띄울 메시지 문자열을 resolve 한다(throw 하지 않음).
 */
export function useResultActions() {
  const save = async (product: Product): Promise<string> => {
    try {
      const res = await saveProduct(product);
      return res.message ?? (res.saved ? '저장되었습니다' : '이미 저장된 상품입니다');
    } catch (err) {
      if (err instanceof ApiError) {
        return err.message ?? '저장에 실패했어요';
      }
      return '저장에 실패했어요';
    }
  };

  const share = async (product: Product): Promise<string> => {
    // 1) 공유 문구 확보 — F-006은 선택 기능이라 실패해도 클라이언트 폴백으로 진행
    let text: string;
    try {
      const { shareText } = await createShareText(product);
      text = shareText;
    } catch {
      const brandKo = product.brandNameKo ?? product.brandNameOriginal ?? '';
      text = [
        '🔍 삑(Bbik)으로 찾은 상품',
        product.nameKo,
        brandKo ? `브랜드: ${brandKo}` : null,
        `가격: ${formatPrice(product.price)}`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    // 2) 클립보드 복사
    try {
      await setClipboardText(text);
      return '상품 정보가 복사되었습니다';
    } catch {
      return '복사에 실패했어요';
    }
  };

  return { save, share };
}
