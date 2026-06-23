import { useState } from "react";
import { useNavigation } from "../lib/router/Router";
import { DUMMY_PRODUCT_BARCODE } from "../api/products";

/**
 * 바코드 직접 입력 — 주신 RN export(상단 바 + 안내문구)에 더해,
 * export가 빠뜨린 TDS 요소(큰 제목 / 입력칸+헬퍼 / 하단 "조회하기" CTA)를 디자인대로 채웠어요.
 * - 조회하기 → 입력한 바코드로 결과 화면 이동(현재는 더미 상품에 바코드만 끼워 표시).
 * - 좌상단(상단 바 이미지의 뒤로 화살표 위치)에 투명 버튼으로 뒤로가기 연결.
 */
export function ManualInputScreen() {
  const { navigate, back } = useNavigation();
  const [code, setCode] = useState("");
  const canSubmit = code.length === 13 || code.length === 8; // JAN-13 / JAN-8

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    navigate("result", { product: { ...DUMMY_PRODUCT_BARCODE, barcode: code } });
  };

  return (
    // SafeAreaView
    <div style={{ flex: 1, minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* 상단 바 이미지의 뒤로 화살표 위치에 투명 버튼 */}
      <button type="button" aria-label="뒤로" onClick={back} style={{ position: "absolute", left: 6, top: 50, width: 44, height: 44, background: "transparent", border: "none", padding: 0, cursor: "pointer", zIndex: 20 }} />

      {/* ScrollView */}
      <div style={{ flex: 1, backgroundColor: "#FFFFFF", paddingBottom: 120, overflowY: "auto" }}>
        <img
          src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/BtdmizRQHr/3wby27ee_expires_30_days.png"
          alt=""
          style={{ display: "block", width: "100%", height: 94, marginBottom: 24, objectFit: "fill" }}
        />

        {/* 큰 제목 */}
        <div style={{ marginLeft: 24, marginRight: 24, marginBottom: 8 }}>
          <span style={{ color: "#333D4B", fontSize: 24, fontWeight: "bold" }}>
            {"바코드 직접 입력"}
          </span>
        </div>

        {/* 안내 문구 (RN export 원본) */}
        <span style={{ display: "block", color: "#6B7684", fontSize: 17, marginLeft: 28, width: 231, whiteSpace: "pre-line" }}>
          {"상품 바코드 숫자를 입력해주세요\n(JAN-13 또는 JAN-8)"}
        </span>

        {/* 입력칸 + 헬퍼 */}
        <div style={{ marginLeft: 28, marginRight: 28, marginTop: 28 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 13))}
            inputMode="numeric"
            placeholder="바코드 숫자 입력"
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 4px", fontSize: 20, fontWeight: "bold", color: "#212529", border: "none", borderBottom: "2px solid #3182F6", outline: "none", background: "transparent" }}
          />
          <span style={{ display: "block", color: "#8B95A1", fontSize: 13, marginTop: 6 }}>
            {`13자리 숫자 (${code.length}/13)`}
          </span>
        </div>
      </div>

      {/* 하단 CTA: 조회하기 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
        <div
          onClick={handleSubmit}
          role="button"
          aria-disabled={!canSubmit}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 56, backgroundColor: "#3182F6", borderRadius: 16, cursor: canSubmit ? "pointer" : "default", opacity: canSubmit ? 1 : 0.4 }}
        >
          <span style={{ color: "#FFFFFF", fontSize: 17 }}>{"조회하기"}</span>
        </div>
      </div>
    </div>
  );
}
