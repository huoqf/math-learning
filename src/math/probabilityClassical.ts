/**
 * 古典概型与有限样本空间纯数学计算层 (Zero Side-effects)
 * 遵循高中课标必修二第十章第二节：有限性与等可能性两大特征、列举法与古典概型计算公式
 */

export type ClassicalModelType =
  "dice_two" | "ball_draw" | "coin_toss" | "gaokao_volunteer";

export interface ClassicalSamplePoint {
  id: string;
  label: string;
  rowIdx: number; // 0-based
  colIdx: number; // 0-based
  xVal?: number | string;
  yVal?: number | string;
  isEvent: boolean;
  tooltip: string;
}

export interface ClassicalTreeNode {
  id: string;
  label: string;
  depth: number;
  isEvent: boolean;
  prob: number;
  parentId?: string;
  childrenIds: string[];
}

export interface ClassicalMathResult {
  modelType: ClassicalModelType;
  totalCount: number; // n(\Omega)
  eventCount: number; // n(A)
  probability: number; // P(A)
  fractionLatex: string;
  reducedFractionLatex: string;
  ratioText: string; // 纯文本形式，如 "6/36 = 1/6" 或 "7/10"，用于 SVG text
  matchedPointsListLatex: string; // 列举的样本点集合，如 "A = \\{(1, 6), (2, 5), \\dots\\}"
  complementCount: number; // n(\bar{A})
  complementProbability: number;
  complementFractionLatex: string;
  samplePoints: ClassicalSamplePoint[];
  treeNodes?: ClassicalTreeNode[];
  isEquiprobable: boolean;
  eventName: string;
  eventDescription: string;
  validity: boolean;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function formatFractionLatex(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) return "0";
  if (numerator === 0) return "0";
  if (numerator === denominator) return "1";
  return `\\frac{${numerator}}{${denominator}}`;
}

export function formatReducedFractionLatex(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) return "0";
  if (numerator === 0) return "0";
  if (numerator === denominator) return "1";
  const g = gcd(numerator, denominator);
  const rn = numerator / g;
  const rd = denominator / g;
  if (g === 1) {
    return `\\frac{${numerator}}{${denominator}}`;
  }
  if (rd === 1) {
    return `${rn}`;
  }
  return `\\frac{${numerator}}{${denominator}} = \\frac{${rn}}{${rd}}`;
}

export function getSimplifiedFraction(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0) return "0";
  if (numerator === 0) return "0";
  if (numerator === denominator) return "1";
  const g = gcd(numerator, denominator);
  const rn = numerator / g;
  const rd = denominator / g;
  if (rd === 1) return `${rn}`;
  return `\\frac{${rn}}{${rd}}`;
}

export interface ClassicalParamsInput {
  modelType: ClassicalModelType;
  targetEvent: string;
  targetSum?: number; // 针对骰子和 2~12
  drawMode?: "without_replacement" | "with_replacement"; // 针对摸球
  redBalls?: number; // 红球数 1~4
  whiteBalls?: number; // 白球数 1~4
}

export function formatRatioText(
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0 || numerator === 0) return "0";
  if (numerator === denominator) return "1";
  const g = gcd(numerator, denominator);
  if (g === 1) return `${numerator}/${denominator}`;
  return `${numerator}/${denominator} = ${numerator / g}/${denominator / g}`;
}

export function buildMatchedPointsLatex(matchedLabels: string[]): string {
  if (matchedLabels.length === 0) return "A = \\emptyset";
  if (matchedLabels.length <= 8) {
    return `A = \\{${matchedLabels.join(", ")}\\}`;
  }
  const head = matchedLabels.slice(0, 4).join(", ");
  const tail = matchedLabels.slice(-2).join(", ");
  return `A = \\{${head}, \\dots, ${tail}\\}`;
}

/**
 * 计算两枚均匀骰子模型 (6x6=36 等可能样本点)
 */
function computeDiceTwo(
  targetEvent: string,
  targetSum: number = 7,
): ClassicalMathResult {
  const points: ClassicalSamplePoint[] = [];
  const matchedLabels: string[] = [];
  let eventCount = 0;
  let eventName = "特定事件 $A$";
  let eventDescription = "";

  const safeSum = Math.min(Math.max(Math.round(targetSum), 2), 12);

  switch (targetEvent) {
    case "sum_k":
      eventName = `点数和等于 $${safeSum}$`;
      eventDescription = `两枚骰子掷出的点数之和恰好为 $${safeSum}$`;
      break;
    case "sum_ge_k":
      eventName = `点数和不小于 $${safeSum}$`;
      eventDescription = `两枚骰子掷出的点数之和满足 $i + j \\ge ${safeSum}$`;
      break;
    case "sum_even":
      eventName = "点数和为偶数";
      eventDescription = "两枚骰子掷出的点数之和为偶数（奇+奇或偶+偶）";
      break;
    case "same":
      eventName = "两枚点数相同";
      eventDescription = "两枚骰子掷出相同的点数，即 $i = j$（对角线样本点）";
      break;
    case "diff_k":
      eventName = "点数之差绝对值为 $1$";
      eventDescription = "两枚骰子点数相差 $1$，即 $|i - j| = 1$";
      break;
    case "at_least_one_six":
      eventName = "至少有一枚出现 $6$ 点";
      eventDescription = "第一枚为 $6$ 点或第二枚为 $6$ 点";
      break;
    case "both_odd":
      eventName = "两枚点数均为奇数";
      eventDescription = "第一枚为奇数且第二枚为奇数";
      break;
    default:
      eventName = `点数和等于 $${safeSum}$`;
      eventDescription = `两枚骰子掷出的点数之和恰好为 $${safeSum}$`;
      break;
  }

  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 6; j++) {
      let isMatch = false;
      switch (targetEvent) {
        case "sum_k":
          isMatch = i + j === safeSum;
          break;
        case "sum_ge_k":
          isMatch = i + j >= safeSum;
          break;
        case "sum_even":
          isMatch = (i + j) % 2 === 0;
          break;
        case "same":
          isMatch = i === j;
          break;
        case "diff_k":
          isMatch = Math.abs(i - j) === 1;
          break;
        case "at_least_one_six":
          isMatch = i === 6 || j === 6;
          break;
        case "both_odd":
          isMatch = i % 2 !== 0 && j % 2 !== 0;
          break;
        default:
          isMatch = i + j === safeSum;
          break;
      }

      if (isMatch) {
        eventCount++;
        matchedLabels.push(`(${i}, ${j})`);
      }

      points.push({
        id: `dice-${i}-${j}`,
        label: `(${i}, ${j})`,
        rowIdx: i - 1,
        colIdx: j - 1,
        xVal: i,
        yVal: j,
        isEvent: isMatch,
        tooltip: `第1枚点数: ${i}, 第2枚点数: ${j}, 和: ${i + j}`,
      });
    }
  }

  const totalCount = 36;
  const prob = eventCount / totalCount;
  const compCount = totalCount - eventCount;

  return {
    modelType: "dice_two",
    totalCount,
    eventCount,
    probability: prob,
    fractionLatex: formatFractionLatex(eventCount, totalCount),
    reducedFractionLatex: formatReducedFractionLatex(eventCount, totalCount),
    ratioText: formatRatioText(eventCount, totalCount),
    matchedPointsListLatex: buildMatchedPointsLatex(matchedLabels),
    complementCount: compCount,
    complementProbability: compCount / totalCount,
    complementFractionLatex: formatReducedFractionLatex(compCount, totalCount),
    samplePoints: points,
    isEquiprobable: true,
    eventName,
    eventDescription,
    validity: true,
  };
}

/**
 * 摸球抽样模型（袋中有红球 R 个、白球 W 个，抽取 2 球）
 */
function computeBallDraw(
  targetEvent: string,
  drawMode: "without_replacement" | "with_replacement" = "without_replacement",
  redBalls: number = 2,
  whiteBalls: number = 3,
): ClassicalMathResult {
  const safeR = Math.max(1, Math.min(4, Math.round(redBalls)));
  const safeW = Math.max(1, Math.min(4, Math.round(whiteBalls)));
  const totalBalls = safeR + safeW;

  // 生成球的标识列表，如 R1, R2, W1, W2, W3
  const balls: {
    id: string;
    displayLabel: string;
    latexLabel: string;
    isRed: boolean;
  }[] = [];
  for (let r = 1; r <= safeR; r++) {
    balls.push({
      id: `R${r}`,
      displayLabel: `R${r}`,
      latexLabel: `R_{${r}}`,
      isRed: true,
    });
  }
  for (let w = 1; w <= safeW; w++) {
    balls.push({
      id: `W${w}`,
      displayLabel: `W${w}`,
      latexLabel: `W_{${w}}`,
      isRed: false,
    });
  }

  const points: ClassicalSamplePoint[] = [];
  let eventCount = 0;

  let eventName = "至少摸到 1 个红球";
  let eventDescription = "抽取的 2 个球中至少有 1 个红球";

  switch (targetEvent) {
    case "at_least_one_red":
      eventName = "至少摸到 $1$ 个红球";
      eventDescription =
        "两球中至少包含一个红球（正难则反：对立事件为全是白球）";
      break;
    case "both_red":
      eventName = "摸到 $2$ 个均为红球";
      eventDescription = "抽取的两球均为红球";
      break;
    case "one_red_one_white":
      eventName = "恰好摸到 $1$ 红 $1$ 白";
      eventDescription = "抽取的两球中一个为红球，另一个为白球";
      break;
    case "both_white":
      eventName = "摸到 $2$ 个均为白球";
      eventDescription = "抽取的两球均为白球";
      break;
    default:
      eventName = "至少摸到 $1$ 个红球";
      eventDescription = "两球中至少包含一个红球";
      break;
  }

  const matchedLabels: string[] = [];
  const isWithoutReplace = drawMode === "without_replacement";

  let row = 0;
  for (let i = 0; i < totalBalls; i++) {
    let col = 0;
    for (let j = 0; j < totalBalls; j++) {
      if (isWithoutReplace && i === j) {
        // 无放回抽取时，同一球不能被抽两次
        continue;
      }
      const b1 = balls[i];
      const b2 = balls[j];
      const redCount = (b1.isRed ? 1 : 0) + (b2.isRed ? 1 : 0);

      let isMatch = false;
      switch (targetEvent) {
        case "at_least_one_red":
          isMatch = redCount >= 1;
          break;
        case "both_red":
          isMatch = redCount === 2;
          break;
        case "one_red_one_white":
          isMatch = redCount === 1;
          break;
        case "both_white":
          isMatch = redCount === 0;
          break;
        default:
          isMatch = redCount >= 1;
          break;
      }

      if (isMatch) {
        eventCount++;
        matchedLabels.push(`(${b1.latexLabel}, ${b2.latexLabel})`);
      }

      points.push({
        id: `ball-${b1.id}-${b2.id}`,
        label: `(${b1.displayLabel}, ${b2.displayLabel})`,
        rowIdx: row,
        colIdx: col,
        xVal: b1.id,
        yVal: b2.id,
        isEvent: isMatch,
        tooltip: `第1次: ${b1.id} (${b1.isRed ? "红球" : "白球"}), 第2次: ${b2.id} (${b2.isRed ? "红球" : "白球"})`,
      });
      col++;
    }
    row++;
  }

  const totalCount = isWithoutReplace
    ? totalBalls * (totalBalls - 1)
    : totalBalls * totalBalls;
  const prob = eventCount / totalCount;
  const compCount = totalCount - eventCount;

  // 构造摸球分步树状图节点 (2 级分支树：起点 -> 第1次 -> 第2次)
  const treeNodes: ClassicalTreeNode[] = [
    {
      id: "root",
      label: "试验开始",
      depth: 0,
      isEvent: true,
      prob: 1,
      childrenIds: ["node-ball-R", "node-ball-W"],
    },
    {
      id: "node-ball-R",
      label: "红球",
      depth: 1,
      isEvent: true,
      prob: safeR / totalBalls,
      parentId: "root",
      childrenIds: ["node-ball-RR", "node-ball-RW"],
    },
    {
      id: "node-ball-W",
      label: "白球",
      depth: 1,
      isEvent: true,
      prob: safeW / totalBalls,
      parentId: "root",
      childrenIds: ["node-ball-WR", "node-ball-WW"],
    },
  ];

  const outcomes2 = [
    { id: "node-ball-RR", label: "红球", red: 2, parent: "node-ball-R" },
    { id: "node-ball-RW", label: "白球", red: 1, parent: "node-ball-R" },
    { id: "node-ball-WR", label: "红球", red: 1, parent: "node-ball-W" },
    { id: "node-ball-WW", label: "白球", red: 0, parent: "node-ball-W" },
  ];

  outcomes2.forEach((leaf) => {
    let isLeafMatch = false;
    switch (targetEvent) {
      case "at_least_one_red":
        isLeafMatch = leaf.red >= 1;
        break;
      case "both_red":
        isLeafMatch = leaf.red === 2;
        break;
      case "one_red_one_white":
        isLeafMatch = leaf.red === 1;
        break;
      case "both_white":
        isLeafMatch = leaf.red === 0;
        break;
      default:
        isLeafMatch = leaf.red >= 1;
        break;
    }
    treeNodes.push({
      id: leaf.id,
      label: leaf.label,
      depth: 2,
      isEvent: isLeafMatch,
      prob: 0.25,
      parentId: leaf.parent,
      childrenIds: [],
    });
  });

  return {
    modelType: "ball_draw",
    totalCount,
    eventCount,
    probability: prob,
    fractionLatex: formatFractionLatex(eventCount, totalCount),
    reducedFractionLatex: formatReducedFractionLatex(eventCount, totalCount),
    ratioText: formatRatioText(eventCount, totalCount),
    matchedPointsListLatex: buildMatchedPointsLatex(matchedLabels),
    complementCount: compCount,
    complementProbability: compCount / totalCount,
    complementFractionLatex: formatReducedFractionLatex(compCount, totalCount),
    samplePoints: points,
    treeNodes,
    isEquiprobable: true,
    eventName,
    eventDescription,
    validity: true,
  };
}

/**
 * 抛掷 3 次硬币树状图模型 (2^3 = 8 个等可能结果)
 */
function computeCoinToss(targetEvent: string): ClassicalMathResult {
  const outcomes = ["H", "T"]; // H: 正面 (Head), T: 反面 (Tail)
  const points: ClassicalSamplePoint[] = [];
  const treeNodes: ClassicalTreeNode[] = [];
  const matchedLabels: string[] = [];

  let eventName = "恰好出现 $2$ 次正面";
  let eventDescription = "三次投掷中正好有两次朝上为正面";

  switch (targetEvent) {
    case "two_heads":
      eventName = "恰好出现 $2$ 次正面";
      eventDescription = "三次抛掷中正面出现次数为 $2$（即 HHT, HTH, THH）";
      break;
    case "at_least_two_heads":
      eventName = "至少出现 $2$ 次正面";
      eventDescription = "三次抛掷中正面出现次数大于等于 $2$";
      break;
    case "three_heads":
      eventName = "三次均为正面";
      eventDescription = "连续三次正面朝上（即 HHH）";
      break;
    case "at_most_one_head":
      eventName = "至多出现 $1$ 次正面";
      eventDescription = "三次抛掷中正面出现次数不超过 $1$ 次";
      break;
    case "first_head":
      eventName = "第一次抛掷为正面";
      eventDescription = "首发命中正面，后两次任意";
      break;
    default:
      eventName = "恰好出现 $2$ 次正面";
      eventDescription = "三次投掷中正好有两次朝上为正面";
      break;
  }

  // 根节点
  treeNodes.push({
    id: "root",
    label: "试验开始",
    depth: 0,
    isEvent: true,
    prob: 1,
    childrenIds: ["node-H", "node-T"],
  });

  // 第1层
  outcomes.forEach((o1) => {
    treeNodes.push({
      id: `node-${o1}`,
      label: o1 === "H" ? "正" : "反",
      depth: 1,
      isEvent: true,
      prob: 0.5,
      parentId: "root",
      childrenIds: [`node-${o1}H`, `node-${o1}T`],
    });

    // 第2层
    outcomes.forEach((o2) => {
      treeNodes.push({
        id: `node-${o1}${o2}`,
        label: o2 === "H" ? "正" : "反",
        depth: 2,
        isEvent: true,
        prob: 0.25,
        parentId: `node-${o1}`,
        childrenIds: [`node-${o1}${o2}H`, `node-${o1}${o2}T`],
      });

      // 第3层 (叶子样本点)
      outcomes.forEach((o3) => {
        const seq = `${o1}${o2}${o3}`;
        const headCount =
          (o1 === "H" ? 1 : 0) + (o2 === "H" ? 1 : 0) + (o3 === "H" ? 1 : 0);

        let isMatch = false;
        switch (targetEvent) {
          case "two_heads":
            isMatch = headCount === 2;
            break;
          case "at_least_two_heads":
            isMatch = headCount >= 2;
            break;
          case "three_heads":
            isMatch = headCount === 3;
            break;
          case "at_most_one_head":
            isMatch = headCount <= 1;
            break;
          case "first_head":
            isMatch = o1 === "H";
            break;
          default:
            isMatch = headCount === 2;
            break;
        }

        treeNodes.push({
          id: `node-${seq}`,
          label: o3 === "H" ? "正" : "反",
          depth: 3,
          isEvent: isMatch,
          prob: 0.125,
          parentId: `node-${o1}${o2}`,
          childrenIds: [],
        });
      });
    });
  });

  // 整理样本点列表
  let eventCount = 0;
  let idx = 0;
  outcomes.forEach((o1) => {
    outcomes.forEach((o2) => {
      outcomes.forEach((o3) => {
        const seq = `${o1}${o2}${o3}`;
        const headCount =
          (o1 === "H" ? 1 : 0) + (o2 === "H" ? 1 : 0) + (o3 === "H" ? 1 : 0);

        let isMatch = false;
        switch (targetEvent) {
          case "two_heads":
            isMatch = headCount === 2;
            break;
          case "at_least_two_heads":
            isMatch = headCount >= 2;
            break;
          case "three_heads":
            isMatch = headCount === 3;
            break;
          case "at_most_one_head":
            isMatch = headCount <= 1;
            break;
          case "first_head":
            isMatch = o1 === "H";
            break;
          default:
            isMatch = headCount === 2;
            break;
        }

        const chineseSeq = `${o1 === "H" ? "正" : "反"}${o2 === "H" ? "正" : "反"}${o3 === "H" ? "正" : "反"}`;
        if (isMatch) {
          eventCount++;
          matchedLabels.push(chineseSeq);
        }

        points.push({
          id: `coin-${seq}`,
          label: chineseSeq,
          rowIdx: Math.floor(idx / 4),
          colIdx: idx % 4,
          isEvent: isMatch,
          tooltip: `第1次: ${o1 === "H" ? "正" : "反"}, 第2次: ${o2 === "H" ? "正" : "反"}, 第3次: ${o3 === "H" ? "正" : "反"} (正面数: ${headCount})`,
        });
        idx++;
      });
    });
  });

  const totalCount = 8;
  const prob = eventCount / totalCount;
  const compCount = totalCount - eventCount;

  return {
    modelType: "coin_toss",
    totalCount,
    eventCount,
    probability: prob,
    fractionLatex: formatFractionLatex(eventCount, totalCount),
    reducedFractionLatex: formatReducedFractionLatex(eventCount, totalCount),
    ratioText: formatRatioText(eventCount, totalCount),
    matchedPointsListLatex: buildMatchedPointsLatex(matchedLabels),
    complementCount: compCount,
    complementProbability: compCount / totalCount,
    complementFractionLatex: formatReducedFractionLatex(compCount, totalCount),
    samplePoints: points,
    treeNodes,
    isEquiprobable: true,
    eventName,
    eventDescription,
    validity: true,
  };
}

/**
 * 高考经典选人模型（3 男 2 女选 2 人，无序组合，C_5^2 = 10 种等可能样本点）
 */
function computeGaokaoVolunteer(targetEvent: string): ClassicalMathResult {
  const members = [
    { id: "M1", label: "男_1", isGirl: false },
    { id: "M2", label: "男_2", isGirl: false },
    { id: "M3", label: "男_3", isGirl: false },
    { id: "W1", label: "女_1", isGirl: true },
    { id: "W2", label: "女_2", isGirl: true },
  ];

  const points: ClassicalSamplePoint[] = [];
  const matchedLabels: string[] = [];
  let eventCount = 0;

  let eventName = "至少有 $1$ 名女生";
  let eventDescription = "选出的 $2$ 名志愿者中至少有 $1$ 名女生";

  switch (targetEvent) {
    case "at_least_one_girl":
      eventName = "至少有 $1$ 名女生";
      eventDescription = "两名志愿者中至少有一名女生（对立事件：全是男生）";
      break;
    case "exactly_one_girl":
      eventName = "恰好有 $1$ 名女生";
      eventDescription = "两名志愿者中一男一女";
      break;
    case "all_boys":
      eventName = "全是男生";
      eventDescription = "两名志愿者均为男生";
      break;
    case "all_girls":
      eventName = "全是女生";
      eventDescription = "两名志愿者均为女生";
      break;
    default:
      eventName = "至少有 $1$ 名女生";
      eventDescription = "两名志愿者中至少有一名女生";
      break;
  }

  let idx = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const m1 = members[i];
      const m2 = members[j];
      const girlCount = (m1.isGirl ? 1 : 0) + (m2.isGirl ? 1 : 0);

      let isMatch = false;
      switch (targetEvent) {
        case "at_least_one_girl":
          isMatch = girlCount >= 1;
          break;
        case "exactly_one_girl":
          isMatch = girlCount === 1;
          break;
        case "all_boys":
          isMatch = girlCount === 0;
          break;
        case "all_girls":
          isMatch = girlCount === 2;
          break;
        default:
          isMatch = girlCount >= 1;
          break;
      }

      if (isMatch) {
        eventCount++;
        matchedLabels.push(`(${m1.label}, ${m2.label})`);
      }

      points.push({
        id: `vol-${m1.id}-${m2.id}`,
        label: `(${m1.label}, ${m2.label})`,
        rowIdx: Math.floor(idx / 5),
        colIdx: idx % 5,
        isEvent: isMatch,
        tooltip: `组员: ${m1.label} 与 ${m2.label} (女生数: ${girlCount})`,
      });
      idx++;
    }
  }

  const totalCount = 10;
  const prob = eventCount / totalCount;
  const compCount = totalCount - eventCount;

  return {
    modelType: "gaokao_volunteer",
    totalCount,
    eventCount,
    probability: prob,
    fractionLatex: formatFractionLatex(eventCount, totalCount),
    reducedFractionLatex: formatReducedFractionLatex(eventCount, totalCount),
    ratioText: formatRatioText(eventCount, totalCount),
    matchedPointsListLatex: buildMatchedPointsLatex(matchedLabels),
    complementCount: compCount,
    complementProbability: compCount / totalCount,
    complementFractionLatex: formatReducedFractionLatex(compCount, totalCount),
    samplePoints: points,
    isEquiprobable: true,
    eventName,
    eventDescription,
    validity: true,
  };
}

/**
 * 纯数学统一入口
 */
export function computeClassicalProbability(
  params: ClassicalParamsInput,
): ClassicalMathResult {
  switch (params.modelType) {
    case "dice_two":
      return computeDiceTwo(params.targetEvent, params.targetSum);
    case "ball_draw":
      return computeBallDraw(
        params.targetEvent,
        params.drawMode,
        params.redBalls,
        params.whiteBalls,
      );
    case "coin_toss":
      return computeCoinToss(params.targetEvent);
    case "gaokao_volunteer":
      return computeGaokaoVolunteer(params.targetEvent);
    default:
      return computeDiceTwo("sum_k", 7);
  }
}
