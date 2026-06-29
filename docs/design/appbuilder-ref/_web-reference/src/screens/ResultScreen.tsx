import { useToast } from "@toss/tds-mobile";
import { useSavedStore } from "../features/saved/SavedStore";
import { formatPrice, type Product } from "../lib/product";

/**
 * S-5 결과 (result) — 주신 React Native '결과_기본' export 코드를 웹(react-dom)으로 1:1 변환.
 * - SafeAreaView→div, ScrollView→스크롤 div, View→div, Text→span, Image→img,
 *   TouchableOpacity→div, resizeMode:"stretch"→objectFit:"fill".
 * - 텍스트는 상품 데이터로 바인딩, 공유/저장 onClick·토스트만 추가.
 * - "라쿠텐 참고가" 라벨은 비AI + 가격 있을 때만 표시. (AI 안내 배너는 이 디자인엔 없어요)
 */
const PLACEHOLDER_IMG = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/g8y00kk9_expires_30_days.png";

export function ResultScreen({ product }: { product: Product }) {
  const { save } = useSavedStore();
  const { openToast } = useToast();

  const isAi = product.lookupType === "ai";
  const hasPrice = product.price != null && product.price !== 0;
  const hasImage = product.imageUrl != null && product.imageUrl !== "";
  const brandKo = product.brandNameKo ?? product.brandNameOriginal ?? "";
  const brandJp = product.brandNameKo && product.brandNameOriginal ? ` (${product.brandNameOriginal})` : "";

  const handleSave = () => {
    const result = save(product);
    openToast(result === "saved" ? "저장되었습니다" : "이미 저장된 상품입니다");
  };

  const handleShare = async () => {
    const text = [`🔍 삑(Bbik)으로 찾은 상품`, product.nameKo, brandKo ? `브랜드: ${brandKo}` : null, `가격: ${formatPrice(product.price)}`]
      .filter(Boolean)
      .join("\n");
    // 클립보드 복사는 best-effort (웹/웹뷰에서 막혀도 무시)
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* ignore */
    }
    // "공유" 액션 버튼 없이, 체크 아이콘 + 문구만
    openToast("상품 정보가 복사되었습니다", { icon: "icon-check", iconType: "circle" });
  };

  return (
    // SafeAreaView
    <div style={{ flex: 1, minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* ScrollView */}
      <div style={{ flex: 1, backgroundColor: "#FFFFFF", paddingBottom: 94, overflowY: "auto" }}>
        <img
          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/3387a4d1_expires_30_days.png"
          alt=""
          style={{ display: "block", width: "100%", height: 94, marginBottom: 47, objectFit: "fill" }}
        />
        {/* 이미지 카드 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#F2F4F6", borderRadius: 16, paddingTop: 46, paddingBottom: 46, marginBottom: 25, marginLeft: 34, marginRight: 34, overflow: "hidden" }}>
          <img
            src={hasImage ? (product.imageUrl as string) : PLACEHOLDER_IMG}
            alt={hasImage ? product.nameKo : ""}
            style={{ width: 100, height: 100, objectFit: hasImage ? "cover" : "fill" }}
          />
        </div>
        {/* 텍스트 블록 */}
        <div style={{ paddingRight: 33, marginBottom: isAi ? 24 : 139, marginLeft: 31, marginRight: 31 }}>
          <span style={{ display: "block", color: "#212529", fontSize: 20, fontWeight: "bold", marginBottom: 3 }}>
            {product.nameKo}
          </span>
          <span style={{ display: "block", color: "#8B95A1", fontSize: 14, marginBottom: 7 }}>
            {product.nameOriginal}
          </span>
          {brandKo ? (
            <span style={{ display: "block", color: "#4E5968", fontSize: 20, marginBottom: 11 }}>
              {`${brandKo}${brandJp}`}
            </span>
          ) : null}
          {!isAi && hasPrice ? (
            <span style={{ display: "block", color: "#4E5968", fontSize: 16, marginBottom: 8 }}>
              {"라쿠텐 참고가"}
            </span>
          ) : null}
          <span style={{ display: "block", color: "#212529", fontSize: hasPrice ? 32 : 16, fontWeight: 600 }}>
            {formatPrice(product.price)}
          </span>
        </div>
        {/* AI 안내 배너 (AI 결과일 때만) */}
        {isAi ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginLeft: 30, marginRight: 30, marginBottom: 16, paddingTop: 2, paddingBottom: 2, paddingLeft: 10, paddingRight: 10, background: "rgba(0, 122, 255, 0.15)", borderRadius: 8 }}>
            <svg width="23" height="23" viewBox="0 0 23 23" fill="none" style={{ flexShrink: 0 }}>
              <path d="M11.1 5.69995C10.327 5.69995 9.69995 6.32695 9.69995 7.09995C9.69995 7.87295 10.327 8.49995 11.1 8.49995C11.873 8.49995 12.5 7.87295 12.5 7.09995C12.5 6.32695 11.873 5.69995 11.1 5.69995Z" fill="#3182F6" />
              <path d="M11.1001 16.7351C10.5481 16.7351 10.1001 16.2881 10.1001 15.7351V11.1001C10.1001 10.5481 10.5481 10.1001 11.1001 10.1001C11.6521 10.1001 12.1001 10.5481 12.1001 11.1001V15.7351C12.1001 16.2881 11.6521 16.7351 11.1001 16.7351Z" fill="#3182F6" />
              <path d="M11.1 22.2C4.979 22.2 0 17.22 0 11.1C0 4.979 4.979 0 11.1 0C17.22 0 22.2 4.979 22.2 11.1C22.2 17.22 17.22 22.2 11.1 22.2ZM11.1 2.2C6.192 2.2 2.2 6.192 2.2 11.1C2.2 16.007 6.192 20 11.1 20C16.007 20 20 16.007 20 11.1C20 6.192 16.007 2.2 11.1 2.2Z" fill="#3182F6" />
            </svg>
            <span style={{ flex: "1 1 0", color: "#007AFF", fontFamily: "SF Pro", fontSize: 13, fontWeight: 590, lineHeight: "16.28px", whiteSpace: "pre-line" }}>
              {"AI 분석 기반 참고 정보예요.\n실제와 다를 수 있어요."}
            </span>
          </div>
        ) : null}
        {/* 공유 / 저장 */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginLeft: 22, marginRight: 22 }}>
          <div
            onClick={handleShare}
            role="button"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#07194C0D", borderRadius: 16, paddingTop: 17, paddingBottom: 17, marginRight: 8, cursor: "pointer" }}
          >
            <span style={{ color: "#031228", fontSize: 17 }}>{"공유"}</span>
          </div>
          <div
            onClick={handleSave}
            role="button"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3182F6", borderRadius: 16, paddingTop: 17, paddingBottom: 17, cursor: "pointer" }}
          >
            <span style={{ color: "#FFFFFF", fontSize: 17 }}>{"저장"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
