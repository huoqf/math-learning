/**
 * 计数原理与二项式定理 - 纯数学计算逻辑
 * 无 React/DOM/window 依赖，纯逻辑函数
 */

/** 阶乘计算 */
export function factorial(n: number): number {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

/** 排列数 A_n^m */
export function perm(n: number, m: number): number {
  if (n < 0 || m < 0 || m > n) return 0;
  return factorial(n) / factorial(n - m);
}

/** 组合数 C_n^m */
export function comb(n: number, m: number): number {
  if (n < 0 || m < 0 || m > n) return 0;
  return factorial(n) / (factorial(m) * factorial(n - m));
}

/** 生成 N 层的杨辉三角 (0 <= row <= maxRows) */
export function getPascalTriangle(maxRows: number): number[][] {
  const triangle: number[][] = [];
  for (let n = 0; n <= maxRows; n++) {
    const row: number[] = [];
    for (let k = 0; k <= n; k++) {
      row.push(comb(n, k));
    }
    triangle.push(row);
  }
  return triangle;
}

/** 杨辉三角高级性质与恒等式分析 */
export interface PascalProperties {
  maxIndices: number[]; // 最大二项式系数的 k 索引
  maxValue: number;
  hockeyStick: {
    points: { r: number; c: number }[]; // 沿斜线求和的点
    target: { r: number; c: number }; // 拐角处等于的和
  };
}

export function getPascalProperties(
  n: number,
  selectedK: number,
): PascalProperties {
  const safeN = Math.max(0, Math.floor(n));
  const safeK = Math.min(Math.max(0, Math.floor(selectedK)), safeN);

  // 最大二项式系数位置
  const maxIndices =
    safeN % 2 === 0 ? [safeN / 2] : [(safeN - 1) / 2, (safeN + 1) / 2];
  const maxValue = comb(safeN, maxIndices[0]);

  // 曲棍球棒恒等式：从 (safeK, safeK) 沿同一列 c=safeK 向下加到 (safeN, safeK)，和等于 (safeN + 1, safeK + 1)
  const hockeyPoints: { r: number; c: number }[] = [];
  const maxRowForHockey = Math.min(safeN, 7);
  const hockeyCol = Math.min(safeK, maxRowForHockey);
  for (let r = hockeyCol; r <= maxRowForHockey; r++) {
    hockeyPoints.push({ r, c: hockeyCol });
  }

  return {
    maxIndices,
    maxValue,
    hockeyStick: {
      points: hockeyPoints,
      target: { r: maxRowForHockey + 1, c: hockeyCol + 1 },
    },
  };
}

export interface BinomialTermInfo {
  k: number;
  binomialCoeff: number; // C_n^k
  termCoeff: number; // C_n^k * a^(n-k) * b^k
  powerA: number; // n-k
  powerB: number; // k
  latexTerm: string; // T_{k+1} 简易 KaTeX
}

/**
 * 计算 (a*x + b)^n 中第 k+1 项 (即 C_n^k (ax)^(n-k) b^k) 的具体数值与系数
 */
export function getBinomialTerm(
  n: number,
  k: number,
  a: number,
  b: number,
): BinomialTermInfo {
  const c = comb(n, k);
  const powerA = n - k;
  const powerB = k;
  const termCoeff = c * Math.pow(a, powerA) * Math.pow(b, powerB);

  // 拼接 Latex 字符串
  let latexTerm = `T_{${k + 1}} = `;
  latexTerm += `\\binom{${n}}{${k}} \\cdot `;
  if (a !== 1) {
    latexTerm += `(${a})^{${powerA}} `;
  } else if (powerA > 0) {
    latexTerm += `1^{${powerA}} `;
  }

  if (b !== 1) {
    latexTerm += `(${b})^{${powerB}} `;
  } else if (powerB > 0) {
    latexTerm += `1^{${powerB}} `;
  }

  latexTerm += `x^{${powerA}} = ${Number.isInteger(termCoeff) ? termCoeff : termCoeff.toFixed(2)} x^{${powerA}}`;

  return {
    k,
    binomialCoeff: c,
    termCoeff,
    powerA,
    powerB,
    latexTerm,
  };
}

/** 获取 (ax+b)^n 所有展开项 */
export function getAllBinomialTerms(
  n: number,
  a: number,
  b: number,
): BinomialTermInfo[] {
  const terms: BinomialTermInfo[] = [];
  for (let k = 0; k <= n; k++) {
    terms.push(getBinomialTerm(n, k, a, b));
  }
  return terms;
}

/** 赋值法评估结果 */
export interface AssignmentResult {
  xValue: number;
  name: string;
  latexExpr: string;
  evaluatedValue: number;
  description: string;
  itemValues: { k: number; val: number; power: number }[];
}

/** 评估常用赋值法结果 */
export function evaluateAssignments(
  n: number,
  a: number,
  b: number,
): Record<string, AssignmentResult> {
  const terms = getAllBinomialTerms(n, a, b);

  // 1. x = 1 所有系数之和
  const valX1 = Math.pow(a + b, n);
  const itemsX1 = terms.map((t) => ({
    k: t.k,
    val: t.termCoeff,
    power: t.powerA,
  }));

  // 2. x = -1 交错系数和
  const valXNeg1 = Math.pow(-a + b, n);
  const itemsXNeg1 = terms.map((t) => ({
    k: t.k,
    val: t.termCoeff * Math.pow(-1, t.powerA),
    power: t.powerA,
  }));

  // 3. x = 0 常数项
  const valX0 = Math.pow(b, n);
  const itemsX0 = terms.map((t) => ({
    k: t.k,
    val: t.powerA === 0 ? t.termCoeff : 0,
    power: t.powerA,
  }));

  // 4. 偶次项系数和
  const valEven = (valX1 + valXNeg1) / 2;
  // 5. 奇次项系数和
  const valOdd = (valX1 - valXNeg1) / 2;

  // 6. 导数赋值法 f'(1) = sum k * a_k
  // f(x) = (ax+b)^n => f'(x) = n * a * (ax+b)^(n-1)
  const valDerivative = n > 0 ? n * a * Math.pow(a + b, n - 1) : 0;

  return {
    sum_all: {
      xValue: 1,
      name: "全部系数和 (令 x = 1)",
      latexExpr: `f(1) = (${a} + ${b})^{${n}} = ${valX1}`,
      evaluatedValue: valX1,
      description: `各项展开项系数相加：a_0 + a_1 + \\dots + a_n = (${a}+${b})^n`,
      itemValues: itemsX1,
    },
    sum_alt: {
      xValue: -1,
      name: "奇偶交错和 (令 x = -1)",
      latexExpr: `f(-1) = (${-a} + ${b})^{${n}} = ${valXNeg1}`,
      evaluatedValue: valXNeg1,
      description: `各项正负交替相加：a_0 - a_1 + a_2 - \\dots = (-${a}+${b})^n`,
      itemValues: itemsXNeg1,
    },
    sum_even: {
      xValue: 1,
      name: "偶次项系数和",
      latexExpr: `\\frac{f(1) + f(-1)}{2} = ${Number.isInteger(valEven) ? valEven : valEven.toFixed(2)}`,
      evaluatedValue: valEven,
      description: "偶次项系数之和：a_0 + a_2 + a_4 + \\dots",
      itemValues: terms.map((t) => ({
        k: t.k,
        val: t.powerA % 2 === 0 ? t.termCoeff : 0,
        power: t.powerA,
      })),
    },
    sum_odd: {
      xValue: 1,
      name: "奇次项系数和",
      latexExpr: `\\frac{f(1) - f(-1)}{2} = ${Number.isInteger(valOdd) ? valOdd : valOdd.toFixed(2)}`,
      evaluatedValue: valOdd,
      description: "奇次项系数之和：a_1 + a_3 + a_5 + \\dots",
      itemValues: terms.map((t) => ({
        k: t.k,
        val: t.powerA % 2 !== 0 ? t.termCoeff : 0,
        power: t.powerA,
      })),
    },
    derivative: {
      xValue: 1,
      name: "导数加权和 (f'(1))",
      latexExpr: `f'(1) = ${n} \\cdot ${a} \\cdot (${a}+${b})^{${Math.max(0, n - 1)}} = ${valDerivative}`,
      evaluatedValue: valDerivative,
      description: "两边求导赋值令 x=1：\\sum k a_k = f'(1)",
      itemValues: terms.map((t) => ({
        k: t.k,
        val: t.powerA * t.termCoeff,
        power: t.powerA,
      })),
    },
    constant: {
      xValue: 0,
      name: "常数项 (令 x = 0)",
      latexExpr: `f(0) = (${b})^{${n}} = ${valX0}`,
      evaluatedValue: valX0,
      description: `展开式中的常数项（x^0 的系数）：b^n = ${valX0}`,
      itemValues: itemsX0,
    },
  };
}

/** 树状决策图节点结构 */
export interface TreeNodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
}

export interface TreeEdgeData {
  id: string;
  from: string;
  to: string;
  label?: string;
}

/** 构建分步乘法决策树模型 */
export function buildMultiplicationTree(
  m1: number,
  m2: number,
  m3: number = 0,
): { nodes: TreeNodeData[]; edges: TreeEdgeData[] } {
  const nodes: TreeNodeData[] = [];
  const edges: TreeEdgeData[] = [];

  // Root
  nodes.push({ id: "root", label: "起点", x: 0, y: 0, depth: 0 });

  // Level 1: m1 个分支
  for (let i = 0; i < m1; i++) {
    const id1 = `L1_${i}`;
    nodes.push({
      id: id1,
      label: `步骤1: 选项${i + 1}`,
      x: 1,
      y: i,
      depth: 1,
      parentId: "root",
    });
    edges.push({
      id: `e_root_${id1}`,
      from: "root",
      to: id1,
      label: `分步1-${i + 1}`,
    });

    // Level 2: m2 个分支
    if (m2 > 0) {
      for (let j = 0; j < m2; j++) {
        const id2 = `L2_${i}_${j}`;
        nodes.push({
          id: id2,
          label: `步骤2: 选项${j + 1}`,
          x: 2,
          y: i * m2 + j,
          depth: 2,
          parentId: id1,
        });
        edges.push({
          id: `e_${id1}_${id2}`,
          from: id1,
          to: id2,
          label: `分步2-${j + 1}`,
        });

        // Level 3: m3 个分支 (若有)
        if (m3 > 0) {
          for (let k = 0; k < m3; k++) {
            const id3 = `L3_${i}_${j}_${k}`;
            nodes.push({
              id: id3,
              label: `结果${i * m2 * m3 + j * m3 + k + 1}`,
              x: 3,
              y: (i * m2 + j) * m3 + k,
              depth: 3,
              parentId: id2,
            });
            edges.push({ id: `e_${id2}_${id3}`, from: id2, to: id3 });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

/** 构建分类加法决策模型 */
export function buildAdditionTree(
  m1: number,
  m2: number,
): { nodes: TreeNodeData[]; edges: TreeEdgeData[] } {
  const nodes: TreeNodeData[] = [];
  const edges: TreeEdgeData[] = [];

  nodes.push({ id: "root", label: "任务起点", x: 0, y: 0, depth: 0 });

  // 类别 1: m1 个独立方法
  for (let i = 0; i < m1; i++) {
    const id1 = `Cat1_${i}`;
    nodes.push({
      id: id1,
      label: `类别Ⅰ-方法${i + 1}`,
      x: 1,
      y: i,
      depth: 1,
      parentId: "root",
    });
    edges.push({ id: `e_root_${id1}`, from: "root", to: id1, label: `类别Ⅰ` });
  }

  // 类别 2: m2 个独立方法
  for (let j = 0; j < m2; j++) {
    const id2 = `Cat2_${j}`;
    nodes.push({
      id: id2,
      label: `类别Ⅱ-方法${j + 1}`,
      x: 1,
      y: m1 + j,
      depth: 1,
      parentId: "root",
    });
    edges.push({ id: `e_root_${id2}`, from: "root", to: id2, label: `类别Ⅱ` });
  }

  return { nodes, edges };
}

/** 网格最短路径与标数法模型 */
export interface GridPathPoint {
  x: number;
  y: number;
  ways: number; // 从 (0,0) 到 (x,y) 的最短路径方法数
  labelFormula: string;
}

export function getGridPathMatrix(m: number, n: number): GridPathPoint[][] {
  const safeM = Math.min(Math.max(1, Math.floor(m)), 6);
  const safeN = Math.min(Math.max(1, Math.floor(n)), 5);

  const grid: GridPathPoint[][] = [];
  for (let y = 0; y <= safeN; y++) {
    const row: GridPathPoint[] = [];
    for (let x = 0; x <= safeM; x++) {
      const ways = comb(x + y, x);
      row.push({
        x,
        y,
        ways,
        labelFormula: `C_{${x + y}}^{${x}} = ${ways}`,
      });
    }
    grid.push(row);
  }
  return grid;
}

/** 均匀分组与定向分配模型计算 */
export interface GroupingInfo {
  totalItems: number;
  groupCount: number;
  itemsPerGroup: number;
  directCombinationWays: number; // 逐步选出的组合数积 (未消序)
  divisionOrderFactor: number; // 均分需要消去的全排列数 k!
  groupedWays: number; // 均匀分组总数（无标签堆）
  allocatedWays: number; // 分配给指定接收者的总数（有标签）
}

export function calculateGroupingAllocation(
  totalItems: number,
  groupCount: number,
): GroupingInfo {
  const k = Math.min(Math.max(2, Math.floor(groupCount)), 4);
  const itemsPerGroup = Math.max(1, Math.floor(totalItems / k));
  const validTotal = itemsPerGroup * k;

  let directCombinationWays = 1;
  let remaining = validTotal;
  for (let i = 0; i < k; i++) {
    directCombinationWays *= comb(remaining, itemsPerGroup);
    remaining -= itemsPerGroup;
  }

  const divisionOrderFactor = factorial(k);
  const groupedWays = directCombinationWays / divisionOrderFactor;
  const allocatedWays = groupedWays * factorial(k); // 等于 directCombinationWays

  return {
    totalItems: validTotal,
    groupCount: k,
    itemsPerGroup,
    directCombinationWays,
    divisionOrderFactor,
    groupedWays,
    allocatedWays,
  };
}
