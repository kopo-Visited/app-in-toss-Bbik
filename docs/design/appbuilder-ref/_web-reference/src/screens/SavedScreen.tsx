import { useDialog } from "@toss/tds-mobile";
import { useNavigation } from "../lib/router/Router";
import { useSavedStore } from "../features/saved/SavedStore";
import { formatPrice, type SavedProduct } from "../lib/product";

/**
 * S-6 저장 목록 (saved) — 주신 React Native '저장 목록' export 코드를 웹(react-dom)으로 1:1 변환.
 * - 하드코딩 4행 → 실제 저장 데이터로 반복(행 디자인 동일).
 * - 행 탭 → 결과 화면 / 휴지통 → 삭제 확인.
 * - 비어있으면 빈 상태(북마크 + "저장한 상품이 없어요" + 스캔하러 가기).
 * - 좌상단(상단 바 이미지 뒤로 화살표 위치)에 투명 버튼으로 뒤로가기 연결.
 */
const ROW_ICON = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/eofnlaqp_expires_30_days.png";
const TRASH_ICON = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/e7ufhp8v_expires_30_days.png";
const BOOKMARK_ICON = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/noj3a7ap_expires_30_days.png";

export function SavedScreen() {
  const { navigate, back } = useNavigation();
  const { items, remove } = useSavedStore();
  const { openConfirm } = useDialog();

  const handleDelete = async (item: SavedProduct) => {
    const ok = await openConfirm({
      title: "삭제할까요?",
      description: `${item.nameKo}을(를) 저장 목록에서 지워요.`,
      confirmButton: "삭제",
      cancelButton: "취소",
    });
    if (ok) {
      remove(item.id);
    }
  };

  return (
    // SafeAreaView
    <div style={{ flex: 1, minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* 상단 바 이미지 뒤로 화살표 위치에 투명 버튼 */}
      <button type="button" aria-label="뒤로" onClick={back} style={{ position: "absolute", left: 6, top: 50, width: 44, height: 44, background: "transparent", border: "none", padding: 0, cursor: "pointer", zIndex: 20 }} />

      {/* ScrollView */}
      <div style={{ flex: 1, backgroundColor: "#FFFFFF", paddingBottom: 388, overflowY: "auto" }}>
        <img
          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/cvmz905x_expires_30_days.png"
          alt=""
          style={{ display: "block", width: "100%", height: 94, marginBottom: 16, objectFit: "fill" }}
        />
        <span style={{ display: "block", color: "#031228", fontSize: 22, fontWeight: "bold", marginBottom: 24, marginLeft: 24 }}>
          {"OO님의 저장한 상품"}
        </span>

        {items.length === 0 ? (
          <EmptyState onScan={() => navigate("scan")} />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate("result", { product: item })}
              role="button"
              style={{ display: "flex", flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24, cursor: "pointer" }}
            >
              <img
                src={item.imageUrl || ROW_ICON}
                alt=""
                style={{ width: 30, height: 30, marginRight: 12, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: "block", color: "#000C1E", fontSize: 17, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.nameKo}
                  </span>
                  <span style={{ display: "block", color: "#00132B", fontSize: 13 }}>
                    {formatPrice(item.price)}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`${item.nameKo} 삭제`}
                  onClick={(e) => { e.stopPropagation(); void handleDelete(item); }}
                  style={{ background: "transparent", border: "none", padding: 0, marginLeft: 12, cursor: "pointer", flexShrink: 0, display: "flex" }}
                >
                  <img src={TRASH_ICON} alt="" style={{ width: 19, height: 19 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** 빈 상태: 북마크 이미지 + 문구 + 스캔하러 가기 (RN export 그대로) */
function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 106, marginBottom: 26 }}>
        <img src={BOOKMARK_ICON} alt="" style={{ width: 66, height: 83, objectFit: "fill" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#031228", fontSize: 20, fontWeight: "bold" }}>
          {"저장한 상품이 없어요"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div onClick={onScan} role="button" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3182F6", borderRadius: 16, paddingTop: 17, paddingBottom: 17, paddingLeft: 33, paddingRight: 33, cursor: "pointer" }}>
          <span style={{ color: "#FFFFFF", fontSize: 17 }}>{"스캔하러 가기"}</span>
        </div>
      </div>
    </>
  );
}
