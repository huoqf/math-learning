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
