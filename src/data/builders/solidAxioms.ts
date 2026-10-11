import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculatePlaneDetermination,
  calculatePlaneIntersection,
  calculateSpatialLinesAndAngles,
} from "@/math3d/solidAxioms";

export function buildSolidAxiomsPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "determination"; // "determination" | "intersection" | "spatialLines"
  const subType =
    (config?.subType as
      "threePoints" | "lineAndPoint" | "intersectingLines" | "parallelLines") ??
    "threePoints";
  /** 等角定理"对应边反向"开关（仅 spatialLines 模式生效），须与中屏同源 */
  const flipSecondRay = (config?.flipSecondRay as boolean) ?? false;

  const tParam = params.tParam ?? 0;
  const tiltDeg = params.tiltDeg ?? 35;
  const angleParamDeg = params.angleParamDeg ?? 60;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];

  if (mode === "determination") {
    const res = calculatePlaneDetermination(subType, tParam);

    quantities.push(
      {
        label: "确定平面构型",
        value:
          subType === "threePoints"
            ? "不共线三点 $A, B, C$"
            : subType === "lineAndPoint"
              ? "直线 $l$ 与线外一点 $C$"
              : subType === "intersectingLines"
                ? "两相交直线 $l_1 \\cap l_2 = A$"
                : "两平行直线 $l_1 \\parallel l_2$",
        color: MATH_COLORS.highlight,
      },
      {
        label: "平面单位法向量 $\\vec{n}$",
        symbol: "\\vec{n}",
        value: `(${res.plane.normal.x.toFixed(2)}, \\; ${res.plane.normal.y.toFixed(2)}, \\; ${res.plane.normal.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "测试点高度偏移量",
        symbol: "\\Delta z",
        value: tParam.toFixed(2),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "点到平面有向距离",
        symbol: "d(P, \\alpha)",
        value: res.distanceToPlane.toFixed(3),
        color: res.isCoplanar
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
      },
      {
        label: "共面性判定结论",
        value: res.isCoplanar
          ? "动点 P 属于平面 α (共面 ✓)"
          : "动点 P 位于平面 α 外 (不共面 ✗)",
        color: res.isCoplanar
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "两点确定一条直线（初中知识 · 推论辅助前提）",
        latex: `A, B \\in l \\implies l \\text{ 存在且唯一}`,
        level: "important",
        condition:
          "初中学段内容，教材仅将其作为三个推论的辅助前提，不占用「基本事实」编号",
      },
      {
        name: "基本事实 1（平面的唯一确定性）",
        latex: `A, B, C \\text{ 不共线 } \\implies \\text{平面 } ABC \\text{ 存在且唯一}`,
        level: "core",
        condition: "过不在一条直线上的三个点，有且只有一个平面",
      },
      {
        name: "基本事实 2（直线在平面内的判定）",
        latex: `A \\in l, \\; B \\in l, \\; A \\in \\alpha, \\; B \\in \\alpha \\implies l \\subset \\alpha`,
        level: "core",
        condition:
          "如果一条直线上的两个点在一个平面内，那么这条直线在这个平面内",
      },
      {
        name: "确定平面的三个推论",
        latex: `\\begin{cases} l \\text{ 与 } P \\notin l \\implies \\text{确定唯一平面} \\\\ l_1 \\cap l_2 = P \\implies \\text{确定唯一平面} \\\\ l_1 \\parallel l_2 \\implies \\text{确定唯一平面} \\end{cases}`,
        level: "important",
        condition: "由基本事实 1 与基本事实 2，结合两点确定一条直线推出",
      },
    );

    warnings.push({
      text: "【高考易错警示】若三点共线（如 $A, B, C$ 位于同一直线上），则过这三点有无数个平面（如旋转的书页），无法唯一确定平面！",
      level: "warning",
    });

    gaokaoPoints.push(
      {
        text: "【客观题高频真题】空间四点至多确定几个平面？若四点不共面，则任意三点确定一个平面，共有 $C_4^3 = 4$ 个平面（四面体四个面）；若四点共面，则确定 1 个平面；若三点共线，则可确定 1 个或无数个平面。",
        importance: "gaokao",
      },
      {
        text: "【证明点线共面规范】证明多点共面或两线共面时，先由两条相交/平行直线（或不共线三点）确定一个平面 $\\alpha$（基本事实 1 及推论），再证明剩余点或线落在平面 $\\alpha$ 内（基本事实 2）。",
        importance: "gaokao",
      },
    );

    const [ptA, ptB, ptC] = res.referencePoints;
    const vABx = Number((ptB.x - ptA.x).toFixed(1));
    const vABy = Number((ptB.y - ptA.y).toFixed(1));
    const vACx = Number((ptC.x - ptA.x).toFixed(1));
    const vACy = Number((ptC.y - ptA.y).toFixed(1));
    const crossZ = Number((vABx * vACy - vABy * vACx).toFixed(2));

    const step1Detail =
      subType === "threePoints"
        ? "选取不在同一直线上的三点 $A, B, C$，由基本事实 1，空间中存在唯一的平面 $\\alpha$ 包含上述要素。"
        : subType === "lineAndPoint"
          ? "选取直线上的基准点 $A, B$ 及线外一点 $C$，由推论 1，空间中存在唯一的平面 $\\alpha$ 包含上述要素。"
          : subType === "intersectingLines"
            ? "选取相交直线上的公共交点 $A$ 及两线上的点 $B, C$，由推论 2，空间中存在唯一的平面 $\\alpha$ 包含两相交直线。"
            : "选取两条平行直线上的基准点 $A, B$ 与 $C$，由推论 3，空间中存在唯一的平面 $\\alpha$ 包含两平行直线。";

    reasoningSteps.push(
      {
        step: 1,
        title: "确定基准平面要素",
        detail: step1Detail,
        latex: `\\vec{AB} = (${vABx}, ${vABy}, 0), \\quad \\vec{AC} = (${vACx}, ${vACy}, 0) \\implies \\vec{n}_0 = \\vec{AB} \\times \\vec{AC} = (0, 0, ${crossZ}), \\quad \\vec{n} = \\frac{\\vec{n}_0}{|\\vec{n}_0|} = (${res.plane.normal.x.toFixed(2)}, ${res.plane.normal.y.toFixed(2)}, ${res.plane.normal.z.toFixed(2)})`,
      },
      {
        step: 2,
        title: "代入平面方程检验点位归属",
        detail:
          "由法向量建立平面方程 $\\alpha: z = 0$。动点 $P$ 的坐标代入方程，距离 $d = |z_P|$。",
        latex: `d = |0 \\cdot x_P + 0 \\cdot y_P + 1 \\cdot z_P| = |\\Delta z| = ${Math.abs(tParam).toFixed(2)}`,
      },
      {
        step: 3,
        title: "得出判定结论",
        detail:
          "当且仅当 $\\Delta z = 0$ 时，点 $P$ 位于基准平面内，四点共面成立。",
        latex: `\\Delta z = ${tParam.toFixed(2)} \\implies P ${res.isCoplanar ? "\\in" : "\\notin"} \\text{平面 } \\alpha`,
      },
    );
  } else if (mode === "intersection") {
    const res = calculatePlaneIntersection(tiltDeg);

    quantities.push(
      {
        label: "平面 α 法向量",
        symbol: "\\vec{n}_\\alpha",
        value: "(0.00, 0.00, 1.00)",
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "平面 β 倾斜角",
        symbol: "\\theta",
        value: `${tiltDeg}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "两平面二面角",
        symbol: "\\angle(\\alpha, \\beta)",
        value: `${res.dihedralDeg.toFixed(1)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "交线 $l$ 方向向量",
        symbol: "\\vec{u}_l",
        value: `(${res.lineDirection.x.toFixed(2)}, ${res.lineDirection.y.toFixed(2)}, ${res.lineDirection.z.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "公共点归属状态",
        value: res.isPointOnIntersectionLine
          ? "公共点严格落在交线上 ✓"
          : "不在交线上",
        color: res.isPointOnIntersectionLine
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "基本事实 3（两平面的交线定理）",
        latex: `\\alpha \\cap \\beta \\neq \\emptyset \\implies \\alpha \\cap \\beta = l \\quad (\\text{过公共点的直线 } l \\text{ 唯一})`,
        level: "core",
        condition:
          "如果两个不重合的平面有一个公共点，那么它们有且只有一条过该点的公共直线",
      },
      {
        name: "两平面交线推论（共线定理）",
        latex: `P \\in \\alpha \\land P \\in \\beta \\implies P \\in (\\alpha \\cap \\beta)`,
        level: "important",
        condition: "两个平面的所有公共点都必位于它们的公共交线上",
      },
    );

    gaokaoPoints.push(
      {
        text: "【截面辅助线作图通法】立体几何作截面时，若要找截面与某个面的交线，只需找到两个公共点，连结即得唯一交线（基本事实 3 的直接应用）。",
        importance: "gaokao",
      },
      {
        text: "【三线共点证明法】若三条直线两两相交且不共面，证明它们交于一点的通法：先取两条直线交点 $P$，说明 $P$ 为两个平面的公共点，再由基本事实 3 得 $P$ 在交线上。",
        importance: "gaokao",
      },
    );
  } else {
    // spatialLines
    const res = calculateSpatialLinesAndAngles(angleParamDeg, flipSecondRay);
    const { relation } = res.equalAngleCheck;

    quantities.push(
      {
        label: "直线 $l_1$ 方向向量",
        symbol: "\\vec{u}_1",
        value: `(${res.dir1.x.toFixed(2)}, ${res.dir1.y.toFixed(2)}, ${res.dir1.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "直线 $l_2$ 方向向量",
        symbol: "\\vec{u}_2",
        value: `(${res.dir2.x.toFixed(2)}, ${res.dir2.y.toFixed(2)}, ${res.dir2.z.toFixed(2)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "基准角 $\\angle AOB$",
        symbol: "\\alpha",
        value: `${res.angle1Deg.toFixed(1)}°`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: `平移角 $\\angle A'O'B'$（对应边${flipSecondRay ? "反向" : "同向"}）`,
        symbol: "\\alpha'",
        value: `${res.angle2Deg.toFixed(1)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "等角定理结论",
        value:
          relation === "equal"
            ? `两角相等 (${res.angle1Deg.toFixed(1)}° = ${res.angle2Deg.toFixed(1)}°)`
            : relation === "supplementary"
              ? `两角互补 (${res.angle1Deg.toFixed(1)}° + ${res.angle2Deg.toFixed(1)}° = 180.0°)`
              : "两角既不相等也不互补",
        color: MATH_COLORS.highlight,
      },
      {
        label: "平行传递性判定 ($l_1 \\parallel l_2 \\parallel l_3$)",
        value:
          res.isParallel12 && res.isParallel23 && res.isParallel13
            ? "平行传递性严格成立 ✓"
            : "不成立",
        color:
          res.isParallel12 && res.isParallel23 && res.isParallel13
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "基本事实 4（平行公理 · 空间平行传递性）",
        latex: `a \\parallel b, \\; b \\parallel c \\implies a \\parallel c`,
        level: "core",
        condition: "平行于同一条直线的两条直线平行",
      },
      {
        name: "空间等角定理",
        latex: `OA \\parallel O'A', \\; OB \\parallel O'B' \\implies \\angle AOB = \\angle A'O'B' \\;\\text{或}\\; \\angle AOB + \\angle A'O'B' = 180^\\circ`,
        level: "core",
        condition:
          "如果空间中两个角的两条边分别对应平行，那么这两个角相等或互补",
      },
      {
        name: "异面直线所成角定义与范围",
        latex: `\\theta \\in \\left(0^\\circ, \\; 90^\\circ\\right], \\quad \\cos\\theta = \\frac{|\\vec{u}_1 \\cdot \\vec{u}_2|}{|\\vec{u}_1||\\vec{u}_2|}`,
        level: "important",
        condition:
          "经过空间任一点 $O$ 分别作两条异面直线的平行线，所成的锐角或直角称为异面直线所成的角",
      },
    );

    warnings.push({
      text: flipSecondRay
        ? "【易错警示】等角定理的完整表述是「相等**或**互补」。判断时必须看清两边的**射线方向**：只有当对照组的两条边与基准组对应边**同向**时，两角才一定相等；反向则互补。"
        : "【易错警示】等角定理只说「两个角相等或互补」，并未断言一定相等。切换为「反向」分支即可看到互补情形，这也是高考判断题最常设的陷阱。",
      level: "warning",
    });

    gaokaoPoints.push({
      text: "【异面直线所成角作图法】平移法是求异面直线夹角的基本几何方法：① 在其中一条直线上选一点（通常为棱的中点或端点）作另一条直线的平行线；② 在构成的三角形中用余弦定理求解；③ 结果必须取锐角或直角（若余弦值为负需取相反数）。",
      importance: "gaokao",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined,
  };
}
