import { colors } from "@toss/tds-colors";

/**
 * 바코드 스캔 로고 (서비스 일러스트)
 * - 회색 스캔 프레임(4개 모서리 브래킷) 안에 파란 바코드 막대 4개
 * - 기본 색: 프레임 grey300(#D1D6DB), 막대 blue500(#3182F6)
 * - 로그인 / 메인에서 공용으로 사용해요.
 * - 어두운 배경(스캔 화면)에서는 frameColor/barColor 로 회색 모노톤으로 바꿔 써요.
 */
export function BarcodeScanLogo({
  size = 120,
  frameColor = colors.grey300,
  barColor = colors.blue500,
}: {
  size?: number;
  /** 스캔 프레임(모서리 브래킷) 색 */
  frameColor?: string;
  /** 바코드 막대 색 */
  barColor?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 106 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* 스캔 프레임 모서리 (디자인 좌표 기준) */}
      <g
        stroke={frameColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M4 34 V17 a7 7 0 0 1 7-7 H31" />
        <path d="M75 10 H95 a7 7 0 0 1 7 7 V34" />
        <path d="M102 72 V89 a7 7 0 0 1-7 7 H75" />
        <path d="M31 96 H11 a7 7 0 0 1-7-7 V72" />
      </g>
      {/* 바코드 막대 4개 — 디자인의 굵기/위치를 그대로 사용 */}
      <g fill={barColor}>
        <rect x="17.02" y="28.79" width="18.02" height="48.5" rx="3" />
        <rect x="41.72" y="28.79" width="7.15" height="48.5" rx="2.5" />
        <rect x="55.74" y="28.79" width="10.73" height="48.5" rx="3" />
        <rect x="73.25" y="28.79" width="15.72" height="48.5" rx="3" />
      </g>
    </svg>
  );
}
