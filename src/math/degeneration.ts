/**
 * src/math/degeneration.ts
 * 统一退化检测系统 — 各模块的 math solver 可复用此模板
 */

export type DegenerationLevel = "danger" | "warning" | "info";

export interface DegenerationReport {
  /** 退化类型标识 */
  type: string;
  /** 退化描述 */
  message: string;
  /** 严重程度 */
  level: DegenerationLevel;
  /** 教学提示（面向学生的解释） */
  hint?: string;
}

export interface DegenerationCheckResult {
  /** 是否处于退化状态 */
  isDegenerate: boolean;
  /** 退化报告列表 */
  reports: DegenerationReport[];
}

/**
 * 退化检测器工厂
 * 为每个模块注册一组退化检查函数，统一返回格式
 */
export class DegenerationChecker {
  private checks: Array<
    (params: Record<string, number>) => DegenerationReport | null
  > = [];

  register(
    check: (params: Record<string, number>) => DegenerationReport | null,
  ) {
    this.checks.push(check);
    return this;
  }

  check(params: Record<string, number>): DegenerationCheckResult {
    const reports = this.checks
      .map((fn) => fn(params))
      .filter((r): r is DegenerationReport => r !== null);

    return {
      isDegenerate: reports.length > 0,
      reports,
    };
  }
}

// ─── 二次函数退化检查器 ──────────────────────────────────────────────────────

export const quadraticChecker = new DegenerationChecker()
  .register((p) => {
    if (Math.abs(p.a ?? 1) < 1e-9) {
      return {
        type: "a_zero",
        message: "当 a = 0 时，函数退化为一次函数（直线）",
        level: "danger",
        hint: "对称轴和顶点坐标不复存在，一元二次方程求根公式失效",
      };
    }
    return null;
  })
  .register((p) => {
    const a = p.a ?? 1,
      b = p.b ?? 0,
      c = p.c ?? 0;
    const delta = b * b - 4 * a * c;
    if (delta < -1e-9 && Math.abs(a) >= 1e-9) {
      return {
        type: "no_real_roots",
        message: "判别式 Δ < 0，抛物线与 x 轴无交点",
        level: "warning",
        hint: "方程在实数范围内无解，但函数仍有最小值/最大值",
      };
    }
    return null;
  })
  .register((p) => {
    const a = p.a ?? 1,
      b = p.b ?? 0,
      c = p.c ?? 0;
    const delta = b * b - 4 * a * c;
    if (Math.abs(delta) <= 1e-9 && Math.abs(a) >= 1e-9) {
      return {
        type: "one_root",
        message: "判别式 Δ = 0，抛物线与 x 轴相切（唯一实根）",
        level: "info",
        hint: "此时顶点恰好落在 x 轴上",
      };
    }
    return null;
  });

// ─── 指对数函数退化检查器（预留） ───────────────────────────────────────────

export const expLogChecker = new DegenerationChecker()
  .register((p) => {
    const a = p.base ?? 2;
    if (a <= 0) {
      return {
        type: "base_non_positive",
        message: `底数 a = ${a} ≤ 0，不满足指数/对数函数定义`,
        level: "danger",
        hint: "指数函数和对数函数要求底数 a > 0 且 a ≠ 1",
      };
    }
    return null;
  })
  .register((p) => {
    const a = p.base ?? 2;
    if (Math.abs(a - 1) < 1e-9) {
      return {
        type: "base_one",
        message: "底数 a = 1，函数退化为常数",
        level: "warning",
        hint: "当 a = 1 时，y = 1ˣ = 1（常函数），失去指数函数特性",
      };
    }
    return null;
  });

// ─── 三角函数退化检查器（预留） ─────────────────────────────────────────────

export const trigChecker = new DegenerationChecker().register((p) => {
  const x = p.x ?? 0;
  const cosVal = Math.cos(x);
  if (Math.abs(cosVal) < 1e-9) {
    return {
      type: "tan_undefined",
      message: `tan(${x.toFixed(2)}) 无定义（cos(x) = 0）`,
      level: "danger",
      hint: "正切函数在 x = π/2 + kπ 处无定义，图像有垂直渐近线",
    };
  }
  return null;
});
