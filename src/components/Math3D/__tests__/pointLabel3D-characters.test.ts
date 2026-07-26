import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * PointLabel3D 使用 troika-three-text + KaTeX_Main 字体渲染纯文本。
 * KaTeX_Main 仅覆盖基本拉丁字符和数学符号，不含 Unicode 下标/上标/CJK。
 * 缺失字形依赖 unicode-font-resolver CDN fallback（弱网/离线会渲染为方框）。
 *
 * 本测试扫描源码中所有 PointLabel3D 调用点的 text 字面量，
 * 确保只使用字体可靠支持的字符集。
 */

// PointLabel3D 允许的字符集：字母、数字、坐标标注常用标点
const ALLOWED = /^[A-Za-z0-9(),.\- ]*$/;

// 已知使用 PointLabel3D 的源文件
const SOURCE_FILES = [
  "src/features/solidGeometry/SpatialAngleAnimation.tsx",
  "src/features/solidGeometry/LinePlaneRelationAnimation.tsx",
  "src/features/solidGeometry/CircumInSphereAnimation.tsx",
  "src/components/Math3D/Scene3DGrid.tsx",
];

function extractPointLabelTexts(filePath: string): string[] {
  const src = readFileSync(filePath, "utf-8");
  const texts: string[] = [];
  // 匹配 text="..." 和 text={`...`} 中的静态部分
  const regex = /PointLabel3D[\s\S]*?text=\{?"([^"]*?)"/g;
  let match;
  while ((match = regex.exec(src)) !== null) {
    texts.push(match[1]);
  }
  return texts;
}

describe("PointLabel3D 字符集合规", () => {
  for (const file of SOURCE_FILES) {
    const fullPath = resolve(__dirname, "../../../../", file);
    const texts = extractPointLabelTexts(fullPath);

    it(`${file} 中的 PointLabel3D text 只包含允许字符`, () => {
      const violations: { text: string; offending: string }[] = [];
      for (const text of texts) {
        if (!ALLOWED.test(text)) {
          const offending = text.replace(/[A-Za-z0-9(),.\- ]/g, "");
          violations.push({ text, offending });
        }
      }
      if (violations.length > 0) {
        const detail = violations
          .map(
            (v) =>
              `  text="${v.text}" → 非法字符: ${[...new Set(v.offending)].map((c) => `"${c}" (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")})`).join(", ")}`,
          )
          .join("\n");
        throw new Error(
          `PointLabel3D 包含字体不支持的字符:\n${detail}\n\nKaTeX_Main 字体不含这些字符，在弱网/离线环境下会渲染为方框。\n如需显示下标/公式请改用 FormulaLabel3D。`,
        );
      }
      expect(violations).toEqual([]);
    });
  }
});
