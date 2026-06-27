import { requestReview } from '@apps-in-toss/framework';

let hasRequestedReview = false;

export async function requestReviewOnce() {
  if (hasRequestedReview) {
    return;
  }

  hasRequestedReview = true;

  try {
    await requestReview();
  } catch (error) {
    console.warn('리뷰 요청 실패:', error);
  }
}