import { Html } from "@react-three/drei";
import { KatexFormula } from "@/components/UI/KatexFormula";
import { mathToThree } from "@/math3d/coordinateConvention";
import type { Vec3 } from "@/math3d/vector3";

interface FormulaLabel3DProps {
  position: Vec3;
  tex: string;
  offset?: [number, number, number];
  /** 距离缩放因子，默认 7.5，使公式大小与 3D 几何顶点标签完全匹配 */
  distanceFactor?: number;
  /** 是否使用纯净无框模式（默认 true，符合教科书作图风格） */
  plain?: boolean;
}

function sanitizeLatex(input: string): string {
  if (!input) return "";
  let clean = input.trim();

  // 1. 过滤任何控制字符 (如 ASCII 11 / \x0b / \v)
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\x00-\x1f]/g, "");

  // 2. 将连续的反斜杠（\\）归一化为单个反斜杠（\）
  clean = clean.replace(/\\+/g, "\\");

  // 3. 修复带下标的向量 (如 vecn_1, vecn_2, ecn_1, \vec{n_1}, \vec{n}_1, \\vec{n}_2 等)
  clean = clean.replace(
    /^(?:\\?vec|ec)\{?([a-zA-Z])\}?_\{?([0-9a-zA-Z]+)\}?$/,
    (_m, p1, p2) => `\\vec{${p1}}_{${p2}}`,
  );

  // 4. 修复单字母向量 (如 vecn, veca, \vec{a}, ec{a} 等)
  clean = clean.replace(
    /^(?:\\?vec|ec)\{?([a-zA-Z])\}?$/,
    (_m, p1) => `\\vec{${p1}}`,
  );

  return clean;
}

/**
 * 3D 空间 KaTeX 公式标注
 * 使用 Drei 原生 distanceFactor 保证与 3D 空间几何模型 100% 正向透视同步（远小近大）
 */
export const FormulaLabel3D = ({
  position,
  tex,
  offset = [0.18, 0.18, 0],
  distanceFactor = 7.8,
  plain = true,
}: FormulaLabel3DProps) => {
  const [x, y, z] = mathToThree(position);
  const cleanTex = sanitizeLatex(tex);

  return (
    <group position={[x + offset[0], y + offset[1], z + offset[2]]}>
      <Html
        center
        distanceFactor={distanceFactor}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={
            plain
              ? {
                  background: "transparent",
                  padding: "0",
                  whiteSpace: "nowrap",
                  fontSize: "13.5px",
                  lineHeight: 1,
                  userSelect: "none",
                  textShadow:
                    "0 0 3px #FFFFFF, 0 0 3px #FFFFFF, 0 0 5px #FFFFFF, 0 0 8px #FFFFFF",
                }
              : {
                  background: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(4px)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.15)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  lineHeight: 1.2,
                  userSelect: "none",
                }
          }
        >
          <KatexFormula formula={cleanTex} mode="inline" />
        </div>
      </Html>
    </group>
  );
};
