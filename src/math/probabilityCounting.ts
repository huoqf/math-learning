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
