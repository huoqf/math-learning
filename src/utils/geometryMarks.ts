/**
 * src/utils/geometryMarks.ts
 * 通用几何标记纯函数（SSOT 单一事实源）：直角符号等。
 *
 * 说明：本文件只产出**路径字符串 / 数值**，不涉及任何颜色与渲染，
 * 因此可被任意 Scene 复用而不引入主题依赖。
 */

/**
 * 生成「直角符号 ∟」的 SVG path `d`。
 *
 * @param corner 直角顶点（设计坐标）
 * @param dir1   第一条边自 corner 出发的方向向量（不必是单位向量）
 * @param dir2   第二条边自 corner 出发的方向向量
 * @param maxSize 直角符号的边长上限（px），默认 10
 *
 * 边长按两条边中较短者自适应收缩（0.35 倍），避免在极短边处画出畸形的直角标记；
 * 任一条边退化（长度 < 1e-4）时返回 null，由调用方决定跳过。
 */
export function rightAnglePath(
  corner: { x: number; y: number },
  dir1: { x: number; y: number },
  dir2: { x: number; y: number },
  maxSize = 10,
): string | null {
  const len1 = Math.hypot(dir1.x, dir1.y);
  const len2 = Math.hypot(dir2.x, dir2.y);
  if (len1 < 1e-4 || len2 < 1e-4) return null;

  const size = Math.min(maxSize, Math.min(len1, len2) * 0.35);
  const u1 = { x: (dir1.x / len1) * size, y: (dir1.y / len1) * size };
  const u2 = { x: (dir2.x / len2) * size, y: (dir2.y / len2) * size };

  const p1 = { x: corner.x + u1.x, y: corner.y + u1.y };
  const p2 = { x: corner.x + u1.x + u2.x, y: corner.y + u1.y + u2.y };
  const p3 = { x: corner.x + u2.x, y: corner.y + u2.y };

  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}
