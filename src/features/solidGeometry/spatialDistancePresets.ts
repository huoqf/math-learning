import type { SpatialDistanceMode } from "@/data/types";

/**
 * 空间距离实验室的「典型情景预设」与「TipCard 导引文案」数据层。
 *
 * 与 `SpatialDistanceAnimation.tsx` 分离的原因：这两个纯函数既服务于组件，
 * 又被公式合法性回归测试（`src/test/spatialDistanceFormulaCheck.test.ts`）直接引用——
 * 测试必须消费**同一份**源数据，严禁在测试里另抄一份 preset key 与文案，
 * 否则源文案改动后测试仍会全绿（假覆盖）。
 *
 * 若把它们留在动画组件文件里导出，会触发 `react-refresh/only-export-components`
 * （组件文件只应导出组件），故独立成模块。
 */

/** 与数据层统一词表同源（SSOT），严禁在此另立一套字符串取值 */
export type DistanceMode = SpatialDistanceMode;

export interface SpatialDistancePreset {
  key: string;
  label: string;
  params: Record<string, number>;
}

/**
 * 典型情景预设（SSOT）：组件与 LaTeX 合法性回归测试共用同一份定义，
 * 严禁测试侧另抄一份 preset key 清单——否则新增情景时测试会静默漏测。
 */
export function getSpatialDistancePresets(
  mode: DistanceMode,
  optimal: { lambda: number; mu: number },
): SpatialDistancePreset[] {
  const presetsByMode: Record<DistanceMode, SpatialDistancePreset[]> = {
    skewDistance: [
      {
        key: "free",
        label: "自由探索",
        params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
      },
      {
        key: "cube",
        label: "正方体面对角线",
        params: { a: 2.5, b: 2.5, c: 2.5, lambda: 0.67, mu: 0.33 },
      },
      {
        key: "sideEdge",
        label: "侧棱与面对角线",
        params: { a: 4, b: 3, c: 3, lambda: 0.0, mu: 0.64 },
      },
      {
        key: "goldenPerp",
        label: "公垂线极值点",
        params: { a: 3, b: 2, c: 2, ...optimal },
      },
    ],
    pointPlaneDistance: [
      {
        key: "free",
        label: "自由探索",
        params: { a: 3, b: 2, c: 2, lambda: 0.6, mu: 0.4 },
      },
      {
        key: "cubeThird",
        label: "正方体三分对角线",
        params: { a: 2.5, b: 2.5, c: 2.5, lambda: 1.0, mu: 0.4 },
      },
      {
        key: "midSection",
        label: "中点截面构型",
        params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
      },
    ],
    volumeExtrema: [
      {
        key: "free",
        label: "自由探索",
        params: { a: 3, b: 2, c: 2, lambda: 0.6, mu: 0.4 },
      },
      {
        key: "maxVolume",
        label: "顶点极大值构型",
        params: { a: 3, b: 2, c: 2, lambda: 1.0, mu: 0.4 },
      },
      {
        key: "midVolume",
        label: "中点半体积分点",
        params: { a: 3, b: 2, c: 2, lambda: 0.5, mu: 0.4 },
      },
    ],
  };
  return presetsByMode[mode] ?? presetsByMode.skewDistance;
}

/**
 * 左屏 TipCard 教学导引文案（高考真题设问随「研究模式 × 典型情景」100% 动态特化）。
 * 抽为模块级纯函数：既服务于组件，也被公式合法性回归测试直接引用，
 * 杜绝"测试内复制一份文案"造成的假覆盖（源文案改动后测试仍全绿）。
 */
export function getSpatialDistanceTip(
  mode: DistanceMode,
  preset: string,
): string {
  if (mode === "skewDistance") {
    switch (preset) {
      case "cube":
        return "【初始条件】在正方体 $ABCD-A_1B_1C_1D_1$ 中，考察面对角线 $A_1B$ 与 $AC$（棱长为 $a$）。\n\n【核心设问】\n(1) 求异面直线 $A_1B$ 与 $AC$ 所成的角（证明为 $60^\\circ$）以及公垂线段长度；\n(2) 过直线 $AC$ 作平行于 $A_1B$ 的平面 $ACD_1$，验证两异面直线距离转化为点 $B$ 到该平面的距离。";
      case "sideEdge":
        return "【初始条件】在长方体 $ABCD-A_1B_1C_1D_1$ 中，直线 1 为侧棱 $BB_1$，直线 2 为底面对角线 $AC$。\n\n【核心设问】\n(1) 设动点 $P \\in BB_1, Q \\in AC$，求线段 $PQ$ 最小时两动点的参数解与极小值；\n(2) 证明公垂足 $H_2$ 为原点在对角线 $AC$ 上的正投影，侧棱到截面 $ACC_1A_1$ 的垂线即为公垂线。";
      case "goldenPerp":
        return "【初始条件】长方体中两异面直线上的动点 $P(\\lambda), Q(\\mu)$ 恰处于极值解位置。\n\n【核心设问】\n(1) 检验动线段 $\\vec{PQ}$ 是否同时垂直于两直线方向向量（$\\vec{PQ} \\cdot \\vec{u} = 0$ 且 $\\vec{PQ} \\cdot \\vec{v} = 0$）；\n(2) 比较二元二次型极值分析法与空间向量正投影法在求解公垂线时的等价性。";
      default:
        return "【初始条件】长方体中动点 $P$ 在直线 $l_1$ 上滑动，动点 $Q$ 在直线 $l_2$ 上滑动。\n\n【核心设问】\n(1) 自由拖拽动点 $P, Q$，观察动线段 $PQ$ 的长度变化与极值临界点；\n(2) 开启“化归平行转化平面”开关，观察两异面直线距离如何转化为线面距离与点面距离。";
    }
  }
  if (mode === "pointPlaneDistance") {
    switch (preset) {
      case "cubeThird":
        return "【初始条件】在棱长为 $a$ 的正方体中，动点 $E$ 位于侧棱顶点 $A_1$（$\\lambda = 1.0$），截面为 $\\triangle A_1BD$。\n\n【核心设问】\n(1) 求平面 $A_1BD$ 的法向量与原点 $A$ 到该平面的垂线距离 $d$；\n(2) 证明体对角线 $AC_1$ 垂直于截面 $A_1BD$，且截面恰好将体对角线三等分（$d = \\frac{\\sqrt{3}}{3}a$）。";
      case "midSection":
        return "【初始条件】动点 $E$ 位于侧棱 $AA_1$ 的中点（$\\lambda = 0.5$），截面为 $\\triangle BDE$。\n\n【核心设问】\n(1) 求截面 $\\triangle BDE$ 的面积与原点 $A$ 到该平面的距离；\n(2) 比较等体积法 $V_{A-BDE} = V_{E-ABD}$ 与坐标向量投影法的计算效率。";
      default:
        return "【初始条件】长方体底面尺寸为 $a, b$，侧棱高为 $c$，动点 $E$ 在侧棱 $AA_1$ 上滑动（$AE = \\lambda c$）。\n\n【核心设问】\n(1) 建立空间直角坐标系，求平面 $BDE$ 的法向量 $\\vec{n}$ 与原点 $A$ 到平面的垂线距离 $d$；\n(2) 利用三棱锥等体积公式 $V_{A-BDE} = V_{E-ABD}$ 反求高线 $d$，验证向量法与等体积法的对账一致性。";
    }
  }
  // volumeExtrema
  switch (preset) {
    case "maxVolume":
      return "【初始条件】三棱锥 $E-ABD$ 的顶点 $E$ 滑动至侧棱顶端 $A_1$（$\\lambda = 1.0$）。\n\n【核心设问】\n(1) 求三棱锥的最大体积，验证其与长方体总体积的固定比值（$V = \\frac{1}{6}abc$）；\n(2) 分析当底面积固定时，三棱锥体积随高线线性单调递增的几何本质。";
    case "midVolume":
      return "【初始条件】动点 $E$ 位于侧棱中点（$\\lambda = 0.5$）。\n\n【核心设问】\n(1) 计算此时三棱锥体积与长方体容积之比（$\\frac{1}{12}$）；\n(2) 探究截面截长方体所形成的两个多面体体积比。";
    default:
      return "【初始条件】三棱锥 $E-ABD$ 底面 $\\triangle ABD$ 位于长方体底面，顶点 $E$ 沿棱 $AA_1$ 滑动。\n\n【核心设问】\n(1) 探究当分点比例 $\\lambda$ 变化时，三棱锥体积与高线的线性关系；\n(2) 分析底面积不变情况下，棱锥体积与动点空间距离的单调性本质。";
  }
}
