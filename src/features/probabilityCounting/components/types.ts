import type { SceneScale } from "../../../hooks/useSceneScale";
import type { ViewportInfo } from "../../../utils/useViewport";

export interface SceneCommonProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  activeMode: string;
  subMode?: number;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
}

export const BALL_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
];

export function toSup(val: number | string): string {
  const map: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    n: "ⁿ",
    k: "ᵏ",
    m: "ᵐ",
    r: "ʳ",
    i: "ⁱ",
  };
  return String(val)
    .split("")
    .map((c) => map[c] || c)
    .join("");
}

export function toSub(val: number | string): string {
  const map: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    "+": "₊",
    "-": "₋",
    n: "ₙ",
    k: "ₖ",
    m: "ₘ",
    r: "ᵣ",
    i: "ᵢ",
  };
  return String(val)
    .split("")
    .map((c) => map[c] || c)
    .join("");
}

export function formatComb(n: number | string, k: number | string): string {
  return `C${toSub(n)}${toSup(k)}`;
}

export function formatPerm(n: number | string, k: number | string): string {
  return `A${toSub(n)}${toSup(k)}`;
}

export function formatTermText(coeff: number, power: number): string {
  if (power === 0) return `${coeff}`;
  const coeffStr = coeff === 1 ? "" : coeff === -1 ? "-" : `${coeff}`;
  const powStr = power === 1 ? "x" : `x${toSup(power)}`;
  return `${coeffStr}${powStr}`;
}
