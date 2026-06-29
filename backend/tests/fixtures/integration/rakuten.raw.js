/**
 * 라쿠텐 Product Search API raw 응답 픽스처 (통합 테스트용).
 * rakuten.client.js 가 직접 파싱하는 구조: json.Products[0].Product (03-api-spec §7.5).
 * client 내부 mapToDTO 가 아래 필드를 읽는다:
 *   productId, productCode, productName, brandName, salesMinPrice, mediumImageUrl, smallImageUrl
 */

// productCode(JAN) 1차 조회 성공 raw
export const RAKUTEN_RAW_SUCCESS = {
  Products: [
    {
      Product: {
        productId: 'rk-p1',
        productCode: '4901234567894',
        productName: '緑茶 500ml',
        brandName: '伊藤園',
        salesMinPrice: 150, // → price (BR-010)
        mediumImageUrl: 'https://image.rakuten.co.jp/p1_medium.jpg',
        smallImageUrl: 'https://image.rakuten.co.jp/p1_small.jpg',
      },
    },
  ],
};

// keyword 재조회 성공 raw (analyze-image keyword 경로)
export const RAKUTEN_RAW_KEYWORD_SUCCESS = {
  Products: [
    {
      Product: {
        productId: 'rk-p2',
        productCode: '4901234567894',
        productName: '緑茶 500ml',
        brandName: '伊藤園',
        salesMinPrice: 150,
        mediumImageUrl: 'https://image.rakuten.co.jp/p2_medium.jpg',
        smallImageUrl: 'https://image.rakuten.co.jp/p2_small.jpg',
      },
    },
  ],
};

// 결과 없음 raw — client 는 Products[0].Product 부재 시 null 반환
export const RAKUTEN_RAW_EMPTY = { Products: [] };
