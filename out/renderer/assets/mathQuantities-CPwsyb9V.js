import { A as ALGEBRA_COLORS, d as CALCULUS_COLORS, b as MATH_COLORS, h as buildProbabilityBayesPanel } from "./probabilityBayes-DNLi5nE3.js";
function isPointInCircle(pt, circle) {
  if (circle.r <= 0) return false;
  const dx = pt.x - circle.x;
  const dy = pt.y - circle.y;
  return dx * dx + dy * dy <= circle.r * circle.r + 1e-9;
}
function getCircleDistance(cA, cB) {
  const dx = cA.x - cB.x;
  const dy = cA.y - cB.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function calculateSetMathState(cA, cB, testPoint) {
  const d = getCircleDistance(cA, cB);
  const rA = Math.max(0, cA.r);
  const rB = Math.max(0, cB.r);
  const isPointInA = isPointInCircle(testPoint, cA);
  const isPointInB = isPointInCircle(testPoint, cB);
  let warningMessage;
  if (rA === 0) {
    warningMessage = "集合 A 为空集 (∅)。空集是任何集合的子集。";
  } else if (rB === 0) {
    warningMessage = "集合 B 为空集 (∅)。";
  }
  let relation = "separate";
  if (rA === 0) {
    relation = "empty_A";
  } else if (rB === 0) {
    relation = "empty_B";
  } else if (Math.abs(cA.x - cB.x) < 1e-4 && Math.abs(cA.y - cB.y) < 1e-4 && Math.abs(rA - rB) < 1e-4) {
    relation = "equal";
  } else if (d + rA <= rB + 1e-4) {
    relation = "contained_A_in_B";
  } else if (d + rB <= rA + 1e-4) {
    relation = "contained_B_in_A";
  } else if (d < rA + rB && d > Math.abs(rA - rB)) {
    relation = "intersect";
  } else {
    relation = "separate";
  }
  let logicType = "neither";
  let logicRelationLatex = "A \\not\\subseteq B \\land B \\not\\subseteq A";
  let logicDescription = "p 既不是 q 的充分条件，也不是 q 的必要条件";
  if (relation === "equal") {
    logicType = "sufficient_and_necessary";
    logicRelationLatex = "A = B \\iff p \\iff q";
    logicDescription = "p 是 q 的充要条件（A 与 B 集合完全相等）";
  } else if (relation === "contained_A_in_B" || relation === "empty_A") {
    logicType = "sufficient_not_necessary";
    logicRelationLatex = "A \\subsetneq B \\implies p \\implies q";
    logicDescription = "p 是 q 的充分不必要条件（A 为 B 的真子集）";
  } else if (relation === "contained_B_in_A" || relation === "empty_B") {
    logicType = "necessary_not_sufficient";
    logicRelationLatex = "B \\subsetneq A \\implies q \\implies p";
    logicDescription = "p 是 q 的必要不充分条件（B 为 A 的真子集）";
  } else if (relation === "intersect") {
    logicType = "neither";
    logicRelationLatex = "A \\cap B \\neq \\varnothing \\text{ 且有部分相异}";
    logicDescription = "p 是 q 的既不充分也不必要条件（A 与 B 有交集但不相互包含）";
  } else {
    logicType = "neither";
    logicRelationLatex = "A \\cap B = \\varnothing";
    logicDescription = "p 是 q 的既不充分也不必要条件（A 与 B 互不相交）";
  }
  return {
    distance: d,
    isPointInA,
    isPointInB,
    relation,
    logicType,
    logicRelationLatex,
    logicDescription,
    validity: true,
    warningMessage
  };
}
function colorize(text, color) {
  return `\\color{${color}}{${text}}`;
}
function solveQuadratic(a, b, c) {
  const delta = b * b - 4 * a * c;
  if (Math.abs(a) < 1e-9) {
    let roots2 = [];
    if (Math.abs(b) >= 1e-9) {
      roots2 = [-c / b];
    } else {
      roots2 = Math.abs(c) < 1e-9 ? [-Infinity, Infinity] : [];
    }
    return {
      a,
      b,
      c,
      delta: 0,
      direction: "无 (退化为直线)",
      axisX: null,
      vertexX: null,
      vertexY: null,
      roots: roots2,
      isValid: false,
      isDegenerate: true,
      degenerateType: Math.abs(b) >= 1e-9 ? "linear" : "constant"
    };
  }
  const direction = a > 0 ? "向上" : "向下";
  const axisX = -b / (2 * a);
  const vertexX = axisX;
  const vertexY = (4 * a * c - b * b) / (4 * a);
  let roots = [];
  if (delta > 1e-9) {
    const sqrtDelta = Math.sqrt(delta);
    roots = [
      (-b - sqrtDelta) / (2 * a),
      (-b + sqrtDelta) / (2 * a)
    ].sort((x, y) => x - y);
  } else if (Math.abs(delta) <= 1e-9) {
    roots = [-b / (2 * a)];
  }
  return {
    a,
    b,
    c,
    delta,
    direction,
    axisX,
    vertexX,
    vertexY,
    roots,
    isValid: true,
    isDegenerate: false,
    degenerateType: "none"
  };
}
class DegenerationChecker {
  checks = [];
  register(check) {
    this.checks.push(check);
    return this;
  }
  check(params) {
    const reports = this.checks.map((fn) => fn(params)).filter((r) => r !== null);
    return {
      isDegenerate: reports.length > 0,
      reports
    };
  }
}
const quadraticChecker = new DegenerationChecker().register((p) => {
  if (Math.abs(p.a ?? 1) < 1e-9) {
    return {
      type: "a_zero",
      message: "当 a = 0 时，函数退化为一次函数（直线）",
      level: "danger",
      hint: "对称轴和顶点坐标不复存在，一元二次方程求根公式失效"
    };
  }
  return null;
}).register((p) => {
  const a = p.a ?? 1, b = p.b ?? 0, c = p.c ?? 0;
  const delta = b * b - 4 * a * c;
  if (delta < -1e-9 && Math.abs(a) >= 1e-9) {
    return {
      type: "no_real_roots",
      message: "判别式 Δ < 0，抛物线与 x 轴无交点",
      level: "warning",
      hint: "方程在实数范围内无解，但函数仍有最小值/最大值"
    };
  }
  return null;
}).register((p) => {
  const a = p.a ?? 1, b = p.b ?? 0, c = p.c ?? 0;
  const delta = b * b - 4 * a * c;
  if (Math.abs(delta) <= 1e-9 && Math.abs(a) >= 1e-9) {
    return {
      type: "one_root",
      message: "判别式 Δ = 0，抛物线与 x 轴相切（唯一实根）",
      level: "info",
      hint: "此时顶点恰好落在 x 轴上"
    };
  }
  return null;
});
new DegenerationChecker().register((p) => {
  const a = p.base ?? 2;
  if (a <= 0) {
    return {
      type: "base_non_positive",
      message: `底数 a = ${a} ≤ 0，不满足指数/对数函数定义`,
      level: "danger",
      hint: "指数函数和对数函数要求底数 a > 0 且 a ≠ 1"
    };
  }
  return null;
}).register((p) => {
  const a = p.base ?? 2;
  if (Math.abs(a - 1) < 1e-9) {
    return {
      type: "base_one",
      message: "底数 a = 1，函数退化为常数",
      level: "warning",
      hint: "当 a = 1 时，y = 1ˣ = 1（常函数），失去指数函数特性"
    };
  }
  return null;
});
new DegenerationChecker().register((p) => {
  const x = p.x ?? 0;
  const cosVal = Math.cos(x);
  if (Math.abs(cosVal) < 1e-9) {
    return {
      type: "tan_undefined",
      message: `tan(${x.toFixed(2)}) 无定义（cos(x) = 0）`,
      level: "danger",
      hint: "正切函数在 x = π/2 + kπ 处无定义，图像有垂直渐近线"
    };
  }
  return null;
});
const PARAM_COLORS$1 = {
  a: ALGEBRA_COLORS.sequence,
  b: ALGEBRA_COLORS.inequality,
  c: CALCULUS_COLORS.derivative
};
function buildQuadraticPanel(params, config) {
  const a = params.a ?? 1;
  const b = params.b ?? 0;
  const c = params.c ?? 0;
  const studyMode = config?.studyMode || "function";
  const ineqType = config?.ineqType || ">";
  const res = solveQuadratic(a, b, c);
  const { a: ca, b: cb, c: cc } = PARAM_COLORS$1;
  const col = colorize;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  let mnemonic = "一柱擎天看a值，左同右异定轴线，常数c点过y轴。";
  if (studyMode === "function") {
    buildFunctionMode(
      quantities,
      theorems,
      gaokaoPoints,
      a,
      b,
      c,
      res,
      col,
      ca,
      cb,
      cc
    );
  } else if (studyMode === "equation") {
    mnemonic = buildEquationMode(
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      a,
      b,
      c,
      res,
      col,
      ca,
      cb,
      cc
    );
  } else {
    mnemonic = buildInequalityMode(
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      a,
      b,
      c,
      ineqType,
      res,
      col,
      ca,
      cb,
      cc
    );
  }
  const degCheck = quadraticChecker.check({ a, b, c });
  degCheck.reports.forEach((r) => {
    if (studyMode === "inequality" && r.message.includes("二次项系数 a 为 0"))
      return;
    warnings.push({
      text: r.hint ? `${r.message}。${r.hint}。` : r.message,
      level: r.level
    });
  });
  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}
function buildFunctionMode(quantities, theorems, gaokaoPoints, a, b, c, res, col, ca, cb, cc) {
  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: ALGEBRA_COLORS.sequence
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative
    },
    { label: "开口方向", value: res.direction },
    {
      label: "对称轴",
      symbol: "x",
      value: res.axisX !== null ? `x = ${res.axisX.toFixed(2)}` : "无"
    },
    {
      label: "顶点坐标",
      value: res.vertexX !== null && res.vertexY !== null ? `(${res.vertexX.toFixed(2)}, ${res.vertexY.toFixed(2)})` : "无"
    }
  );
  theorems.push(
    {
      name: "二次函数一般式",
      latex: `y = ${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} \\quad (${col("a", ca)} \\neq 0)`,
      level: "core",
      prerequisites: ["a ≠ 0"]
    },
    {
      name: "对称轴与顶点坐标公式",
      latex: `x = -\\frac{${col("b", cb)}}{2${col("a", ca)}} \\quad \\text{顶点} \\left(-\\frac{${col("b", cb)}}{2${col("a", ca)}}, \\frac{4${col("a", ca)}${col("c", cc)}-${col("b", cb)}^2}{4${col("a", ca)}}\\right)`,
      level: "important",
      prerequisites: ["a ≠ 0"]
    }
  );
  gaokaoPoints.push(
    {
      text: "二次函数图象的开口方向（由 a 决定）、对称轴位置和顶点坐标是解决区间最值问题和不等式恒成立问题的核心基准。",
      importance: "gaokao"
    },
    {
      text: "二次函数单调性：在对称轴 x = -b/(2a) 处取得极值。若 a > 0，在 (-∞, -b/2a] 单调递减，在 [-b/2a, +∞) 单调递增；若 a < 0 则单调性相反。",
      importance: "core"
    }
  );
}
function buildEquationMode(quantities, theorems, gaokaoPoints, warnings, a, b, c, res, col, ca, cb, cc) {
  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: ALGEBRA_COLORS.sequence
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative
    },
    {
      label: "判别式",
      symbol: "Δ",
      value: res.delta.toFixed(2),
      highlight: res.delta > 1e-9 ? "positive" : Math.abs(res.delta) <= 1e-9 ? "zero" : "negative"
    },
    {
      label: "实根个数",
      value: res.isDegenerate ? Math.abs(b) >= 1e-9 ? "1个 (退化)" : Math.abs(c) < 1e-9 ? "无数个 (重合)" : "0个" : res.roots.length.toString()
    }
  );
  if (!res.isDegenerate) {
    if (res.roots.length === 2) {
      quantities.push(
        {
          label: "实根 x₁",
          value: res.roots[0].toFixed(2),
          color: CALCULUS_COLORS.tangentLine
        },
        {
          label: "实根 x₂",
          value: res.roots[1].toFixed(2),
          color: CALCULUS_COLORS.tangentLine
        }
      );
    } else if (res.roots.length === 1) {
      quantities.push({
        label: "唯一实根 x₀",
        value: res.roots[0].toFixed(2),
        color: CALCULUS_COLORS.tangentLine
      });
    } else {
      quantities.push({ label: "实根数值", value: "无实数根" });
    }
  } else {
    if (Math.abs(b) >= 1e-9) {
      quantities.push({
        label: "一次方程根 x₀",
        value: (-c / b).toFixed(2),
        color: CALCULUS_COLORS.tangentLine
      });
    } else {
      quantities.push({
        label: "方程状态",
        value: Math.abs(c) < 1e-9 ? "0 = 0 (恒等)" : `${c.toFixed(2)} = 0 (无解)`
      });
    }
  }
  theorems.push(
    {
      name: "一元二次方程一般形式",
      latex: `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} = 0 \\quad (${col("a", ca)} \\neq 0)`,
      level: "core",
      prerequisites: ["a ≠ 0"]
    },
    {
      name: "求根公式 (韦达定理基础)",
      latex: `x = \\frac{-${col("b", cb)} \\pm \\sqrt{${col("b", cb)}^2 - 4${col("a", ca)}${col("c", cc)}}}{2${col("a", ca)}} \\quad (\\Delta \\ge 0)`,
      level: "important",
      prerequisites: ["a ≠ 0", "Δ ≥ 0"]
    },
    {
      name: "韦达定理 (根与系数关系)",
      latex: `x_1 + x_2 = -\\frac{${col("b", cb)}}{${col("a", ca)}}, \\quad x_1 x_2 = \\frac{${col("c", cc)}}{${col("a", ca)}}`,
      level: "important",
      prerequisites: ["a ≠ 0", "Δ ≥ 0"]
    }
  );
  gaokaoPoints.push(
    {
      text: "方程 ax² + bx + c = 0 的实数根即为二次函数 f(x) = ax² + bx + c 与 x 轴交点的横坐标。其个数由判别式 Δ 决定。",
      importance: "gaokao"
    },
    {
      text: "韦达定理是代数与解析几何联立的核心桥梁。在圆锥曲线交点弦长、对称中点等题目中是列式计算的绝对高频工具。",
      importance: "gaokao"
    },
    {
      text: "根的分布规律：例如若要求两实根均大于常数 k，等价于条件组：① Δ ≥ 0；② 对称轴 -b/(2a) > k；③ 若 a > 0，f(k) > 0（若 a < 0，f(k) < 0）。这是高考压轴题的第一步。",
      importance: "hard"
    }
  );
  if (a !== 0 && res.delta < 0) {
    warnings.push({
      text: "判别式 Δ < 0，方程在实数范围内无解，抛物线与 x 轴无交点！",
      level: "warning"
    });
  }
  return "判别式看根个数，求根公式记心头，韦达定理连几何。";
}
function buildInequalityMode(quantities, theorems, gaokaoPoints, warnings, a, b, c, ineqType, res, col, ca, cb, cc) {
  let solutionText = "";
  if (a !== 0) {
    const x1 = res.roots[0];
    const x2 = res.roots[1];
    if (ineqType === ">") {
      if (a > 0) {
        if (res.roots.length === 2) {
          solutionText = `x < ${x1.toFixed(2)} 或 x > ${x2.toFixed(2)}`;
        } else if (res.roots.length === 1) {
          solutionText = `x ≠ ${x1.toFixed(2)} (x ∈ ℝ 且 x ≠ x₀)`;
        } else {
          solutionText = "全体实数 ℝ";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `${x1.toFixed(2)} < x < ${x2.toFixed(2)}`;
        } else {
          solutionText = "无解 (空集 ∅)";
        }
      }
    } else {
      if (a > 0) {
        if (res.roots.length === 2) {
          solutionText = `${x1.toFixed(2)} < x < ${x2.toFixed(2)}`;
        } else {
          solutionText = "无解 (空集 ∅)";
        }
      } else {
        if (res.roots.length === 2) {
          solutionText = `x < ${x1.toFixed(2)} 或 x > ${x2.toFixed(2)}`;
        } else if (res.roots.length === 1) {
          solutionText = `x ≠ ${x1.toFixed(2)} (x ∈ ℝ 且 x ≠ x₀)`;
        } else {
          solutionText = "全体实数 ℝ";
        }
      }
    }
  } else {
    const x0 = Math.abs(b) >= 1e-9 ? -c / b : 0;
    if (Math.abs(b) >= 1e-9) {
      if (ineqType === ">") {
        solutionText = b > 0 ? `x > ${x0.toFixed(2)}` : `x < ${x0.toFixed(2)}`;
      } else {
        solutionText = b > 0 ? `x < ${x0.toFixed(2)}` : `x > ${x0.toFixed(2)}`;
      }
    } else {
      if (ineqType === ">") {
        solutionText = c > 0 ? "全体实数 ℝ" : "无解 (空集 ∅)";
      } else {
        solutionText = c < 0 ? "全体实数 ℝ" : "无解 (空集 ∅)";
      }
    }
  }
  quantities.push(
    {
      label: "二次项系数",
      symbol: "a",
      value: a,
      color: ALGEBRA_COLORS.sequence
    },
    {
      label: "一次项系数",
      symbol: "b",
      value: b,
      color: ALGEBRA_COLORS.inequality
    },
    {
      label: "常数项",
      symbol: "c",
      value: c,
      color: CALCULUS_COLORS.derivative
    },
    { label: "不等式类型", value: ineqType === ">" ? "f(x) > 0" : "f(x) < 0" },
    {
      label: "解集范围",
      value: solutionText,
      color: ALGEBRA_COLORS.inequality
    }
  );
  theorems.push(
    {
      name: "一元二次不等式三位一体对应关系",
      latex: ineqType === ">" ? `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} > 0 \\quad \\text{的解集由 } f(x) > 0 \\text{ 的区域决定。}` : `${col("a", ca)}x^2 + ${col("b", cb)}x + ${col("c", cc)} < 0 \\quad \\text{的解集由 } f(x) < 0 \\text{ 的区域决定。}`,
      level: "core",
      prerequisites: ["由 a 符号与判别式 Δ 共同控制解集形式"]
    },
    {
      name: "不等式口诀",
      latex: `\\text{当 } ${col("a", ca)} > 0, \\Delta > 0 \\text{ 时：} \\\\ f(x) > 0 \\iff x < x_1 \\text{ 或 } x > x_2 \\quad (\\text{同号取两边}) \\\\ f(x) < 0 \\iff x_1 < x < x_2 \\quad (\\text{异号取中间})`,
      level: "important",
      prerequisites: ["a > 0", "Δ > 0", "x₁ < x₂"]
    }
  );
  gaokaoPoints.push(
    {
      text: "“三个二次”（二次函数、二次方程、二次不等式）是高中代数的基石。不等式 f(x) > 0 的解集即二次函数在 x 轴上方图象所对应的自变量 x 的集合。",
      importance: "gaokao"
    },
    {
      text: "二次不等式恒成立条件（常考压轴）：① 对任意实数恒有 f(x) > 0 成立 ⇔ a > 0 且 Δ < 0；② 恒有 f(x) < 0 成立 ⇔ a < 0 且 Δ < 0。务必同时讨论二次项系数为 0 的退化状态！",
      importance: "gaokao"
    }
  );
  if (a === 0) {
    warnings.push({
      text: "二次项系数为 0，不等式退化为一元一次不等式！高考中凡二次项系数含参，必须分 a = 0 与 a ≠ 0 分类讨论。",
      level: "danger"
    });
  } else if (solutionText === "全体实数 ℝ") {
    warnings.push({
      text: "此不等式在全体实数范围内恒成立 (解集为 ℝ)。",
      level: "warning"
    });
  } else if (solutionText === "无解 (空集 ∅)") {
    warnings.push({
      text: "此不等式在实数范围内无解 (解集为空集)。",
      level: "warning"
    });
  }
  return "同号取两边，异号取中间；系数为零先讨论，二次判别式莫忘记。";
}
function numericalDerivative(fn, x, h = 1e-7) {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}
function solveDerivative(fn, x0) {
  const fx = fn(x0);
  if (!Number.isFinite(fx)) {
    return {
      fx: NaN,
      fpx: NaN,
      slope: NaN,
      tangentIntercept: NaN,
      isValid: false,
      degenerateType: "undefined"
    };
  }
  const fpx = numericalDerivative(fn, x0);
  if (!Number.isFinite(fpx)) {
    return {
      fx,
      fpx: NaN,
      slope: NaN,
      tangentIntercept: NaN,
      isValid: false,
      degenerateType: "non_differentiable"
    };
  }
  return {
    fx,
    fpx,
    slope: fpx,
    tangentIntercept: fx - fpx * x0,
    isValid: true
  };
}
const PRESET_FUNCTIONS = {
  /** f(x) = x³ - 3x */
  cubic: {
    fn: (x) => x * x * x - 3 * x,
    label: "f(x) = x³ - 3x",
    latex: "f(x) = x^3 - 3x",
    x0Range: [-3, 3],
    defaultX0: 1
  },
  /** f(x) = x² */
  quadratic: {
    fn: (x) => x * x,
    label: "f(x) = x²",
    latex: "f(x) = x^2",
    x0Range: [-3, 3],
    defaultX0: 1
  },
  /** f(x) = sin(x) */
  sine: {
    fn: (x) => Math.sin(x),
    label: "f(x) = sin(x)",
    latex: "f(x) = \\sin x",
    x0Range: [-6.28, 6.28],
    defaultX0: 1
  },
  /** f(x) = cos(x) */
  cosine: {
    fn: (x) => Math.cos(x),
    label: "f(x) = cos(x)",
    latex: "f(x) = \\cos x",
    x0Range: [-6.28, 6.28],
    defaultX0: 1
  },
  /** f(x) = eˣ */
  exp: {
    fn: (x) => Math.exp(x),
    label: "f(x) = eˣ",
    latex: "f(x) = e^x",
    x0Range: [-3, 2],
    defaultX0: 0
  },
  /** f(x) = ln(x) */
  ln: {
    fn: (x) => x > 0 ? Math.log(x) : NaN,
    label: "f(x) = ln(x)",
    latex: "f(x) = \\ln x",
    x0Range: [0.1, 4],
    defaultX0: 1
  },
  /** f(x) = 1/x */
  rational: {
    fn: (x) => x !== 0 ? 1 / x : NaN,
    label: "f(x) = 1/x",
    latex: "f(x) = \\frac{1}{x}",
    x0Range: [-4, 4],
    defaultX0: 1
  },
  /** f(x) = √x */
  sqrt: {
    fn: (x) => x >= 0 ? Math.sqrt(x) : NaN,
    label: "f(x) = √x",
    latex: "f(x) = \\sqrt{x}",
    x0Range: [0, 4],
    defaultX0: 1
  },
  /** f(x) = x ln(x) */
  xlnx: {
    fn: (x) => x > 0 ? x * Math.log(x) : NaN,
    label: "f(x) = x ln x",
    latex: "f(x) = x \\ln x",
    x0Range: [0.1, 4],
    defaultX0: 0.37
    // 极值点 1/e
  },
  /** f(x) = ln(x)/x */
  lnx_x: {
    fn: (x) => x > 0 ? Math.log(x) / x : NaN,
    label: "f(x) = (ln x)/x",
    latex: "f(x) = \\frac{\\ln x}{x}",
    x0Range: [0.1, 5],
    defaultX0: 2.72
    // 极值点 e
  },
  /** f(x) = x eˣ */
  xex: {
    fn: (x) => x * Math.exp(x),
    label: "f(x) = x eˣ",
    latex: "f(x) = x e^x",
    x0Range: [-4, 1.5],
    defaultX0: -1
    // 极值点 -1
  }
};
function buildDerivativePanel(params, config) {
  const x0 = params.x0 ?? 1;
  const dx = params.dx ?? 1;
  const fnKey = config?.fnKey || "cubic";
  const preset = PRESET_FUNCTIONS[fnKey] || PRESET_FUNCTIONS.cubic;
  const res = solveDerivative(preset.fn, x0);
  const x2 = x0 + dx;
  let fy2 = NaN;
  try {
    fy2 = preset.fn(x2);
  } catch {
    fy2 = NaN;
  }
  const kSecant = Number.isFinite(fy2) && Number.isFinite(res.fx) ? (fy2 - res.fx) / dx : NaN;
  const quantities = [
    {
      label: "切点横坐标",
      symbol: "x₀",
      value: x0.toFixed(2),
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "函数值",
      symbol: "f(x₀)",
      value: Number.isFinite(res.fx) ? res.fx.toFixed(3) : "无定义",
      color: MATH_COLORS.labelText
    },
    {
      label: "割线步长",
      symbol: "Δx",
      value: dx.toFixed(2),
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "割线斜率",
      symbol: "k_割",
      value: Number.isFinite(kSecant) ? kSecant.toFixed(3) : "不存在",
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "切线斜率 (导数)",
      symbol: "f'(x₀)",
      value: Number.isFinite(res.fpx) ? res.fpx.toFixed(3) : "不存在",
      color: MATH_COLORS.tangentLine
    }
  ];
  const theorems = [
    {
      name: "割线斜率 (平均变化率)",
      latex: `k_{\\text{割}} = \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}`,
      level: "important",
      prerequisites: ["x₀ 与 x₀ + Δx 在函数定义域内"]
    },
    {
      name: "导数的几何意义",
      latex: "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
      level: "core",
      prerequisites: ["f(x) 在 x₀ 的某邻域内有定义", "极限存在"]
    },
    {
      name: "切线方程",
      latex: res.isValid ? `y - ${res.fx.toFixed(2)} = ${res.slope.toFixed(2)}(x - ${x0.toFixed(2)})` : "y - f(x_0) = f'(x_0)(x - x_0)",
      level: "important",
      prerequisites: ["f'(x₀) 存在"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "几何意义：函数 y=f(x) 在 x₀ 处的导数 f'(x₀) 就是曲线在该点切线的斜率 k。",
      importance: "gaokao"
    },
    {
      text: "割线斜率的极限：割线斜率随着 Δx 趋于 0 的极限即为切线斜率，体现了“以直代曲”的微积分核心思想。",
      importance: "core"
    },
    {
      text: "高考易错点：注意“在点 P 处的切线”与“过点 P 的切线”的区别，前者 P 必为切点，后者 P 不一定是切点。",
      importance: "gaokao"
    },
    {
      text: "压轴模型：高考常利用 xlnx, (lnx)/x, xex 等高频模型的导数来研究函数的单调性与极值。",
      importance: "core"
    }
  ];
  const warnings = [];
  if (!res.isValid) {
    warnings.push({
      text: res.degenerateType === "undefined" ? `函数在 x₀ = ${x0} 处无定义，无法求导。` : `函数在 x₀ = ${x0} 处不可导（可能存在尖点、间断点或切线垂直）。`,
      level: "danger"
    });
  } else if (!Number.isFinite(fy2)) {
    warnings.push({
      text: `割线终点 x₀ + Δx = ${x2.toFixed(2)} 超出函数定义域，割线无法绘制。`,
      level: "warning"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "导数即斜率，切线看斜率；割线逼近切，极限是关键。"
  };
}
function evalF(x) {
  return x * x - 2 * x + 2;
}
function evalGParam(x, a) {
  return x * x - 2 * a * x + 2;
}
function solveConstantSingleSep(a, m, n) {
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      a,
      m,
      n,
      isAlwaysTrue: false,
      isExistTrue: false,
      violatedInterval: null
    };
  }
  const symAxis = 1;
  let fMin;
  let xFMin;
  if (symAxis < m) {
    fMin = evalF(m);
    xFMin = m;
  } else if (symAxis > n) {
    fMin = evalF(n);
    xFMin = n;
  } else {
    fMin = 1;
    xFMin = symAxis;
  }
  const fm = evalF(m);
  const fn = evalF(n);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;
  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;
  let violatedInterval = null;
  if (a > 1) {
    const delta = 4 * a - 4;
    if (delta > 0) {
      const sqrtDelta = Math.sqrt(delta);
      const r1 = (2 - sqrtDelta) / 2;
      const r2 = (2 + sqrtDelta) / 2;
      const start = Math.max(m, r1);
      const end = Math.min(n, r2);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  }
  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    a,
    m,
    n,
    isAlwaysTrue,
    isExistTrue,
    violatedInterval
  };
}
function solveConstantSingleDirect(a, m, n) {
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      a,
      m,
      n,
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      isAlwaysTrue: false,
      violatedInterval: null,
      discussionType: "inside"
    };
  }
  let fMin;
  let xFMin;
  let discussionType;
  if (a < m) {
    fMin = evalGParam(m, a);
    xFMin = m;
    discussionType = "left";
  } else if (a > n) {
    fMin = evalGParam(n, a);
    xFMin = n;
    discussionType = "right";
  } else {
    fMin = 2 - a * a;
    xFMin = a;
    discussionType = "inside";
  }
  const fm = evalGParam(m, a);
  const fn = evalGParam(n, a);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;
  const isAlwaysTrue = fMin >= 0;
  let violatedInterval = null;
  const delta = 4 * a * a - 8;
  if (delta > 0) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (2 * a - sqrtDelta) / 2;
    const r2 = (2 * a + sqrtDelta) / 2;
    const start = Math.max(m, r1);
    const end = Math.min(n, r2);
    if (start < end) {
      violatedInterval = [start, end];
    }
  }
  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    a,
    m,
    n,
    fMin,
    xFMin,
    fMax,
    xFMax,
    isAlwaysTrue,
    violatedInterval,
    discussionType
  };
}
function solveConstantDouble(yf, xf, mf, nf, yg, xg, mg, ng, selectedLogic) {
  const evalFDouble = (x) => (x - xf) * (x - xf) + yf;
  let fMin;
  let xFMin;
  if (xf < mf) {
    fMin = evalFDouble(mf);
    xFMin = mf;
  } else if (xf > nf) {
    fMin = evalFDouble(nf);
    xFMin = nf;
  } else {
    fMin = yf;
    xFMin = xf;
  }
  const fValM = evalFDouble(mf);
  const fValN = evalFDouble(nf);
  const fMax = fValM > fValN ? fValM : fValN;
  const xFMax = fValM > fValN ? mf : nf;
  const evalGDouble = (x) => -(x - xg) * (x - xg) + yg;
  let gMax;
  let xGMax;
  if (xg < mg) {
    gMax = evalGDouble(mg);
    xGMax = mg;
  } else if (xg > ng) {
    gMax = evalGDouble(ng);
    xGMax = ng;
  } else {
    gMax = yg;
    xGMax = xg;
  }
  const gValM = evalGDouble(mg);
  const gValN = evalGDouble(ng);
  const gMin = gValM < gValN ? gValM : gValN;
  const xGMin = gValM < gValN ? mg : ng;
  const isAllAllTrue = fMin >= gMax;
  const isAllExistTrue = fMin >= gMin;
  const isExistAllTrue = fMax >= gMax;
  const isExistExistTrue = fMax >= gMin;
  const mJoint = Math.max(mf, mg);
  const nJoint = Math.min(nf, ng);
  let isSameVarTrue = false;
  let sameVarMinDiff = 0;
  let sameVarXMin = 0;
  if (mJoint < nJoint) {
    const symH = (xf + xg) / 2;
    const evalH = (x) => evalFDouble(x) - evalGDouble(x);
    if (symH < mJoint) {
      sameVarMinDiff = evalH(mJoint);
      sameVarXMin = mJoint;
    } else if (symH > nJoint) {
      sameVarMinDiff = evalH(nJoint);
      sameVarXMin = nJoint;
    } else {
      sameVarMinDiff = evalH(symH);
      sameVarXMin = symH;
    }
    isSameVarTrue = sameVarMinDiff >= 0;
  }
  let battlePointF = { x: xFMin, y: fMin };
  let battlePointG = { x: xGMax, y: gMax };
  let isCurrentLogicTrue = isAllAllTrue;
  switch (selectedLogic) {
    case "all_all":
      battlePointF = { x: xFMin, y: fMin };
      battlePointG = { x: xGMax, y: gMax };
      isCurrentLogicTrue = isAllAllTrue;
      break;
    case "all_exist":
      battlePointF = { x: xFMin, y: fMin };
      battlePointG = { x: xGMin, y: gMin };
      isCurrentLogicTrue = isAllExistTrue;
      break;
    case "exist_all":
      battlePointF = { x: xFMax, y: fMax };
      battlePointG = { x: xGMax, y: gMax };
      isCurrentLogicTrue = isExistAllTrue;
      break;
    case "exist_exist":
      battlePointF = { x: xFMax, y: fMax };
      battlePointG = { x: xGMin, y: gMin };
      isCurrentLogicTrue = isExistExistTrue;
      break;
    case "same_var":
      battlePointF = { x: sameVarXMin, y: evalFDouble(sameVarXMin) };
      battlePointG = { x: sameVarXMin, y: evalGDouble(sameVarXMin) };
      isCurrentLogicTrue = isSameVarTrue;
      break;
  }
  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    gMin,
    xGMin,
    gMax,
    xGMax,
    isAllAllTrue,
    isAllExistTrue,
    isExistAllTrue,
    isExistExistTrue,
    isSameVarTrue,
    sameVarMinDiff,
    sameVarXMin,
    battlePointF,
    battlePointG,
    isCurrentLogicTrue
  };
}
function evalFTrans(x) {
  return x > 0 ? Math.log(x) / x : NaN;
}
function evalGParamTrans(x, a) {
  return Math.exp(x) - a * x;
}
function solveSepEquation(a) {
  if (a <= 0) {
    let left = 1e-5, right = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.log(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }
  if (a > 1 / Math.E) {
    return { r1: null, r2: null };
  }
  if (Math.abs(a - 1 / Math.E) < 1e-9) {
    return { r1: Math.E, r2: null };
  }
  let left1 = 1, right1 = Math.E;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) right1 = mid;
    else left1 = mid;
  }
  const r1 = (left1 + right1) / 2;
  let left2 = Math.E, right2 = 100;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.log(mid) - a * mid;
    if (val > 0) left2 = mid;
    else right2 = mid;
  }
  const r2 = (left2 + right2) / 2;
  return { r1, r2 };
}
function solveDirectEquation(a) {
  if (a <= 0) {
    let left = -15, right = 0;
    if (a < -5) left = -30;
    for (let i = 0; i < 30; i++) {
      const mid = (left + right) / 2;
      const val = Math.exp(mid) - a * mid;
      if (val > 0) right = mid;
      else left = mid;
    }
    return { r1: (left + right) / 2, r2: null };
  }
  const lna = Math.log(a);
  const fMin = Math.exp(lna) - a * lna;
  if (fMin >= 0) {
    return { r1: null, r2: null };
  }
  let left1 = -15, right1 = lna;
  for (let i = 0; i < 30; i++) {
    const mid = (left1 + right1) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) left1 = mid;
    else right1 = mid;
  }
  const r1 = (left1 + right1) / 2;
  let left2 = lna, right2 = 15;
  for (let i = 0; i < 30; i++) {
    const mid = (left2 + right2) / 2;
    const val = Math.exp(mid) - a * mid;
    if (val > 0) right2 = mid;
    else left2 = mid;
  }
  const r2 = (left2 + right2) / 2;
  return { r1, r2 };
}
function solveConstantSingleSepTrans(a, m, n) {
  if (m <= 0 || m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      a,
      m,
      n,
      isAlwaysTrue: false,
      isExistTrue: false,
      violatedInterval: null
    };
  }
  const e = Math.E;
  let fMin;
  let xFMin;
  let fMax;
  let xFMax;
  if (e < m) {
    fMax = evalFTrans(m);
    xFMax = m;
    fMin = evalFTrans(n);
    xFMin = n;
  } else if (e > n) {
    fMax = evalFTrans(n);
    xFMax = n;
    fMin = evalFTrans(m);
    xFMin = m;
  } else {
    fMax = 1 / Math.E;
    xFMax = e;
    const fm = evalFTrans(m);
    const fn = evalFTrans(n);
    fMin = fm < fn ? fm : fn;
    xFMin = fm < fn ? m : n;
  }
  const isAlwaysTrue = fMin >= a;
  const isExistTrue = fMax >= a;
  let violatedInterval = null;
  const { r1, r2 } = solveSepEquation(a);
  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (a > 1 / Math.E) {
      violatedInterval = [m, n];
    } else if (r1 !== null && r2 !== null) {
      const start1 = m;
      const end1 = Math.min(n, r1);
      const start2 = Math.max(m, r2);
      const end2 = n;
      const len1 = end1 - start1;
      const len2 = end2 - start2;
      if (len1 > 0 && len2 > 0) {
        violatedInterval = len1 > len2 ? [start1, end1] : [start2, end2];
      } else if (len1 > 0) {
        violatedInterval = [start1, end1];
      } else if (len2 > 0) {
        violatedInterval = [start2, end2];
      }
    }
  }
  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    fMin,
    xFMin,
    fMax,
    xFMax,
    a,
    m,
    n,
    isAlwaysTrue,
    isExistTrue,
    violatedInterval
  };
}
function solveConstantSingleDirectTrans(a, m, n) {
  if (m >= n) {
    return {
      isValid: false,
      isDegenerate: true,
      degenerateType: "interval_collapse",
      a,
      m,
      n,
      fMin: 0,
      xFMin: 0,
      fMax: 0,
      xFMax: 0,
      isAlwaysTrue: false,
      violatedInterval: null,
      discussionType: "inside"
    };
  }
  let fMin;
  let xFMin;
  let discussionType;
  if (a <= 0) {
    fMin = evalGParamTrans(m, a);
    xFMin = m;
    discussionType = "left";
  } else {
    const lna = Math.log(a);
    if (lna < m) {
      fMin = evalGParamTrans(m, a);
      xFMin = m;
      discussionType = "left";
    } else if (lna > n) {
      fMin = evalGParamTrans(n, a);
      xFMin = n;
      discussionType = "right";
    } else {
      fMin = a - a * lna;
      xFMin = lna;
      discussionType = "inside";
    }
  }
  const fm = evalGParamTrans(m, a);
  const fn = evalGParamTrans(n, a);
  const fMax = fm > fn ? fm : fn;
  const xFMax = fm > fn ? m : n;
  const isAlwaysTrue = fMin >= 0;
  let violatedInterval = null;
  const { r1, r2 } = solveDirectEquation(a);
  if (a <= 0) {
    if (r1 !== null) {
      const start = m;
      const end = Math.min(n, r1);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  } else {
    if (fMin < 0 && r1 !== null && r2 !== null) {
      const start = Math.max(m, r1);
      const end = Math.min(n, r2);
      if (start < end) {
        violatedInterval = [start, end];
      }
    }
  }
  return {
    isValid: true,
    isDegenerate: false,
    degenerateType: "none",
    a,
    m,
    n,
    fMin,
    xFMin,
    fMax,
    xFMax,
    isAlwaysTrue,
    violatedInterval,
    discussionType
  };
}
function evalFTransC(x, a) {
  return x > 0 ? a * Math.log(x) - x + 1 : NaN;
}
function evalFTransCDerivative(x, a) {
  return x > 0 ? a / x - 1 : NaN;
}
function evalFTransD(x, a) {
  return Math.exp(x) - a * (x + 1);
}
function evalFTransDDerivative(x, a) {
  return Math.exp(x) - a;
}
function evalTransDerivative(x, a, model) {
  switch (model) {
    case "ln_x_over_x":
      return x > 0 ? (1 - Math.log(x)) / (x * x) : NaN;
    case "exp_minus_ax":
      return Math.exp(x) - a;
    case "a_ln_x_minus_x":
      return evalFTransCDerivative(x, a);
    case "exp_minus_a_x_plus_1":
      return evalFTransDDerivative(x, a);
    default:
      return NaN;
  }
}
function buildConstantSinglePanel(params, config) {
  const subMode = config?.subMode || "sep";
  const logic = config?.logic || "always";
  const funModel = config?.funModel || "quadratic";
  const transModel = config?.transModel || "ln_x_over_x";
  const m = params.m ?? 0.5;
  const n = params.n ?? 2.5;
  const col = colorize;
  const isTranscendent = funModel === "transcendent";
  if (subMode === "sep") {
    return buildSepBranch(params, m, n, logic, isTranscendent, transModel, col);
  } else {
    return buildDirectBranch(params, m, n, isTranscendent, transModel, col);
  }
}
function buildSepBranch(params, m, n, logic, isTranscendent, transModel, col) {
  const a = params.a ?? 1.2;
  const res = isTranscendent ? solveConstantSingleSepTrans(a, m, n) : solveConstantSingleSep(a, m, n);
  const quantities = [
    {
      label: "区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function
    },
    { label: "最小值横坐标", symbol: "xmin", value: res.xFMin },
    {
      label: "区间内最大值",
      symbol: "f(x)max",
      value: res.fMax,
      color: MATH_COLORS.derivative
    },
    { label: "最大值横坐标", symbol: "xmax", value: res.xFMax },
    {
      label: logic === "always" ? "恒成立状态 (f(x) ≥ a)" : "存在性状态 (f(x) ≥ a)",
      value: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue) ? "成立" : "不成立",
      highlight: (logic === "always" ? res.isAlwaysTrue : res.isExistTrue) ? "extreme" : "negative"
    }
  ];
  const theorems = [
    {
      name: "恒成立等价转化",
      latex: `\\forall x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\min} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数最值可达"]
    },
    {
      name: "存在性等价转化",
      latex: `\\exists x \\in [m, n], \\, f(x) \\ge ${col("a", MATH_COLORS.paramPrimary)} \\iff f(x)_{\\max} \\ge ${col("a", MATH_COLORS.paramPrimary)}`,
      level: "core",
      prerequisites: ["区间范围 [m, n] 合理", "函数最值可达"]
    }
  ];
  if (isTranscendent) {
    if (transModel === "ln_x_over_x") {
      theorems.push({
        name: "高考核心结构 f(x) = ln x / x",
        latex: `f'(x) = \\frac{1-\\ln x}{x^2} \\Rightarrow \\text{极大值点 } x=e, \\, f(e) = \\frac{1}{e} \\approx 0.368`,
        level: "important",
        prerequisites: ["x > 0", "单调性：(0, e) 增，(e, +∞) 减"]
      });
    } else if (transModel === "a_ln_x_minus_x") {
      theorems.push({
        name: "切线放缩与端点效应",
        latex: `\\ln x \\le x - 1 \\quad (x = 1 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["用于放缩超越部分，确定必要条件 a = 1"]
      });
    } else if (transModel === "exp_minus_a_x_plus_1") {
      theorems.push({
        name: "指数放缩与切线下界",
        latex: `e^x \\ge x + 1 \\quad (x = 0 \\text{ 处等号成立})`,
        level: "important",
        prerequisites: ["切线 y = x+1 为 e^x 的下放缩界"]
      });
    }
  }
  const gaokaoPoints = isTranscendent ? [
    {
      text: "参变分离法首选：将未知参数 a 完全孤立于不等式一侧，转化为研究另一侧函数在给定区间 [m, n] 上的最值。",
      importance: "gaokao"
    },
    {
      text: "临界点判定：对 ∀x 恒成立看最小值（底线），对 ∃x 存在性成立看最大值（突破口）。",
      importance: "core"
    },
    {
      text: "切线放缩秒杀：高考中极常用 e^x ≥ x+1 与 ln x ≤ x-1 快速寻找临界边界 a。",
      importance: "gaokao"
    }
  ] : [
    {
      text: "参变分离法核心：二次函数参变分离后转化为 y = a 与 f(x) 的高低对比。",
      importance: "gaokao"
    },
    {
      text: "恒成立看最小值，存在性看最大值。",
      importance: "core"
    }
  ];
  const warnings = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化 (m ≥ n 或超出定义域)，请调整区间滑块！",
      level: "danger"
    });
  }
  if (logic === "always" && !res.isAlwaysTrue) {
    warnings.push({
      text: `参数 a 超出了函数最小值 ${res.fMin.toFixed(2)}，高亮区内的 x 无法满足不等式。`,
      level: "warning"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent ? "参变分离最直观，恒成求小存在大；切线放缩求临界，隐零代换解压轴。" : "参变分离超好用，恒成求小存在大。"
  };
}
function buildDirectBranch(params, m, n, isTranscendent, _transModel, col) {
  const aAxis = params.a_axis ?? 1;
  const res = isTranscendent ? solveConstantSingleDirectTrans(aAxis, m, n) : solveConstantSingleDirect(aAxis, m, n);
  const quantities = [
    {
      label: "研究区间内最小值",
      symbol: "f(x)min",
      value: res.fMin,
      color: MATH_COLORS.function
    },
    {
      label: "极值/驻点位置",
      value: res.discussionType === "left" ? "区间左端点 m" : res.discussionType === "right" ? "区间右端点 n" : isTranscendent ? "驻点 x0" : "顶点 a"
    },
    {
      label: "恒成立状态 (f(x) ≥ 0)",
      value: res.isAlwaysTrue ? "成立" : "不成立",
      highlight: res.isAlwaysTrue ? "extreme" : "negative"
    }
  ];
  const theorems = isTranscendent ? [
    {
      name: "分类讨论法（含参超越函数）",
      latex: `f(x) \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
      level: "core",
      prerequisites: ["基于导函数 f'(x) 的零点讨论单调性区段"]
    },
    {
      name: "隐零点设而不求法",
      latex: `f'(x_0) = 0 \\Rightarrow \\text{用 } x_0 \\text{ 表达参数并在 } f(x_0) \\text{ 中消元}`,
      level: "important",
      prerequisites: ["适用于导数零点无法显式表示的压轴题"]
    }
  ] : [
    {
      name: "分类讨论法（轴动区间定）",
      latex: `f(x) = x^2 - 2${col("a", MATH_COLORS.paramPrimary)}x + 2 \\ge 0 \\iff f(x)_{\\min} \\ge 0`,
      level: "core",
      prerequisites: ["对称轴 x = a 相对区间 [m, n] 的位置"]
    },
    {
      name: "三段分类临界",
      latex: `f(x)_{\\min} = \\begin{cases} f(m), & a < m \\\\ f(a), & m \\le a \\le n \\\\ f(n), & a > n \\end{cases}`,
      level: "important",
      prerequisites: ["临界讨论点为 a = m 与 a = n"]
    }
  ];
  const gaokaoPoints = isTranscendent ? [
    {
      text: "高考压轴必备：当参变分离导致函数极度复杂时，直接讨论法是唯一突破路径。",
      importance: "gaokao"
    },
    {
      text: "隐零点设而不求技巧：设 f'(x₀) = 0，利用关系式代换消去指数/对数，将最值转化为关于 x₀ 的单变量问题。",
      importance: "gaokao"
    },
    {
      text: "端点效应：若 f(x₀) = 0，可先求 f'(x₀) ≥ 0 获得参数 a 的必要条件，再证明充分性。",
      importance: "core"
    }
  ] : [
    {
      text: "直接最值讨论法：对称轴 x = a 与区间 [m, n] 分为“轴在左、轴在中、轴在右”三类。",
      importance: "gaokao"
    },
    {
      text: "临界点恰好是对称轴与端点重合时。",
      importance: "core"
    }
  ];
  const warnings = [];
  if (res.isDegenerate) {
    warnings.push({
      text: "区间发生退化，请重新调整区间滑块！",
      level: "danger"
    });
  }
  if (!res.isAlwaysTrue) {
    warnings.push({
      text: `函数最小值跌破 0 (${res.fMin.toFixed(2)})，高亮区内的 x 不满足恒成立要求。`,
      level: "warning"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: isTranscendent ? "求导先找极小点，无法显示设 x₀；消去指对求最值，端点效应先必要。" : "轴动定区间讨论，端点顶点定分界。"
  };
}
function buildConstantDoublePanel(params, config) {
  const selectedLogic = config?.selectedLogic || "all_all";
  const yf = params.yf ?? 2.5;
  const xf = params.xf ?? 1.25;
  const yg = params.yg ?? 1.5;
  const xg = params.xg ?? 2.25;
  const mf = 0.5, nf = 2;
  const mg = 1.5, ng = 3;
  const res = solveConstantDouble(
    yf,
    xf,
    mf,
    nf,
    yg,
    xg,
    mg,
    ng,
    selectedLogic
  );
  const quantities = selectedLogic === "same_var" ? [
    { label: "作用域交集", value: "x ∈ [1.50, 2.00]" },
    {
      label: "最小差值 f(x) - g(x)",
      symbol: "h_min",
      value: res.sameVarMinDiff ?? 0,
      color: CALCULUS_COLORS.function
    },
    {
      label: "最危险位置",
      symbol: "x_min",
      value: res.sameVarXMin ?? 0
    },
    {
      label: "同自变量恒成立状态",
      value: res.isSameVarTrue ? "满足" : "不满足",
      highlight: res.isSameVarTrue ? "extreme" : "negative"
    }
  ] : [
    {
      label: "f(x)最小值",
      symbol: "f_min",
      value: res.fMin,
      color: CALCULUS_COLORS.function
    },
    {
      label: "f(x)最大值",
      symbol: "f_max",
      value: res.fMax,
      color: CALCULUS_COLORS.function
    },
    {
      label: "g(x)最大值",
      symbol: "g_max",
      value: res.gMax,
      color: CALCULUS_COLORS.derivative
    },
    {
      label: "g(x)最小值",
      symbol: "g_min",
      value: res.gMin,
      color: CALCULUS_COLORS.derivative
    },
    {
      label: "所选博弈状态",
      value: res.isCurrentLogicTrue ? "满足" : "不满足",
      highlight: res.isCurrentLogicTrue ? "extreme" : "negative"
    }
  ];
  const theorems = selectedLogic === "same_var" ? [
    {
      name: "同自变量差函数法",
      latex: `\\forall x \\in I_1 \\cap I_2, \\; f(x) \\ge g(x) \\iff h(x) = f(x) - g(x) \\ge 0 \\iff h(x)_{\\min} \\ge 0`,
      level: "core",
      prerequisites: ["自变量 x 为同一变量，作用在两区间交集上"]
    },
    {
      name: "差函数最值计算",
      latex: `h(x) = 2x^2 - 2(x_f + x_g)x + (x_f^2 + y_f + x_g^2 - y_g)`,
      level: "important",
      prerequisites: ["对称轴为 x_{sym} = \\frac{x_f + x_g}{2}"]
    }
  ] : [
    {
      name: "高考双动点不等式四大法宝",
      latex: `\\forall x_1, x_2, f(x_1) \\ge g(x_2) \\iff f_{\\min} \\ge g_{\\max}`,
      level: "core",
      prerequisites: ["x₁ 与 x₂ 分别在独立区间内自由变动"]
    },
    {
      name: "其他对应关系参考",
      latex: `\\begin{aligned} \\forall x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\min} \\ge g_{\\min} \\\\ \\exists x_1, \\forall x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\max} \\\\ \\exists x_1, \\exists x_2, f(x_1) \\ge g(x_2) &\\iff f_{\\max} \\ge g_{\\min} \\end{aligned}`,
      level: "important",
      prerequisites: ["注意主词“任意”与“存在”的组合"]
    }
  ];
  const gaokaoPoints = selectedLogic === "same_var" ? [
    {
      text: "同自变量恒成立使用“差函数法”：当自变量 x 限制在重合区间内且为同一个动点时，只需两函数在该区间上的差值大于等于 0 即可。",
      importance: "gaokao"
    },
    {
      text: "易错辨析：同自变量成立并不需要 f(x) 的最小值高于 g(x) 的最大值，只需在每个点上 f 都在 g 的上方（即差函数图象在 x 轴上方）。",
      importance: "core"
    }
  ] : [
    {
      text: "双自变量恒成立：“对任意自变量不等式成立”要求两函数各自极值完全分离。其中 ∀x₁, ∀x₂ 要求 f 的最小值必须压过 g 的最大值。",
      importance: "gaokao"
    },
    {
      text: "区分双动点恒成立（各行其是）与同变量恒成立（f(x) ≥ g(x) 构造差函数）。",
      importance: "core"
    }
  ];
  const warnings = [];
  if (selectedLogic === "same_var") {
    if (!res.isSameVarTrue) {
      warnings.push({
        text: `同变量恒成立不满足！在最危险位置 x = ${res.sameVarXMin?.toFixed(2)} 处，差值只有 ${res.sameVarMinDiff?.toFixed(2)} (< 0)。`,
        level: "warning"
      });
    }
  } else {
    if (!res.isCurrentLogicTrue) {
      warnings.push({
        text: `当前条件不满足！博弈对垒中 ${res.battlePointF.y.toFixed(2)} 未能压过 ${res.battlePointG.y.toFixed(2)}。`,
        level: "warning"
      });
    }
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: selectedLogic === "same_var" ? "同变量差函数，作差求最值。" : "双动点别慌张，任意任意比极值，最小值压最大值。"
  };
}
function buildSetPanel(params) {
  const xA = params.xA ?? -1.2;
  const yA = params.yA ?? 0;
  const rA = params.rA ?? 2.2;
  const xB = params.xB ?? 1.2;
  const yB = params.yB ?? 0;
  const rB = params.rB ?? 2.2;
  const xP = params.xP ?? 0;
  const yP = params.yP ?? 0;
  const setRes = calculateSetMathState(
    { x: xA, y: yA, r: rA },
    { x: xB, y: yB, r: rB },
    { x: xP, y: yP }
  );
  const quantities = [
    {
      label: "圆心距 d(O₠, O₢)",
      symbol: "d",
      value: setRes.distance.toFixed(2),
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "集合 A 半径",
      symbol: "rA",
      value: rA.toFixed(2),
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "集合 B 半径",
      symbol: "rB",
      value: rB.toFixed(2),
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "测试点 P 归属 A",
      value: setRes.isPointInA ? "P ∈ A" : "P ∉ A",
      color: setRes.isPointInA ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText
    },
    {
      label: "测试点 P 归属 B",
      value: setRes.isPointInB ? "P ∈ B" : "P ∉ B",
      color: setRes.isPointInB ? MATH_COLORS.paramSecondary : MATH_COLORS.labelText
    },
    {
      label: "充要逻辑判定",
      value: setRes.logicType === "sufficient_not_necessary" ? "充分不必要条件" : setRes.logicType === "necessary_not_sufficient" ? "必要不充分条件" : setRes.logicType === "sufficient_and_necessary" ? "充要条件" : "既不充分也不必要",
      highlight: setRes.logicType === "sufficient_and_necessary" ? "extreme" : "positive"
    }
  ];
  const theorems = [
    {
      name: "集合的基本运算与 Venn 图",
      latex: "A \\cap B = \\{x \\mid x \\in A \\land x \\in B\\}, \\quad A \\cup B = \\{x \\mid x \\in A \\lor x \\in B\\}",
      level: "core",
      prerequisites: ["全集 U 存在"]
    },
    {
      name: "充分必要条件与包含关系",
      latex: "p: x \\in A, \\quad q: x \\in B, \\quad p \\implies q \\iff A \\subseteq B",
      level: "important",
      prerequisites: ["A 与 B 为非空集合"]
    },
    {
      name: "摩根定律 (De Morgan's Laws)",
      latex: "\\complement_U (A \\cup B) = \\complement_U A \\cap \\complement_U B, \\quad \\complement_U (A \\cap B) = \\complement_U A \\cup \\complement_U B",
      level: "important",
      prerequisites: ["全集 U 正确限定"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考一轮基础：集合元素的确定性、互异性、无序性。做题时谨防互异性检验与空集 ∅ 扣分陷阱。",
      importance: "gaokao"
    },
    {
      text: "充分条件与必要条件四步判定法：① 明确条件 p 与结论 q；② 建立集合 A={x|p} 与 B={x|q}；③ 观察 Venn 图包含关系 (A ⊆ B 还是 B ⊆ A)；④ 写出充要判定结论。",
      importance: "gaokao"
    },
    {
      text: "全称量词与存在量词否定：否定全称命题“∀x∈A, p(x)”变为存在命题“∃x∈A, ¬p(x)”，改量词变结论，限定集合 A 不改变！",
      importance: "core"
    }
  ];
  const warnings = [];
  if (setRes.warningMessage) {
    warnings.push({
      text: setRes.warningMessage,
      level: "danger"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "小范围推大范围（A ⊂ B 推出 p 充分）；全称改存在，否定在末尾；空集是子集，互异莫忘记。"
  };
}
function evalFunctionParity(fnType, x) {
  let fx = 0;
  let fNegX = 0;
  let parity = "neither";
  let parityDescription = "";
  switch (fnType) {
    case "cubic":
      fx = x * x * x;
      fNegX = -x * -x * -x;
      parity = "odd";
      parityDescription = "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
    case "quadratic":
      fx = x * x;
      fNegX = -x * -x;
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "abs":
      fx = Math.abs(x);
      fNegX = Math.abs(-x);
      parity = "even";
      parityDescription = "f(-x) = f(x)，属于偶函数，图象关于 y 轴轴对称。";
      break;
    case "reciprocal":
      fx = x !== 0 ? 1 / x : NaN;
      fNegX = -x !== 0 ? 1 / -x : NaN;
      parity = "odd";
      parityDescription = "f(-x) = -f(x)，属于奇函数，图象关于坐标原点中心对称。";
      break;
  }
  return { fx, fNegX, parity, parityDescription };
}
function evalSecantSlope(fn, x1, x2) {
  const fx1 = fn(x1);
  const fx2 = fn(x2);
  if (!Number.isFinite(fx1) || !Number.isFinite(fx2)) {
    return {
      fx1,
      fx2,
      deltaX: x2 - x1,
      deltaY: NaN,
      slope: NaN,
      monotonicity: "invalid",
      description: "自变量包含无定义点"
    };
  }
  const deltaX = x2 - x1;
  const deltaY = fx2 - fx1;
  if (Math.abs(deltaX) < 1e-6) {
    return {
      fx1,
      fx2,
      deltaX,
      deltaY: 0,
      slope: NaN,
      monotonicity: "invalid",
      description: "x₁ 与 x₂ 重合，割线变为切线"
    };
  }
  const slope = deltaY / deltaX;
  let monotonicity = "constant";
  let description = "常数函数，割线斜率 k = 0";
  if (slope > 1e-4) {
    monotonicity = "increasing";
    description = `割线斜率 k = ${slope.toFixed(2)} > 0，在 [${Math.min(x1, x2).toFixed(1)}, ${Math.max(x1, x2).toFixed(1)}] 区间单调递增`;
  } else if (slope < -1e-4) {
    monotonicity = "decreasing";
    description = `割线斜率 k = ${slope.toFixed(2)} < 0，在 [${Math.min(x1, x2).toFixed(1)}, ${Math.max(x1, x2).toFixed(1)}] 区间单调递减`;
  }
  return { fx1, fx2, deltaX, deltaY, slope, monotonicity, description };
}
function evalSymmetryPeriod(axisA, axisB) {
  const dist = Math.abs(axisB - axisA);
  const period = 2 * dist;
  const formulaDescription = dist > 1e-4 ? `关于直线 x = ${axisA.toFixed(1)} 与 x = ${axisB.toFixed(1)} 均对称 ⇒ 最小正周期 T = 2|${axisA.toFixed(1)} - ${axisB.toFixed(1)}| = ${period.toFixed(1)}` : `两对称轴重合于 x = ${axisA.toFixed(1)}`;
  return { dist, period, formulaDescription };
}
function calculateExpLog(a, x0) {
  const isValidBase = a > 0 && Math.abs(a - 1) > 1e-4;
  let baseWarning;
  if (a <= 0) {
    baseWarning = "底数 a 必须大于 0！指数与对数函数底数不能为负数或零。";
  } else if (Math.abs(a - 1) <= 1e-4) {
    baseWarning = "底数 a = 1 退化为常数函数 y = 1，无法构成对数与反函数！";
  }
  const expVal = isValidBase ? Math.pow(a, x0) : NaN;
  const logVal = isValidBase && x0 > 0 ? Math.log(x0) / Math.log(a) : NaN;
  return {
    a,
    isValidBase,
    baseWarning,
    expVal,
    logVal,
    pointExp: { x: x0, y: expVal },
    pointLog: { x: expVal, y: x0 }
    // 对应反函数点 (y, x) 恰好关于 y=x 对称
  };
}
function calculatePowerFunction(alpha, x0) {
  let isValidPoint = true;
  let warningMessage;
  let yVal = NaN;
  if (alpha === 0) {
    if (Math.abs(x0) < 1e-6) {
      isValidPoint = false;
      warningMessage = "0⁰ 在数学上无意义！";
    } else {
      yVal = 1;
    }
  } else if (alpha < 0) {
    if (Math.abs(x0) < 1e-6) {
      isValidPoint = false;
      warningMessage = `指数 α = ${alpha} < 0 时，x = 0 为分母无定义点（垂直渐近线）！`;
    } else if (x0 < 0) {
      if (Number.isInteger(alpha)) {
        yVal = Math.pow(x0, alpha);
      } else {
        isValidPoint = false;
        warningMessage = `非整数负指数 α = ${alpha} 时，x < 0 在实数域无定义！`;
      }
    } else {
      yVal = Math.pow(x0, alpha);
    }
  } else {
    if (x0 < 0) {
      if (Number.isInteger(alpha)) {
        yVal = Math.pow(x0, alpha);
      } else if (alpha === 0.5) {
        isValidPoint = false;
        warningMessage = "√x 的自变量 x 必须非负 (x ≥ 0)！";
      } else {
        isValidPoint = false;
        warningMessage = `分数/非整数指数 α = ${alpha} 时，负数 x < 0 在实数域无定义！`;
      }
    } else {
      yVal = Math.pow(x0, alpha);
    }
  }
  let domainDescription = "x ∈ ℝ";
  let parityDescription = "非奇非偶函数";
  if (alpha === 2) {
    domainDescription = "x ∈ ℝ";
    parityDescription = "偶函数 (f(-x) = f(x)，图象关于 y 轴对称)";
  } else if (alpha === 3 || alpha === 1 || alpha === -1) {
    domainDescription = alpha === -1 ? "{x ∈ ℝ | x ≠ 0}" : "x ∈ ℝ";
    parityDescription = "奇函数 (f(-x) = -f(x)，图象关于原点对称)";
  } else if (alpha === 0.5) {
    domainDescription = "[0, +∞)";
    parityDescription = "非奇非偶函数 (定义域不对称)";
  } else if (alpha < 0) {
    domainDescription = Number.isInteger(alpha) ? "{x ∈ ℝ | x ≠ 0}" : "(0, +∞)";
    parityDescription = Number.isInteger(alpha) ? alpha % 2 === 0 ? "偶函数" : "奇函数" : "非奇非偶函数";
  } else if (alpha === 0) {
    domainDescription = "{x ∈ ℝ | x ≠ 0}";
    parityDescription = "偶函数 (在 x ≠ 0 时为常数 1)";
  }
  let monotonicityPositive = "常数函数 y = 1 (α = 0)";
  if (alpha > 0) {
    monotonicityPositive = `单调递增 (α = ${alpha} > 0)`;
  } else if (alpha < 0) {
    monotonicityPositive = `单调递减 (α = ${alpha} < 0)`;
  }
  return {
    alpha,
    x0,
    isValidPoint,
    yVal,
    domainDescription,
    parityDescription,
    monotonicityPositive,
    warningMessage,
    hasAsymptote: alpha < 0
  };
}
function solveBisection(fn, m, n, maxSteps) {
  if (m >= n) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: NaN,
      validity: false,
      warningMessage: "区间端点无效：要求左端点 m < 右端点 n！"
    };
  }
  const fM = fn(m);
  const fN = fn(n);
  if (fM * fN > 0) {
    return {
      hasZero: false,
      steps: [],
      currentStep: null,
      approxRoot: NaN,
      errorBound: n - m,
      validity: true,
      warningMessage: `f(${m.toFixed(1)}) 与 f(${n.toFixed(1)}) 同号 (${fM > 0 ? "+" : "-"})，不满足零点存在性定理前提 f(a)·f(b) < 0！`
    };
  }
  let left = m;
  let right = n;
  const steps = [];
  for (let k = 1; k <= maxSteps; k++) {
    const mid = (left + right) / 2;
    const fLeft = fn(left);
    const fRight = fn(right);
    const fMid = fn(mid);
    steps.push({
      step: k,
      left,
      right,
      mid,
      fLeft,
      fRight,
      fMid
    });
    if (Math.abs(fMid) < 1e-9) {
      break;
    }
    if (fLeft * fMid < 0) {
      right = mid;
    } else {
      left = mid;
    }
  }
  const currentStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const approxRoot = currentStep ? currentStep.mid : (m + n) / 2;
  const errorBound = currentStep ? (currentStep.right - currentStep.left) / 2 : (n - m) / 2;
  return {
    hasZero: true,
    steps,
    currentStep,
    approxRoot,
    errorBound,
    validity: true
  };
}
function buildFuncPropertiesPanel(params, config) {
  const mode = config?.mode || "parity";
  const fnType = config?.fnType || "cubic";
  const getFn = (x) => {
    switch (fnType) {
      case "cubic":
        return x * x * x;
      case "quadratic":
        return x * x;
      case "abs":
        return Math.abs(x);
      case "reciprocal":
        return Math.abs(x) > 1e-4 ? 1 / x : NaN;
      case "sin":
        return Math.sin(x);
      default:
        return x;
    }
  };
  const x0 = params.x0 ?? 1.5;
  const x1 = params.x1 ?? -1;
  const x2 = params.x2 ?? 2;
  const axisA = params.axisA ?? 0;
  const axisB = params.axisB ?? 2;
  if (mode === "domain") {
    const fx0 = getFn(x0);
    const domainText = fnType === "reciprocal" ? "(-∞, 0) ∪ (0, +∞)" : "R (-∞, +∞)";
    const rangeText = fnType === "quadratic" || fnType === "abs" ? "[0, +∞)" : fnType === "reciprocal" ? "(-∞, 0) ∪ (0, +∞)" : fnType === "sin" ? "[-1, 1]" : "R (-∞, +∞)";
    const quantities2 = [
      {
        label: "采样自变量 x₀",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "函数值 f(x₀)",
        symbol: "f(x₀)",
        value: Number.isFinite(fx0) ? fx0.toFixed(2) : "无定义",
        color: MATH_COLORS.function
      },
      {
        label: "定义域 D",
        symbol: "D",
        value: domainText,
        color: MATH_COLORS.functionTransformed
      },
      {
        label: "值域 R",
        symbol: "R",
        value: rangeText,
        color: MATH_COLORS.functionSecondary
      }
    ];
    const theorems2 = [
      {
        name: "定义域优先铁律",
        latex: "\\text{确定函数性质的前置条件: } x \\in D",
        level: "core",
        prerequisites: [
          "任何关于奇偶性、单调性、周期的讨论均建立在定义域存在的基础上"
        ]
      },
      {
        name: "值域与对应关系",
        latex: "R = \\{ y \\mid y = f(x), x \\in D \\}",
        level: "important",
        prerequisites: ["每一个 x 在 D 中有且仅有一个对应的 y"]
      }
    ];
    const gaokaoPoints2 = [
      {
        text: "高考第一陷阱：研究奇偶性或单调性前，必须首先确定函数的定义域！定义域如果不关于原点对称，直接判定为非奇非偶函数。",
        importance: "gaokao"
      },
      {
        text: "值域与最值：闭区间上的连续函数必有最大值与最小值；反比例函数与分式函数需特别警示渐近线与无定义断点。",
        importance: "core"
      }
    ];
    const warnings2 = [];
    if (fnType === "reciprocal" && Math.abs(x0) < 1e-4) {
      warnings2.push({
        text: "x₀ = 0 处反比例函数无定义！位于定义域之外。",
        level: "danger"
      });
    }
    return {
      quantities: quantities2,
      theorems: theorems2,
      gaokaoPoints: gaokaoPoints2,
      warnings: warnings2,
      mnemonic: "定义域先看对称否，无定义点需排查，值域区间仔细寻。"
    };
  }
  if (mode === "parity") {
    const parityRes = evalFunctionParity(
      fnType === "sin" ? "cubic" : fnType,
      x0
    );
    const secantRes = evalSecantSlope(getFn, x1, x2);
    const quantities2 = [
      {
        label: "采样点 x₀ / f(x₀)",
        symbol: "f(x₀)",
        value: Number.isFinite(parityRes.fx) ? parityRes.fx.toFixed(2) : "无定义",
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "奇偶性判定",
        value: fnType === "sin" ? "奇函数 (Odd)" : parityRes.parity === "even" ? "偶函数 (Even)" : parityRes.parity === "odd" ? "奇函数 (Odd)" : "非奇非偶",
        highlight: "extreme"
      },
      {
        label: "割线斜率 k",
        symbol: "k",
        value: Number.isFinite(secantRes.slope) ? secantRes.slope.toFixed(2) : "未定义",
        color: MATH_COLORS.secantLine
      },
      {
        label: "区间单调性",
        value: secantRes.monotonicity === "increasing" ? "单调递增 (k > 0)" : secantRes.monotonicity === "decreasing" ? "单调递减 (k < 0)" : "常数 / 重合",
        highlight: secantRes.monotonicity === "increasing" ? "positive" : "negative"
      }
    ];
    const theorems2 = [
      {
        name: "奇函数与偶函数严格定义",
        latex: "\\text{偶函数: } f(-x) = f(x), \\quad \\text{奇函数: } f(-x) = -f(x)",
        level: "core",
        prerequisites: ["定义域必须关于坐标原点对称！"]
      },
      {
        name: "单调性割线斜率判定定理",
        latex: "\\frac{f(x_2) - f(x_1)}{x_2 - x_1} > 0 \\iff f(x) \\text{ 单调递增}",
        level: "important",
        prerequisites: ["x₁ ≠ x₂ 且均属于定义域区间"]
      },
      {
        name: "奇同偶反定理",
        latex: "\\text{奇函数在对称区间单调性相同；偶函数在对称区间单调性相反}",
        level: "important",
        prerequisites: ["区间关于原点对称"]
      }
    ];
    const gaokaoPoints2 = [
      {
        text: "奇函数在原点处的性质：若奇函数 f(x) 在 x = 0 处有定义，则必有 f(0) = 0！这是高考特值秒杀的关键。",
        importance: "gaokao"
      },
      {
        text: "单调性与不等式：利用单调性脱去函数符号 f(A) > f(B) 转化为 A > B (增) 或 A < B (减)。",
        importance: "gaokao"
      }
    ];
    const warnings2 = [];
    if (Math.abs(x1 - x2) < 1e-4) {
      warnings2.push({
        text: "x₁ 与 x₂ 重合！割线退化，斜率未定义。",
        level: "warning"
      });
    }
    return {
      quantities: quantities2,
      theorems: theorems2,
      gaokaoPoints: gaokaoPoints2,
      warnings: warnings2,
      mnemonic: "奇在原点f(0)=0，偶图y轴左右对称，割线斜率为正增。"
    };
  }
  const symRes = evalSymmetryPeriod(axisA, axisB);
  const quantities = [
    {
      label: "第一对称轴 a",
      symbol: "x=a",
      value: axisA.toFixed(1),
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "第二对称轴 b",
      symbol: "x=b",
      value: axisB.toFixed(1),
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "轴间距 |a - b|",
      symbol: "Δd",
      value: symRes.dist.toFixed(1),
      color: MATH_COLORS.asymptote
    },
    {
      label: "导出最小正周期 T",
      symbol: "T",
      value: symRes.dist > 1e-4 ? symRes.period.toFixed(1) : "未导出(两轴重合)",
      highlight: symRes.dist > 1e-4 ? "positive" : "negative"
    }
  ];
  const theorems = [
    {
      name: "函数图象轴对称定理",
      latex: "f(a + x) = f(a - x) \\iff \\text{图象关于直线 } x = a \\text{ 轴对称}",
      level: "core",
      prerequisites: ["定义域关于 x = a 对称"]
    },
    {
      name: "双轴对称导出周期性定理",
      latex: "f(x) \\text{ 关于 } x=a, x=b \\text{ 对称 } \\Rightarrow T = 2|a - b|",
      level: "important",
      prerequisites: ["a ≠ b"]
    },
    {
      name: "一轴一中心推导周期",
      latex: "\\text{轴 } x=a \\text{ 与中心 } (b,c) \\Rightarrow T = 4|a - b|",
      level: "important",
      prerequisites: ["a ≠ b"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考压轴秒杀：只要看到 f(a+x) = f(b-x)，对称轴必为 x = (a+b)/2；看到 f(a+x) = -f(b-x)，周期必与 2|a-b| 或 4|a-b| 相关！",
      importance: "gaokao"
    },
    {
      text: "周期函数性质：f(x+T) = f(x) 意味着函数图象在水平方向上按长度 T 无限重复循环。",
      importance: "core"
    }
  ];
  const warnings = [];
  if (symRes.dist < 1e-4) {
    warnings.push({
      text: "对称轴 a 与 b 重合！无法导出周期 T，需两条不同对称轴。",
      level: "warning"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "双轴对称周期现，周期长度等于两倍轴距 T=2|a-b|。"
  };
}
function buildFuncExpLogPanel(params, config) {
  const subType = config?.subExpLog ?? "exponential";
  if (subType === "power") {
    const alpha = params.powerAlpha ?? 2;
    const x02 = params.x0 ?? 1.5;
    const powerRes = calculatePowerFunction(alpha, x02);
    const quantities2 = [
      {
        label: "指数 α",
        symbol: "\\alpha",
        value: alpha.toFixed(1),
        color: MATH_COLORS.paramPrimary
      },
      { label: "自变量 x₀", symbol: "x_0", value: x02.toFixed(2) },
      {
        label: "函数值 y₀",
        symbol: "x_0^{\\alpha}",
        value: powerRes.isValidPoint ? powerRes.yVal.toFixed(2) : "无定义",
        color: MATH_COLORS.function
      },
      {
        label: "定义域",
        value: powerRes.domainDescription
      },
      {
        label: "奇偶性",
        value: powerRes.parityDescription
      },
      {
        label: "(0,+∞) 单调性",
        value: powerRes.monotonicityPositive,
        highlight: alpha > 0 ? "positive" : alpha < 0 ? "extreme" : void 0
      }
    ];
    const theorems2 = [
      {
        name: "幂函数概念与第一象限通用性质",
        latex: "y = x^{\\alpha} \\quad (x > 0)",
        level: "core",
        prerequisites: ["图象必过定点 (1, 1)", "在 (0, +∞) 上均有定义"]
      },
      {
        name: "高考常见 5 种基准幂函数",
        latex: "y=x, \\quad y=x^2, \\quad y=x^3, \\quad y=x^{-1}, \\quad y=x^{1/2}",
        level: "important",
        prerequisites: ["奇偶性判定", "定义域分析"]
      },
      {
        name: "第一象限图象变化特征",
        latex: "\\alpha > 1: \\text{凸向上递增}; \\quad 0 < \\alpha < 1: \\text{凹向下递增}; \\quad \\alpha < 0: \\text{减函数且含双渐近线}",
        level: "important",
        prerequisites: ["x > 0", "α ≠ 0"]
      }
    ];
    const gaokaoPoints2 = [
      {
        text: "高考必考定点：所有幂函数图象在第一象限内必过定点 (1, 1)；当 α > 0 时图象必过原点 (0, 0)。",
        importance: "gaokao"
      },
      {
        text: "第一象限图象比较策略：取 x = 2，看图象的高低，y 值越大对应的指数 α 越大。",
        importance: "gaokao"
      }
    ];
    const warnings2 = [];
    if (powerRes.warningMessage) {
      warnings2.push({
        text: powerRes.warningMessage,
        level: "danger"
      });
    }
    return {
      quantities: quantities2,
      theorems: theorems2,
      gaokaoPoints: gaokaoPoints2,
      warnings: warnings2,
      mnemonic: "第一象限必过(1,1)，α大于0增且过原点；取x=2高者指数大。"
    };
  }
  const a = params.baseA ?? 2;
  const x0 = params.x0 ?? 1.5;
  const expLogRes = calculateExpLog(a, x0);
  const quantities = [
    {
      label: "底数 a",
      symbol: "a",
      value: a.toFixed(1),
      color: MATH_COLORS.paramPrimary
    },
    { label: "自变量 x₀", symbol: "x₀", value: x0.toFixed(2) },
    {
      label: subType === "logarithmic" ? "对数函数值" : "指数函数值",
      symbol: subType === "logarithmic" ? "\\log_a(x_0)" : "a^{x_0}",
      value: subType === "logarithmic" ? expLogRes.isValidBase && Number.isFinite(expLogRes.logVal) ? expLogRes.logVal.toFixed(2) : "无意义" : expLogRes.isValidBase ? expLogRes.expVal.toFixed(2) : "无意义",
      color: MATH_COLORS.function
    },
    {
      label: subType === "logarithmic" ? "对称指数值" : "对称对数值",
      symbol: subType === "logarithmic" ? "a^{x_0}" : "\\log_a(x_0)",
      value: subType === "logarithmic" ? expLogRes.isValidBase ? expLogRes.expVal.toFixed(2) : "无意义" : expLogRes.isValidBase && Number.isFinite(expLogRes.logVal) ? expLogRes.logVal.toFixed(2) : "无意义",
      color: MATH_COLORS.functionTransformed
    },
    {
      label: "单调状态",
      value: a > 1 ? "单调递增 (a > 1)" : a > 0 && a < 1 ? "单调递减 (0 < a < 1)" : "退化/无定义",
      highlight: a > 1 ? "extreme" : "positive"
    }
  ];
  const theorems = [
    {
      name: "指数与对数互为反函数关系",
      latex: "y = a^x \\iff x = \\log_a y \\quad (a > 0, a \\neq 1)",
      level: "core",
      prerequisites: ["a > 0", "a ≠ 1", "x ∈ ℝ, y > 0"]
    },
    {
      name: "反函数图像对称定理",
      latex: "\\small\\text{互为反函数的两个函数图象关于直线 } y = x \\text{ 轴对称}",
      level: "important",
      prerequisites: ["定义域与值域互换"]
    },
    {
      name: "对数换底公式与运算法则",
      latex: "\\log_a b = \\frac{\\ln b}{\\ln a}, \\quad \\log_a(MN) = \\log_a M + \\log_a N",
      level: "important",
      prerequisites: ["M > 0", "N > 0"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考高频定点：指数函数 y = a^x 必过定点 (0, 1)，渐近线 y = 0；对数函数 y = log_a x 必过定点 (1, 0)，渐近线 x = 0。",
      importance: "gaokao"
    },
    {
      text: "反函数三要素：① 定义域与值域互换；② 图象关于 y = x 对称；③ 只有严格单调函数才存在同单调性的反函数。",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (expLogRes.baseWarning) {
    warnings.push({
      text: expLogRes.baseWarning,
      level: "danger"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "指过(0,1)对过(1,0)，底过1增小1减；y=x对称反函数。"
  };
}
function buildFuncZeroPanel(params) {
  const m = params.intervalM ?? -1;
  const n = params.intervalN ?? 2.5;
  const steps = Math.max(1, Math.round(params.bisectionSteps ?? 3));
  const targetFn = (x) => x * x * x - x - 2;
  const bisectionRes = solveBisection(targetFn, m, n, steps);
  const quantities = [
    { label: "研究区间", value: `[${m.toFixed(1)}, ${n.toFixed(1)}]` },
    {
      label: "迭代次数 Step",
      symbol: "k",
      value: steps,
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "近似零点根",
      symbol: "x*",
      value: Number.isFinite(bisectionRes.approxRoot) ? bisectionRes.approxRoot.toFixed(4) : "未收敛",
      color: MATH_COLORS.function
    },
    {
      label: "最大误差界",
      symbol: "ε",
      value: Number.isFinite(bisectionRes.errorBound) ? `±${bisectionRes.errorBound.toFixed(4)}` : "未知",
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "零点定理满足",
      value: bisectionRes.hasZero ? "满足 (f(a)·f(b) < 0)" : "不满足同号",
      highlight: bisectionRes.hasZero ? "extreme" : "negative"
    }
  ];
  const theorems = [
    {
      name: "零点存在性定理 (Bolzano 定理)",
      latex: "f(a) \\cdot f(b) < 0 \\implies \\exists c \\in (a, b), \\, f(c) = 0",
      level: "core",
      prerequisites: ["f(x) 在 [a, b] 上连续"]
    },
    {
      name: "二分法误差缩小公式",
      latex: "|x^* - x_k| \\le \\frac{b - a}{2^k}",
      level: "important",
      prerequisites: ["迭代 k 次", "每步区间长度减半"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "零点定理注意事项：定理只是“充分条件”而非“必要条件”！若 f(a)·f(b) > 0，在 (a, b) 内仍可能有偶数个零点；若 f(x) 不连续，异号也不一定有零点。",
      importance: "gaokao"
    },
    {
      text: "单调函数零点唯一性：若连续函数 f(x) 在 [a, b] 上单调且 f(a)·f(b) < 0，则在 (a, b) 上有且仅有一个零点。",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (bisectionRes.warningMessage) {
    warnings.push({
      text: bisectionRes.warningMessage,
      level: "warning"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "连续异号有零点，二分切半误差减；单调保证唯一根。"
  };
}
function evalBaseFunction(fnType, x) {
  switch (fnType) {
    case "quadratic":
      return x * x;
    case "sine":
      return Math.sin(x);
    case "cubic":
      return x * x * x;
    case "exp":
      return Math.pow(2, x);
    default:
      return x;
  }
}
function evalTransformedFunction(fnType, params, x) {
  const { h, k, A, omega, foldMode } = params;
  const effectiveX = foldMode === "input" ? Math.abs(x) : x;
  const innerArg = omega * (effectiveX - h);
  const rawY = evalBaseFunction(fnType, innerArg);
  let y = A * rawY + k;
  if (foldMode === "global") {
    y = Math.abs(y);
  }
  return y;
}
function calculateTransform(fnType, params) {
  const { h, k, A, omega, foldMode } = params;
  const isDegenerate = A === 0 || omega === 0;
  let warningMessage;
  if (A === 0) {
    warningMessage = "纵向伸缩系数 A = 0，函数退化为常数直线 y = k！";
  } else if (omega === 0) {
    warningMessage = "频率/横向系数 ω = 0，自变量缩退为常数，失去函数图像变化！";
  }
  const baseFn = (x) => evalBaseFunction(fnType, x);
  const transformedFn = (x) => evalTransformedFunction(fnType, params, x);
  const origKeyXList = fnType === "sine" ? [0, Math.PI / 2] : [0, 1];
  const keyPoints = origKeyXList.map((xOrig) => {
    const yOrig = baseFn(xOrig);
    const xTransformed = omega !== 0 ? xOrig / omega + h : h;
    const yTransformed = transformedFn(xTransformed);
    return {
      label: `P(${xOrig.toFixed(1)}, ${yOrig.toFixed(1)})`,
      original: { x: xOrig, y: yOrig },
      transformed: { x: xTransformed, y: yTransformed }
    };
  });
  const hDesc = h > 0 ? `向右平移 ${h.toFixed(1)}` : h < 0 ? `向左平移 ${Math.abs(h).toFixed(1)}` : "未平移";
  const kDesc = k > 0 ? `向上平移 ${k.toFixed(1)}` : k < 0 ? `向下平移 ${Math.abs(k).toFixed(1)}` : "未平移";
  const aDesc = A !== 1 ? `纵向伸缩 ${A.toFixed(1)} 倍` : "";
  const wDesc = omega !== 1 ? `横向伸缩 ${omega.toFixed(1)} 倍` : "";
  const foldDesc = foldMode === "global" ? "保留 x 轴上方，下方翻折向上" : foldMode === "input" ? "保留 y 轴右侧，左侧按右侧对称" : "";
  const description = [hDesc, kDesc, aDesc, wDesc, foldDesc].filter(Boolean).join("；");
  return {
    fnType,
    params,
    baseFn,
    transformedFn,
    keyPoints,
    description,
    isDegenerate,
    warningMessage
  };
}
function buildFuncTransformPanel(params, config) {
  const fnType = config?.fnType || "quadratic";
  const foldMode = config?.foldMode || "none";
  const h = params.h ?? 1;
  const k = params.k ?? 0.5;
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 1;
  const res = calculateTransform(fnType, { h, k, A, omega, foldMode });
  const quantities = [
    {
      label: "左右平移",
      symbol: "h",
      value: h > 0 ? `右移 ${h}` : h < 0 ? `左移 ${Math.abs(h)}` : "0",
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "上下平移",
      symbol: "k",
      value: k > 0 ? `上移 ${k}` : k < 0 ? `下移 ${Math.abs(k)}` : "0",
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "纵向伸缩",
      symbol: "A",
      value: `${A} 倍`,
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "横向伸缩",
      symbol: "ω",
      value: `${omega} 倍`,
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "翻折模式",
      value: foldMode === "global" ? "|f(x)| 轴上翻" : foldMode === "input" ? "f(|x|) y轴对称" : "无"
    },
    { label: "几何演化", value: res.description }
  ];
  const theorems = [
    {
      name: "图像平移口诀 (左加右减，上加下减)",
      latex: "y = f(x \\mp h) \\pm k",
      level: "core",
      prerequisites: ["x - h 对应向右平移 h", "+ k 对应向上平移 k"]
    },
    {
      name: "绝对值翻折法则",
      latex: "y = |f(x)| \\quad \\text{保留 } x \\text{ 轴上方，下方翻到上方}",
      level: "important",
      prerequisites: ["y = f(|x|) 保留 y 轴右侧，左侧按右侧对称"]
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考图像平移陷阱：y = f(2x + 1) 是由 y = f(2x) 向左平移 1/2 个单位得到，而不是 1 个单位！提公因数 2 得 y = f(2(x + 1/2))。",
      importance: "gaokao"
    },
    {
      text: "翻折图像定义域与值域：y = |f(x)| 的值域必为 [0, +∞)；y = f(|x|) 必定为偶函数。",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (res.isDegenerate && res.warningMessage) {
    warnings.push({ text: res.warningMessage, level: "warning" });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "左加右减平移定，上加下减纵向移；整体绝对值保留上，自变量绝对对称右。"
  };
}
function calculatePiecewise(params) {
  const { x0, leftSlope, leftConst, rightSlope, rightConst } = params;
  const leftValAtX0 = leftSlope * x0 + leftConst;
  const rightValAtX0 = rightSlope * x0 + rightConst;
  const isContinuous = Math.abs(leftValAtX0 - rightValAtX0) < 1e-4;
  const evaluate = (x) => {
    if (x <= x0) {
      return leftSlope * x + leftConst;
    } else {
      return rightSlope * x + rightConst;
    }
  };
  const description = isContinuous ? `在分界点 x₀ = ${x0.toFixed(1)} 处连续，左极限 = 右极限 = ${leftValAtX0.toFixed(2)}。` : `在分界点 x₀ = ${x0.toFixed(1)} 处断开，左极限 ${leftValAtX0.toFixed(2)} ≠ 右极限 ${rightValAtX0.toFixed(2)}。`;
  return {
    x0,
    leftValAtX0,
    rightValAtX0,
    isContinuous,
    evaluate,
    description
  };
}
function calculateComposite(params) {
  const { xSample, innerB, innerC, outerType } = params;
  const u = xSample * xSample + innerB * xSample + innerC;
  const axisX = -innerB / 2;
  const innerMono = xSample > axisX ? "increasing" : xSample < axisX ? "decreasing" : "stationary";
  let y = NaN;
  let outerMono = "increasing";
  let isValid = true;
  let warningMessage;
  switch (outerType) {
    case "exp":
      y = Math.pow(2, u);
      outerMono = "increasing";
      break;
    case "log":
      if (u <= 0) {
        isValid = false;
        warningMessage = `中间变量 u = g(${xSample.toFixed(1)}) = ${u.toFixed(2)} ≤ 0，超出对数外层定义域 (u > 0)！`;
        y = NaN;
      } else {
        y = Math.log2(u);
        outerMono = "increasing";
      }
      break;
    case "quadratic":
      y = -Math.pow(u - 2, 2) + 4;
      outerMono = u < 2 ? "increasing" : u > 2 ? "decreasing" : "stationary";
      break;
  }
  let compositeMono = "stationary";
  if (innerMono === "stationary" || outerMono === "stationary") {
    compositeMono = "stationary";
  } else if (innerMono === outerMono) {
    compositeMono = "increasing";
  } else {
    compositeMono = "decreasing";
  }
  const ruleMnemonic = "同增异减法则：内外层单调性相同时复合函数递增，相反时递减。";
  return {
    x: xSample,
    u,
    y,
    innerMonotonicity: innerMono,
    outerMonotonicity: outerMono,
    compositeMonotonicity: compositeMono,
    ruleMnemonic,
    isValid,
    warningMessage
  };
}
function buildFuncCompositePanel(params, config) {
  const subMode = config?.subMode || "piecewise";
  if (subMode === "piecewise") {
    const x0 = params.x0 ?? 1;
    const leftSlope = params.leftSlope ?? 1;
    const leftConst = params.leftConst ?? 0;
    const rightSlope = params.rightSlope ?? -0.5;
    const rightConst = params.rightConst ?? 1.5;
    const res = calculatePiecewise({
      x0,
      leftSlope,
      leftConst,
      rightSlope,
      rightConst
    });
    const quantities = [
      {
        label: "分界点",
        symbol: "x₀",
        value: x0.toFixed(1),
        color: MATH_COLORS.paramPrimary
      },
      { label: "左段 x ≤ x₀ 极限", value: res.leftValAtX0.toFixed(2) },
      { label: "右段 x > x₀ 极限", value: res.rightValAtX0.toFixed(2) },
      {
        label: "连续状态",
        value: res.isContinuous ? "连续" : "存在跳跃断点",
        highlight: res.isContinuous ? "extreme" : "negative"
      }
    ];
    const theorems = [
      {
        name: "分段函数连续条件",
        latex: "\\lim_{x \\to x_0^-} f(x) = \\lim_{x \\to x_0^+} f(x) = f(x_0)",
        level: "core",
        prerequisites: ["左右两侧函数在分界点处函数值相等"]
      }
    ];
    const gaokaoPoints = [
      {
        text: "分段函数求值策略：“由外向内”或“自内向外”逐步代入，优先判断自变量所在段的区间范围。",
        importance: "gaokao"
      },
      {
        text: "分段函数零点：需分别求各段的零点，并严格检验所得解是否落在该段的定义域内！",
        importance: "gaokao"
      }
    ];
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings: [],
      mnemonic: "分段讨论看分界，代入先核定义域；零点分别求解验证。"
    };
  } else {
    const xSample = params.xSample ?? 1.5;
    const innerB = params.innerB ?? -2;
    const innerC = params.innerC ?? 2;
    const outerType = config?.outerType || "exp";
    const res = calculateComposite({ xSample, innerB, innerC, outerType });
    const quantities = [
      {
        label: "自变量采样",
        symbol: "x",
        value: xSample.toFixed(1),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "中间变量",
        symbol: "u = g(x)",
        value: Number.isFinite(res.u) ? res.u.toFixed(2) : "无意义",
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "复合终值",
        symbol: "y = f(u)",
        value: Number.isFinite(res.y) ? res.y.toFixed(2) : "无意义",
        color: MATH_COLORS.function
      },
      {
        label: "内层单调性",
        value: res.innerMonotonicity === "increasing" ? "单调递增" : res.innerMonotonicity === "decreasing" ? "单调递减" : "驻点/极值点"
      },
      {
        label: "外层单调性",
        value: res.outerMonotonicity === "increasing" ? "单调递增" : res.outerMonotonicity === "decreasing" ? "单调递减" : "驻点"
      },
      {
        label: "复合单调性",
        value: res.compositeMonotonicity === "increasing" ? "🟢 单调递增" : res.compositeMonotonicity === "decreasing" ? "🔴 单调递减" : "🟡 驻点",
        highlight: res.compositeMonotonicity === "increasing" ? "extreme" : "negative"
      }
    ];
    const theorems = [
      {
        name: "复合函数单调性法则 (同增异减)",
        latex: "y = f(g(x)) \\quad (\\text{增}+\\text{增}\\to\\text{增},\\, \\text{减}+\\text{减}\\to\\text{增},\\, \\text{增}+\\text{减}\\to\\text{减})",
        level: "core",
        prerequisites: ["g(x) 在区间 I 上单调", "f(u) 在 g(I) 上单调"]
      }
    ];
    const gaokaoPoints = [
      {
        text: "复合函数值域核心：求解 y = f(g(x)) 的值域时，必须先求内层 u = g(x) 的值域 U，再求外层 f(u) 在定义域 U 上的值域！直接忽略内层值域是高考最高频错因。",
        importance: "gaokao"
      }
    ];
    const warnings = [];
    if (!res.isValid && res.warningMessage) {
      warnings.push({ text: res.warningMessage, level: "warning" });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: res.ruleMnemonic
    };
  }
}
function solveNike(a, b, h = 0, c = 0) {
  const isAZero = Math.abs(a) < 1e-9;
  const isBZero = Math.abs(b) < 1e-9;
  const symmetryCenter = { x: h, y: c };
  const verticalAsymptoteX = h;
  const obliqueAsymptoteSlope = a;
  const obliqueAsymptoteIntercept = c - a * h;
  if (isAZero && isBZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "constant",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: 0,
      obliqueAsymptoteIntercept: c,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "both_zero",
      monotonicityDescription: "常数函数 y = c，全域单调递增/递减均不成立",
      parityDescription: h === 0 ? c === 0 ? "既是偶函数又是奇函数" : "偶函数" : "非奇非偶函数"
    };
  }
  if (isAZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "inverse_prop",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: 0,
      obliqueAsymptoteIntercept: c,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "a_zero",
      monotonicityDescription: b > 0 ? `在 (-∞, ${h}) 和 (${h}, +∞) 上分别单调递减` : `在 (-∞, ${h}) 和 (${h}, +∞) 上分别单调递增`,
      parityDescription: h === 0 && c === 0 ? "奇函数（关于原点对称）" : `关于点 (${h}, ${c}) 中心对称`
    };
  }
  if (isBZero) {
    return {
      a,
      b,
      h,
      c,
      curveType: "proportional",
      symmetryCenter,
      verticalAsymptoteX,
      obliqueAsymptoteSlope: a,
      obliqueAsymptoteIntercept: c - a * h,
      criticalPoints: [],
      amgmMinPoint: null,
      isValid: false,
      isDegenerate: true,
      degenerationType: "b_zero",
      monotonicityDescription: a > 0 ? "在 R 上单调递增" : "在 R 上单调递减",
      parityDescription: h === 0 && c === 0 ? "奇函数（关于原点对称）" : `关于点 (${h}, ${c}) 中心对称`
    };
  }
  const ab = a * b;
  const isNike = ab > 0;
  const curveType = isNike ? "nike" : "streamer";
  const criticalPoints = [];
  let amgmMinPoint = null;
  if (isNike) {
    const deltaX = Math.sqrt(b / a);
    const rightX = h + deltaX;
    const leftX = h - deltaX;
    const extValRight = c + 2 * Math.sqrt(ab) * (a > 0 ? 1 : -1);
    const extValLeft = c - 2 * Math.sqrt(ab) * (a > 0 ? 1 : -1);
    if (a > 0 && b > 0) {
      criticalPoints.push({
        x: rightX,
        y: extValRight,
        type: "min",
        label: `极小值点 (${rightX.toFixed(2)}, ${extValRight.toFixed(2)})`
      });
      criticalPoints.push({
        x: leftX,
        y: extValLeft,
        type: "max",
        label: `极大值点 (${leftX.toFixed(2)}, ${extValLeft.toFixed(2)})`
      });
      amgmMinPoint = {
        x: rightX,
        y: extValRight,
        val1: Math.sqrt(ab),
        val2: Math.sqrt(ab)
      };
    } else {
      criticalPoints.push({
        x: rightX,
        y: extValRight,
        type: "max",
        label: `极大值点 (${rightX.toFixed(2)}, ${extValRight.toFixed(2)})`
      });
      criticalPoints.push({
        x: leftX,
        y: extValLeft,
        type: "min",
        label: `极小值点 (${leftX.toFixed(2)}, ${extValLeft.toFixed(2)})`
      });
    }
  }
  let monotonicityDescription = "";
  if (isNike) {
    const rXStr = (h + Math.sqrt(b / a)).toFixed(2);
    const lXStr = (h - Math.sqrt(b / a)).toFixed(2);
    if (a > 0) {
      monotonicityDescription = `在 (-∞, ${lXStr}] 和 [${rXStr}, +∞) 单调递增；在 [${lXStr}, ${h}) 和 (${h}, ${rXStr}] 单调递减`;
    } else {
      monotonicityDescription = `在 (-∞, ${lXStr}] 和 [${rXStr}, +∞) 单调递减；在 [${lXStr}, ${h}) 和 (${h}, ${rXStr}] 单调递增`;
    }
  } else {
    if (a > 0) {
      monotonicityDescription = `在 (-∞, ${h}) 和 (${h}, +∞) 上均为单调递增，全域无极值点`;
    } else {
      monotonicityDescription = `在 (-∞, ${h}) 和 (${h}, +∞) 上均为单调递减，全域无极值点`;
    }
  }
  const parityDescription = h === 0 && c === 0 ? "奇函数（图像关于原点 (0,0) 成中心对称）" : `非奇非偶函数（图像关于中心点 (${h}, ${c}) 成中心对称）`;
  return {
    a,
    b,
    h,
    c,
    curveType,
    symmetryCenter,
    verticalAsymptoteX,
    obliqueAsymptoteSlope,
    obliqueAsymptoteIntercept,
    criticalPoints,
    amgmMinPoint,
    isValid: true,
    isDegenerate: false,
    degenerationType: "none",
    monotonicityDescription,
    parityDescription
  };
}
function evalNikeAt(a, b, h = 0, c = 0, x0) {
  const dx = x0 - h;
  if (Math.abs(dx) < 1e-6) {
    return {
      isValid: false,
      y: NaN,
      derivative: NaN,
      intercept: NaN,
      tangentEquation: "切线不存在 (无意义点)"
    };
  }
  const y = a * dx + c + b / dx;
  const derivative = a - b / (dx * dx);
  const intercept = y - derivative * x0;
  const tangentEquation = `y = ${derivative.toFixed(2)}x ${intercept >= 0 ? "+" : "-"} ${Math.abs(intercept).toFixed(2)}`;
  return {
    isValid: true,
    y,
    derivative,
    intercept,
    tangentEquation
  };
}
const PARAM_COLORS = {
  a: MATH_COLORS.paramPrimary,
  // #EF4444
  b: MATH_COLORS.paramSecondary,
  // #D97706
  t: MATH_COLORS.paramTertiary
  // #059669
};
function buildNikePanel(params, config) {
  const a = params.a ?? 1;
  const b = params.b ?? 4;
  const x0 = params.x0 ?? 3;
  const h = params.h ?? 0;
  const c = params.c ?? 0;
  const activeMode = config?.activeMode || "standard";
  const res = solveNike(a, b, h, c);
  const evalPt = evalNikeAt(a, b, h, c, x0);
  const col = colorize;
  const ca = PARAM_COLORS.a;
  const cb = PARAM_COLORS.b;
  const ct = PARAM_COLORS.t;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  let mnemonic = "对勾函数看系数，ab同号出对勾，极值根号b比a，均值不等双项相等。";
  const funcFormulaStr = h === 0 && c === 0 ? `y = ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} = ${col(a.toFixed(1), ca)}x + \\frac{${col(b.toFixed(1), cb)}}{x}` : `y = ${col(a.toFixed(1), ca)}(x - ${col(h.toFixed(1), ct)}) + ${col(c.toFixed(1), ct)} + \\frac{${col(b.toFixed(1), cb)}}{x - ${col(h.toFixed(1), ct)}}`;
  quantities.push({
    label: "函数解析式",
    value: funcFormulaStr
  });
  quantities.push({
    label: "图像形态分类",
    value: res.curveType === "nike" ? "经典对勾型 (ab > 0)" : res.curveType === "streamer" ? "双曲飘带型 (ab < 0)" : res.curveType === "inverse_prop" ? "反比例退化型 (a = 0)" : res.curveType === "proportional" ? "正比例退化型 (b = 0)" : "常数退化型"
  });
  quantities.push({
    label: "渐近线方程",
    value: `x = ${h.toFixed(1)}, y = ${a.toFixed(1)}x ${c - a * h >= 0 ? "+" : "-"} ${Math.abs(c - a * h).toFixed(1)}`
  });
  quantities.push({
    label: "奇偶性与对称中心",
    value: `${res.parityDescription}`
  });
  quantities.push({
    label: "单调区间分布",
    value: `${res.monotonicityDescription}`
  });
  if (evalPt.isValid) {
    quantities.push({
      label: `探针动点 P(${x0.toFixed(1)}, f(${x0.toFixed(1)}))`,
      value: `P(${col(x0.toFixed(2), ct)}, \\; ${col(evalPt.y.toFixed(2), ct)})`
    });
    quantities.push({
      label: "点 P 处切线斜率 k",
      value: `k = f'(${x0.toFixed(1)}) = ${evalPt.derivative.toFixed(2)}`
    });
  }
  if (activeMode === "amgm") {
    mnemonic = "一正二定三相等，均值不等拆项巧，ax等于b比x，和值极小勾底现。";
    theorems.push({
      name: "基本不等式（均值不等式）",
      latex: `\\text{若 } ${col("a", ca)}>0, ${col("b", cb)}>0, x>0, \\text{ 则 } ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} \\ge 2\\sqrt{${col("a", ca)}${col("b", cb)}}`,
      prerequisites: ["a > 0", "b > 0", "x > 0"],
      note: "当且仅当 ax = b/x (即 x = √(b/a)) 时等号成立"
    });
    if (a > 0 && b > 0) {
      const minX = Math.sqrt(b / a);
      const minY = 2 * Math.sqrt(a * b);
      quantities.push({
        label: "均值不等式最小值",
        value: `y_{min} = 2\\sqrt{${a} \\times ${b}} = ${minY.toFixed(2)} \\quad (x = ${minX.toFixed(2)})`
      });
    }
    gaokaoPoints.push({
      text: "高考高频：均值不等式求最值与配凑法。将分式变形为 ax + b/(x-h) + c 形式，利用均值不等式求解最值，严格检验等号成立条件。",
      importance: "gaokao"
    });
  } else if (activeMode === "shifted") {
    mnemonic = "渐近交点为中心，平移h与平移c，双曲性质全保留，图象变换看对应。";
    theorems.push({
      name: "双曲型分式平移变换定理",
      latex: `f(x) = \\frac{A x + B}{C x + D} = k_0 + \\frac{k_1}{x - h}`,
      prerequisites: ["C ≠ 0", "AD - BC ≠ 0"],
      note: "中心对称点平移至 (h, k0) = (-D/C, A/C)，渐近线为 x = h 与 y = k0"
    });
    gaokaoPoints.push({
      text: "高考考点：分式线性函数的图象与对称性。形如 y = (ax+b)/(cx+d) 的函数，对称中心为 (-d/c, a/c)，常考单调性与对称性。",
      importance: "gaokao"
    });
  } else {
    theorems.push({
      name: "对勾函数极值定理",
      latex: `f(x) = ${col("a", ca)}x + \\frac{${col("b", cb)}}{x} \\implies f'(x) = ${col("a", ca)} - \\frac{${col("b", cb)}}{x^2} = 0`,
      prerequisites: ["a · b > 0"],
      note: "在 x = ±√(b/a) 处分别取得极小值与极大值"
    });
    gaokaoPoints.push({
      text: "高考考点：对勾函数的单调性与闭区间最值。结合对勾函数单调性考查在有限闭区间 [m, n] 上的最值与参数范围求解。",
      importance: "gaokao"
    });
  }
  if (res.isDegenerate) {
    if (res.degenerationType === "a_zero") {
      warnings.push({
        text: "警告：斜率 a = 0，斜渐近线降维，对勾函数退化为反比例函数 y = b/x。",
        level: "warning"
      });
    } else if (res.degenerationType === "b_zero") {
      warnings.push({
        text: "警告：分子 b = 0，反比例项消失，对勾函数退化为正比例一次函数 y = ax。",
        level: "warning"
      });
    } else {
      warnings.push({
        text: "危险：a = 0 且 b = 0，函数退化为常数零函数。",
        level: "danger"
      });
    }
  }
  if (Math.abs(x0 - h) < 1e-3) {
    warnings.push({
      text: `危险：探针动点处于渐近线 x = ${h} 无意义位置，函数在该点无定义！`,
      level: "danger"
    });
  }
  return { quantities, theorems, gaokaoPoints, warnings, mnemonic };
}
function solveExpTangent(x0) {
  if (!Number.isFinite(x0)) {
    return {
      x0: 0,
      y0: 1,
      slope: 1,
      intercept: 1,
      latexEquation: "y = x + 1",
      isValid: false,
      degenerateReason: "切点横坐标无效"
    };
  }
  const y0 = Math.exp(x0);
  const slope = y0;
  const intercept = y0 * (1 - x0);
  const slopeStr = slope.toFixed(2);
  const interceptSign = intercept >= 0 ? "+" : "-";
  const interceptStr = Math.abs(intercept).toFixed(2);
  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: `y = ${slopeStr}x ${interceptSign} ${interceptStr}`,
    isValid: true
  };
}
function solveLogTangent(x0) {
  if (!Number.isFinite(x0) || x0 <= 0) {
    return {
      x0: Math.max(0.1, x0),
      y0: NaN,
      slope: NaN,
      intercept: NaN,
      latexEquation: "y = x - 1",
      isValid: false,
      degenerateReason: "对数函数定义域必须为 x > 0"
    };
  }
  const y0 = Math.log(x0);
  const slope = 1 / x0;
  const intercept = y0 - 1;
  const slopeStr = slope.toFixed(2);
  const interceptSign = intercept >= 0 ? "+" : "-";
  const interceptStr = Math.abs(intercept).toFixed(2);
  return {
    x0,
    y0,
    slope,
    intercept,
    latexEquation: `y = ${slopeStr}x ${interceptSign} ${interceptStr}`,
    isValid: true
  };
}
function solveParamExpAx1(a) {
  const criticalA = 1;
  const eps = 1e-4;
  if (Math.abs(a - criticalA) < eps) {
    return {
      a,
      criticalA,
      status: "tangent",
      intersections: 1,
      description: "a = 1 时，y = x + 1 恰为 e^x 在 (0, 1) 处的基准切线，全定义域 e^x ≥ x + 1 成立。"
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      status: "intersect",
      intersections: 2,
      description: "a > 1 时，直线斜率过大，与 e^x 曲线在 x < 0 区间产生第二个交点，部分区域 e^x < ax + 1，不恒成立。"
    };
  } else {
    return {
      a,
      criticalA,
      status: "above",
      intersections: 1,
      description: "a < 1 时，直线在 e^x 下方，e^x ≥ ax + 1 依然恒成立（放缩变宽松）。"
    };
  }
}
function solveParamExpAx(a) {
  const criticalA = Math.E;
  const eps = 1e-3;
  if (Math.abs(a - criticalA) < eps) {
    return {
      a,
      criticalA,
      tangentX: 1,
      status: "tangent",
      intersections: 1,
      description: "a = e 时，y = ex 恰为 e^x 在切点 (1, e) 处过原点的切线，e^x ≥ ex 恒成立。"
    };
  } else if (a > criticalA) {
    return {
      a,
      criticalA,
      tangentX: 1,
      status: "intersect",
      intersections: 2,
      description: "a > e 时，过原点的直线斜率过大，与 e^x 曲线交于两个点，e^x ≥ ax 不成立。"
    };
  } else {
    return {
      a,
      criticalA,
      tangentX: 1,
      status: "separated",
      intersections: 0,
      description: "a < e 时，直线位于 e^x 曲线下方无交点，e^x > ax 严格成立。"
    };
  }
}
function buildTranscendentalPanel(params, config) {
  const mode = config?.mode || "exp";
  const x0 = params.x0 ?? 0;
  const a = params.a ?? 1;
  const quantities = [];
  const warnings = [];
  if (mode === "exp") {
    const resExp = solveExpTangent(x0);
    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "切点纵坐标",
        symbol: "e^{x₀}",
        value: resExp.y0.toFixed(3),
        color: MATH_COLORS.function
      },
      {
        label: "切线斜率",
        symbol: "f'(x₀)",
        value: resExp.slope.toFixed(3),
        color: MATH_COLORS.tangentLine
      },
      {
        label: "基准下界差值 (x=0)",
        symbol: "e⁰ - (0+1)",
        value: "0.000",
        color: MATH_COLORS.labelText
      }
    );
  } else if (mode === "log") {
    const resLog = solveLogTangent(x0);
    if (!resLog.isValid) {
      warnings.push({
        text: "对数函数定义域必须满足 x₀ > 0，当前切点无效！",
        level: "danger"
      });
    }
    quantities.push(
      {
        label: "切点横坐标",
        symbol: "x₀",
        value: x0.toFixed(2),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "切点纵坐标",
        symbol: "ln(x₀)",
        value: resLog.isValid ? resLog.y0.toFixed(3) : "无定义",
        color: MATH_COLORS.function
      },
      {
        label: "切线斜率",
        symbol: "g'(x₀)",
        value: resLog.isValid ? resLog.slope.toFixed(3) : "无定义",
        color: MATH_COLORS.tangentLine
      },
      {
        label: "基准上界差值 (x=1)",
        symbol: "(1-1) - ln 1",
        value: "0.000",
        color: MATH_COLORS.labelText
      }
    );
  } else if (mode === "chain") {
    quantities.push(
      {
        label: "基准中轴切线",
        symbol: "y",
        value: "x",
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "指数上界",
        symbol: "e^{x-1}",
        value: Math.exp(x0 - 1).toFixed(3),
        color: MATH_COLORS.function
      },
      {
        label: "对数下界",
        symbol: "ln x + 1",
        value: x0 > 0 ? (Math.log(x0) + 1).toFixed(3) : "无定义",
        color: MATH_COLORS.functionTransformed
      }
    );
  } else if (mode === "param") {
    const subMode = config?.subMode || "exp_ax_1";
    const resAx1 = solveParamExpAx1(a);
    const resAx = solveParamExpAx(a);
    const activeRes = subMode === "exp_ax" ? resAx : resAx1;
    quantities.push(
      {
        label: "待定参数 a",
        symbol: "a",
        value: a.toFixed(2),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: subMode === "exp_ax" ? "e^x ≥ ax 过原点临界" : "e^x ≥ ax + 1 切线临界",
        symbol: "a_{临界}",
        value: subMode === "exp_ax" ? Math.E.toFixed(2) : "1.00",
        color: MATH_COLORS.tangentLine
      },
      {
        label: "与 e^x 交点个数",
        symbol: "N",
        value: `${activeRes.intersections} 个`,
        color: activeRes.status === "tangent" ? MATH_COLORS.paramPrimary : MATH_COLORS.labelText
      }
    );
    if (a > 1) {
      warnings.push({
        text: `当前参数 a = ${a.toFixed(2)} > 1，直线与 e^x 出现 2 个交点，e^x ≥ ax + 1 不恒成立！`,
        level: "warning"
      });
    }
  }
  const theorems = [
    {
      name: "指数基准切线放缩不等式",
      latex: "e^x \\ge x + 1 \\quad (x \\in \\mathbb{R})",
      level: "core",
      prerequisites: ["f(x) = e^x 是下凸函数", "等号仅在 x = 0 时成立"]
    },
    {
      name: "对数基准切线放缩不等式",
      latex: "\\ln x \\le x - 1 \\quad (x > 0)",
      level: "core",
      prerequisites: ["g(x) = \\ln x 是上凸函数", "等号仅在 x = 1 时成立"]
    },
    {
      name: "双基准对偶链式夹逼不等式",
      latex: "\\ln x + 1 \\le x \\le e^{x-1} \\quad (x > 0)",
      level: "important",
      prerequisites: [
        "e^{x-1} 与 \\ln x + 1 互为反函数",
        "三者关于 y = x 对称"
      ]
    },
    {
      name: "切线临界求参定理",
      latex: "e^x \\ge \\color{#EF4444}{a} x + 1 \\iff \\color{#EF4444}{a} \\le 1",
      level: "important",
      prerequisites: [
        "当 a = 1 时直线与曲线在 (0,1) 相切",
        "a > 1 时产生第二个交点"
      ]
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考核心原理：基准切线放缩来自于超越函数在基准点（如 x=0 或 x=1）处的泰勒展开一阶切线近似。",
      importance: "gaokao"
    },
    {
      text: '凹凸性保障：下凸函数 (f"(x)>0) 曲线永远在任意切线上方；上凸函数 (g"(x)<0) 曲线永远在切线下方。',
      importance: "core"
    },
    {
      text: "压轴大题解题套路：当题目中同时出现指数 e^x 与对数 ln x 混合项时，优先考虑利用 x 或 x-1 作为“中间桥梁”进行切线双向放缩！",
      importance: "hard"
    },
    {
      text: "端点效应与相切临界：求解 e^x ≥ ax+1 或 a lnx ≤ x-1 恒成立问题时，“相切”往往对应参数的极值边界（临界点）。",
      importance: "gaokao"
    }
  ];
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic: "指数切线 x 加一，对数切线 x 减一；凹凸决定上与下，相切即是临界点。"
  };
}
function solveImplicitZero(a, model) {
  if (model === "x_ln_x") {
    const x0 = Math.exp(a - 1);
    const y0 = x0 * Math.log(x0) - a * x0 + 1;
    const traceY = 1 - x0;
    const fn = (x) => x > 0 ? x * Math.log(x) - a * x + 1 : NaN;
    const dfn = (x) => x > 0 ? Math.log(x) + 1 - a : NaN;
    const traceFn = (x) => 1 - x;
    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: Math.abs(a) < 1e-4,
      fn,
      dfn,
      traceFn
    };
  } else {
    if (a <= 1e-3) {
      return {
        x0: 0,
        y0: 1,
        traceY: 1,
        isValid: false,
        isDegenerate: true,
        fn: (x) => Math.exp(x) - a * x,
        dfn: (x) => Math.exp(x) - a,
        traceFn: (x) => Math.exp(x) * (1 - x)
      };
    }
    const x0 = Math.log(a);
    const y0 = Math.exp(x0) - a * x0;
    const traceY = Math.exp(x0) * (1 - x0);
    const fn = (x) => Math.exp(x) - a * x;
    const dfn = (x) => Math.exp(x) - a;
    const traceFn = (x) => Math.exp(x) * (1 - x);
    return {
      x0,
      y0,
      traceY,
      isValid: true,
      isDegenerate: Math.abs(a - 1) < 1e-4,
      fn,
      dfn,
      traceFn
    };
  }
}
function findRoot(fn, target, min, max) {
  let low = min;
  let high = max;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const val = fn(mid);
    if (isNaN(val)) break;
    if (fn(low) < fn(high)) {
      if (val < target) low = mid;
      else high = mid;
    } else {
      if (val > target) low = mid;
      else high = mid;
    }
  }
  return (low + high) / 2;
}
function solveExtremumShift(kParam, model) {
  if (model === "xe_neg_x") {
    const x0 = 1;
    const maxY = 1 / Math.E;
    const k = Math.min(Math.max(kParam, 0.01), maxY - 1e-3);
    const fn = (x) => x * Math.exp(-x);
    const x1 = findRoot(fn, k, 1e-4, 0.9999);
    const x2 = findRoot(fn, k, 1.0001, 8);
    const midX = (x1 + x2) / 2;
    const delta = midX - x0;
    const mirrorFn = (x) => fn(2 * x0 - x);
    const diffFn = (x) => fn(x) - mirrorFn(x);
    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      isValid: true,
      fn,
      mirrorFn,
      diffFn
    };
  } else {
    const x0 = Math.E;
    const maxY = 1 / Math.E;
    const k = Math.min(Math.max(kParam, 0.01), maxY - 1e-3);
    const fn = (x) => x > 0 ? Math.log(x) / x : NaN;
    const x1 = findRoot(fn, k, 1.0001, Math.E - 1e-4);
    const x2 = findRoot(fn, k, Math.E + 1e-4, 20);
    const midX = (x1 + x2) / 2;
    const delta = midX - x0;
    const mirrorFn = (x) => 2 * x0 - x > 0 ? fn(2 * x0 - x) : NaN;
    const diffFn = (x) => fn(x) - mirrorFn(x);
    return {
      x0,
      y0: maxY,
      k,
      x1,
      x2,
      midX,
      delta,
      shiftType: delta > 1e-4 ? "right" : delta < -1e-4 ? "left" : "none",
      isValid: true,
      fn,
      mirrorFn,
      diffFn
    };
  }
}
function solveLogMean(x1, x2) {
  if (x1 <= 0 || x2 <= 0 || Math.abs(x1 - x2) < 1e-5) {
    return {
      x1,
      x2,
      t: 1,
      geoMean: Math.max(0, x1),
      logMean: Math.max(0, x1),
      ariMean: Math.max(0, x1),
      isValid: false
    };
  }
  const t = x2 / x1;
  const geoMean = Math.sqrt(x1 * x2);
  const logMean = (x2 - x1) / (Math.log(x2) - Math.log(x1));
  const ariMean = (x1 + x2) / 2;
  return {
    x1,
    x2,
    t,
    geoMean,
    logMean,
    ariMean,
    isValid: true
  };
}
function buildDerivativeShiftPanel(params, config) {
  const mode = config?.activeMode || "implicit_zero";
  const subModel = config?.subModel || "x_ln_x";
  const a = params.a ?? 1.5;
  const k = params.k ?? 0.25;
  const x1Param = params.x1 ?? 0.3;
  const x2Param = params.x2 ?? 3.5;
  const quantities = [];
  const warnings = [];
  const theorems = [];
  const gaokaoPoints = [];
  if (mode === "implicit_zero") {
    const izRes = solveImplicitZero(a, subModel);
    if (!izRes.isValid) {
      warnings.push({
        text: "参数 a 过小，导函数 f'(x) 在定义域内无零点！",
        level: "danger"
      });
    }
    quantities.push(
      {
        label: "隐零点横坐标",
        symbol: "x₀",
        value: izRes.x0.toFixed(3),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "极值 (未消元)",
        symbol: "f(x₀)",
        value: izRes.y0.toFixed(3),
        color: MATH_COLORS.function
      },
      {
        label: "极值 (代换消元下沉)",
        symbol: "h(x₀)",
        value: izRes.traceY.toFixed(3),
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "零点处导数值",
        symbol: "f'(x₀)",
        value: "0.000",
        color: MATH_COLORS.derivative
      }
    );
    theorems.push(
      {
        name: "零点存在定理与隐零点设而不求",
        latex: "f'(x_0) = 0 \\implies x_0 \\in (a, b)",
        condition: "1. f'(x) 在 (a, b) 连续且单调； 2. f'(a) \\cdot f'(b) < 0",
        note: "设而不求：不直接求出 x0 的显式，而是利用 f'(x0)=0 导出超越项等量代换关系。",
        level: "core"
      },
      {
        name: "代换下沉消元法",
        latex: subModel === "x_ln_x" ? "\\ln x_0 = a-1 \\implies f(x_0) = 1 - x_0" : "e^{x_0} = a \\implies f(x_0) = a(1 - \\ln a)",
        condition: "消去极值表达式中的超越项（如 e^{x0} 或 \\ln x0）",
        note: "将双变量/超越极值转化为仅含 x0 的多项式或代数函数 h(x0)，从而方便求最值。",
        level: "important"
      }
    );
    gaokaoPoints.push(
      {
        text: "高考压轴第一问：通过特值缩小隐零点 x0 范围，虚设根并代换下沉",
        importance: "gaokao"
      },
      {
        text: "高考压轴第二问：消去超越项后转换为单变量 h(x0) 求单调性与最值",
        importance: "hard"
      }
    );
  } else if (mode === "shift_symmetric") {
    const shiftRes = solveExtremumShift(k, subModel);
    if (k >= shiftRes.y0) {
      warnings.push({
        text: `割线 k ≥ ${shiftRes.y0.toFixed(3)} 已超出极值上限，无法截得两个交点！`,
        level: "danger"
      });
    }
    quantities.push(
      {
        label: "极值点",
        symbol: "x₀",
        value: shiftRes.x0.toFixed(3),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "割线左根",
        symbol: "x₁",
        value: shiftRes.x1.toFixed(3),
        color: MATH_COLORS.function
      },
      {
        label: "割线右根",
        symbol: "x₂",
        value: shiftRes.x2.toFixed(3),
        color: MATH_COLORS.functionSecondary
      },
      {
        label: "两根中点",
        symbol: "(x₁+x₂)/2",
        value: shiftRes.midX.toFixed(3),
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "极值点偏移量",
        symbol: "\\Delta = \\frac{x₁+x₂}{2} - x₀",
        value: `${shiftRes.delta > 0 ? "+" : ""}${shiftRes.delta.toFixed(3)} (${shiftRes.shiftType === "right" ? "右偏" : "左偏"})`,
        color: MATH_COLORS.paramTertiary
      }
    );
    theorems.push(
      {
        name: "极值点偏移判定定理",
        latex: "x_1 + x_2 > 2x_0 \\iff \\text{中点 } \\frac{x_1+x_2}{2} > x_0",
        condition: "f(x1) = f(x2) = k，且 f(x) 在 x0 两侧单调性相反",
        note: "口诀：中点在极值点右侧为“右偏”，中点在左侧为“左偏”。",
        level: "core"
      },
      {
        name: "对称构造法 (构造差值函数)",
        latex: "F(x) = f(x) - f(2x_0 - x) > 0 \\quad (x \\in (0, x_0))",
        condition: "利用镜像曲线 y = f(2x0 - x) 与原曲线 y = f(x) 的高度差比较",
        note: "若 F(x1) < 0，则 f(x1) < f(2x0 - x1)，结合右侧单调性可导出 x1+x2 > 2x0。",
        level: "important"
      }
    );
    gaokaoPoints.push(
      {
        text: "对称构造法四步曲：求极值点 x0 -> 转换目标 x2 > 2x0 - x1 -> 利用单调性转化 -> 构造 F(x)",
        importance: "gaokao"
      },
      {
        text: "乘积偏移与对数齐次化：设 t = x2 / x1 > 1 转化为单变量单调性",
        importance: "hard"
      }
    );
  } else {
    const lmRes = solveLogMean(x1Param, x2Param);
    quantities.push(
      {
        label: "几何均值",
        symbol: "\\sqrt{x_1 x_2}",
        value: lmRes.geoMean.toFixed(3),
        color: MATH_COLORS.function
      },
      {
        label: "对数均值",
        symbol: "L(x_1, x_2)",
        value: lmRes.logMean.toFixed(3),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "算术均值",
        symbol: "(x_1+x_2)/2",
        value: lmRes.ariMean.toFixed(3),
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "齐次化比值",
        symbol: "t = x_2 / x_1",
        value: lmRes.t.toFixed(2),
        color: MATH_COLORS.labelText
      }
    );
    theorems.push(
      {
        name: "对数均值不等式链",
        latex: "\\sqrt{ab} < \\frac{a - b}{\\ln a - \\ln b} < \\frac{a + b}{2}",
        condition: "a, b 为正实数且 a ≠ b",
        note: "对数均值 L(a, b) 严格夹在几何均值与算术均值之间！",
        level: "core"
      },
      {
        name: "齐次化单变量不等式",
        latex: "\\sqrt{t} < \\frac{t - 1}{\\ln t} < \\frac{t + 1}{2} \\quad (t > 1)",
        condition: "设 t = b / a > 1",
        note: "极值点偏移压轴题中秒杀 x1+x2 > 2x0 或 x1 x2 < x0^2 的终极利器。",
        level: "important"
      }
    );
    gaokaoPoints.push({
      text: "对数均值不等式在高考解答题中可直接证明（构造 g(t) = ln t - 2(t-1)/(t+1)）后做压轴秒杀",
      importance: "gaokao"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings
  };
}
function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}
function perm(n, m) {
  if (n < 0 || m < 0 || m > n) return 0;
  return factorial(n) / factorial(n - m);
}
function comb(n, m) {
  if (n < 0 || m < 0 || m > n) return 0;
  return factorial(n) / (factorial(m) * factorial(n - m));
}
function getPascalTriangle(maxRows) {
  const triangle = [];
  for (let n = 0; n <= maxRows; n++) {
    const row = [];
    for (let k = 0; k <= n; k++) {
      row.push(comb(n, k));
    }
    triangle.push(row);
  }
  return triangle;
}
function getBinomialTerm(n, k, a, b) {
  const c = comb(n, k);
  const powerA = n - k;
  const powerB = k;
  const termCoeff = c * Math.pow(a, powerA) * Math.pow(b, powerB);
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
    latexTerm
  };
}
function getAllBinomialTerms(n, a, b) {
  const terms = [];
  for (let k = 0; k <= n; k++) {
    terms.push(getBinomialTerm(n, k, a, b));
  }
  return terms;
}
function buildMultiplicationTree(m1, m2, m3 = 0) {
  const nodes = [];
  const edges = [];
  nodes.push({ id: "root", label: "起点", x: 0, y: 0, depth: 0 });
  for (let i = 0; i < m1; i++) {
    const id1 = `L1_${i}`;
    nodes.push({
      id: id1,
      label: `步骤1: 选项${i + 1}`,
      x: 1,
      y: i,
      depth: 1,
      parentId: "root"
    });
    edges.push({
      id: `e_root_${id1}`,
      from: "root",
      to: id1,
      label: `分步1-${i + 1}`
    });
    if (m2 > 0) {
      for (let j = 0; j < m2; j++) {
        const id2 = `L2_${i}_${j}`;
        nodes.push({
          id: id2,
          label: `步骤2: 选项${j + 1}`,
          x: 2,
          y: i * m2 + j,
          depth: 2,
          parentId: id1
        });
        edges.push({
          id: `e_${id1}_${id2}`,
          from: id1,
          to: id2,
          label: `分步2-${j + 1}`
        });
        if (m3 > 0) {
          for (let k = 0; k < m3; k++) {
            const id3 = `L3_${i}_${j}_${k}`;
            nodes.push({
              id: id3,
              label: `结果${i * m2 * m3 + j * m3 + k + 1}`,
              x: 3,
              y: (i * m2 + j) * m3 + k,
              depth: 3,
              parentId: id2
            });
            edges.push({ id: `e_${id2}_${id3}`, from: id2, to: id3 });
          }
        }
      }
    }
  }
  return { nodes, edges };
}
function buildAdditionTree(m1, m2) {
  const nodes = [];
  const edges = [];
  nodes.push({ id: "root", label: "任务起点", x: 0, y: 0, depth: 0 });
  for (let i = 0; i < m1; i++) {
    const id1 = `Cat1_${i}`;
    nodes.push({
      id: id1,
      label: `类别Ⅰ-方法${i + 1}`,
      x: 1,
      y: i,
      depth: 1,
      parentId: "root"
    });
    edges.push({ id: `e_root_${id1}`, from: "root", to: id1, label: `类别Ⅰ` });
  }
  for (let j = 0; j < m2; j++) {
    const id2 = `Cat2_${j}`;
    nodes.push({
      id: id2,
      label: `类别Ⅱ-方法${j + 1}`,
      x: 1,
      y: m1 + j,
      depth: 1,
      parentId: "root"
    });
    edges.push({ id: `e_root_${id2}`, from: "root", to: id2, label: `类别Ⅱ` });
  }
  return { nodes, edges };
}
function buildProbabilityCountingPanel(params, config) {
  const mode = config?.activeMode || "binomial";
  const n = Math.floor(params.n ?? 5);
  const k = Math.min(Math.floor(params.k ?? 2), n);
  const a = params.a ?? 1;
  const b = params.b ?? 1;
  const m1 = Math.floor(params.m1 ?? 3);
  const m2 = Math.floor(params.m2 ?? 2);
  const m3 = Math.floor(params.m3 ?? 2);
  if (mode === "binomial") {
    const termInfo = getBinomialTerm(n, k, a, b);
    const coeffSum = Math.pow(a + b, n);
    const binomCoeffSum = Math.pow(2, n);
    return {
      quantities: [
        {
          label: "二项式指数 n",
          symbol: "n",
          value: n,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "当前选中项 index (k)",
          symbol: "k",
          value: `第 ${k + 1} 项 (T_${k + 1})`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "二项式系数 C_n^k",
          symbol: `C_{${n}}^{${k}}`,
          value: termInfo.binomialCoeff,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: `实际项系数 (x^{${termInfo.powerA}} 的系数)`,
          symbol: `A_{${k}}`,
          value: termInfo.termCoeff,
          color: MATH_COLORS.functionTransformed
        },
        {
          label: "二项式系数和 2^n",
          symbol: `\\sum_{k=0}^{${n}} C_{${n}}^k`,
          value: binomCoeffSum,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "赋值法各项系数和 (x=1)",
          symbol: `(${a} + ${b})^{${n}}`,
          value: coeffSum,
          color: MATH_COLORS.derivative
        }
      ],
      theorems: [
        {
          name: "二项式定理 (Binomial Theorem)",
          latex: `(a + b)^n = \\sum_{k=0}^n C_n^k a^{n-k} b^k`,
          condition: "n \\in \\mathbb{N}^*",
          note: `展开式共 ${n + 1} 项，各项二项式系数对称分布。`,
          level: "core"
        },
        {
          name: "通项公式 (第 k+1 项)",
          latex: `T_{k+1} = C_n^k a^{n-k} b^k`,
          condition: `0 \\le k \\le n`,
          note: `当前高亮项 T_{${k + 1}} = ${termInfo.latexTerm}`,
          level: "important"
        },
        {
          name: "二项式系数性质与递推",
          latex: `C_n^k = C_{n-1}^{k-1} + C_{n-1}^k, \\quad C_n^k = C_n^{n-k}`,
          note: "杨辉三角第 n 行两数相加等于下一行正中间的数。",
          level: "derived"
        }
      ],
      gaokaoPoints: [
        {
          text: `区分“二项式系数”与“项的系数”：二项式系数恒为 C_n^k > 0；项的系数包含 a^{n-k}b^k。`,
          importance: "gaokao"
        },
        {
          text: "常数项与有理项求解：令通项中 x 的指数等于 0 解 k（常数项）；指数为整数解有理项。",
          importance: "hard"
        },
        {
          text: "赋值法特殊值技巧：令 x=1 得各项系数和 (a+b)^n；令 x=-1 得奇偶项交错和。",
          importance: "core"
        }
      ],
      warnings: [
        ...a === 0 ? [
          {
            level: "warning",
            text: "退化提醒：当 a = 0 时，多项式退化为常数 b^n，含 x 项均为 0。"
          }
        ] : [],
        ...b === 0 ? [
          {
            level: "warning",
            text: "退化提醒：当 b = 0 时，多项式退化为单项式 (ax)^n。"
          }
        ] : [],
        ...b < 0 ? [
          {
            level: "info",
            text: `符号提醒：常数项 b = ${b} < 0，展开式各项系数正负交替，切记带上 (-1)^k！`
          }
        ] : []
      ],
      mnemonic: "二项展开共 n+1 项，通项看准 k 加 1；二项系数对称大，赋值求和特殊 x。"
    };
  }
  if (mode === "perm_comb") {
    const P = perm(n, k);
    const C = comb(n, k);
    const KFact = factorial(k);
    return {
      quantities: [
        {
          label: "元素总数 n",
          symbol: "n",
          value: n,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "选取元素数 m (或 k)",
          symbol: "m",
          value: k,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "排列数 A_n^m (与顺序有关)",
          symbol: `A_{${n}}^{${k}}`,
          value: P,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "组合数 C_n^m (与顺序无关)",
          symbol: `C_{${n}}^{${k}}`,
          value: C,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "选出 m 个元素的全排列 m!",
          symbol: `${k}!`,
          value: KFact,
          color: MATH_COLORS.functionTransformed
        }
      ],
      theorems: [
        {
          name: "排列数公式 (Permutations)",
          latex: `A_n^m = \\frac{n!}{(n-m)!} = n(n-1)\\cdots(n-m+1)`,
          condition: `0 \\le m \\le n`,
          note: "从 n 个不同元素中取出 m 个排成一列，关注顺序。",
          level: "core"
        },
        {
          name: "组合数公式 (Combinations)",
          latex: `C_n^m = \\frac{A_n^m}{m!} = \\frac{n!}{m!(n-m)!}`,
          condition: `0 \\le m \\le n`,
          note: "从 n 个不同元素中取出 m 个合成一组，无关顺序。",
          level: "core"
        },
        {
          name: "组合数补集对称性",
          latex: `C_n^m = C_n^{n-m}`,
          note: `选出 ${k} 个元素等价于留下 ${n - k} 个元素。`,
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "“顺序”核心判定法则：交换选出的两个元素，若结果改变则是排列，不变则是组合。",
          importance: "gaokao"
        },
        {
          text: "相邻问题捆绑法：要求相邻的元素视作一个整体参与排列，内部再全排列。",
          importance: "core"
        },
        {
          text: "不相邻问题插空法：先排无限制元素，再将限制相邻的元素插入已形成的空隙中。",
          importance: "hard"
        }
      ],
      warnings: [
        ...k > n ? [
          {
            level: "danger",
            text: "非法参数：选取元素数 m 不能大于总元素数 n，组合数与排列数均无意义！"
          }
        ] : []
      ],
      mnemonic: "区分顺序列阵排，消去顺序组合算；捆绑相邻做整体，插空留隙解间隔。"
    };
  }
  const multTotal = m1 * m2 * (m3 > 0 ? m3 : 1);
  const addTotal = m1 + m2;
  return {
    quantities: [
      {
        label: "步骤/类别 1 方法数 m1",
        symbol: "m_1",
        value: m1,
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "步骤/类别 2 方法数 m2",
        symbol: "m_2",
        value: m2,
        color: MATH_COLORS.paramSecondary
      },
      {
        label: "步骤 3 方法数 m3",
        symbol: "m_3",
        value: m3,
        color: MATH_COLORS.paramTertiary
      },
      {
        label: "分步乘法原理总数 N_乘",
        symbol: "N_\\text{乘}",
        value: multTotal,
        color: MATH_COLORS.function
      },
      {
        label: "分类加法原理总数 N_加",
        symbol: "N_\\text{加}",
        value: addTotal,
        color: MATH_COLORS.derivative
      }
    ],
    theorems: [
      {
        name: "分类加法计数原理",
        latex: `N = m_1 + m_2 + \\dots + m_k`,
        note: "完成一件事有 k 类办法，各类办法相互独立（互斥），用加法。",
        level: "core"
      },
      {
        name: "分步乘法计数原理",
        latex: `N = m_1 \\times m_2 \\times \\dots \\times m_k`,
        note: "完成一件事需要分 k 个步骤，各个步骤依次进行（相依），用乘法。",
        level: "core"
      }
    ],
    gaokaoPoints: [
      {
        text: "加法 vs 乘法的区分关键：看单一步骤/类别能否独立完成整件事（能用加法，不能用乘法）。",
        importance: "basic"
      }
    ],
    warnings: [],
    mnemonic: "分类独立用加法，一步到位各算各；分步相依用乘法，环环相扣才完成。"
  };
}
function buildProbabilityDistributionPanel(params, config) {
  const studyMode = config?.studyMode || "binomial";
  const distResult = config?.distResult;
  const transformedDist = config?.transformedDist;
  const meanVal = distResult ? distResult.mean.toFixed(3) : "0";
  const varVal = distResult ? distResult.variance.toFixed(3) : "0";
  const stdVal = distResult ? distResult.stdDev.toFixed(3) : "0";
  const sumPVal = distResult ? distResult.sumP.toFixed(4) : "1.000";
  const maxPVal = distResult ? distResult.maxP.toFixed(3) : "0";
  if (studyMode === "binomial") {
    const n = params.n ?? 5;
    const p = params.p ?? 0.4;
    const theoreticalMean = (n * p).toFixed(3);
    const theoreticalVar = (n * p * (1 - p)).toFixed(3);
    return {
      quantities: [
        {
          label: "试验次数 n",
          symbol: "n",
          value: `${n}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "成功概率 p",
          symbol: "p",
          value: `${p}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "数学期望 E(X) = np",
          symbol: "E(X)",
          value: theoreticalMean,
          color: MATH_COLORS.tangentLine
        },
        {
          label: "方差 D(X) = np(1-p)",
          symbol: "D(X)",
          value: theoreticalVar,
          color: MATH_COLORS.function
        },
        {
          label: "标准差 σ(X)",
          symbol: "\\sigma(X)",
          value: stdVal,
          color: MATH_COLORS.asymptote
        },
        {
          label: "峰值概率 P_max",
          symbol: "P_{max}",
          value: maxPVal,
          color: MATH_COLORS.barFill
        }
      ],
      theorems: [
        {
          name: "二项分布定义与 PMF (Binomial PMF)",
          latex: `X \\sim B(n, p) \\implies P(X=k) = C_n^k p^k (1-p)^{n-k}`,
          condition: "n 次独立重复试验 (伯努利试验)，每次成功概率为 p",
          note: "在 n 次试验中恰好成功 k 次的概率公式。",
          level: "core"
        },
        {
          name: "二项分布均值与方差定理",
          latex: `E(X) = np, \\quad D(X) = np(1-p)`,
          note: "高考避坑要点：对于二项分布直接代入 np 与 np(1-p)，严禁手动展开分布列计算累加！",
          level: "core"
        },
        {
          name: "伯努利试验独立性公理",
          latex: `P(A_1 A_2 \\cdots A_n) = P(A_1) P(A_2) \\cdots P(A_n)`,
          note: "各次试验结果互不影响，每次试验中事件 A 发生的概率保持不变。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "高考应用题判别：带有“有放回抽样”、“重复试验”、“每次射击/投篮成功概率不变”等字眼时，必为二项分布 B(n,p)。",
          importance: "gaokao"
        },
        {
          text: "最值求解技巧：若求使 P(X=k) 最大的 k（众数），可利用递推比值 P(X=k)/P(X=k-1) ≥ 1 求解不等式组。",
          importance: "core"
        }
      ],
      warnings: [],
      mnemonic: "有放回抽二项布，期望 np 方差 pq，直接套用最省时。"
    };
  }
  if (studyMode === "hypergeometric") {
    const N = params.N ?? 10;
    const M = params.M ?? 4;
    const sampleN = params.sampleN ?? 3;
    const theoreticalMean = (sampleN * M / N).toFixed(3);
    return {
      quantities: [
        {
          label: "总体容量 N",
          symbol: "N",
          value: `${N}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "目标特征数 M",
          symbol: "M",
          value: `${M}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "抽取样本数 n",
          symbol: "n",
          value: `${sampleN}`,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "数学期望 E(X) = n(M/N)",
          symbol: "E(X)",
          value: theoreticalMean,
          color: MATH_COLORS.tangentLine
        },
        {
          label: "样本方差 D(X)",
          symbol: "D(X)",
          value: varVal,
          color: MATH_COLORS.function
        },
        {
          label: "标准差 σ(X)",
          symbol: "\\sigma(X)",
          value: stdVal,
          color: MATH_COLORS.asymptote
        }
      ],
      theorems: [
        {
          name: "超几何分布定义与 PMF",
          latex: `X \\sim H(N, M, n) \\implies P(X=k) = \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n}`,
          condition: "1 ≤ N, 0 ≤ M ≤ N, 1 ≤ n ≤ N, max(0, n-N+M) ≤ k ≤ min(n, M)",
          note: "在含有 M 个特殊元素的 N 个总体中，无放回抽取 n 个元素，抽中特殊元素个数 X 的分布。",
          level: "core"
        },
        {
          name: "超几何分布数学期望定理",
          latex: `E(X) = n \\cdot \\frac{M}{N}`,
          note: "期望值等于“抽取样本数”乘以“总体中特殊元素的占比 M/N”。",
          level: "important"
        },
        {
          name: "二项逼近极限定理 (N → ∞)",
          latex: `\\lim_{N \\to \\infty} \\frac{C_M^k C_{N-M}^{n-k}}{C_N^n} = C_n^k p^k (1-p)^{n-k} \\quad \\left(p = \\frac{M}{N}\\right)`,
          note: "当总体 N 极大时，不放回抽样可近似视为有放回抽样 (二项分布)。",
          level: "derived"
        }
      ],
      gaokaoPoints: [
        {
          text: "高考应用题判别：带有“无放回抽样”、“不放回抓取”、“从包含 M 个次品的 N 个产品中任取 n 个”时，必为超几何分布 H(N,M,n)。",
          importance: "gaokao"
        },
        {
          text: "规范步骤：写明“X 的所有可能取值为 0, 1, ..., min(n, M)”，代入组合数计算概率，列写规范二维表格。",
          importance: "core"
        }
      ],
      warnings: sampleN > N || M > N ? [
        {
          text: "参数不合法：抽取数 n 或特征数 M 不能大于总体数 N！",
          level: "danger"
        }
      ] : [],
      mnemonic: "无放回抽超几何，分母总组合 C_N^n，期望等于 n 乘占比。"
    };
  }
  if (studyMode === "linear") {
    const a = params.linearA ?? 2;
    const b = params.linearB ?? 1;
    return {
      quantities: [
        {
          label: "缩放因子 a",
          symbol: "a",
          value: `${a}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "平移量 b",
          symbol: "b",
          value: `${b}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "原变量期望 E(X)",
          symbol: "E(X)",
          value: meanVal,
          color: MATH_COLORS.tangentLine
        },
        {
          label: "★ 变换后期望 E(aX+b)",
          symbol: "E(Y)",
          value: transformedDist ? transformedDist.mean.toFixed(3) : "0",
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "原变量方差 D(X)",
          symbol: "D(X)",
          value: varVal,
          color: MATH_COLORS.function
        },
        {
          label: "★ 变换后方差 D(aX+b)",
          symbol: "D(Y)",
          value: transformedDist ? transformedDist.variance.toFixed(3) : "0",
          color: MATH_COLORS.paramSecondary
        }
      ],
      theorems: [
        {
          name: "线性变换期望定理",
          latex: `E(aX + b) = a E(X) + b`,
          note: "随机变量进行线性变换后，期望满足线性缩放与平移特性。",
          level: "core"
        },
        {
          name: "线性变换方差定理",
          latex: `D(aX + b) = a^2 D(X)`,
          note: "关键考点：平移常数 b 不改变数据的离散程度，因此 b 对方差无贡献；乘积 a 的贡献为 a² 倍！",
          level: "core"
        },
        {
          name: "标准差线性变换公式",
          latex: `\\sigma(aX + b) = |a| \\sigma(X)`,
          note: "标准差取绝对值 |a| 倍，始终保持非负性。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "高考计算避坑：求 D(aX+b) 时，切记常数 b 直接舍去，且系数 a 必须平方 (a²)！例如 D(2X+3) = 4 D(X)，而非 2D(X)+3！",
          importance: "gaokao"
        },
        {
          text: "实际应用：用于标准化变量 Z = (X - μ) / σ，标准化后 E(Z) = 0, D(Z) = 1。",
          importance: "core"
        }
      ],
      warnings: [],
      mnemonic: "期望线性随 a,b 变，方差平移 b 舍去，a 变方差加平方！"
    };
  }
  return {
    quantities: [
      {
        label: "数学期望 (均值) E(X)",
        symbol: "E(X)",
        value: meanVal,
        color: MATH_COLORS.tangentLine
      },
      {
        label: "方差 D(X)",
        symbol: "D(X)",
        value: varVal,
        color: MATH_COLORS.function
      },
      {
        label: "标准差 σ(X)",
        symbol: "\\sigma(X)",
        value: stdVal,
        color: MATH_COLORS.asymptote
      },
      {
        label: "概率和 ∑p_i (规范性)",
        symbol: "\\sum p_i",
        value: sumPVal,
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "最大概率峰值 P_max",
        symbol: "P_{max}",
        value: maxPVal,
        color: MATH_COLORS.paramSecondary
      }
    ],
    theorems: [
      {
        name: "离散分布列基本公理",
        latex: `p_i \\ge 0, \\quad \\sum_{i=1}^n p_i = 1`,
        note: "离散型随机变量在各个取值上的概率非负，且全部可能取值的概率之和恒等于 1。",
        level: "core"
      },
      {
        name: "数学期望与物理杠杆重心",
        latex: `E(X) = \\sum_{i=1}^n x_i p_i \\iff \\sum_{i=1}^n (x_i - E(X)) p_i = 0`,
        note: "数学期望反映随机变量取值的平均水平与受力重心配重平衡点。",
        level: "core"
      },
      {
        name: "方差与离散度刻画",
        latex: `D(X) = E[(X - E(X))^2] = \\sum_{i=1}^n (x_i - E(X))^2 p_i = E(X^2) - [E(X)]^2`,
        note: "方差反映随机变量取值偏离期望均值的波动程度与离散带范围。",
        level: "important"
      }
    ],
    gaokaoPoints: [
      {
        text: "高考解答题核心考法：首先列出分布列规范表格（第一行 X，第二行 P），其次校验 ∑p_i = 1，最后代入公式求期望 E(X) 与方差 D(X)。",
        importance: "gaokao"
      },
      {
        text: "决策应用题：比较方案优劣时，均值 E(X) 代表平均收益，方差 D(X) 代表风险波动，通常选择“均值大、方差小”的方案。",
        importance: "gaokao"
      }
    ],
    warnings: distResult && !distResult.isValid ? [
      {
        text: distResult.invalidReason || "参数不合法",
        level: "danger"
      }
    ] : [],
    mnemonic: "分布列出和为一，均值支点平衡处，方差拉伸加平移。"
  };
}
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}
function normalPdf(x, mu, sigma) {
  if (sigma <= 0) return 0;
  const normCoeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
  return normCoeff * Math.exp(exponent);
}
function standardNormalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}
function normalCdf(x, mu, sigma) {
  if (sigma <= 0) return x >= mu ? 1 : 0;
  const z = (x - mu) / sigma;
  return standardNormalCdf(z);
}
function calcIntervalProbability(mu, sigma, x1, x2) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const p1 = normalCdf(minX, mu, sigma);
  const p2 = normalCdf(maxX, mu, sigma);
  return Math.max(0, p2 - p1);
}
function generateHistogramBins$1(mu, sigma, binCount, sampleSize) {
  const safeBinCount = Math.max(4, Math.min(30, Math.round(binCount)));
  const safeSigma = Math.max(0.1, sigma);
  const safeSampleSize = Math.max(10, Math.round(sampleSize));
  const rangeWidth = 7 * safeSigma;
  const startX = mu - 3.5 * safeSigma;
  const binWidth = rangeWidth / safeBinCount;
  const bins = [];
  let rawCounts = [];
  let totalRawCount = 0;
  for (let i = 0; i < safeBinCount; i++) {
    const xStart = startX + i * binWidth;
    const xEnd = xStart + binWidth;
    const p = calcIntervalProbability(mu, safeSigma, xStart, xEnd);
    const count = Math.round(p * safeSampleSize);
    rawCounts.push(count);
    totalRawCount += count;
  }
  if (totalRawCount === 0) {
    rawCounts[Math.floor(safeBinCount / 2)] = safeSampleSize;
    totalRawCount = safeSampleSize;
  }
  for (let i = 0; i < safeBinCount; i++) {
    const xStart = startX + i * binWidth;
    const xEnd = xStart + binWidth;
    const mid = (xStart + xEnd) / 2;
    const count = rawCounts[i];
    const frequency = count / totalRawCount;
    const density = frequency / binWidth;
    bins.push({
      index: i,
      xStart,
      xEnd,
      mid,
      width: binWidth,
      count,
      frequency,
      density
    });
  }
  return bins;
}
function estimateHistogramStats(bins) {
  if (bins.length === 0) {
    return { mode: 0, median: 0, mean: 0, totalArea: 0, q1: 0, q3: 0 };
  }
  let maxDensity = -1;
  let mode = bins[0].mid;
  for (const bin of bins) {
    if (bin.density > maxDensity) {
      maxDensity = bin.density;
      mode = bin.mid;
    }
  }
  let mean = 0;
  let totalArea = 0;
  for (const bin of bins) {
    mean += bin.mid * bin.frequency;
    totalArea += bin.density * bin.width;
  }
  let median = bins[0].mid;
  let cumFreq = 0;
  for (const bin of bins) {
    if (cumFreq + bin.frequency >= 0.5) {
      const neededFreq = 0.5 - cumFreq;
      const fraction = bin.frequency > 0 ? neededFreq / bin.frequency : 0.5;
      median = bin.xStart + fraction * bin.width;
      break;
    }
    cumFreq += bin.frequency;
  }
  let q1 = bins[0].mid;
  cumFreq = 0;
  for (const bin of bins) {
    if (cumFreq + bin.frequency >= 0.25) {
      const neededFreq = 0.25 - cumFreq;
      const fraction = bin.frequency > 0 ? neededFreq / bin.frequency : 0.5;
      q1 = bin.xStart + fraction * bin.width;
      break;
    }
    cumFreq += bin.frequency;
  }
  let q3 = bins[0].mid;
  cumFreq = 0;
  for (const bin of bins) {
    if (cumFreq + bin.frequency >= 0.75) {
      const neededFreq = 0.75 - cumFreq;
      const fraction = bin.frequency > 0 ? neededFreq / bin.frequency : 0.5;
      q3 = bin.xStart + fraction * bin.width;
      break;
    }
    cumFreq += bin.frequency;
  }
  return {
    mode,
    median,
    mean,
    totalArea,
    q1,
    q3
  };
}
function buildProbabilityNormalPanel(params, config) {
  const mu = params.mu ?? 0;
  const sigma = Math.max(0.1, params.sigma ?? 1);
  const binCount = params.binCount ?? 10;
  const sampleSize = params.sampleSize ?? 200;
  const x1 = params.x1 ?? -1;
  const x2 = params.x2 ?? 1;
  const studyMode = config?.studyMode ?? "histogram";
  const bins = generateHistogramBins$1(mu, sigma, binCount, sampleSize);
  const stats = estimateHistogramStats(bins);
  const peakHeight = normalPdf(mu, mu, sigma);
  const intervalProb = calcIntervalProbability(mu, sigma, x1, x2);
  if (studyMode === "histogram") {
    return {
      quantities: [
        {
          label: "总体均值 μ",
          value: `${mu.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "标准差 σ",
          value: `${sigma.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "直方图估算均值 x̄",
          value: `${stats.mean.toFixed(3)}`,
          color: MATH_COLORS.function
        },
        {
          label: "直方图中位数 m_e",
          value: `${stats.median.toFixed(3)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "直方图众数 m_o",
          value: `${stats.mode.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "下四分位数 Q₁ (25%)",
          value: `${stats.q1.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(3)}`,
          color: MATH_COLORS.paramTertiary
        }
      ],
      theorems: [
        {
          name: "频率分布直方图基本性质",
          latex: "\\sum (\\text{高}_i \\times \\text{组距}_i) = \\sum \\text{频率}_i = 1",
          note: "直方图纵轴为 频率/组距，矩形面积为频率。矩形总面积恒为 1。",
          level: "core"
        },
        {
          name: "数字特征估算公式",
          latex: "\\bar{x} = \\sum_{i=1}^{k} x_i \\cdot f_i \\quad m_e: \\sum_{i=1}^{m} f_i \\ge 0.5",
          note: "平均数 = Σ(组中值×频率)；中位数为累计频率达到 0.5 的位置。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】直方图估算平均数 ∑(中点×频率)、中位数（平分面积）和众数（最高组中点）。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】直方图中矩形面积 = 频率/组距 × 组距 = 频率，所有矩形面积之和为 1。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】第 p 百分位数：累计频率达到 p 的位置，四分位数 Q₁(25%)、Q₃(75%) 为常考考点。",
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "警示：直方图纵轴表示'频率/组距'，面积才是频率！切勿将纵轴高度直接当作频率。",
          level: "warning"
        }
      ],
      mnemonic: "平均数用组中值乘频率求和，中位数找面积一半处，众数看最高矩形中点，四分位数看25%和75%！"
    };
  } else if (studyMode === "normalFit") {
    return {
      quantities: [
        {
          label: "总体均值 μ",
          value: `${mu.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "标准差 σ",
          value: `${sigma.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "密度最大值 f(μ)",
          value: `${peakHeight.toFixed(3)}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "区间概率 P(x₁≤X≤x₂)",
          value: `${(intervalProb * 100).toFixed(2)}%`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive"
        }
      ],
      theorems: [
        {
          name: "正态分布密度函数 N(μ, σ²)",
          latex: "f(x) = \\frac{1}{\\sqrt{2\\pi}\\color{#D97706}{\\sigma}} e^{-\\frac{(x - \\color{#EF4444}{\\mu})^2}{2\\color{#D97706}{\\sigma}^2}}",
          prerequisites: [
            "$\\sigma > 0$",
            "$\\int_{-\\infty}^{+\\infty} f(x)dx = 1$"
          ],
          note: "均值 μ 决定曲线对称轴；标准差 σ 越小曲线越瘦陡高耸，σ 越大越矮胖平缓。",
          level: "core"
        },
        {
          name: "直方图与正态曲线关系",
          latex: "\\text{当 } n \\to \\infty \\text{ 时，直方图轮廓趋近于正态曲线}",
          note: "样本量越大，直方图的频率分布越接近正态分布曲线。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】利用正态曲线对称性 P(X ≤ μ) = 0.5 与 3-σ 原则求解区间概率。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】正态曲线下的面积恒为 1，可通过积分或查表计算区间概率。",
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "前提：标准差 $\\sigma$ 必须大于 0；$\\sigma$ 趋近于 0 时退化为确定常数。",
          level: "info"
        }
      ],
      mnemonic: "均值决定中心位置，标准差定胖瘦高低；正态曲线左右对称，面积恒为 1！"
    };
  } else {
    const z1 = (x1 - mu) / sigma;
    const z2 = (x2 - mu) / sigma;
    const isStandardNormal = Math.abs(mu) < 0.01 && Math.abs(sigma - 1) < 0.01;
    return {
      quantities: [
        {
          label: "总体均值 μ",
          value: `${mu.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "标准差 σ",
          value: `${sigma.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "区间概率 P(x₁≤X≤x₂)",
          value: `${(intervalProb * 100).toFixed(2)}%`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive"
        },
        {
          label: "区间左端点 x₁",
          value: `${x1.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "区间右端点 x₂",
          value: `${x2.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary
        },
        ...isStandardNormal ? [
          {
            label: "★ 标准正态分布",
            value: "N(0, 1)",
            color: MATH_COLORS.paramPrimary,
            highlight: "positive"
          }
        ] : [
          {
            label: "标准化 Z₁",
            value: `${z1.toFixed(2)}`,
            color: MATH_COLORS.function
          },
          {
            label: "标准化 Z₂",
            value: `${z2.toFixed(2)}`,
            color: MATH_COLORS.function
          }
        ]
      ],
      theorems: [
        {
          name: "正态分布 3-σ 原则 (高考核心)",
          latex: "P(\\mu-\\sigma \\le X \\le \\mu+\\sigma) \\approx 68.27\\% \\quad P(\\mu-2\\sigma \\le X \\le \\mu+2\\sigma) \\approx 95.45\\%",
          prerequisites: ["$X \\sim N(\\mu, \\sigma^2)$"],
          note: "落在 [μ-3σ, μ+3σ] 之外的概率仅约 0.27%，为小概率事件。",
          level: "core"
        },
        {
          name: isStandardNormal ? "当前为标准正态分布" : "标准化转换公式",
          latex: isStandardNormal ? "\\text{当前：} X \\sim N(0, 1) \\text{，无需标准化}" : `Z = \\frac{X - \\color{#EF4444}{${mu.toFixed(1)}}}{\\color{#D97706}{${sigma.toFixed(1)}}} \\quad \\Rightarrow \\quad P(${z1.toFixed(2)} \\le Z \\le ${z2.toFixed(2)})`,
          note: isStandardNormal ? "均值 μ=0，标准差 σ=1，已处于标准正态分布状态。" : `将 X ∈ [${x1.toFixed(2)}, ${x2.toFixed(2)}] 转化为 Z ∈ [${z1.toFixed(2)}, ${z2.toFixed(2)}]`,
          level: isStandardNormal ? "core" : "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】利用正态曲线对称性 P(X ≤ μ) = 0.5 与 3-σ 原则求解区间概率。",
          importance: "gaokao"
        },
        {
          text: isStandardNormal ? "【高考要点】当前为标准正态分布 N(0,1)，可直接使用标准正态分布表。" : `【高考考点】标准化 Z = (X-${mu.toFixed(1)})/${sigma.toFixed(1)}，当前区间对应 Z ∈ [${z1.toFixed(2)}, ${z2.toFixed(2)}]。`,
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "前提：标准差 $\\sigma$ 必须大于 0；$\\sigma$ 趋近于 0 时退化为确定常数。",
          level: "info"
        },
        ...isStandardNormal ? [] : [
          {
            text: `标准化后，$P(${x1.toFixed(2)} \\le X \\le ${x2.toFixed(2)}) = P(${z1.toFixed(2)} \\le Z \\le ${z2.toFixed(2)})$`,
            level: "info"
          }
        ]
      ],
      mnemonic: "一倍标准差 68%，两倍 95%，三倍 99.7%；标准化转换用 Z=(X-μ)/σ！"
    };
  }
}
function calculateLinearRegression(points) {
  const n = points.length;
  if (n < 2) {
    return {
      n,
      meanX: 0,
      meanY: 0,
      lxx: 0,
      lyy: 0,
      lxy: 0,
      b: 0,
      a: 0,
      r: 0,
      rSquare: 0,
      residuals: [],
      sse: 0,
      sst: 0,
      isValid: false,
      message: "样本点数量至少需要2个"
    };
  }
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let lxx = 0;
  let lyy = 0;
  let lxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = points[i].x - meanX;
    const dy = points[i].y - meanY;
    lxx += dx * dx;
    lyy += dy * dy;
    lxy += dx * dy;
  }
  if (Math.abs(lxx) < 1e-9) {
    return {
      n,
      meanX,
      meanY,
      lxx: 0,
      lyy,
      lxy: 0,
      b: 0,
      a: meanY,
      r: 0,
      rSquare: 0,
      residuals: points.map((p) => p.y - meanY),
      sse: lyy,
      sst: lyy,
      isValid: false,
      message: "样本点x取值全部相同，无法拟合斜率"
    };
  }
  const b = lxy / lxx;
  const a = meanY - b * meanX;
  let r = 0;
  if (lyy > 1e-9) {
    r = lxy / Math.sqrt(lxx * lyy);
    r = Math.max(-1, Math.min(1, r));
  }
  const residuals = [];
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const yHat = b * points[i].x + a;
    const e = points[i].y - yHat;
    residuals.push(e);
    sse += e * e;
  }
  let rSquare = 0;
  if (lyy > 1e-9) {
    rSquare = Math.max(0, 1 - sse / lyy);
  }
  return {
    n,
    meanX,
    meanY,
    lxx,
    lyy,
    lxy,
    b,
    a,
    r,
    rSquare,
    residuals,
    sse,
    sst: lyy,
    isValid: true
  };
}
function calculateIndependenceTest(a, b, c, d) {
  const n = a + b + c + d;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d;
  if (n === 0 || row1 === 0 || row2 === 0 || col1 === 0 || col2 === 0) {
    return {
      a,
      b,
      c,
      d,
      n,
      adMinusBc: 0,
      chiSquare: 0,
      p90: false,
      p95: false,
      p99: false,
      p999: false,
      confidenceText: "无有效数据或边际分布为0",
      isValid: false
    };
  }
  const adMinusBc = a * d - b * c;
  const numerator = n * Math.pow(adMinusBc, 2);
  const denominator = row1 * row2 * col1 * col2;
  const chiSquare = denominator > 0 ? numerator / denominator : 0;
  const p90 = chiSquare >= 2.706;
  const p95 = chiSquare >= 3.841;
  const p99 = chiSquare >= 6.635;
  const p999 = chiSquare >= 10.828;
  let confidenceText = "没有充分理由认为变量间有关联 (接受无关联原假设)";
  if (p999) {
    confidenceText = "有 99.9% 以上的把握认为两个变量有关联";
  } else if (p99) {
    confidenceText = "有 99% 以上的把握认为两个变量有关联";
  } else if (p95) {
    confidenceText = "有 95% 以上的把握认为两个变量有关联";
  } else if (p90) {
    confidenceText = "有 90% 以上的把握认为两个变量有关联";
  }
  return {
    a,
    b,
    c,
    d,
    n,
    adMinusBc,
    chiSquare,
    p90,
    p95,
    p99,
    p999,
    confidenceText,
    isValid: true
  };
}
const REGRESSION_PRESETS = [
  {
    id: "ad_sales",
    name: "广告支出与销售额 (高考经典正相关)",
    points: [
      { id: "p1", x: 2, y: 3 },
      { id: "p2", x: 4, y: 5 },
      { id: "p3", x: 5, y: 6.5 },
      { id: "p4", x: 6, y: 7.5 },
      { id: "p5", x: 8, y: 9.5 }
    ],
    xName: "广告支出 (万元)",
    yName: "销售额 (万元)",
    xRange: [0, 10],
    yRange: [0, 12]
  },
  {
    id: "temp_power",
    name: "气温与用电量 (高考负相关)",
    points: [
      { id: "p1", x: 10, y: 22 },
      { id: "p2", x: 15, y: 18 },
      { id: "p3", x: 20, y: 15 },
      { id: "p4", x: 25, y: 12 },
      { id: "p5", x: 30, y: 9 }
    ],
    xName: "气温 (°C)",
    yName: "用电量 (度)",
    xRange: [5, 35],
    yRange: [5, 25]
  },
  {
    id: "height_weight",
    name: "身高与体重 (强线性)",
    points: [
      { id: "p1", x: -4, y: -3.2 },
      { id: "p2", x: -2, y: -1.5 },
      { id: "p3", x: 0, y: 0.2 },
      { id: "p4", x: 2, y: 1.8 },
      { id: "p5", x: 4, y: 3.5 }
    ],
    xName: "x (离均值)",
    yName: "y (离均值)",
    xRange: [-6, 6],
    yRange: [-5, 5]
  },
  {
    id: "outlier",
    name: "含异常值的散点分布",
    points: [
      { id: "p1", x: -4, y: -3 },
      { id: "p2", x: -2, y: -1.5 },
      { id: "p3", x: 0, y: 0.5 },
      { id: "p4", x: 2, y: 2 },
      { id: "p5", x: 4, y: -3.5 }
      // 异常点
    ],
    xName: "x",
    yName: "y",
    xRange: [-6, 6],
    yRange: [-5, 5]
  }
];
const INDEPENDENCE_PRESETS = [
  {
    id: "medicine",
    name: "新药疗效对比 (强显著关联)",
    a: 85,
    b: 15,
    c: 40,
    d: 60,
    labelA: "新药组",
    labelNotA: "对照组",
    labelB: "有效",
    labelNotB: "无效"
  },
  {
    id: "gender_subject",
    name: "性别与学科偏好 (中等关联)",
    a: 40,
    b: 20,
    c: 25,
    d: 35,
    labelA: "男生",
    labelNotA: "女生",
    labelB: "喜欢理科",
    labelNotB: "喜欢文科"
  },
  {
    id: "no_relation",
    name: "完全无关联独立样本",
    a: 50,
    b: 50,
    c: 50,
    d: 50,
    labelA: "A类",
    labelNotA: "非A类",
    labelB: "B类",
    labelNotB: "非B类"
  }
];
function buildPairedDataPanel(params, config) {
  const studyMode = config?.studyMode ?? "regression";
  const customPoints = config?.points;
  if (studyMode === "regression") {
    const presetIndex = Math.min(
      REGRESSION_PRESETS.length - 1,
      Math.max(0, Math.round(params.presetIndex ?? 0))
    );
    const preset = REGRESSION_PRESETS[presetIndex];
    const points = customPoints ?? preset.points;
    const res = calculateLinearRegression(points);
    return {
      quantities: [
        {
          label: "样本容量 n",
          value: `${res.n}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "样本均值 (x̄, ȳ)",
          value: `(${res.meanX.toFixed(2)}, ${res.meanY.toFixed(2)})`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "回归斜率 b̂",
          value: `${res.b.toFixed(4)}`,
          color: MATH_COLORS.function
        },
        {
          label: "回归截距 â",
          value: `${res.a.toFixed(4)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "样本相关系数 r",
          value: `${res.r.toFixed(4)}`,
          color: res.r >= 0 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary
        },
        {
          label: "决定系数 R²",
          value: `${res.rSquare.toFixed(4)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "残差平方和 SSE",
          value: `${res.sse.toFixed(2)}`,
          color: MATH_COLORS.tangentLine
        }
      ],
      theorems: [
        {
          name: "一元线性回归模型方程",
          latex: `\\hat{y} = \\hat{b}x + \\hat{a} \\quad \\text{其中 } \\hat{b} = \\frac{\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}, \\; \\hat{a} = \\bar{y} - \\hat{b}\\bar{x}`,
          note: "回归直线必过样本中心点 (x̄, ȳ)。",
          level: "core"
        },
        {
          name: "样本相关系数 r 公式",
          latex: `r = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum (x_i-\\bar{x})^2 \\sum (y_i-\\bar{y})^2}}`,
          note: "|r| 越接近 1，相关性越强；r > 0 正相关，r < 0 负相关。",
          level: "important"
        },
        {
          name: "决定系数 R² 的统计意义",
          latex: `R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2} = 1 - \\frac{\\text{SSE}}{\\text{SST}}`,
          note: "R² 越接近 1，说明回归方程对样本数据的拟合效果越好。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】回归直线必过样本中心点 (x̄, ȳ)。已知 x̄, ȳ 与 b̂，必有 â = ȳ - b̂ x̄。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】样本相关系数 r 取值范围 [-1, 1]。|r| > 0.75 通常认为线性相关性很强。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】残差 e_i = y_i - ŷ_i。残差图中带状区域越窄，说明线性拟合精度越高。",
          importance: "gaokao"
        }
      ],
      warnings: res.isValid ? Math.abs(res.r) < 0.3 ? [
        {
          text: "【相关性较弱】|r| < 0.3 说明线性相关程度低，直接用线性回归模型可能预测偏差较大。",
          level: "warning"
        }
      ] : [] : [
        {
          text: `【模型退化】${res.message ?? "数据无法计算回归方程"}`,
          level: "warning"
        }
      ]
    };
  } else {
    const presetIndex = Math.min(
      INDEPENDENCE_PRESETS.length - 1,
      Math.max(0, Math.round(params.presetIndex ?? 0))
    );
    const preset = INDEPENDENCE_PRESETS[presetIndex];
    const a = params.freqA ?? preset.a;
    const b = params.freqB ?? preset.b;
    const c = params.freqC ?? preset.c;
    const d = params.freqD ?? preset.d;
    const res = calculateIndependenceTest(a, b, c, d);
    return {
      quantities: [
        {
          label: "样本容量 n",
          value: `${res.n}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "交叉积 |ad - bc|",
          value: `${Math.abs(res.adMinusBc)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "χ² 观测值 (K²)",
          value: `${res.chiSquare.toFixed(3)}`,
          color: res.p95 ? MATH_COLORS.paramPrimary : MATH_COLORS.paramTertiary
        },
        {
          label: "临界点 3.841 (95%)",
          value: res.p95 ? "已达到 (超95%把握)" : "未达到",
          color: res.p95 ? MATH_COLORS.paramTertiary : MATH_COLORS.textMuted
        },
        {
          label: "临界点 6.635 (99%)",
          value: res.p99 ? "已达到 (超99%把握)" : "未达到",
          color: res.p99 ? MATH_COLORS.paramTertiary : MATH_COLORS.textMuted
        }
      ],
      theorems: [
        {
          name: "2×2 列联表卡方检验统计量 χ²",
          latex: `\\chi^2 = \\frac{n(ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)}`,
          note: "其中 n = a+b+c+d，用于检验两个分类变量是否相互独立。",
          level: "core"
        },
        {
          name: "高考常用卡方临界值对照表",
          latex: `P(\\chi^2 \\ge k_0): \\quad k_0=2.706 (90\\%), \\; 3.841 (95\\%), \\; 6.635 (99\\%), \\; 10.828 (99.9\\%)`,
          note: "若 χ² ≥ 3.841，则有 95% 以上的把握推翻 H₀（即认为两个变量有关联）。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】零假设 H₀：变量 A 与变量 B 独立（无关联）。小概率原理：当观测值 χ² ≥ k₀ 时，拒绝 H₀。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】熟记临界值 3.841 (对应 α=0.05，即 95% 把握) 和 6.635 (对应 α=0.01，即 99% 把握)。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】答题表述公式：“有 1 - α 的把握认为 A 与 B 有关”，不可误表述为“A 导致 B 的概率为 95%”。",
          importance: "gaokao"
        }
      ],
      warnings: !res.isValid ? [
        {
          text: `【退化预警】${res.confidenceText}`,
          level: "warning"
        }
      ] : res.n < 40 ? [
        {
          text: "【样本容量过小】样本总数 n < 40 时，卡方近似检验可能误差较大（高考中要求 n ≥ 40 且各频数 ≥ 5）。",
          level: "warning"
        }
      ] : []
    };
  }
}
const DEFAULT_BIN_INTERVALS = [
  { min: 50, max: 60 },
  { min: 60, max: 70 },
  { min: 70, max: 80 },
  { min: 80, max: 90 },
  { min: 90, max: 100 }
];
const BASE_FREQUENCIES = [0.1, 0.25, 0.35, 0.2, 0.1];
function generateHistogramBins(shift = 0) {
  const rawFreqs = BASE_FREQUENCIES.map((f, idx) => {
    const factor = 1 + shift * (idx - 2) * 0.4;
    return Math.max(0.04, f * factor);
  });
  const sumFreq = rawFreqs.reduce((a, b) => a + b, 0);
  const normalizedFreqs = rawFreqs.map((f) => f / sumFreq);
  let cum = 0;
  return DEFAULT_BIN_INTERVALS.map((interval, i) => {
    const freq = normalizedFreqs[i];
    cum += freq;
    const width = interval.max - interval.min;
    return {
      xMin: interval.min,
      xMax: interval.max,
      width,
      midpoint: (interval.min + interval.max) / 2,
      frequency: freq,
      height: freq / width,
      cumFrequency: cum
    };
  });
}
function calculatePercentile(bins, pPercentage) {
  const targetRatio = Math.min(0.999, Math.max(1e-3, pPercentage / 100));
  let prevCum = 0;
  for (let i = 0; i < bins.length; i++) {
    const bin = bins[i];
    if (bin.cumFrequency >= targetRatio || i === bins.length - 1) {
      const needed = targetRatio - prevCum;
      const val = bin.xMin + needed / bin.height;
      return {
        value: Math.min(bin.xMax, Math.max(bin.xMin, val)),
        binIndex: i
      };
    }
    prevCum = bin.cumFrequency;
  }
  const last = bins[bins.length - 1];
  return { value: last.xMax, binIndex: bins.length - 1 };
}
function calculateHistogramStats(bins, percentileP = 50) {
  let mean = 0;
  let maxHeight = -1;
  let modeIndex = 0;
  bins.forEach((bin, idx) => {
    mean += bin.midpoint * bin.frequency;
    if (bin.height > maxHeight) {
      maxHeight = bin.height;
      modeIndex = idx;
    }
  });
  const mode = bins[modeIndex].midpoint;
  const median = calculatePercentile(bins, 50).value;
  const q1 = calculatePercentile(bins, 25).value;
  const q3 = calculatePercentile(bins, 75).value;
  const iqr = q3 - q1;
  const targetP = calculatePercentile(bins, percentileP);
  return {
    mean,
    mode,
    median,
    q1,
    q3,
    iqr,
    percentileVal: targetP.value,
    percentileBinIndex: targetP.binIndex
  };
}
function calculatePercentileShadeBins(bins, percentileVal) {
  return bins.map((bin) => {
    if (percentileVal <= bin.xMin) {
      return {
        xMin: bin.xMin,
        xMax: bin.xMin,
        height: bin.height,
        isFull: false,
        isPartial: false,
        fraction: 0
      };
    } else if (percentileVal >= bin.xMax) {
      return {
        xMin: bin.xMin,
        xMax: bin.xMax,
        height: bin.height,
        isFull: true,
        isPartial: false,
        fraction: 1
      };
    } else {
      const frac = (percentileVal - bin.xMin) / bin.width;
      return {
        xMin: bin.xMin,
        xMax: percentileVal,
        height: bin.height,
        isFull: false,
        isPartial: true,
        fraction: Math.max(0, Math.min(1, frac))
      };
    }
  });
}
function calculateStratifiedSampling(sampleN, N1, N2, N3, mean1, mean2, mean3, var1, var2, var3) {
  const totalN = N1 + N2 + N3;
  const ratio = sampleN / totalN;
  const rawCounts = [N1 * ratio, N2 * ratio, N3 * ratio];
  const roundedCounts = rawCounts.map((v) => Math.round(v));
  const roundedSum = roundedCounts.reduce((a, b) => a + b, 0);
  const diff = sampleN - roundedSum;
  if (diff !== 0) {
    const remainders = rawCounts.map((v, i) => ({
      idx: i,
      rem: v - Math.floor(v)
    }));
    remainders.sort((a, b) => b.rem - a.rem);
    roundedCounts[remainders[0].idx] += diff;
  }
  const strataN = [N1, N2, N3];
  const strataSampleN = [
    Math.max(1, roundedCounts[0]),
    Math.max(1, roundedCounts[1]),
    Math.max(1, roundedCounts[2])
  ];
  const w1 = N1 / totalN;
  const w2 = N2 / totalN;
  const w3 = N3 / totalN;
  const strataWeights = [w1, w2, w3];
  const strataMeans = [mean1, mean2, mean3];
  const strataVars = [var1, var2, var3];
  const totalMean = w1 * mean1 + w2 * mean2 + w3 * mean3;
  const term1 = w1 * (var1 + Math.pow(mean1 - totalMean, 2));
  const term2 = w2 * (var2 + Math.pow(mean2 - totalMean, 2));
  const term3 = w3 * (var3 + Math.pow(mean3 - totalMean, 2));
  const totalVar = term1 + term2 + term3;
  const totalStd = Math.sqrt(totalVar);
  return {
    totalN,
    sampleN,
    samplingRatio: ratio,
    strataN,
    strataSampleN,
    strataWeights,
    strataMeans,
    strataVars,
    totalMean,
    totalVar,
    totalStd
  };
}
function buildStatPercentilePanel(params, config) {
  const studyMode = config?.studyMode ?? "histogram";
  const percentileP = params.percentileP ?? 50;
  const shift = params.shift ?? 0;
  const sampleN = params.sampleN ?? 100;
  const N1 = params.N1 ?? 300;
  const N2 = params.N2 ?? 500;
  const N3 = params.N3 ?? 200;
  const mean1 = params.mean1 ?? 72;
  const mean2 = params.mean2 ?? 78;
  const mean3 = params.mean3 ?? 85;
  const var1 = params.var1 ?? 36;
  const var2 = params.var2 ?? 49;
  const var3 = params.var3 ?? 25;
  const bins = generateHistogramBins(shift);
  const stats = calculateHistogramStats(bins, percentileP);
  const stratResult = calculateStratifiedSampling(
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3
  );
  if (studyMode === "histogram") {
    return {
      quantities: [
        {
          label: `第 ${percentileP}% 百分位数 P_${percentileP}`,
          value: `${stats.percentileVal.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive"
        },
        {
          label: "直方图估算平均数 x̄",
          value: `${stats.mean.toFixed(2)}`,
          color: MATH_COLORS.function
        },
        {
          label: "估算中位数 Me (50%)",
          value: `${stats.median.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "估算众数 Mo",
          value: `${stats.mode.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "下四分位数 Q₁ (25%)",
          value: `${stats.q1.toFixed(2)}`,
          color: MATH_COLORS.function
        },
        {
          label: "上四分位数 Q₃ (75%)",
          value: `${stats.q3.toFixed(2)}`,
          color: MATH_COLORS.function
        },
        {
          label: "四分位距 IQR (Q₃ - Q₁)",
          value: `${stats.iqr.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        }
      ],
      theorems: [
        {
          name: "频率分布直方图三大特征",
          latex: "\\sum (h_i \\times d) = \\sum f_i = 1, \\quad h_i = \\frac{f_i}{d}",
          note: "纵轴为 频率/组距 h，矩形面积表示频率 f，直方图矩形总面积恒等于 1。",
          level: "core"
        },
        {
          name: "百分位数/中位数的几何意义",
          latex: "\\text{面积}(x \\le P_p) = \\sum_{\\text{左侧}} f_i + h_k \\cdot (P_p - x_{k,\\min}) = \\frac{p}{100}",
          note: "第 p 百分位数 P_p 恰好将直方图左侧矩形面积切割为 p%。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】频率分布直方图纵轴是 频率/组距，求解各组频率需乘以组距 d (如 d=10)！",
          importance: "gaokao"
        },
        {
          text: "【高考考点】直方图估计平均数必须用各组【组中值】乘以对应组【频率】后累加。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】中位数是把直方图左右面积平分为 0.5 的垂直切线。",
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "易错警示：切勿把纵轴高度 h_i 直接当成频率！频率 = h_i × 组距 d。",
          level: "warning"
        }
      ],
      mnemonic: "组中值乘频率求均值，平分面积求中位，最高矩形找众数，纵轴高度乘以距！"
    };
  } else if (studyMode === "cumulative") {
    const activeBin = bins[stats.percentileBinIndex];
    const prevCum = stats.percentileBinIndex > 0 ? bins[stats.percentileBinIndex - 1].cumFrequency : 0;
    return {
      quantities: [
        {
          label: `目标百分位 p%`,
          value: `${percentileP}%`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive"
        },
        {
          label: `估算百分位数 P_${percentileP}`,
          value: `${stats.percentileVal.toFixed(2)}`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive"
        },
        {
          label: "落入区间",
          value: `[${activeBin.xMin}, ${activeBin.xMax})`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "前组累积频率 F_prev",
          value: `${(prevCum * 100).toFixed(1)}%`,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "该组矩形高度 h",
          value: `${activeBin.height.toFixed(4)}`,
          color: MATH_COLORS.function
        },
        {
          label: "四分位距 IQR (Q₃ - Q₁)",
          value: `${stats.iqr.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        }
      ],
      theorems: [
        {
          name: "百分位数线性插值公式 (高考标准)",
          latex: "y_p = a + \\frac{\\color{#EF4444}{\\frac{p}{100} - F_{\\text{prev}}}}{\\color{#D97706}{h}} = a + \\frac{\\frac{p}{100} - F_{\\text{prev}}}{f_i} \\cdot d",
          prerequisites: [
            "$a$ 为目标所在组左端点",
            "$F_{\\text{prev}}$ 为此前各组累积频率",
            "$h$ 为该组矩形高度"
          ],
          note: "累积频率达到 p% 时，在该组内按矩形面积线性插值补足所需频率。",
          level: "core"
        },
        {
          name: "三大常考百分位数",
          latex: "Q_1: p=25\\% (\\text{下四分位数}), \\quad M_e: p=50\\% (\\text{中位数}), \\quad Q_3: p=75\\% (\\text{上四分位数})",
          note: "四分位距 IQR = Q₃ - Q₁ 反映数据中间 50% 的离散程度。",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考考点】百分位数计算题解答时需先算各组累积频率，定位所在区间后再插值。",
          importance: "gaokao"
        },
        {
          text: "【高考考点】第 p 百分位数代表样本中至少有 p% 的数据小于或等于该值。",
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "线性插值公式中分子为 (p% - F_prev)，分母是矩形高度 h（或频率除以组距），注意量纲单位！",
          level: "warning"
        }
      ],
      mnemonic: "定位区间看累加，缺多少频率向上插；除以高度加左界，百分位数轻松拿！"
    };
  } else {
    const intraVar = stratResult.strataWeights[0] * stratResult.strataVars[0] + stratResult.strataWeights[1] * stratResult.strataVars[1] + stratResult.strataWeights[2] * stratResult.strataVars[2];
    const interMeanVar = Math.max(0, stratResult.totalVar - intraVar);
    return {
      quantities: [
        {
          label: "总体规模 N",
          value: `${stratResult.totalN}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "样本总量 n",
          value: `${stratResult.sampleN}`,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "抽样比例 f = n/N",
          value: `${(stratResult.samplingRatio * 100).toFixed(1)}%`,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "各层抽样数 (n₁, n₂, n₃)",
          value: `(${stratResult.strataSampleN.join(", ")})`,
          color: MATH_COLORS.paramSecondary,
          highlight: "positive"
        },
        {
          label: "总体加权均值 x̄",
          value: `${stratResult.totalMean.toFixed(2)}`,
          color: MATH_COLORS.function
        },
        {
          label: "总体加权方差 s²",
          value: `${stratResult.totalVar.toFixed(2)}`,
          color: MATH_COLORS.paramTertiary,
          highlight: "positive"
        },
        {
          label: "• 组内方差贡献 ∑w_i s_i²",
          value: `${intraVar.toFixed(2)}`,
          color: MATH_COLORS.function
        },
        {
          label: "• 组间均值离差贡献",
          value: `${interMeanVar.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        }
      ],
      theorems: [
        {
          name: "分层抽样比例分配公式",
          latex: "n_i = N_i \\cdot \\frac{n}{N} = N_i \\cdot f, \\quad \\sum n_i = n",
          note: "各层抽取的样本量与该层在总体中所占的人数比例成正比。",
          level: "core"
        },
        {
          name: "分层抽样总体均值与方差公式 (高考高频新大纲)",
          latex: "\\bar{x} = \\sum_{i=1}^{k} w_i \\bar{x}_i, \\quad s^2 = \\sum_{i=1}^{k} w_i \\left[ s_i^2 + (\\bar{x}_i - \\bar{x})^2 \\right]",
          prerequisites: ["$w_i = \\frac{N_i}{N}$ 满足 $\\sum w_i = 1$"],
          note: "总体方差由【组内方差加权和】与【组间均值离差平方和】两部分共同决定！",
          level: "important"
        }
      ],
      gaokaoPoints: [
        {
          text: "【高考新考点】分层抽样的总体方差计算公式：必须考虑各层本身的方差以及各层均值与总体均值偏差的平方！",
          importance: "gaokao"
        },
        {
          text: "【高考考点】当总体由差异明显的几部分组成时，必须采用分层抽样以提高估计精度。",
          importance: "gaokao"
        }
      ],
      warnings: [
        {
          text: "特别提醒：总体方差 s² 绝非简单的 ∑ w_i s_i²！必须加上组间均值偏差项 w_i (x̄_i - x̄)²。",
          level: "warning"
        }
      ],
      mnemonic: "按比例抽样本，总体均值权加和；总体方差两部分，层内方差加层间！"
    };
  }
}
const cuboidCircumRadius = (a, b, c) => Math.sqrt(a * a + b * b + c * c) / 2;
const regularPyramidCircumRadius = (baseCircumR, h) => (baseCircumR * baseCircumR + h * h) / (2 * h);
const coneCircumRadius = (r, h) => (r * r + h * h) / (2 * h);
const sphereVolume = (r) => 4 / 3 * Math.PI * r ** 3;
const sphereSurfaceArea = (r) => 4 * Math.PI * r ** 2;
const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});
const sub = (a, b) => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});
const scale = (a, k) => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k
});
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});
const norm = (a) => Math.sqrt(dot(a, a));
const normalize = (a) => {
  const n = norm(a);
  return n < 1e-9 ? { x: 0, y: 0, z: 0 } : scale(a, 1 / n);
};
const lerp = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t
});
function judgeLinePlane(dir, plane, pointOnLine, eps = 1e-3) {
  const nDir = normalize(dir);
  const cosWithNormal = dot(nDir, plane.normal);
  const distToPlane = Math.abs(
    dot(sub(pointOnLine, plane.point), plane.normal)
  );
  if (Math.abs(cosWithNormal) < eps && distToPlane < eps) return "inPlane";
  if (Math.abs(cosWithNormal) < eps) return "parallel";
  if (Math.abs(Math.abs(cosWithNormal) - 1) < eps) return "perpendicular";
  return "intersect";
}
function getLineDirection(thetaDeg, phiDeg) {
  const thetaRad = thetaDeg * Math.PI / 180;
  const phiRad = phiDeg * Math.PI / 180;
  return {
    x: Math.cos(thetaRad) * Math.cos(phiRad),
    y: Math.cos(thetaRad) * Math.sin(phiRad),
    z: Math.sin(thetaRad)
  };
}
function calcLinePlaneAngle(dir, planeNormal = { x: 0, y: 0, z: 1 }) {
  const nDir = normalize(dir);
  const nNorm = normalize(planeNormal);
  const cosNormalAngle = Math.abs(dot(nDir, nNorm));
  const sinTheta = cosNormalAngle;
  const thetaRad = Math.asin(Math.min(1, Math.max(0, sinTheta)));
  return {
    sinTheta,
    thetaDeg: thetaRad * 180 / Math.PI,
    cosNormalAngle
  };
}
function buildSpatialAnglePanel(params, config) {
  const mode = config?.mode ?? "skewLines";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const ex = params.ex ?? 1.2;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  if (mode === "skewLines") {
    const dot2 = ex * c;
    const lenU = Math.sqrt(b * b + ex * ex);
    const lenV = Math.sqrt(a * a + c * c);
    const cosVal = Math.min(1, Math.max(0, Math.abs(dot2) / (lenU * lenV)));
    const angleRad = Math.acos(cosVal);
    const angleDeg = angleRad * 180 / Math.PI;
    const nSkewX = -b * c;
    const nSkewY = a * ex;
    const nSkewZ = a * b;
    const lenNSkew = Math.sqrt(
      nSkewX * nSkewX + nSkewY * nSkewY + nSkewZ * nSkewZ
    );
    const distSkew = a * b * ex / lenNSkew;
    quantities.push(
      {
        label: "方向向量 u (DE)",
        symbol: "\\vec{u}",
        value: `(0, -${b}, ${ex})`,
        color: MATH_COLORS.primary
      },
      {
        label: "方向向量 v (AB₁)",
        symbol: "\\vec{v}",
        value: `(${a}, 0, ${c})`,
        color: MATH_COLORS.accent
      },
      {
        label: "公垂线向量 n_公",
        symbol: "\\vec{n}_{\\text{公}}",
        value: `(${nSkewX.toFixed(1)}, ${nSkewY.toFixed(1)}, ${nSkewZ.toFixed(1)})`,
        color: MATH_COLORS.secondary
      },
      {
        label: "异面直线间距离",
        symbol: "d_{\\text{异面}}",
        value: Number(distSkew.toFixed(4)),
        color: MATH_COLORS.paramPrimary
      },
      {
        label: "向量夹角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(cosVal.toFixed(4)),
        color: MATH_COLORS.secondary
      },
      {
        label: "异面直线所成的角",
        symbol: "\\theta",
        value: `${angleDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "异面直线所成角坐标公式",
        latex: `\\cos \\theta = \\frac{|\\vec{u} \\cdot \\vec{v}|}{|\\vec{u}||\\vec{v}|} = \\frac{|x_1 x_2 + y_1 y_2 + z_1 z_2|}{\\sqrt{x_1^2+y_1^2+z_1^2}\\sqrt{x_2^2+y_2^2+z_2^2}}`,
        level: "core",
        condition: "θ ∈ (0°, 90°]，异面直线角不能为钝角"
      },
      {
        name: "异面直线间的距离（公垂线法）",
        latex: `d_{\\text{异面}} = \\frac{|\\vec{P_1 P_2} \\cdot \\vec{n}_{\\text{公}}|}{|\\vec{n}_{\\text{公}}|}`,
        level: "important",
        note: "n_公 = u × v 为两条异面直线的公垂线方向向量，P1, P2 分别为两直线上任意一点"
      },
      {
        name: "长方体建系顶点坐标",
        latex: `A(0,0,0),\\; B_1(a,0,c),\\; D(0,b,0),\\; E(0,0,z_E)`,
        level: "important"
      }
    );
    gaokaoPoints.push(
      {
        text: "求异面直线所成角高考三步法：① 建立空间直角坐标系；② 确定两条直线的方向向量 u, v 的坐标；③ 代入余弦绝对值公式计算，范围必在 (0°, 90°] 内。",
        importance: "gaokao"
      },
      {
        text: "异面直线间距离（公垂线法）：两条异面直线的距离即公垂线段长度，等于连接两线上任意两点 P₁P₂ 在公垂向量 n_公 方向上的投影长度。",
        importance: "gaokao"
      }
    );
    if (Math.abs(dot2) < 1e-3) {
      warnings.push({
        text: "方向向量内积 u · v = 0，异面直线 DE ⊥ AB₁，所成角达到最大极值 90°！",
        level: "warning"
      });
    }
  } else if (mode === "linePlane") {
    const lenU = Math.sqrt(a * a + ex * ex);
    const sinThetaBase = ex / lenU;
    const angleBaseDeg = Math.asin(sinThetaBase) * 180 / Math.PI;
    quantities.push(
      {
        label: "顶点坐标 B",
        symbol: "B",
        value: `(${a}, 0, 0)`,
        color: MATH_COLORS.primary
      },
      {
        label: "方向向量 u (BE)",
        symbol: "\\vec{u}",
        value: `(-${a}, 0, ${ex})`,
        color: MATH_COLORS.primary
      },
      {
        label: "底面法向量 n_0",
        symbol: "\\vec{n_0}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.secondary
      },
      {
        label: "线面角正弦 sinθ",
        symbol: "\\sin\\theta",
        value: Number(sinThetaBase.toFixed(4)),
        color: MATH_COLORS.accent
      },
      {
        label: "直线与底面所成的角",
        symbol: "\\theta",
        value: `${angleBaseDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "直线与平面所成角坐标公式",
        latex: `\\sin \\theta = |\\cos \\langle \\vec{u}, \\vec{n} \\rangle| = \\frac{|\\vec{u} \\cdot \\vec{n}|}{|\\vec{u}||\\vec{n}|}`,
        level: "core",
        condition: "θ ∈ [0°, 90°]，正弦值等于方向向量与法向量夹角余弦的绝对值"
      },
      {
        name: "底面与斜线向量坐标",
        latex: `\\vec{u} = \\vec{BE} = (-a, 0, z_E),\\; \\vec{n_0} = (0,0,1)`,
        level: "important"
      }
    );
    gaokaoPoints.push({
      text: "高考大题核心考点：线面角使用的是正弦 sinθ！向量公式求出的是与法向量夹角的余弦，切记做 sinθ = |cos<u,n>| 的转换，不要直接写成 cosθ。",
      importance: "gaokao"
    });
    if (ex < 0.3) {
      warnings.push({
        text: "动点 E 接近底面 (z_E → 0)，直线 BE 接近落在底面内，线面角趋近于 0°！",
        level: "warning"
      });
    }
  } else if (mode === "distance") {
    const n2X = b * ex;
    const n2Y = a * ex;
    const n2Z = a * b;
    const lenN2 = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
    const dist = a * b * ex / lenN2;
    const sBde = 0.5 * lenN2;
    const sAbd = 0.5 * a * b;
    const vol = 1 / 6 * a * b * ex;
    const volMax = 1 / 6 * a * b * c;
    quantities.push(
      {
        label: "截面法向量 n",
        symbol: "\\vec{n}",
        value: `(${n2X.toFixed(1)}, ${n2Y.toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.primary
      },
      {
        label: "截面三角形面积 S_BDE",
        symbol: "S_{\\Delta BDE}",
        value: Number(sBde.toFixed(3)),
        color: MATH_COLORS.secondary
      },
      {
        label: "底面三角形面积 S_ABD",
        symbol: "S_{\\Delta ABD}",
        value: Number(sAbd.toFixed(3)),
        color: MATH_COLORS.primary
      },
      {
        label: "点到平面距离 d",
        symbol: "d_{A-\\text{面}}",
        value: Number(dist.toFixed(4)),
        color: MATH_COLORS.highlight
      },
      {
        label: "三棱锥 E-ABD 当前体积",
        symbol: "V_{E-ABD}",
        value: Number(vol.toFixed(4)),
        color: MATH_COLORS.accent
      },
      {
        label: "三棱锥体积最大极值",
        symbol: "V_{\\max}",
        value: Number(volMax.toFixed(4)),
        color: MATH_COLORS.paramPrimary
      }
    );
    theorems.push(
      {
        name: "向量法求点到平面的距离公式",
        latex: `d = \\frac{|\\vec{AP} \\cdot \\vec{n}|}{|\\vec{n}|}`,
        level: "core",
        note: "P 为平面内任意一点，A 为平面外一点，n 为平面的法向量"
      },
      {
        name: "等体积法（等积法）互验公式",
        latex: `V_{E-ABD} = \\frac{1}{3} S_{\\Delta BDE} \\cdot d = \\frac{1}{3} S_{\\Delta ABD} \\cdot z_E`,
        level: "important",
        note: "当求法向量复杂时，可利用等体积法 d = (3V) / S_底 反解距离"
      },
      {
        name: "动点体积极值定理",
        latex: `V(z_E) = \\frac{1}{6} a b z_E \\le \\frac{1}{6} a b c = V_{\\max}`,
        level: "important",
        condition: "当 z_E = c (即动点 E 重合顶点 A₁) 时取最大值"
      }
    );
    gaokaoPoints.push(
      {
        text: "高考压轴问法必杀技：求点到平面的距离优先建系取法向量代用公式 d = |AP · n| / |n|。也可通过等体积法 V = 1/3 S d 避开法向量求解。",
        importance: "gaokao"
      },
      {
        text: "体积极值考点：由于底面 S_ABD 保持不变，三棱锥 E-ABD 体积随高 z_E 线性递增，当动点 E 移动到侧棱顶端 A₁ (z_E = c) 时达到最大体积。",
        importance: "gaokao"
      }
    );
    if (Math.abs(ex - c) < 0.05) {
      warnings.push({
        text: `动点 E 已到达侧棱顶端 A₁ (z_E = c = ${c})，三棱锥 E-ABD 体积达到最大极值 V_max = ${volMax.toFixed(2)}！`,
        level: "warning"
      });
    } else if (ex < 0.3) {
      warnings.push({
        text: "动点 E 接近底面 (z_E → 0)，三棱锥趋于扁平退化，点 A 到截面的距离 d 趋近于 0！",
        level: "warning"
      });
    }
  } else {
    const n2X = b * ex;
    const n2Y = a * ex;
    const n2Z = a * b;
    const lenN1 = 1;
    const lenN2 = Math.sqrt(n2X * n2X + n2Y * n2Y + n2Z * n2Z);
    const cosVal = n2Z / (lenN1 * lenN2);
    const dihedralRad = Math.acos(cosVal);
    const dihedralDeg = dihedralRad * 180 / Math.PI;
    quantities.push(
      {
        label: "底面法向量 n_1",
        symbol: "\\vec{n_1}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.secondary
      },
      {
        label: "截面法向量 n_2",
        symbol: "\\vec{n_2}",
        value: `(${n2X.toFixed(1)}, ${n2Y.toFixed(1)}, ${(a * b).toFixed(1)})`,
        color: MATH_COLORS.primary
      },
      {
        label: "二面角余弦 cosθ",
        symbol: "\\cos\\theta",
        value: Number(cosVal.toFixed(4)),
        color: MATH_COLORS.accent
      },
      {
        label: "二面角 B-DE-A 大小",
        symbol: "\\theta",
        value: `${dihedralDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "二面角向量坐标公式",
        latex: `\\cos \\theta = \\pm \\frac{\\vec{n_1} \\cdot \\vec{n_2}}{|\\vec{n_1}||\\vec{n_2}|}`,
        level: "core",
        note: "通过计算两个平面的法向量 n₁, n₂ 夹角确定二面角（锐角用正值，钝角用负值）"
      },
      {
        name: "截面法向量求解方程组",
        latex: `\\begin{cases} \\vec{n_2} \\cdot \\vec{BD} = 0 \\\\ \\vec{n_2} \\cdot \\vec{BE} = 0 \\end{cases} \\;\\Rightarrow\\; \\vec{n_2} = (b z_E, a z_E, a b)`,
        level: "important"
      }
    );
    gaokaoPoints.push({
      text: "高考立体几何第(2)问满分步骤：① 设法向量 n=(x,y,z)；② 列出 n·v1=0 和 n·v2=0 方程组取特解；③ 计算 cos<n1,n2>；④ 根据图形几何直观明确说明“由图可知该二面角为锐角/钝角”。",
      importance: "gaokao"
    });
    if (dihedralDeg < 1 || dihedralDeg > 179) {
      warnings.push({
        text: "二面角接近 0° 或 180°，截面退化为共面！",
        level: "warning"
      });
    }
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function buildLinePlaneRelationPanel(params, config) {
  const mode = config?.mode ?? "parallel";
  const zHeight = params.zHeight ?? 2;
  const thetaDeg = params.thetaDeg ?? 0;
  const phiDeg = params.phiDeg ?? 30;
  const intersectType = params.intersectType ?? 1;
  if (mode === "surfaceParallel" || mode === "surfacePerp") {
    const isParallelMode = mode === "surfaceParallel";
    const quantities2 = [
      {
        label: "平面 α 法向量 n₁",
        symbol: "\\vec{n_1}",
        value: "(0, 0, 1)",
        color: MATH_COLORS.primary
      },
      {
        label: "平面 β 法向量 n₂",
        symbol: "\\vec{n_2}",
        value: isParallelMode ? "(0, 0, 1)" : "(1, 0, 0)",
        color: MATH_COLORS.secondary
      },
      {
        label: "两平面位置关系",
        value: isParallelMode ? "面面平行 (α ∥ β)" : "面面垂直 (α ⊥ β)",
        color: MATH_COLORS.highlight
      }
    ];
    const theorems2 = isParallelMode ? [
      {
        name: "面面平行判定定理 (几何法)",
        latex: `\\begin{cases} a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\\\ a \\parallel \\beta, \\; b \\parallel \\beta \\end{cases} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "一个平面内有两条相交直线分别平行于另一个平面"
      },
      {
        name: "面面平行向量法判定",
        latex: `\\vec{n_1} \\parallel \\vec{n_2} \\;\\Rightarrow\\; \\alpha \\parallel \\beta`,
        level: "core",
        condition: "两平面的法向量平行 (成比例)"
      }
    ] : [
      {
        name: "面面垂直判定定理 (几何法)",
        latex: `l \\perp \\alpha, \\; l \\subset \\beta \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
        level: "core",
        condition: "一个平面经过另一个平面的一条垂线"
      },
      {
        name: "面面垂直向量法判定",
        latex: `\\vec{n_1} \\cdot \\vec{n_2} = 0 \\;\\Rightarrow\\; \\alpha \\perp \\beta`,
        level: "core",
        condition: "两平面的法向量数量积为 0 (相互垂直)"
      }
    ];
    const gaokaoPoints2 = [
      {
        text: isParallelMode ? "高考证明面面平行常用“线面平行→面面平行”：找到平面α内的两条相交直线分别平行于β。" : "高考证明面面垂直黄金法则：先在平面β内找到一条直线l，证明l垂直于平面α（线面垂直→面面垂直）。",
        importance: "gaokao"
      }
    ];
    const warnings2 = [];
    return { quantities: quantities2, theorems: theorems2, gaokaoPoints: gaokaoPoints2, warnings: warnings2 };
  }
  const plane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 }
  };
  const lineDir = getLineDirection(thetaDeg, phiDeg);
  const pointOnLine = { x: 0, y: 0, z: zHeight };
  const relation = judgeLinePlane(lineDir, plane, pointOnLine);
  const angleInfo = calcLinePlaneAngle(lineDir, plane.normal);
  const relationText = relation === "parallel" ? "线面平行 (l ∥ α)" : relation === "perpendicular" ? "线面垂直 (l ⊥ α)" : relation === "inPlane" ? "线在面内 (l ⊂ α)" : "线面相交 (l ∩ α = P)";
  const quantities = [
    {
      label: "线面角正弦 sinθ",
      symbol: "\\sin\\theta",
      value: Number(angleInfo.sinTheta.toFixed(3)),
      color: MATH_COLORS.paramTertiary
    },
    {
      label: "位置关系",
      value: relationText,
      color: relation === "perpendicular" || relation === "parallel" ? MATH_COLORS.highlight : MATH_COLORS.primary
    }
  ];
  const theorems = [
    {
      name: "线面平行判定定理 (几何法)",
      latex: `\\begin{cases} l \\not\\subset \\alpha \\\\ m \\subset \\alpha \\\\ l \\parallel m \\end{cases} \\;\\Rightarrow\\; l \\parallel \\alpha`,
      level: "core",
      condition: "平面外一条直线与平面内一条直线平行"
    },
    {
      name: "线面垂直判定定理 (几何法)",
      latex: `\\begin{cases} l \\perp a, \\; l \\perp b \\\\ a \\subset \\alpha, \\; b \\subset \\alpha \\\\ a \\cap b = P \\end{cases} \\;\\Rightarrow\\; l \\perp \\alpha`,
      level: "core",
      condition: "直线与平面内两条相交直线都垂直 (相交是必要条件)"
    },
    {
      name: "空间向量法判定定理",
      latex: `\\vec{l} \\cdot \\vec{n} = 0 \\;(l \\not\\subset \\alpha) \\Rightarrow l \\parallel \\alpha, \\quad \\vec{l} \\parallel \\vec{n} \\Rightarrow l \\perp \\alpha`,
      level: "core",
      condition: "利用直线方向向量 l 与平面法向量 n 判断"
    }
  ];
  const gaokaoPoints = [
    {
      text: "立体几何大题第一问常考几何法判定平行/垂直；第二问建系用向量法求线面角 sinθ = |cos<l, n>|。",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (mode === "perpendicular" && intersectType === 0) {
    warnings.push({
      text: "当前演示：平面内两条直线 a ∥ b。此时即使直线 l 分别垂直于 a 和 b，l 依然可以左右倾斜（斜交），无法导出 l ⊥ α！线面垂直判定必须强调两直线【相交】。",
      level: "danger"
    });
  }
  if (zHeight === 0 && thetaDeg === 0) {
    warnings.push({
      text: "当前 h = 0 且 θ = 0°，直线完全贴合在平面内 (l ⊂ α)。线面平行的严格前提条件是直线在平面外 (l ⊄ α)。",
      level: "warning"
    });
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function buildSectionPanel(params, config) {
  const cutHeight = params.cutHeight ?? 2;
  const tiltDeg = params.tiltDeg ?? 0;
  const vertexCount = config?.vertexCount ?? (tiltDeg === 0 ? 4 : 5);
  const area3D = config?.area3D ?? 6;
  const areaProj = config?.areaProj ?? 6;
  const cosTheta = config?.cosTheta ?? 1;
  const thetaDeg = config?.thetaDeg ?? Math.abs(tiltDeg);
  const normalStr = config?.normalStr ?? "(0.00, 0.00, 1.00)";
  let shapeName = "四边形";
  if (vertexCount === 3) shapeName = "三角形";
  else if (vertexCount === 4) shapeName = "四边形 (矩形/梯形/菱形)";
  else if (vertexCount === 5) shapeName = "五边形";
  else if (vertexCount === 6) shapeName = "六边形 (含正六边形)";
  else if (vertexCount === 0) shapeName = "未切割 (无相交)";
  const quantities = [
    {
      label: "截面形状",
      value: shapeName,
      color: MATH_COLORS.primary
    },
    {
      label: "截面顶点数",
      symbol: "N",
      value: vertexCount,
      color: MATH_COLORS.highlight
    },
    {
      label: "截面 3D 真实面积",
      symbol: "S_{\\text{截}}",
      value: `${area3D.toFixed(3)}`,
      color: MATH_COLORS.paramPrimary
    },
    {
      label: "底面 2D 投影面积",
      symbol: "S_{\\text{投影}}",
      value: `${areaProj.toFixed(3)}`,
      color: MATH_COLORS.paramSecondary
    },
    {
      label: "截面与底面夹角",
      symbol: "\\theta",
      value: `${thetaDeg.toFixed(1)}° (cosθ=${cosTheta.toFixed(3)})`,
      color: MATH_COLORS.paramTertiary
    },
    {
      label: "平面法向量",
      symbol: "\\boldsymbol{n}",
      value: normalStr,
      color: MATH_COLORS.secondary
    }
  ];
  const theorems = [
    {
      name: "射影面积定理 (高考核心推导)",
      latex: `S_{\\text{投影}} = S_{\\text{截}} \\cdot \\cos \\theta \\;\\Rightarrow\\; S_{\\text{截}} = \\frac{S_{	ext{投影}}}{\\cos \\theta}`,
      level: "core",
      note: `当前数值验证: ${areaProj.toFixed(2)} / ${cosTheta.toFixed(3)} ≈ ${area3D.toFixed(2)}`
    },
    {
      name: "截面作图交线法则与面面平行",
      latex: `\\alpha \\parallel \\beta \\; \\text{且} \\; \\gamma \\cap \\alpha = a, \\gamma \\cap \\beta = b \\;\\Rightarrow\\; a \\parallel b`,
      level: "important",
      note: "平面截多面体，多边形顶点数 ≤ 多面体面数。在正方体/长方体中，相对面交线必平行"
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考选填题热点：正方体/长方体截面边数 N ∈ {3, 4, 5, 6}，绝不可能出现七边形！正六边形截面过正方体中心且垂直于体对角线。",
      importance: "gaokao"
    },
    {
      text: "高考大题技巧：利用空间向量求出法向量 n 后，无需求截面各边长，直接求出底面投影面积与二面角 cosθ，用 S_截 = S_投 / cosθ 快速解算截面积！",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (cosTheta < 1e-3) {
    warnings.push({
      text: "截面垂直于底面 (cosθ = 0)，底面投影退化为一条线段 (S_投影 = 0)，射影面积公式 S_截 = S_投 / cosθ 不适用！",
      level: "warning"
    });
  }
  if (cutHeight <= 0.1 || cutHeight >= 3.9) {
    warnings.push({
      text: "切割平面贴近多面体边界顶底，截面临界退化为顶点、棱或底面！",
      level: "warning"
    });
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function buildCircumSpherePanel(params, config) {
  if (!config) {
    console.warn(
      "[buildCircumSpherePanel] config 未传入，右屏公式默认为长方体外接球"
    );
  }
  const sphereType = config?.sphereType ?? "circum";
  const shape = config?.shape ?? "cuboid";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  let radius = 0;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  if (sphereType === "circum") {
    if (shape === "cuboid") {
      radius = cuboidCircumRadius(a, b, c);
      quantities.push(
        {
          label: "体对角线长 d",
          symbol: "d",
          value: (2 * radius).toFixed(3),
          color: MATH_COLORS.primary
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push(
        {
          name: "长方体/墙角模型外接球公式",
          latex: `R = \\frac{\\sqrt{a^2 + b^2 + c^2}}{2}`,
          level: "core",
          note: "体对角线长等于外接球直径 ($d = 2R = \\sqrt{a^2+b^2+c^2}$)"
        },
        {
          name: "球心位置几何表达",
          latex: `O = \\frac{1}{2} (A + C_1)`,
          level: "important",
          note: "外接球球心即为长方体体对角线的中点"
        }
      );
      gaokaoPoints.push({
        text: "高考经典补体法（墙角模型）：凡具有三条两两垂直棱的三棱锥（如 $P-ABC$ 满足 $PA \\perp PB \\perp PC$），均可补形为长方体求外接球半径 $R = \\frac{\\sqrt{a^2+b^2+c^2}}{2}$。",
        importance: "gaokao"
      });
    } else if (shape === "regularPyramid") {
      const rBase = a / Math.sqrt(2);
      radius = regularPyramidCircumRadius(rBase, c);
      quantities.push(
        {
          label: "底面外接圆半径 r",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push(
        {
          name: "正棱锥外接球公式 (截面勾股法)",
          latex: `R = \\frac{r_{底}^2 + h^2}{2h} = \\frac{\\frac{a^2}{2} + h^2}{2h}`,
          level: "core",
          condition: "外接球球心位于过底面外心且垂直于底面的中心轴线上"
        },
        {
          name: "中心高线勾股方程",
          latex: `R^2 = r_{底}^2 + (h - R)^2`,
          level: "important"
        }
      );
      gaokaoPoints.push({
        text: "正棱锥外接球球心求法：球心在中心高线上，在包含高的轴截面直角三角形中利用勾股定理 $R^2 = r^2 + (h-R)^2$ 即可解出 $R = \\frac{r^2+h^2}{2h}$。",
        importance: "gaokao"
      });
    } else if (shape === "triangularPrism") {
      const rBase = Math.sqrt(a * a + b * b) / 2;
      radius = Math.sqrt(rBase * rBase + (c / 2) ** 2);
      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "底面外接圆半径",
          symbol: "r_{底}",
          value: rBase.toFixed(3),
          color: MATH_COLORS.primary
        },
        {
          label: "柱体高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "直棱柱外接球通用公式",
        latex: `R = \\sqrt{r_{底}^2 + \\left(\\frac{h}{2}\\right)^2}`,
        level: "core",
        note: "r_底 为底面多边形外接圆半径，h 为直棱柱高"
      });
      gaokaoPoints.push({
        text: "直棱柱外接球黄金法则：R² = r_底² + (h/2)²。若底面为直角三角形，斜边中点即为底面外心，r_底 = 斜边/2。",
        importance: "gaokao"
      });
    } else if (shape === "cone") {
      radius = coneCircumRadius(a, c);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "圆锥高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: Math.sqrt(a * a + c * c).toFixed(3),
          color: MATH_COLORS.secondary
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push(
        {
          name: "圆锥外接球公式 (轴截面法)",
          latex: `R = \\frac{r^2 + h^2}{2h} = \\frac{l^2}{2h}`,
          level: "core",
          note: "轴截面为底长 $2r$、腰长 $l$ 的等腰三角形，其外接圆半径即为圆锥外接球半径"
        },
        {
          name: "圆锥母线与半径高勾股关系",
          latex: `l = \\sqrt{r^2 + h^2}`,
          level: "important"
        }
      );
      gaokaoPoints.push({
        text: "旋转体切接问题降维法：过旋转轴作轴截面，圆锥外接球问题降维转化为轴截面三角形的外接圆问题，$R = \\frac{l^2}{2h}$。",
        importance: "gaokao"
      });
    } else {
      radius = Math.sqrt(a * a + (c / 2) ** 2);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "圆柱高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "外接球半径 R",
          symbol: "R",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "圆柱外接球公式",
        latex: `R = \\sqrt{r^2 + \\left(\\frac{h}{2}\\right)^2}`,
        level: "core",
        note: "圆柱轴截面为宽 $2r$、高 $h$ 的矩形，矩形对角线长的一半即为外接球半径"
      });
      gaokaoPoints.push({
        text: "圆柱外接球球心位于旋转轴的中点，轴截面矩形对角线半径 $R = \\sqrt{r^2 + (h/2)^2}$。",
        importance: "gaokao"
      });
    }
    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "外接球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary
      },
      {
        label: "外接球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent
      }
    );
  } else {
    if (shape === "cuboid") {
      radius = Math.min(a, b, c) / 2;
      const isCube = a === b && b === c;
      quantities.push(
        {
          label: "长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "宽 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "高 c",
          symbol: "c",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "最大可容纳球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "正方体内切球公式",
        latex: `r_{in} = \\frac{a}{2} \\quad (a = b = c \\text{ 时成立})`,
        level: "core",
        note: "一般长方体 (a ≠ b 或 b ≠ c) 不存在同时切 6 个面的内切球"
      });
      if (!isCube) {
        warnings.push({
          text: "当前长方体长宽高不相等 (a ≠ b ≠ c)，不存在同时与 6 个面相切的内切球！图中展示为最大内部相切球。",
          level: "warning"
        });
      }
    } else if (shape === "regularPyramid") {
      const hs = Math.sqrt(c * c + (a / 2) ** 2);
      const vSolid = 1 / 3 * a * a * c;
      const sTotal = a * a + 2 * a * hs;
      radius = 3 * vSolid / sTotal;
      quantities.push(
        {
          label: "底面边长 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "棱锥体积 V",
          symbol: "V_{棱锥}",
          value: vSolid.toFixed(3),
          color: MATH_COLORS.primary
        },
        {
          label: "全面积 S",
          symbol: "S_{全}",
          value: sTotal.toFixed(3),
          color: MATH_COLORS.secondary
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "等体积法求内切球公式",
        latex: `r_{in} = \\frac{3V_{几何体}}{S_{全面积}} = \\frac{a h}{a + 2\\sqrt{h^2 + \\frac{a^2}{4}}}`,
        level: "core",
        condition: "将多面体拆分为以各面为底、球心为顶点的锥体分割"
      });
      gaokaoPoints.push({
        text: "高考通用内切球神器：等体积法 r_{in} = 3V / S_{全}！适用于任意存在内切球的凸多面体和旋转体。",
        importance: "gaokao"
      });
    } else if (shape === "triangularPrism") {
      const rBaseIn = (a + b - Math.sqrt(a * a + b * b)) / 2;
      radius = Math.min(rBaseIn, c / 2);
      quantities.push(
        {
          label: "直角边 a",
          symbol: "a",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "直角边 b",
          symbol: "b",
          value: b,
          color: MATH_COLORS.paramSecondary
        },
        {
          label: "底面内切圆半径",
          symbol: "r_{底}",
          value: rBaseIn.toFixed(3),
          color: MATH_COLORS.primary
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "切球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "直三棱柱内切球存在条件",
        latex: `h = 2 r_{底in} = a + b - \\sqrt{a^2+b^2}`,
        level: "core",
        note: "只有当柱体高度等于底面内切圆直径时才存在内切球"
      });
      if (Math.abs(c - 2 * rBaseIn) > 0.1) {
        warnings.push({
          text: `当前高 h=${c} 不等于底面内切圆直径 2r=${(2 * rBaseIn).toFixed(2)}，三棱柱无法同时切上下底面与侧面！`,
          level: "warning"
        });
      }
    } else if (shape === "cone") {
      const l = Math.sqrt(a * a + c * c);
      radius = a * c / (a + l);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "母线长 l",
          symbol: "l",
          value: l.toFixed(3),
          color: MATH_COLORS.secondary
        },
        {
          label: "内切球半径 r",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "圆锥内切球公式 (轴截面法)",
        latex: `r_{in} = \\frac{r \\cdot h}{r + l} = \\frac{r \\cdot h}{r + \\sqrt{r^2+h^2}}`,
        level: "core",
        note: "在轴截面等腰三角形中，内切圆半径即为圆锥内切球半径"
      });
      gaokaoPoints.push({
        text: "圆锥内切球降维求解：轴截面为等腰三角形（底 2r，高 h，腰 l），内切圆半径 r_{in} = rh / (r+l)。",
        importance: "gaokao"
      });
    } else {
      radius = Math.min(a, c / 2);
      quantities.push(
        {
          label: "底面半径 r",
          symbol: "r",
          value: a,
          color: MATH_COLORS.paramPrimary
        },
        {
          label: "高 h",
          symbol: "h",
          value: c,
          color: MATH_COLORS.paramTertiary
        },
        {
          label: "切球半径",
          symbol: "r_{in}",
          value: radius.toFixed(3),
          color: MATH_COLORS.highlight
        }
      );
      theorems.push({
        name: "圆柱内切球存在条件",
        latex: `h = 2r`,
        level: "core",
        note: "当且仅当圆柱的高等于底面直径 (h = 2r) 时，才存在与上下底面和侧面均相切的内切球"
      });
      if (Math.abs(c - 2 * a) > 0.1) {
        warnings.push({
          text: `当前圆柱高 h=${c} 不等于底面直径 2r=${2 * a}，圆柱无法同时与上下底面和侧面相切！`,
          level: "warning"
        });
      }
    }
    const V = sphereVolume(radius);
    const S = sphereSurfaceArea(radius);
    quantities.push(
      {
        label: "内切球体积 V",
        symbol: "V_{球}",
        value: V.toFixed(3),
        color: MATH_COLORS.secondary
      },
      {
        label: "内切球表面积 S",
        symbol: "S_{球}",
        value: S.toFixed(3),
        color: MATH_COLORS.accent
      }
    );
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function buildRotationBodyPanel(params) {
  const shape = params.shape ?? "rectangle";
  const r1 = params.r1 ?? 1.5;
  const r2 = params.r2 ?? 0.8;
  const height = params.height ?? 3;
  const quantities = [];
  const theorems = [];
  if (shape === "rectangle") {
    const sSide = 2 * Math.PI * r1 * height;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + 2 * sBase;
    const sAxial = 2 * r1 * height;
    const v = Math.PI * r1 ** 2 * height;
    quantities.push(
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent
      },
      {
        label: "全面积",
        symbol: "S_{全}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.complexNum
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "圆柱侧面积与全面积",
        latex: "S_{侧}=2\\pi r h,\\; S_{全}=2\\pi r(r+h)",
        level: "core"
      },
      {
        name: "圆柱体积公式",
        latex: "V=\\pi r^2 h = S_{底} h",
        level: "core"
      },
      {
        name: "轴截面特征",
        latex: "S_{轴}=2rh,\\; d=\\sqrt{4r^2+h^2}",
        level: "important",
        note: "轴截面为矩形，长 2r，高 h"
      }
    );
  } else if (shape === "rightTriangle") {
    const l = Math.sqrt(r1 ** 2 + height ** 2);
    const angleDeg = r1 / l * 360;
    const sSide = Math.PI * r1 * l;
    const sBase = Math.PI * r1 ** 2;
    const sTotal = sSide + sBase;
    const sAxial = r1 * height;
    const v = Math.PI * r1 ** 2 * height / 3;
    quantities.push(
      {
        label: "母线长",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum
      },
      {
        label: "展开角",
        symbol: "\\alpha",
        value: `${angleDeg.toFixed(1)}°`,
        color: MATH_COLORS.sequenceCobweb
      },
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent
      },
      {
        label: "全面积",
        symbol: "S_{全}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.secondary
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "圆锥母线与侧面积",
        latex: "l=\\sqrt{r^2+h^2},\\; S_{侧}=\\pi r l",
        level: "core"
      },
      {
        name: "圆锥全面积与体积",
        latex: "S_{全}=\\pi r(l+r),\\; V=\\dfrac{1}{3}\\pi r^2 h",
        level: "core"
      },
      {
        name: "侧面展开图圆心角",
        latex: "\\alpha = \\dfrac{r}{l} \\cdot 360^\\circ",
        level: "important",
        condition: "高考侧面上蚂蚁爬行最速折线（化曲为直）核心公式"
      }
    );
  } else if (shape === "rightTrapezoid") {
    const l = Math.sqrt((r1 - r2) ** 2 + height ** 2);
    const sSide = Math.PI * (r1 + r2) * l;
    const sTop = Math.PI * r2 ** 2;
    const sBottom = Math.PI * r1 ** 2;
    const sTotal = sSide + sTop + sBottom;
    const sAxial = (r1 + r2) * height;
    const v = Math.PI * height * (r1 ** 2 + r1 * r2 + r2 ** 2) / 3;
    quantities.push(
      {
        label: "母线长",
        symbol: "l",
        value: l.toFixed(2),
        color: MATH_COLORS.complexNum
      },
      {
        label: "轴截面积",
        symbol: "S_{轴}",
        value: sAxial.toFixed(2),
        color: MATH_COLORS.primary
      },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: sSide.toFixed(2),
        color: MATH_COLORS.accent
      },
      {
        label: "全面积",
        symbol: "S_{全}",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.secondary
      },
      {
        label: "体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "圆台母线与侧面积",
        latex: "l=\\sqrt{(r_1-r_2)^2+h^2},\\; S_{侧}=\\pi(r_1+r_2)l",
        level: "core"
      },
      {
        name: "圆台体积公式",
        latex: "V=\\dfrac{1}{3}\\pi h(r_1^2+r_1r_2+r_2^2)",
        level: "core"
      },
      {
        name: "柱锥台体积统一公式",
        latex: "V=\\dfrac{1}{3}h(S_1+\\sqrt{S_1 S_2}+S_2)",
        level: "important",
        note: "r₂=r₁ (S₁=S₂) 时演化为圆柱 V=Sh；r₂=0 (S₁=0) 时演化为圆锥 V=⅓Sh"
      }
    );
  } else {
    const sGreatCircle = Math.PI * r1 ** 2;
    const sTotal = 4 * Math.PI * r1 ** 2;
    const v = 4 / 3 * Math.PI * r1 ** 3;
    quantities.push(
      {
        label: "截面大圆面积",
        symbol: "S_{大圆}",
        value: sGreatCircle.toFixed(2),
        color: MATH_COLORS.primary
      },
      {
        label: "球表面积",
        symbol: "S",
        value: sTotal.toFixed(2),
        color: MATH_COLORS.accent
      },
      {
        label: "球体积",
        symbol: "V",
        value: v.toFixed(2),
        color: MATH_COLORS.highlight
      }
    );
    theorems.push(
      {
        name: "球表面积与体积",
        latex: "S=4\\pi R^2,\\; V=\\dfrac{4}{3}\\pi R^3",
        level: "core"
      },
      {
        name: "球截面圆性质定理",
        latex: "R^2 = r_{截}^2 + d^2",
        level: "important",
        note: "球心到截面圆圆心的距离为 d，截面圆半径为 r_截，球半径为 R"
      },
      {
        name: "斜二测画法面积转换定理",
        latex: "S_{\\text{直观图}} = \\frac{\\sqrt{2}}{4} S_{\\text{原图形}}",
        level: "important",
        note: "斜二测画法规则：x' 轴与 y' 轴夹角为 45° 或 135°，平行于 x 轴长度不变，平行于 y 轴长度减半"
      }
    );
  }
  const gaokaoPoints = [
    {
      text: "斜二测画法（直观图）：① 横轴 x 长度不变，纵轴 y 长度折半；② 夹角为 45° 或 135°；③ 原平面图形面积与直观图面积满足 S_直观 = (√2 / 4) S_原。",
      importance: "gaokao"
    },
    {
      text: "旋转体由平面图形绕轴旋转 360° 形成。轴截面（矩形、等腰三角形、等腰梯形、大圆）是把 3D 旋转体问题降维至 2D 平面图形求解的核心钥匙。",
      importance: "core"
    },
    {
      text: "侧面展开图（化曲为直）：求解圆锥/圆柱侧面曲面上两点间最短距离（蚂蚁爬行路径）时，必须先将侧面沿母线展开，圆锥展开为扇形（圆心角 α = r/l · 360°）。",
      importance: "gaokao"
    },
    {
      text: "柱锥台公式统一思想：熟练掌握台体体积公式 V = ⅓h(S₁ + √(S₁S₂) + S₂)。理解 r₂=r₁（圆柱）与 r₂=0（圆锥）时的极限演解。",
      importance: "gaokao"
    },
    {
      text: "切接问题与轴截面：旋转体与球的内切/外接模型是高考大题热点，通常通过轴截面中圆内接/切多边形几何关系直接求出球心与半径。",
      importance: "hard"
    }
  ];
  const warnings = [];
  if (shape === "rightTrapezoid") {
    if (Math.abs(r1 - r2) < 0.05) {
      warnings.push({
        text: "上、下底半径接近相等 (r₂ ≈ r₁)，圆台演变/退化为圆柱！",
        level: "warning"
      });
    } else if (r2 < 0.15) {
      warnings.push({
        text: "上底半径接近 0 (r₂ ≈ 0)，圆台演变/退化为圆锥！",
        level: "warning"
      });
    }
  }
  if (r1 < 0.15 || height < 0.15) {
    warnings.push({
      text: "几何尺寸接近 0，旋转体退化为线段或点！",
      level: "warning"
    });
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function computeTripleProduct(a, b, c) {
  return dot(cross(a, b), c);
}
function solveBasisCoefficients(a, b, c, P) {
  const det = computeTripleProduct(a, b, c);
  if (Math.abs(det) < 1e-5) {
    return { x: 0, y: 0, z: 0, isValid: false, det };
  }
  const detX = computeTripleProduct(P, b, c);
  const detY = computeTripleProduct(a, P, c);
  const detZ = computeTripleProduct(a, b, P);
  return {
    x: detX / det,
    y: detY / det,
    z: detZ / det,
    isValid: true,
    det
  };
}
function calculateParallelepipedVertices(a, b, c, x, y, z) {
  const xa = { x: x * a.x, y: x * a.y, z: x * a.z };
  const yb = { x: y * b.x, y: y * b.y, z: y * b.z };
  const zc = { x: z * c.x, y: z * c.y, z: z * c.z };
  const xy = { x: xa.x + yb.x, y: xa.y + yb.y, z: xa.z + yb.z };
  const xz = { x: xa.x + zc.x, y: xa.y + zc.y, z: xa.z + zc.z };
  const yz = { x: yb.x + zc.x, y: yb.y + zc.y, z: yb.z + zc.z };
  const P = {
    x: xa.x + yb.x + zc.x,
    y: xa.y + yb.y + zc.y,
    z: xa.z + yb.z + zc.z
  };
  return {
    O: { x: 0, y: 0, z: 0 },
    xa,
    yb,
    zc,
    xy,
    xz,
    yz,
    P
  };
}
function checkCoplanarCondition(x, y, z) {
  const sum = x + y + z;
  const isCoplanar = Math.abs(sum - 1) < 0.02;
  const isInsideTriangle = isCoplanar && x >= -0.01 && y >= -0.01 && z >= -0.01;
  const isCentroid = isCoplanar && Math.abs(x - 1 / 3) < 0.04 && Math.abs(y - 1 / 3) < 0.04 && Math.abs(z - 1 / 3) < 0.04;
  return {
    sum,
    isCoplanar,
    isInsideTriangle,
    isCentroid
  };
}
function buildVector3DBasisPanel(params, extraConfig) {
  const x = params.x ?? 1.5;
  const y = params.y ?? 1.2;
  const z = params.z ?? 1.8;
  const cz = params.cz ?? 2;
  const mode = extraConfig?.mode ?? "parallelepiped";
  const modeLabelMap = {
    parallelepiped: "平行六面体分解",
    coplanar: "四点共面探究 (x+y+z=1)",
    degeneration: "基底共面检验"
  };
  const vecA = extraConfig?.vecA ?? { x: 2, y: 0, z: 0 };
  const vecB = extraConfig?.vecB ?? { x: 0.5, y: 2, z: 0 };
  const vecC = extraConfig?.vecC ?? { x: 0, y: 0.5, z: cz };
  const decomposition = solveBasisCoefficients(vecA, vecB, vecC, {
    x: x * vecA.x + y * vecB.x + z * vecC.x,
    y: x * vecA.y + y * vecB.y + z * vecC.y,
    z: x * vecA.z + y * vecB.z + z * vecC.z
  });
  const coplanarInfo = checkCoplanarCondition(x, y, z);
  const quantities = [
    {
      label: "当前教学模式",
      symbol: "\\text{Mode}",
      value: modeLabelMap[mode] ?? "基底分解",
      color: MATH_COLORS.primary
    },
    {
      label: "基底线性无关性",
      symbol: "(\\vec{a}\\times\\vec{b})\\cdot\\vec{c}",
      value: decomposition.isValid ? `正常 (det = ${decomposition.det.toFixed(2)})` : "退化失效 (共面!)",
      color: decomposition.isValid ? MATH_COLORS.primary : MATH_COLORS.secondary
    },
    {
      label: "分解向量表达式",
      symbol: "\\vec{OP}",
      value: `\\color{#EF4444}{${x.toFixed(1)}}\\vec{a} + \\color{#D97706}{${y.toFixed(1)}}\\vec{b} + \\color{#059669}{${z.toFixed(1)}}\\vec{c}`,
      color: MATH_COLORS.highlight
    },
    {
      label: "系数之和 x + y + z",
      symbol: "x + y + z",
      value: Number(coplanarInfo.sum.toFixed(2)),
      color: coplanarInfo.isCoplanar ? MATH_COLORS.highlight : MATH_COLORS.primary
    }
  ];
  if (coplanarInfo.isCoplanar) {
    quantities.push({
      label: "四点共面状态",
      symbol: "P \\in (ABC)",
      value: coplanarInfo.isCentroid ? "位于 △ABC 重心处 (x=y=z=1/3)" : coplanarInfo.isInsideTriangle ? "位于 △ABC 内部及边界" : "位于 (ABC) 延伸平面上",
      color: MATH_COLORS.highlight
    });
  }
  const theorems = [
    {
      name: "空间向量基本定理",
      latex: `\\forall \\vec{p}, \\; \\exists! (\\color{#EF4444}{x},\\color{#D97706}{y},\\color{#059669}{z}), \\; \\text{使得} \\; \\vec{p} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c}`,
      level: "core",
      condition: "a, b, c 是空间中三个不共面的基底向量"
    },
    {
      name: "共面向量定理 (四点共面条件)",
      latex: `\\vec{OP} = \\color{#EF4444}{x}\\vec{OA} + \\color{#D97706}{y}\\vec{OB} + \\color{#059669}{z}\\vec{OC} \\quad (\\color{#EF4444}{x} + \\color{#D97706}{y} + \\color{#059669}{z} = 1)`,
      level: "core",
      condition: "当且仅当 x + y + z = 1 时，点 P 与 A, B, C 四点共面"
    }
  ];
  const gaokaoPoints = [
    {
      text: "高考选填题核心考点：若四点 P, A, B, C 共面，对任意空间基点 O，向量分解系数和必满足 x + y + z = 1！常用于线面平行判定与共面交点解算。",
      importance: "gaokao"
    },
    {
      text: "高考立体几何解题技巧：当 x, y, z ≥ 0 且 x+y+z=1 时，P 必落在 △ABC 凸多边形截面内部；当 x=y=z=1/3 时，P 恰为 △ABC 的重心！",
      importance: "gaokao"
    }
  ];
  const warnings = [];
  if (!decomposition.isValid || Math.abs(cz) < 0.05) {
    warnings.push({
      text: "🚨 基底向量 a, b, c 共面 (det ≈ 0)！空间基底定理失效，任意 3D 向量无法被唯一分解！",
      level: "warning"
    });
  }
  if (Math.abs(z) < 0.05 && decomposition.isValid) {
    warnings.push({
      text: "当前 z = 0，向量 OP 转化为 x a + y b，退化为与基底 a, b 共面的二维向量！",
      level: "warning"
    });
  }
  if (coplanarInfo.isCoplanar) {
    warnings.push({
      text: "💡 触发高考核心条件：系数和 x + y + z = 1！点 P 落在基底端点 A, B, C 决定的截面 (ABC) 内！",
      level: "warning"
    });
  }
  return { quantities, theorems, gaokaoPoints, warnings };
}
function calcArithmeticSequence(a1, d, N) {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(d)) {
    return {
      isValid: false,
      errorMsg: "参数无效，项数 N 须大于 0",
      terms: [],
      a1,
      d,
      N,
      zeroPointN: null,
      maxSnInfo: null,
      lineFn: () => 0,
      parabolaFn: () => 0
    };
  }
  const terms = [];
  let currentSum = 0;
  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    currentSum += an;
    terms.push({ n, an, Sn: currentSum });
  }
  const lineFn = (x) => d * x + (a1 - d);
  const parabolaFn = (x) => 0.5 * d * x * x + (a1 - 0.5 * d) * x;
  let zeroPointN = null;
  if (Math.abs(d) > 1e-9) {
    const zN = 1 - a1 / d;
    if (zN >= 1 && zN <= N) {
      zeroPointN = zN;
    }
  }
  let bestN = 1;
  let bestSn = terms[0].Sn;
  if (d < 0) {
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn > bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  } else if (d > 0) {
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].Sn < bestSn) {
        bestSn = terms[i].Sn;
        bestN = terms[i].n;
      }
    }
  }
  return {
    isValid: true,
    terms,
    a1,
    d,
    N,
    zeroPointN,
    maxSnInfo: { nMax: bestN, maxSn: bestSn },
    lineFn,
    parabolaFn
  };
}
function calcGeometricSequence(a1, q, N) {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(q)) {
    return {
      isValid: false,
      errorMsg: "参数无效",
      terms: [],
      a1,
      q,
      N,
      limitSum: null,
      expFn: null
    };
  }
  const terms = [];
  let currentSum = 0;
  let currentAn = a1;
  for (let n = 1; n <= N; n++) {
    if (n === 1) {
      currentAn = a1;
    } else {
      currentAn = currentAn * q;
    }
    currentSum += currentAn;
    terms.push({ n, an: currentAn, Sn: currentSum });
  }
  let limitSum = null;
  if (Math.abs(q) < 1) {
    limitSum = a1 / (1 - q);
  }
  let expFn = null;
  if (q > 0) {
    expFn = (x) => a1 * Math.pow(q, x - 1);
  }
  return {
    isValid: true,
    terms,
    a1,
    q,
    N,
    limitSum,
    expFn
  };
}
function calcArithGeoSplit(a1, d, q, N) {
  const terms = [];
  let currentTn = 0;
  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    const bn = Math.pow(q, n - 1);
    const cn = an * bn;
    currentTn += cn;
    terms.push({ n, an, bn, cn, Tn: currentTn });
  }
  return {
    isValid: true,
    terms,
    a1,
    d,
    q,
    N
  };
}
function calcTelescoping(N) {
  const terms = [];
  let currentTn = 0;
  for (let n = 1; n <= N; n++) {
    const cn = 1 / (n * (n + 1));
    const partA = 1 / n;
    const partB = 1 / (n + 1);
    currentTn += cn;
    terms.push({ n, cn, partA, partB, Tn: currentTn });
  }
  return {
    isValid: true,
    terms,
    N,
    limitSum: 1
  };
}
function calcGroupedSequence(a1, d, q, N) {
  const terms = [];
  let curSan = 0;
  let curSbn = 0;
  for (let n = 1; n <= N; n++) {
    const an = a1 + (n - 1) * d;
    const bn = Math.pow(q, n - 1);
    const cn = an + bn;
    curSan += an;
    curSbn += bn;
    terms.push({
      n,
      an,
      bn,
      cn,
      San: curSan,
      Sbn: curSbn,
      Tn: curSan + curSbn
    });
  }
  return {
    isValid: true,
    terms,
    a1,
    d,
    q,
    N
  };
}
function calcCrossTelescoping(N) {
  const terms = [];
  let currentTn = 0;
  for (let n = 1; n <= N; n++) {
    const cn = 1 / (n * (n + 2));
    const partA = 0.5 / n;
    const partB = 0.5 / (n + 2);
    currentTn += cn;
    terms.push({ n, cn, partA, partB, Tn: currentTn });
  }
  return {
    isValid: true,
    terms,
    N,
    limitSum: 0.75
    // 0.5 * (1 + 1/2) = 0.75
  };
}
function calcOddEvenSequence(N) {
  const terms = [];
  let currentTn = 0;
  for (let n = 1; n <= N; n++) {
    const cn = (n % 2 === 0 ? 1 : -1) * n;
    currentTn += cn;
    const pairSum = n % 2 === 0 ? terms[n - 2].cn + cn : null;
    terms.push({
      n,
      cn,
      pairSum,
      Tn: currentTn
    });
  }
  return {
    isValid: true,
    terms,
    N
  };
}
function calcLinearRecurrence(a1, p, q, N) {
  if (N <= 0 || !Number.isFinite(a1) || !Number.isFinite(p) || !Number.isFinite(q)) {
    return {
      isValid: false,
      terms: [],
      a1,
      p,
      q,
      N,
      fixedPoint: null,
      isDegenerateArith: false,
      cobwebPoints: []
    };
  }
  const isDegenerateArith = Math.abs(p - 1) < 1e-9;
  const fixedPoint = isDegenerateArith ? null : q / (1 - p);
  const terms = [];
  const cobwebPoints = [];
  let currentAn = a1;
  let currentSum = 0;
  cobwebPoints.push({ x: currentAn, y: currentAn });
  for (let n = 1; n <= N; n++) {
    const bn = fixedPoint !== null ? currentAn - fixedPoint : currentAn;
    currentSum += currentAn;
    terms.push({ n, an: currentAn, bn, Sn: currentSum });
    const nextAn = p * currentAn + q;
    cobwebPoints.push({ x: currentAn, y: nextAn });
    cobwebPoints.push({ x: nextAn, y: nextAn });
    currentAn = nextAn;
  }
  return {
    isValid: true,
    terms,
    a1,
    p,
    q,
    N,
    fixedPoint,
    isDegenerateArith,
    cobwebPoints
  };
}
function calcAccumulationRecurrence(a1, stepType, stepParam, N) {
  const terms = [];
  let currentAn = a1;
  let currentSum = 0;
  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const deltaK = stepParam * n;
    terms.push({ n, deltaK, an: currentAn, Sn: currentSum });
    currentAn += deltaK;
  }
  return {
    isValid: true,
    terms,
    a1,
    stepType,
    stepParam,
    N
  };
}
function calcMultiplicationRecurrence(a1, multType, N) {
  const terms = [];
  let currentAn = a1;
  let currentSum = 0;
  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const ratioK = n / (n + 1);
    terms.push({ n, ratioK, an: currentAn, Sn: currentSum });
    currentAn *= ratioK;
  }
  return {
    isValid: true,
    terms,
    a1,
    multType,
    N
  };
}
function calcReciprocalRecurrence(a1, A, B, C, N) {
  const terms = [];
  let currentAn = a1;
  let currentSum = 0;
  for (let n = 1; n <= N; n++) {
    currentSum += currentAn;
    const bn = Math.abs(currentAn) > 1e-9 ? 1 / currentAn : NaN;
    terms.push({ n, an: currentAn, bn, Sn: currentSum });
    const denom = B * currentAn + C;
    if (Math.abs(denom) < 1e-9) {
      currentAn = NaN;
    } else {
      currentAn = A * currentAn / denom;
    }
  }
  return {
    isValid: true,
    terms,
    a1,
    A,
    B,
    C,
    N,
    isReciprocalLinear: Math.abs(A - C) < 1e-9
    // 当 A=C 时，倒数 bn 为等差数列
  };
}
function calcSecondOrderRecurrence(a1, a2, p, q, N) {
  const delta = p * p + 4 * q;
  let r1 = 0;
  let r2 = 0;
  if (delta >= 0) {
    r1 = (p + Math.sqrt(delta)) / 2;
    r2 = (p - Math.sqrt(delta)) / 2;
  } else {
    r1 = p / 2;
    r2 = p / 2;
  }
  const terms = [];
  let anPrev = a1;
  let anCurr = a2;
  let currentSum = 0;
  for (let n = 1; n <= N; n++) {
    if (n === 1) {
      currentSum += a1;
      const bn = a2 - r1 * a1;
      terms.push({ n: 1, an: a1, bn, Sn: currentSum });
    } else if (n === 2) {
      currentSum += a2;
      const anNext = p * a2 + q * a1;
      const bn = anNext - r1 * a2;
      terms.push({ n: 2, an: a2, bn, Sn: currentSum });
    } else {
      const anNext = p * anCurr + q * anPrev;
      currentSum += anNext;
      const bnNext = p * anNext + q * anCurr - r1 * anNext;
      terms.push({ n, an: anNext, bn: bnNext, Sn: currentSum });
      anPrev = anCurr;
      anCurr = anNext;
    }
  }
  return {
    isValid: true,
    terms,
    a1,
    a2,
    p,
    q,
    N,
    r1,
    r2
  };
}
function buildSequencePanel(params, config) {
  const activeMode = config?.activeMode ?? "arithmetic";
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.round(params.N ?? 8);
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  if (activeMode === "arithmetic") {
    const res = calcArithmeticSequence(a1, d, N);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;
    const constTerm = a1 - d;
    const constSign = constTerm >= 0 ? `+ ${constTerm}` : `- ${Math.abs(constTerm)}`;
    const anLatex = Math.abs(d) < 1e-9 ? `${a1}` : `\\color{${MATH_COLORS.paramSecondary}}{${d}}n ${constSign}`;
    quantities.push({
      label: `通项 a_${N} (a_n = ${anLatex})`,
      value: `a_${N} = ${aN.toFixed(2)}`,
      color: MATH_COLORS.sequence
    });
    quantities.push({
      label: `前 ${N} 项和 S_${N}`,
      value: `S_${N} = ${SN.toFixed(2)}`,
      color: MATH_COLORS.sequenceSum
    });
    if (res.maxSnInfo) {
      quantities.push({
        label: d < 0 ? "S_n 最大值项" : "S_n 极值项",
        value: `n = ${res.maxSnInfo.nMax}, S_max = ${res.maxSnInfo.maxSn.toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight
      });
    }
    theorems.push({
      name: "等差数列通项与求和定理",
      latex: `a_n = a_1 + (n-1)d, \\quad S_n = \\frac{d}{2}n^2 + \\left(a_1 - \\frac{d}{2}\\right)n`,
      condition: "d 为常数，n ∈ N*"
    });
    theorems.push({
      name: "等差中项与下标性质",
      latex: `若 \\ m+n = p+q \\implies a_m + a_n = a_p + a_q = 2a_{\\frac{m+n}{2}}`,
      condition: "在对称中点处函数值具有算术平均性质"
    });
    gaokaoPoints.push({
      text: "数形结合：等差数列 a_n 对应直线 y=dx+(a1-d)，S_n 对应二次函数抛物线。当 d<0 且 a1>0 时，S_n 存在最大值，极值在 a_n 由正转负临界点处取得。",
      importance: "gaokao"
    });
    if (Math.abs(d) < 1e-9) {
      warnings.push({
        text: "d = 0 (退化常数列)：公差 d 为 0 时，通项 a_n = a_1 为常数，前 n 项和 S_n = n · a_1 呈线性增长。",
        level: "warning"
      });
    }
  } else if (activeMode === "geometric") {
    const res = calcGeometricSequence(a1, q, N);
    const aN = res.terms[N - 1]?.an ?? 0;
    const SN = res.terms[N - 1]?.Sn ?? 0;
    quantities.push({
      label: `通项 a_${N} (a_n = a_1 · q^{n-1})`,
      value: `a_${N} = ${aN.toFixed(4)}`,
      color: MATH_COLORS.sequence
    });
    quantities.push({
      label: `前 ${N} 项和 S_${N}`,
      value: `S_${N} = ${SN.toFixed(4)}`,
      color: MATH_COLORS.sequenceSum
    });
    if (res.limitSum !== null) {
      quantities.push({
        label: "无穷递缩和 S_∞",
        value: `S_∞ = ${res.limitSum.toFixed(4)}`,
        color: MATH_COLORS.sequenceHighlight
      });
    }
    theorems.push({
      name: "等比数列通项与求和定理",
      latex: `a_n = a_1 q^{n-1}, \\quad S_n = \\begin{cases} \\frac{a_1(1-q^n)}{1-q}, & q \\neq 1 \\\\ n a_1, & q = 1 \\end{cases}`,
      condition: "a_1 ≠ 0, q ≠ 0"
    });
    theorems.push({
      name: "等比中项性质",
      latex: `a_n^2 = a_{n-1} \\cdot a_{n+1} \\quad (n \\ge 2)`,
      condition: "同号连续三项的几何平均值"
    });
    gaokaoPoints.push({
      text: "公比 q 的分类讨论：当 q>1 时呈指数爆发增长；0<q<1 时指数衰减收敛；q<0 时正负交替震荡。高考常考 q=1 与 q≠1 的分类讨论。",
      importance: "gaokao"
    });
    if (Math.abs(q - 1) < 1e-9) {
      warnings.push({
        text: "q = 1 (公式退化)：公比 q=1 时不能使用 S_n = a1(1-q^n)/(1-q)，此时 S_n = n · a_1。",
        level: "warning"
      });
    } else if (Math.abs(q) < 1e-9) {
      warnings.push({
        text: "q = 0 (非等比数列)：等比数列定义要求公比 q ≠ 0 且首项 a1 ≠ 0。",
        level: "danger"
      });
    }
  } else if (activeMode === "models") {
    const subModel = config?.subModel ?? "arith-geo";
    if (subModel === "arith-geo") {
      const res = calcArithGeoSplit(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      quantities.push({
        label: "混合通项 c_n = a_n · b_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum
      });
      theorems.push({
        name: "错位相减法原理",
        latex: `(1-q)T_n = a_1 + d \\sum_{k=2}^n q^{k-1} - a_n q^n`,
        condition: "适用于等差与等比相乘构成的数列"
      });
      gaokaoPoints.push({
        text: "高考压轴题必考：错位相减对齐与消去。将 T_n 乘以公比 q 后整体右移一位，中间 n-1 项转化为纯等比求和，注意末项 - a_n · q^n 的符号与系数。",
        importance: "hard"
      });
    } else if (subModel === "telescoping") {
      const res = calcTelescoping(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      quantities.push({
        label: "裂项通项 c_n = 1/(n(n+1))",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum
      });
      quantities.push({
        label: "极限值 lim T_N",
        value: "1.0000",
        color: MATH_COLORS.sequenceHighlight
      });
      theorems.push({
        name: "裂项相消法原理",
        latex: `\\sum_{k=1}^n \\left( \\frac{1}{k} - \\frac{1}{k+1} \\right) = 1 - \\frac{1}{n+1}`,
        condition: "通项拆分为前后相消的两项之差"
      });
      gaokaoPoints.push({
        text: "高考常考：裂项相消首尾对销。中间项 (+1/2 - 1/2 + 1/3 - 1/3 ...) 两两对消，最终仅保留首项 1 与尾项 -1/(N+1)。",
        importance: "gaokao"
      });
    } else if (subModel === "cross-telescoping") {
      const res = calcCrossTelescoping(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      quantities.push({
        label: "跨项裂项通项 c_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(4)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(4)}`,
        color: MATH_COLORS.sequenceSum
      });
      quantities.push({
        label: "极限值 lim T_N",
        value: "0.7500",
        color: MATH_COLORS.sequenceHighlight
      });
      theorems.push({
        name: "跨项裂项相消原理",
        latex: `\\sum_{k=1}^n \\frac{1}{k(k+2)} = \\frac{1}{2}\\left( 1 + \\frac{1}{2} - \\frac{1}{n+1} - \\frac{1}{n+2} \\right)`,
        condition: "分母差为 2 时，相消后保留首部 2 项与尾部 2 项"
      });
      gaokaoPoints.push({
        text: "高考防错陷阱：分母差为 k 时，系数须乘以 1/k，且首尾各保留 k 项不被消去。",
        importance: "hard"
      });
    } else if (subModel === "grouped") {
      const res = calcGroupedSequence(a1, d, q, N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      quantities.push({
        label: "复合通项 c_n = a_n + b_n",
        value: `c_${N} = ${(res.terms[N - 1]?.cn ?? 0).toFixed(2)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN.toFixed(2)}`,
        color: MATH_COLORS.sequenceSum
      });
      theorems.push({
        name: "分组求和法原理",
        latex: `T_n = \\sum (a_k + b_k) = \\sum a_k + \\sum b_k = S_n^{(a)} + S_n^{(b)}`,
        condition: "通项可拆解为两个已知常见求和数列之和"
      });
      gaokaoPoints.push({
        text: "高考基础必备：拆项分组。将复合通项拆分为等差数列与等比数列，分别套用各自的求和公式相加。",
        importance: "basic"
      });
    } else if (subModel === "odd-even") {
      const res = calcOddEvenSequence(N);
      const TN = res.terms[N - 1]?.Tn ?? 0;
      quantities.push({
        label: "交替通项 c_n = (-1)^n · n",
        value: `c_${N} = ${res.terms[N - 1]?.cn ?? 0}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `前 ${N} 项和 T_${N}`,
        value: `T_${N} = ${TN}`,
        color: MATH_COLORS.sequenceSum
      });
      theorems.push({
        name: "奇偶并项求和原理",
        latex: `c_{2k-1} + c_{2k} = -(2k-1) + 2k = 1`,
        condition: "正负交替或分段数列，相邻奇偶两项合并为常数"
      });
      gaokaoPoints.push({
        text: "高考高频思想：奇偶并项。相邻奇数项与偶数项两两组合，每对合并为常数 1，将 n 项求和转化为 n/2 组常数累加。",
        importance: "gaokao"
      });
    }
  } else if (activeMode === "recurrence") {
    const subModel = config?.subModel ?? "linear-pan";
    if (subModel === "linear-pan") {
      const res = calcLinearRecurrence(a1, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;
      quantities.push({
        label: `原数列第 ${N} 项 a_${N}`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence
      });
      if (res.fixedPoint !== null) {
        quantities.push({
          label: "不动点 c = q / (1 - p)",
          value: `c = ${res.fixedPoint.toFixed(2)}`,
          color: MATH_COLORS.sequenceHighlight
        });
        quantities.push({
          label: `平移等比数列 b_${N} (b_n = a_n - c)`,
          value: `b_${N} = ${bN.toFixed(2)}`,
          color: MATH_COLORS.paramSecondary
        });
        theorems.push({
          name: "待定系数法 (一阶线性递推构造)",
          latex: `a_{n+1} - c = p(a_n - c) \\implies c = \\frac{q}{1-p} \\quad (p \\neq 1)`,
          condition: "两边减去不动点 c，转化为公比为 p 的等比数列"
        });
        theorems.push({
          name: "通项公式推导",
          latex: `a_n = (a_1 - c) p^{n-1} + c`,
          condition: `a_1=${a1}, p=${p_rec}, c=${res.fixedPoint.toFixed(2)}`
        });
      } else {
        theorems.push({
          name: "退化等差数列 (p = 1)",
          latex: `a_{n+1} = a_n + q \\implies a_n = a_1 + (n-1)q`,
          condition: "p = 1 时递推关系化为标准等差数列"
        });
        warnings.push({
          text: "p = 1 (公式退化)：此时不动点 c 不存在，递推关系退化为公差为 q 的等差数列。",
          level: "warning"
        });
      }
      gaokaoPoints.push({
        text: "高考第一大题常考：待定系数法求通项。令 a_{n+1}+x = p(a_n+x)，展开对比系数得 x = q/(1-p)，构造等比数列 {a_n + x}。图形上表现为蛛网图向不动点 (c,c) 迭代收敛或发散。",
        importance: "gaokao"
      });
    } else if (subModel === "accumulation") {
      const res = calcAccumulationRecurrence(a1, "linear", d, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      quantities.push({
        label: `通项 a_${N} (a_n = a_1 + \\sum f(k))`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `末阶增量 \\Delta a_{${N - 1}}`,
        value: `\\Delta a = ${(res.terms[N - 1]?.deltaK ?? 0).toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight
      });
      theorems.push({
        name: "累加法原理",
        latex: `a_n = a_1 + \\sum_{k=1}^{n-1} (a_{k+1} - a_k) = a_1 + \\sum_{k=1}^{n-1} f(k)`,
        condition: "已知递推关系 a_{n+1} - a_n = f(n) 且 f(n) 可求和"
      });
      gaokaoPoints.push({
        text: "高考解答题高频：累加法。写出 n-1 个递推式纵向相加，左侧中间项全消，右侧套用 f(n) 的求和公式（如等差、等比或二次式）。",
        importance: "gaokao"
      });
    } else if (subModel === "multiplication") {
      const res = calcMultiplicationRecurrence(a1, "n_over_n1", N);
      const aN = res.terms[N - 1]?.an ?? 0;
      quantities.push({
        label: `通项 a_${N} (a_n = a_1 \\prod f(k))`,
        value: `a_${N} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence
      });
      theorems.push({
        name: "累乘法原理",
        latex: `a_n = a_1 \\cdot \\frac{a_2}{a_1} \\cdot \\frac{a_3}{a_2} \\cdots \\frac{a_n}{a_{n-1}} = a_1 \\prod_{k=1}^{n-1} f(k)`,
        condition: "已知递推关系 a_{n+1} / a_n = f(n) 且 f(n) 可相消或连乘"
      });
      gaokaoPoints.push({
        text: "高考技巧：累乘法。写出 n-1 个比值式纵向相乘，两两对销只余 a_n / a_1，右侧化简为多项式或阶乘形式。",
        importance: "gaokao"
      });
    } else if (subModel === "reciprocal") {
      const res = calcReciprocalRecurrence(a1, coefA, coefB, coefC, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      const bN = res.terms[N - 1]?.bn ?? 0;
      quantities.push({
        label: `原通项 a_${N}`,
        value: Number.isNaN(aN) ? "发散/无定义" : `a_${N} = ${aN.toFixed(4)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: `倒数构造项 b_${N} (b_n = 1/a_n)`,
        value: Number.isNaN(bN) ? "无定义" : `b_${N} = ${bN.toFixed(4)}`,
        color: MATH_COLORS.paramSecondary
      });
      theorems.push({
        name: "倒数构造法 (分式递推)",
        latex: `a_{n+1} = \\frac{A a_n}{B a_n + C} \\implies \\frac{1}{a_{n+1}} = \\frac{C}{A} \\cdot \\frac{1}{a_n} + \\frac{B}{A}`,
        condition: "分式递推取倒数，转化为一阶线性递推 b_{n+1} = p b_n + q"
      });
      gaokaoPoints.push({
        text: "高考难题突破：取倒数构造。当递推式分子为单项 a_n、分母为一次式时，取倒数令 b_n = 1/a_n，转化为构造等差/等比数列求出 b_n，再倒数回 a_n。",
        importance: "hard"
      });
      if (Math.abs(coefB) < 1e-9) {
        warnings.push({
          text: "B = 0 (退化为纯比例)：分母二次项为 0 时，无需取倒数，原式即为标准等比数列。",
          level: "info"
        });
      }
    } else if (subModel === "second-order") {
      const res = calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N);
      const aN = res.terms[N - 1]?.an ?? 0;
      quantities.push({
        label: `二阶递推通项 a_${N}`,
        value: `a_${N} = ${aN.toFixed(2)}`,
        color: MATH_COLORS.sequence
      });
      quantities.push({
        label: "特征根 r₁, r₂",
        value: `r₁ = ${res.r1.toFixed(2)}, r₂ = ${res.r2.toFixed(2)}`,
        color: MATH_COLORS.sequenceHighlight
      });
      theorems.push({
        name: "特征方程法 (二阶常系数线性递推)",
        latex: `x^2 - p x - q = 0 \\implies a_n = C_1 r_1^n + C_2 r_2^n \\quad (r_1 \\neq r_2)`,
        condition: "特征方程求得两不相等实根时通项的线性组合"
      });
      gaokaoPoints.push({
        text: "高考压轴题应用：二阶递推与特征方程。通过构造 a_{n+2} - r_1 a_{n+1} = r_2 (a_{n+1} - r_1 a_n)，将二阶递推转化为一阶等比递推。",
        importance: "hard"
      });
    }
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings
  };
}
function buildConicDefinitionPanel(params, config) {
  const a = params.a ?? 3;
  const c = params.c ?? 2;
  const e = params.e ?? 0.66;
  const p = params.p ?? 2;
  const theta = params.theta ?? 0.8;
  const studyMode = config?.studyMode || "firstDef";
  const conicType = config?.conicType || "ellipse";
  const col = colorize;
  const cPrimary = MATH_COLORS.paramPrimary;
  const cSecondary = MATH_COLORS.paramSecondary;
  const cTertiary = MATH_COLORS.paramTertiary;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  let mnemonic = "焦半径求和看椭圆，求差绝对双曲线，到焦点准线抛物线，比值e统领三曲线。";
  if (studyMode === "firstDef") {
    if (conicType === "ellipse") {
      const isDegenerate = a <= c;
      const b = isDegenerate ? 0 : Math.sqrt(a * a - c * c);
      const curE = (c / a).toFixed(3);
      const px = a * Math.cos(theta);
      const py = b * Math.sin(theta);
      const d1 = Math.hypot(px - -c, py);
      const d2 = Math.hypot(px - c, py);
      const sumD = d1 + d2;
      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: d1.toFixed(2),
          color: cPrimary
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: d2.toFixed(2),
          color: cSecondary
        },
        {
          label: "距离之和 d₁ + d₂",
          value: `${sumD.toFixed(2)} (2a = ${(2 * a).toFixed(2)})`
        },
        {
          label: "离心率 e",
          value: curE,
          color: cPrimary
        }
      );
      theorems.push({
        name: "椭圆第一定义",
        latex: "|PF_1| + |PF_2| = 2a \\quad (2a > 2c > 0)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 距离之和等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: ["2a > 2c > 0", "定点 F₁, F₂ 距离为 2c"],
        level: "core"
      });
      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：当 2a = 2c 时，动点 P 的轨迹退化为线段 F₁F₂，不再是椭圆。",
          level: "danger"
        });
      } else if (a < c) {
        warnings.push({
          text: "退化警示 (2a < 2c)：当 2a < 2c 时，平面内无任何点满足轨迹条件。",
          level: "danger"
        });
      }
      gaokaoPoints.push({
        text: "高考考点：椭圆焦点三角形 ΔF₁PF₂ 面积 S = b²·tan(θ/2)，考查频次极高。",
        importance: "gaokao"
      });
    } else if (conicType === "hyperbola") {
      const isDegenerate = a >= c;
      const b = isDegenerate ? 0 : Math.sqrt(c * c - a * a);
      const curE = (c / a).toFixed(3);
      const secT = 1 / Math.cos(theta * 0.4);
      const px = a * secT;
      const py = b * Math.tan(theta * 0.4);
      const d1 = Math.hypot(px - -c, py);
      const d2 = Math.hypot(px - c, py);
      const diffD = Math.abs(d1 - d2);
      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`
        },
        {
          label: "焦半径 d₁ = |PF₁|",
          value: d1.toFixed(2),
          color: cPrimary
        },
        {
          label: "焦半径 d₂ = |PF₂|",
          value: d2.toFixed(2),
          color: cSecondary
        },
        {
          label: "距离之差绝对值 |d₁ - d₂|",
          value: `${diffD.toFixed(2)} (2a = ${(2 * a).toFixed(2)})`
        },
        {
          label: "离心率 e",
          value: curE,
          color: cPrimary
        }
      );
      theorems.push({
        name: "双曲线第一定义",
        latex: "||PF_1| - |PF_2|| = 2a \\quad (0 < 2a < 2c)",
        note: `平面内到两定点 ${col("F_1", cSecondary)}, ${col("F_2", cSecondary)} 距离之差绝对值等于常数 ${col("2a", cPrimary)} 的动点轨迹`,
        prerequisites: ["0 < 2a < 2c"],
        level: "core"
      });
      if (a === c) {
        warnings.push({
          text: "退化警示 (2a = 2c)：轨迹退化为以 F₁, F₂ 为端点向外延伸的两条射线。",
          level: "danger"
        });
      } else if (a > c) {
        warnings.push({
          text: "退化警示 (2a > 2c)：到两焦点距离差绝对值大于焦距，无满足条件轨迹。",
          level: "danger"
        });
      }
      gaokaoPoints.push({
        text: "高考考点：双曲线渐近线方程 y = ±(b/a)x，离心率 e = √(1 + (b/a)²)。",
        importance: "gaokao"
      });
    } else {
      const px = p / 2 * Math.pow(theta - 3.14, 2);
      const py = p * (theta - 3.14);
      const dF = Math.hypot(px - p / 2, py);
      const dL = px + p / 2;
      quantities.push(
        {
          label: "动点 P 坐标",
          value: `(${px.toFixed(2)}, ${py.toFixed(2)})`
        },
        {
          label: "焦点距离 d_F = |PF|",
          value: dF.toFixed(2),
          color: cPrimary
        },
        {
          label: "到准线距离 d_l",
          value: dL.toFixed(2),
          color: cSecondary
        },
        {
          label: "焦准距 p",
          value: p.toFixed(2),
          color: cTertiary
        },
        {
          label: "离心率 e",
          value: "1.000"
        }
      );
      theorems.push({
        name: "抛物线第一定义",
        latex: "|PF| = d_l",
        note: `平面内到定焦点 ${col("F(p/2, 0)", cSecondary)} 与定准线 ${col("x = -p/2", cPrimary)} 距离相等的动点轨迹`,
        prerequisites: ["p > 0", "焦点不在准线上"],
        level: "core"
      });
      gaokaoPoints.push({
        text: "高考考点：对于抛物线 y² = 2px，焦半径 |PF| = x₀ + p/2 极其常用。",
        importance: "gaokao"
      });
    }
  } else if (studyMode === "unifiedDef") {
    let curveName = "椭圆 (0 < e < 1)";
    if (Math.abs(e - 1) < 1e-4) curveName = "抛物线 (e = 1)";
    else if (e > 1) curveName = "双曲线 (e > 1)";
    const dlVal = 2.5 + Math.cos(theta) * 1.2;
    const dfVal = e * dlVal;
    quantities.push(
      {
        label: "当前曲线类型",
        value: curveName,
        color: e < 1 ? cPrimary : e === 1 ? cSecondary : cTertiary
      },
      {
        label: "离心率 e",
        value: e.toFixed(2),
        color: cPrimary
      },
      {
        label: "到焦点距离 d_F",
        value: dfVal.toFixed(2),
        color: cSecondary
      },
      {
        label: "到准线距离 d_l",
        value: dlVal.toFixed(2),
        color: cTertiary
      },
      {
        label: "比值实时验算 d_F / d_l",
        value: (dfVal / dlVal).toFixed(3)
      }
    );
    theorems.push({
      name: "圆锥曲线统一定义 (焦准距比值法)",
      latex: "\\frac{d_F}{d_l} = e \\quad (e > 0)",
      note: `平面内到定焦点 ${col("F", cSecondary)} 的距离与到定准线 ${col("L", cPrimary)} 的距离之比等于常数 ${col("e", cPrimary)} 的点的轨迹`,
      prerequisites: ["焦点 F 不在准线 L 上"],
      level: "important"
    });
    if (Math.abs(e - 1) < 0.03) {
      warnings.push({
        text: "临界状态 (e = 1)：椭圆右端无限延伸变开弧，在 e = 1 演变为抛物线。",
        level: "warning"
      });
    }
    gaokaoPoints.push({
      text: "高考考点：利用第二定义可实现“焦半径与到准线距离”的等价转化。",
      importance: "gaokao"
    });
  } else {
    quantities.push(
      {
        label: "动圆半径 R",
        value: (2 * a).toFixed(2),
        color: cPrimary
      },
      {
        label: "定圆圆心 F₁",
        value: `(${(-c).toFixed(1)}, 0)`,
        color: cSecondary
      },
      {
        label: "定圆圆心 F₂",
        value: `(${c.toFixed(1)}, 0)`,
        color: cSecondary
      },
      {
        label: "动圆圆心 M 轨迹",
        value: conicType === "ellipse" ? "椭圆轨迹" : "双曲线轨迹",
        color: cTertiary
      }
    );
    theorems.push({
      name: "动圆相切轨迹定理",
      latex: "|MF_1| \\pm |MF_2| = R",
      note: `过定点 ${col("F_2", cSecondary)} 且与已知圆 ${col("(x+c)^2+y^2=R^2", cPrimary)} 相切的动圆圆心 ${col("M", cTertiary)} 的轨迹`,
      prerequisites: ["F₂ 在圆内 -> 椭圆", "F₂ 在圆外 -> 双曲线"],
      level: "derived"
    });
    gaokaoPoints.push({
      text: "高考考点：高考解析几何解答题常考“动圆相切”几何背景求轨迹方程。",
      importance: "core"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic
  };
}
function normalizeLineCoeffs(A, B, C) {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
    return { A: 0, B: 0, C, isValid: false };
  }
  return { A, B, C, isValid: true };
}
function convertFormToGeneral(form, params) {
  switch (form) {
    case "pointSlope": {
      const k = params.k ?? 1;
      const x0 = params.x0 ?? 0;
      const y0 = params.y0 ?? 0;
      return normalizeLineCoeffs(k, -1, y0 - k * x0);
    }
    case "slopeIntercept": {
      const k = params.k ?? 1;
      const b = params.b ?? 0;
      return normalizeLineCoeffs(k, -1, b);
    }
    case "twoPoint": {
      const x1 = params.x1 ?? -2;
      const y1 = params.y1 ?? -1;
      const x2 = params.x2 ?? 2;
      const y2 = params.y2 ?? 3;
      const A = y2 - y1;
      const B = -(x2 - x1);
      const C = x1 * y2 - x2 * y1;
      return normalizeLineCoeffs(A, B, C);
    }
    case "intercept": {
      const a = params.a ?? 3;
      const b = params.b ?? 2;
      if (Math.abs(a) < 1e-9 || Math.abs(b) < 1e-9) {
        return { A: 0, B: 0, C: 0, isValid: false };
      }
      return normalizeLineCoeffs(b, a, -a * b);
    }
    case "general":
    default: {
      const A = params.A ?? 1;
      const B = params.B ?? -1;
      const C = params.C ?? 0;
      return normalizeLineCoeffs(A, B, C);
    }
  }
}
function getLineSegmentInBounds(A, B, C, bounds) {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) return null;
  const points = [];
  const eps = 1e-7;
  if (Math.abs(B) > 1e-9) {
    const y = (-C - A * bounds.xMin) / B;
    if (y >= bounds.yMin - eps && y <= bounds.yMax + eps) {
      points.push({ x: bounds.xMin, y });
    }
  }
  if (Math.abs(B) > 1e-9) {
    const y = (-C - A * bounds.xMax) / B;
    if (y >= bounds.yMin - eps && y <= bounds.yMax + eps) {
      points.push({ x: bounds.xMax, y });
    }
  }
  if (Math.abs(A) > 1e-9) {
    const x = (-C - B * bounds.yMin) / A;
    if (x >= bounds.xMin - eps && x <= bounds.xMax + eps) {
      points.push({ x, y: bounds.yMin });
    }
  }
  if (Math.abs(A) > 1e-9) {
    const x = (-C - B * bounds.yMax) / A;
    if (x >= bounds.xMin - eps && x <= bounds.xMax + eps) {
      points.push({ x, y: bounds.yMax });
    }
  }
  const uniquePoints = [];
  for (const pt of points) {
    const isDuplicate = uniquePoints.some(
      (u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-5
    );
    if (!isDuplicate) {
      uniquePoints.push(pt);
    }
  }
  if (uniquePoints.length >= 2) {
    return { p1: uniquePoints[0], p2: uniquePoints[1] };
  }
  return null;
}
function calcPointToLineDistance(x0, y0, A, B, C) {
  const denomSq = A * A + B * B;
  if (denomSq < 1e-12) {
    return { distance: 0, foot: { x: x0, y: y0 }, isValid: false };
  }
  const distance = Math.abs(A * x0 + B * y0 + C) / Math.sqrt(denomSq);
  const xH = (B * B * x0 - A * B * y0 - A * C) / denomSq;
  const yH = (A * A * y0 - A * B * x0 - B * C) / denomSq;
  return {
    distance,
    foot: { x: xH, y: yH },
    isValid: true
  };
}
function calcTwoLinesRelation(A1, B1, C1, A2, B2, C2) {
  const norm1 = Math.hypot(A1, B1);
  const norm2 = Math.hypot(A2, B2);
  if (norm1 < 1e-9 || norm2 < 1e-9) {
    return {
      type: "intersect",
      intersection: null,
      isPerpendicular: false,
      angleRad: 0,
      angleDeg: 0,
      distance: null,
      isValid: false
    };
  }
  const D = A1 * B2 - A2 * B1;
  const dot2 = A1 * A2 + B1 * B2;
  const isPerpendicular = Math.abs(dot2) < 1e-7;
  const cosVal = Math.min(1, Math.max(0, Math.abs(dot2) / (norm1 * norm2)));
  const angleRad = Math.acos(cosVal);
  const angleDeg = angleRad * 180 / Math.PI;
  if (Math.abs(D) < 1e-7) {
    const scaledC2 = C2 * (A1 !== 0 ? A1 / A2 : B1 / B2);
    const isCoincident = Math.abs(C1 - scaledC2) < 1e-5;
    if (isCoincident) {
      return {
        type: "coincident",
        intersection: null,
        isPerpendicular: false,
        angleRad: 0,
        angleDeg: 0,
        distance: 0,
        isValid: true
      };
    } else {
      const factor = (A1 * A2 + B1 * B2) / (A2 * A2 + B2 * B2);
      const A2_adj = A2 * factor;
      const B2_adj = B2 * factor;
      const C2_adj = C2 * factor;
      const avgA = (A1 + A2_adj) / 2;
      const avgB = (B1 + B2_adj) / 2;
      const dist = Math.abs(C1 - C2_adj) / Math.hypot(avgA, avgB);
      return {
        type: "parallel",
        intersection: null,
        isPerpendicular: false,
        angleRad: 0,
        angleDeg: 0,
        distance: dist,
        isValid: true
      };
    }
  }
  const xInt = (B1 * C2 - B2 * C1) / D;
  const yInt = (C1 * A2 - C2 * A1) / D;
  return {
    type: "intersect",
    intersection: { x: xInt, y: yInt },
    isPerpendicular,
    angleRad,
    angleDeg,
    distance: null,
    isValid: true
  };
}
function getLineProperties(A, B, C) {
  if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
    return {
      slope: null,
      inclinationDeg: 0,
      inclinationRad: 0,
      xIntercept: null,
      yIntercept: null,
      isValid: false
    };
  }
  let slope = null;
  let inclinationRad = 0;
  let inclinationDeg = 0;
  if (Math.abs(B) < 1e-9) {
    slope = null;
    inclinationRad = Math.PI / 2;
    inclinationDeg = 90;
  } else {
    slope = -A / B;
    if (slope >= 0) {
      inclinationRad = Math.atan(slope);
    } else {
      inclinationRad = Math.atan(slope) + Math.PI;
    }
    inclinationDeg = inclinationRad * 180 / Math.PI;
  }
  const xIntercept = Math.abs(A) > 1e-9 ? -C / A : null;
  const yIntercept = Math.abs(B) > 1e-9 ? -C / B : null;
  return {
    slope,
    inclinationDeg,
    inclinationRad,
    xIntercept,
    yIntercept,
    isValid: true
  };
}
function buildLineEquationPanel(params, config) {
  const studyMode = config?.studyMode || "forms";
  const form = config?.form || "general";
  const cPrimary = MATH_COLORS.paramPrimary;
  const cSecondary = MATH_COLORS.paramSecondary;
  const cTertiary = MATH_COLORS.paramTertiary;
  const quantities = [];
  const theorems = [];
  const gaokaoPoints = [];
  const warnings = [];
  let mnemonic = "斜率存在点斜设，垂直坐标要特设；截距为零别遗漏，一般表达最通通用。点到直线垂线引，分子代值加绝对，分母勾股系数平方和。";
  let A = params.A ?? 1;
  let B = params.B ?? -1;
  let C = params.C ?? -1;
  if (studyMode === "forms" && form !== "general") {
    const gen = convertFormToGeneral(form, params);
    A = gen.A;
    B = gen.B;
    C = gen.C;
  }
  const lineProps = getLineProperties(A, B, C);
  if (studyMode === "forms") {
    quantities.push({
      label: "一般式方程",
      value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`
    });
    if (lineProps.slope !== null) {
      quantities.push({
        label: "斜率 k = -A/B",
        value: lineProps.slope.toFixed(2),
        color: cPrimary
      });
      quantities.push({
        label: "倾斜角 α",
        value: `${lineProps.inclinationDeg.toFixed(1)}°`,
        color: cSecondary
      });
    } else {
      quantities.push({
        label: "斜率 k",
        value: "不存在 (α = 90°)",
        color: cPrimary
      });
      quantities.push({
        label: "倾斜角 α",
        value: "90.0°",
        color: cSecondary
      });
    }
    quantities.push({
      label: "x 轴截距 a",
      value: lineProps.xIntercept !== null ? lineProps.xIntercept.toFixed(2) : "无 (平行x轴)"
    });
    quantities.push({
      label: "y 轴截距 b",
      value: lineProps.yIntercept !== null ? lineProps.yIntercept.toFixed(2) : "无 (平行y轴)",
      color: cTertiary
    });
    theorems.push(
      {
        name: "点斜式方程",
        latex: "y - y_0 = k(x - x_0)",
        condition: "适用于斜率 k 存在 (直线不垂直于 x 轴) 的情况",
        level: "core"
      },
      {
        name: "斜截式方程",
        latex: "y = kx + b",
        condition: "已知斜率 k 与 y 轴截距 (0, b)",
        level: "core"
      },
      {
        name: "截距式方程",
        latex: "\\frac{x}{a} + \\frac{y}{b} = 1",
        condition: "a \\neq 0 \\text{ 且 } b \\neq 0 \\text{ (不过原点且不平行于坐标轴)}",
        level: "important"
      },
      {
        name: "一般式方程",
        latex: "Ax + By + C = 0",
        condition: "A, B \\text{ 不同时为 } 0 \\text{ (即 } A^2 + B^2 > 0 \\text{)}",
        level: "core"
      }
    );
    gaokaoPoints.push({
      text: "在设直线方程解题时，首选斜截式 $y = kx + b$ 或点斜式，但必须对斜率 $k$ 是否存在进行分类讨论；求与截距相关的最值问题时常设截距式 $\\frac{x}{a}+\\frac{y}{b}=1$，但也必须分类讨论截距为 0 的情况。",
      importance: "gaokao"
    });
    if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) {
      warnings.push({
        text: "退化警告：当 A 与 B 同时为 0 时，Ax + By + C = 0 不表示直线！",
        level: "danger"
      });
    }
    if (form === "intercept" && (Math.abs(params.a ?? 0) < 1e-9 || Math.abs(params.b ?? 0) < 1e-9)) {
      warnings.push({
        text: "截距式要求 a ≠ 0 且 b ≠ 0。过原点的直线不能用截距式表示！",
        level: "warning"
      });
    }
  } else if (studyMode === "distance") {
    const x0 = params.x0 ?? 2;
    const y0 = params.y0 ?? 3;
    const p2l = calcPointToLineDistance(x0, y0, A, B, C);
    quantities.push(
      {
        label: "目标点 P(x₀, y₀)",
        value: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`
      },
      {
        label: "直线 L: Ax+By+C=0",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`
      },
      {
        label: "点到直线距离 d",
        value: p2l.distance.toFixed(3),
        color: cPrimary
      },
      {
        label: "垂足 Q(x_H, y_H)",
        value: `(${p2l.foot.x.toFixed(2)}, ${p2l.foot.y.toFixed(2)})`,
        color: cSecondary
      }
    );
    theorems.push(
      {
        name: "点到直线的距离公式",
        latex: "d = \\frac{|A x_0 + B y_0 + C|}{\\sqrt{A^2 + B^2}}",
        condition: "点 P(x_0, y_0) 到直线 Ax + By + C = 0 的最短几何距离",
        level: "core"
      },
      {
        name: "垂足坐标公式",
        latex: "x_H = \\frac{B^2 x_0 - AB y_0 - AC}{A^2 + B^2}, \\quad y_H = \\frac{A^2 y_0 - AB x_0 - BC}{A^2 + B^2}",
        condition: "PQ \\perp L",
        level: "derived"
      }
    );
    gaokaoPoints.push(
      {
        text: "在求直线与圆相交的弦长及圆的切线方程时，点到直线的距离 $d$ 是联系圆心到直线的距离与弦长 ($2\\sqrt{R^2 - d^2}$) 的核心钥匙。",
        importance: "gaokao"
      },
      {
        text: "求点 $P$ 关于直线 $L$ 的对称点 $P'$，本质利用垂足 $Q$ 是 $PP'$ 的中点，且直线 $PP'$ 与 $L$ 垂直（斜率乘积为 -1）。",
        importance: "core"
      }
    );
    if (!p2l.isValid) {
      warnings.push({
        text: "直线系数 A 和 B 不能同时为 0，否则无法计算点到直线的距离！",
        level: "danger"
      });
    }
  } else if (studyMode === "relation") {
    const A2 = params.A2 ?? 1;
    const B2 = params.B2 ?? 1;
    const C2 = params.C2 ?? -2;
    const rel = calcTwoLinesRelation(A, B, C, A2, B2, C2);
    const relTextMap = {
      intersect: rel.isPerpendicular ? "相交且垂直 (L₁ ⊥ L₂)" : "相交",
      parallel: "平行 (L₁ ∥ L₂)",
      coincident: "重合 (L₁ = L₂)"
    };
    quantities.push(
      {
        label: "直线 L₁ 方程",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
        color: cPrimary
      },
      {
        label: "直线 L₂ 方程",
        value: `${A2.toFixed(1)}x ${B2 >= 0 ? "+" : ""} ${B2.toFixed(1)}y ${C2 >= 0 ? "+" : ""} ${C2.toFixed(1)} = 0`,
        color: cSecondary
      },
      {
        label: "两条直线位置关系",
        value: relTextMap[rel.type],
        color: rel.isPerpendicular || rel.type === "parallel" ? MATH_COLORS.primary : MATH_COLORS.labelText
      }
    );
    if (rel.type === "intersect" && rel.intersection) {
      quantities.push({
        label: "交点 P 坐标",
        value: `(${rel.intersection.x.toFixed(2)}, ${rel.intersection.y.toFixed(2)})`
      });
      quantities.push({
        label: "两线夹角 θ",
        value: `${rel.angleDeg.toFixed(1)}°`,
        color: cTertiary
      });
    } else if (rel.type === "parallel" && rel.distance !== null) {
      quantities.push({
        label: "平行线间距离 d",
        value: rel.distance.toFixed(3),
        color: cPrimary
      });
    }
    theorems.push(
      {
        name: "两条直线垂直判定",
        latex: "L_1 \\perp L_2 \\iff A_1 A_2 + B_1 B_2 = 0 \\quad (k_1 k_2 = -1)",
        condition: "两直线的法向量点积为 0，或斜率乘积为 -1",
        level: "core"
      },
      {
        name: "两条直线平行判定",
        latex: "L_1 \\parallel L_2 \\iff A_1 B_2 - A_2 B_1 = 0 \\quad \\text{且} \\quad A_1 C_2 - A_2 C_1 \\neq 0",
        condition: "斜率相等但截距不相等",
        level: "core"
      },
      {
        name: "两条平行直线间的距离公式",
        latex: "d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}",
        condition: "L_1 \\parallel L_2 \\text{ 且 } x, y \\text{ 系数必须完全化为一致}",
        level: "important"
      }
    );
    gaokaoPoints.push({
      text: "在直接代入平行线距离公式 $d = \\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}$ 之前，必须先将两直线的 $x$ 和 $y$ 系数化为完全相同（如 $2x - 3y + 1 = 0$ 与 $4x - 6y + 5 = 0$，需先将前者化为 $4x - 6y + 2 = 0$）。",
      importance: "gaokao"
    });
    if (rel.type === "coincident") {
      warnings.push({
        text: "两条直线重合，平行线距离为 0。使用平行线公式前请先排除重合！",
        level: "warning"
      });
    }
  } else if (studyMode === "family") {
    const lam = params.lambda ?? 1;
    const A2 = params.A2 ?? 1;
    const B2 = params.B2 ?? 1;
    const C2 = params.C2 ?? -2;
    const A_fam = A + lam * A2;
    const B_fam = B + lam * B2;
    const C_fam = C + lam * C2;
    quantities.push(
      {
        label: "基准直线 L₁",
        value: `${A.toFixed(1)}x ${B >= 0 ? "+" : ""} ${B.toFixed(1)}y ${C >= 0 ? "+" : ""} ${C.toFixed(1)} = 0`,
        color: cPrimary
      },
      {
        label: "基准直线 L₂",
        value: `${A2.toFixed(1)}x ${B2 >= 0 ? "+" : ""} ${B2.toFixed(1)}y ${C2 >= 0 ? "+" : ""} ${C2.toFixed(1)} = 0`,
        color: cSecondary
      },
      {
        label: "动直线系 L(λ)",
        value: `${A_fam.toFixed(1)}x ${B_fam >= 0 ? "+" : ""} ${B_fam.toFixed(1)}y ${C_fam >= 0 ? "+" : ""} ${C_fam.toFixed(1)} = 0`,
        color: cTertiary
      }
    );
    theorems.push(
      {
        name: "过两直线交点的直线系",
        latex: "A_1 x + B_1 y + C_1 + \\lambda (A_2 x + B_2 y + C_2) = 0",
        condition: "表示经过 L₁ 与 L₂ 交点（若相交）的所有直线（不包含 L₂ 本身）",
        level: "derived"
      },
      {
        name: "平行/垂直直线系",
        latex: "\\text{平行系: } Ax + By + \\lambda = 0, \\quad \\text{垂直系: } Bx - Ay + \\lambda = 0",
        condition: "\\lambda \\in \\mathbb{R}",
        level: "important"
      }
    );
    gaokaoPoints.push({
      text: "对于形如 $(2\\lambda+1)x + (\\lambda-1)y + \\lambda - 4 = 0$ 的含参直线，按 $\\lambda$ 整理为 $(2x + y + 1)\\lambda + (x - y - 4) = 0$，解方程组 $2x + y + 1 = 0$ 与 $x - y - 4 = 0$ 即可求得恒过的定点坐标。",
      importance: "gaokao"
    });
  }
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic
  };
}
function normalizeAngleDeg(deg) {
  let mod = deg % 360;
  if (mod < 0) mod += 360;
  return mod;
}
function calculateTrigLines(alphaDeg) {
  const alphaRad = alphaDeg * Math.PI / 180;
  const normalizeDeg = normalizeAngleDeg(alphaDeg);
  const cosVal = Math.cos(alphaRad);
  const sinVal = Math.sin(alphaRad);
  const pointP = { x: cosVal, y: sinVal };
  const pointM = { x: cosVal, y: 0 };
  const pointA = { x: 1, y: 0 };
  const isTanDefined = Math.abs(cosVal) > 1e-7;
  let tanVal = null;
  let pointT = null;
  if (isTanDefined) {
    tanVal = Math.tan(alphaRad);
    pointT = { x: 1, y: tanVal };
  }
  let quadrant;
  const normRad = normalizeDeg * Math.PI / 180;
  if (Math.abs(sinVal) < 1e-7) {
    quadrant = cosVal > 0 ? "axis-x-pos" : "axis-x-neg";
  } else if (Math.abs(cosVal) < 1e-7) {
    quadrant = sinVal > 0 ? "axis-y-pos" : "axis-y-neg";
  } else if (normRad > 0 && normRad < Math.PI / 2) {
    quadrant = 1;
  } else if (normRad > Math.PI / 2 && normRad < Math.PI) {
    quadrant = 2;
  } else if (normRad > Math.PI && normRad < 3 * Math.PI / 2) {
    quadrant = 3;
  } else {
    quadrant = 4;
  }
  return {
    alphaDeg,
    alphaRad,
    normalizeDeg,
    quadrant,
    pointP,
    pointM,
    pointA,
    pointT,
    sinVal,
    cosVal,
    tanVal,
    isTanDefined,
    hasDegenerateSine: Math.abs(sinVal) < 1e-7,
    hasDegenerateCosine: Math.abs(cosVal) < 1e-7,
    hasDegenerateTangent: Math.abs(sinVal) < 1e-7
  };
}
function pointToAngleDeg$1(x, y, currentAlphaDeg) {
  let rad = Math.atan2(y, x);
  let deg = rad * 180 / Math.PI;
  if (deg < 0) deg += 360;
  const circles = Math.floor(currentAlphaDeg / 360);
  let targetDeg = circles * 360 + deg;
  if (targetDeg - currentAlphaDeg > 180) {
    targetDeg -= 360;
  } else if (targetDeg - currentAlphaDeg < -180) {
    targetDeg += 360;
  }
  return Math.round(targetDeg);
}
function buildTrigLinesPanel(params, _config) {
  const alphaDeg = params.alphaDeg ?? 45;
  const trig = calculateTrigLines(alphaDeg);
  const radStr = `${(trig.alphaRad / Math.PI).toFixed(2)}\\pi`;
  const sinStr = trig.sinVal.toFixed(3);
  const cosStr = trig.cosVal.toFixed(3);
  const tanStr = trig.isTanDefined && trig.tanVal !== null ? trig.tanVal.toFixed(3) : "无意义";
  const quantities = [
    {
      label: "动角 α",
      symbol: `\\alpha = ${alphaDeg}^\\circ`,
      value: `${alphaDeg}° (${radStr})`
    },
    {
      label: "交点 P 坐标",
      symbol: "P(\\cos\\alpha, \\sin\\alpha)",
      value: `(${cosStr}, ${sinStr})`
    },
    {
      label: "正弦线 MP (数量)",
      symbol: "MP = \\sin\\alpha",
      value: sinStr,
      color: "#EF4444",
      highlight: trig.sinVal > 0 ? "positive" : trig.sinVal < 0 ? "negative" : "zero"
    },
    {
      label: "余弦线 OM (数量)",
      symbol: "OM = \\cos\\alpha",
      value: cosStr,
      color: "#D97706",
      highlight: trig.cosVal > 0 ? "positive" : trig.cosVal < 0 ? "negative" : "zero"
    },
    {
      label: "正切线 AT (数量)",
      symbol: "AT = \\tan\\alpha",
      value: tanStr,
      color: "#059669",
      highlight: !trig.isTanDefined ? "extreme" : (trig.tanVal ?? 0) > 0 ? "positive" : (trig.tanVal ?? 0) < 0 ? "negative" : "zero"
    },
    {
      label: "勾股恒等式",
      symbol: "\\sin^2\\alpha + \\cos^2\\alpha",
      value: "1.000",
      color: "#3B82F6"
    }
  ];
  const qMap = {
    1: "第一象限 (sin>0, cos>0, tan>0)",
    2: "第二象限 (sin>0, cos<0, tan<0)",
    3: "第三象限 (sin<0, cos<0, tan>0)",
    4: "第四象限 (sin<0, cos<0, tan<0)",
    "axis-x-pos": "x 轴正半轴 (0°, 360°)",
    "axis-x-neg": "x 轴负半轴 (180°)",
    "axis-y-pos": "y 轴正半轴 (90°)",
    "axis-y-neg": "y 轴负半轴 (270°)"
  };
  const quadrantText = qMap[String(trig.quadrant)] || "轴线上";
  const theorems = [
    {
      name: "三角函数线的几何定义",
      latex: "\\overrightarrow{MP} = \\sin\\alpha, \\quad \\overrightarrow{OM} = \\cos\\alpha, \\quad \\overrightarrow{AT} = \\tan\\alpha",
      condition: "单位圆 r = 1，P(cosα, sinα)，M 为 P 在 x 轴投影，A(1,0) 为切点",
      note: "有向线段的方向顺坐标轴方向为正，逆方向为负。",
      level: "core"
    },
    {
      name: "第一象限几何比较不等式",
      latex: "\\sin\\alpha < \\alpha < \\tan\\alpha \\quad (0 < \\alpha < \\frac{\\pi}{2})",
      condition: "仅在第一象限锐角区间 (0, π/2) 成立",
      note: "由 S_△OMP < S_扇形OAP < S_△OAT 面积逼近直接导出，高考放缩基础。",
      level: "important"
    }
  ];
  const gaokaoPoints = [
    {
      text: "考点1：三角函数值的符号判断（一全正、二正弦、三正切、四余弦）",
      importance: "gaokao"
    },
    {
      text: "考点2：解三角不等式（在单位圆上结合三角函数线扫描弧区解集）",
      importance: "gaokao"
    },
    {
      text: "考点3：极限逼近与切线放缩（sin x < x < tan x 的几何证明）",
      importance: "hard"
    }
  ];
  const warnings = [];
  if (!trig.isTanDefined) {
    warnings.push({
      text: `退化警示：当前动角 α = ${alphaDeg}°，终边与切线 x=1 平行，正切线 AT 不存在 (tan α 无定义)！`,
      level: "danger"
    });
  }
  if (trig.hasDegenerateSine) {
    warnings.push({
      text: `临界状态：当前动角 α = ${alphaDeg}°，终边落在 x 轴上，正弦线 MP 与正切线 AT 缩为单点 (0)。`,
      level: "warning"
    });
  }
  const mnemonic = `当前位置：${quadrantText}。正弦看竖线(MP)，余弦看横线(OM)，正切看右切线(AT)。顺坐标轴方向为正，逆方向为负！`;
  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic
  };
}
function getQuadrant(deg) {
  const norm2 = (deg % 360 + 360) % 360;
  if (norm2 === 0 || norm2 === 90 || norm2 === 180 || norm2 === 270) return 0;
  if (norm2 > 0 && norm2 < 90) return 1;
  if (norm2 > 90 && norm2 < 180) return 2;
  if (norm2 > 180 && norm2 < 270) return 3;
  return 4;
}
function calculateTrigIdentity(alphaDeg, homoA = 1, homoB = 1) {
  const alphaRad = alphaDeg * Math.PI / 180;
  const normDeg = (alphaDeg % 360 + 360) % 360;
  const quadrant = getQuadrant(alphaDeg);
  const sinVal = Math.sin(alphaRad);
  const cosVal = Math.cos(alphaRad);
  const isTanDefined = Math.abs(cosVal) > 1e-5;
  const tanVal = isTanDefined ? sinVal / cosVal : void 0;
  const pointP = { x: cosVal, y: sinVal };
  const pointM = { x: cosVal, y: 0 };
  const pointA = { x: 1, y: 0 };
  const pointT = isTanDefined && tanVal !== void 0 ? { x: 1, y: tanVal } : void 0;
  const sinSq = sinVal * sinVal;
  const cosSq = cosVal * cosVal;
  const sqSum = sinSq + cosSq;
  const sumSC = sinVal + cosVal;
  const diffSC = sinVal - cosVal;
  const prodSC = sinVal * cosVal;
  const sumSqVerif = sumSC * sumSC;
  const diffSqVerif = diffSC * diffSC;
  const denom = sinVal + cosVal;
  const isHomoDefined = Math.abs(denom) > 1e-4;
  const homoVal = isHomoDefined ? (homoA * sinVal + homoB * cosVal) / denom : void 0;
  const homoFormulaTex = `\\frac{${homoA}\\sin\\alpha + ${homoB}\\cos\\alpha}{\\sin\\alpha + \\cos\\alpha}`;
  return {
    alphaDeg,
    alphaRad,
    normDeg,
    quadrant,
    sinVal,
    cosVal,
    tanVal,
    isTanDefined,
    pointP,
    pointM,
    pointA,
    pointT,
    sinSq,
    cosSq,
    sqSum,
    sumSC,
    diffSC,
    prodSC,
    sumSqVerif,
    diffSqVerif,
    homoVal,
    isHomoDefined,
    homoFormulaTex
  };
}
function calculateInduction(alphaDeg, formulaType) {
  const alphaRad = alphaDeg * Math.PI / 180;
  const pointP = { x: Math.cos(alphaRad), y: Math.sin(alphaRad) };
  let betaDeg = alphaDeg;
  let formulaTitle = "";
  let formulaTex = "";
  let symmetryType = "coincide";
  let symmetryName = "";
  let symmetryLineTex = void 0;
  let kValue = 0;
  let isOdd = false;
  let nameChangeDesc = "函数名不变";
  let assumedQuadrant = "";
  let signDesc = "";
  let sinFormulaTex = "";
  let cosFormulaTex = "";
  let tanFormulaTex = "";
  switch (formulaType) {
    case "period":
      betaDeg = alphaDeg + 360;
      formulaTitle = "公式一：α + 2kπ";
      formulaTex = "\\alpha + 2\\pi";
      symmetryType = "coincide";
      symmetryName = "终边重合 (周期性)";
      kValue = 4;
      isOdd = false;
      nameChangeDesc = "k=4 (偶数) ➔ 函数名不变";
      assumedQuadrant = "α 为锐角(第一象限)，α+2π 也在第一象限";
      signDesc = "全为正 ➔ 符号全取正号 '+'";
      sinFormulaTex = "\\sin(\\alpha + 2\\pi) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\alpha + 2\\pi) = \\cos\\alpha";
      tanFormulaTex = "\\tan(\\alpha + 2\\pi) = \\tan\\alpha";
      break;
    case "pi_plus":
      betaDeg = 180 + alphaDeg;
      formulaTitle = "公式二：π + α";
      formulaTex = "\\pi + \\alpha";
      symmetryType = "origin";
      symmetryName = "关于原点 (0,0) 中心对称";
      kValue = 2;
      isOdd = false;
      nameChangeDesc = "k=2 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π+α 落在第 Ⅲ 象限";
      signDesc = "第 Ⅲ 象限中 sin<0, cos<0, tan>0 ➔ sin,cos加负号，tan为正";
      sinFormulaTex = "\\sin(\\pi + \\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi + \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi + \\alpha) = \\tan\\alpha";
      break;
    case "neg":
      betaDeg = -alphaDeg;
      formulaTitle = "公式三：-α";
      formulaTex = "-\\alpha";
      symmetryType = "xaxis";
      symmetryName = "关于 x 轴对称";
      symmetryLineTex = "y = 0";
      kValue = 0;
      isOdd = false;
      nameChangeDesc = "k=0 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，-α 落在第 Ⅳ 象限";
      signDesc = "第 Ⅳ 象限中 sin<0, cos>0, tan<0 ➔ sin,tan加负号";
      sinFormulaTex = "\\sin(-\\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(-\\alpha) = \\cos\\alpha";
      tanFormulaTex = "\\tan(-\\alpha) = -\\tan\\alpha";
      break;
    case "pi_minus":
      betaDeg = 180 - alphaDeg;
      formulaTitle = "公式四：π - α";
      formulaTex = "\\pi - \\alpha";
      symmetryType = "yaxis";
      symmetryName = "关于 y 轴对称";
      symmetryLineTex = "x = 0";
      kValue = 2;
      isOdd = false;
      nameChangeDesc = "k=2 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π-α 落在第 Ⅱ 象限";
      signDesc = "第 Ⅱ 象限中 sin>0, cos<0, tan<0 ➔ sin不变号，cos,tan加负号";
      sinFormulaTex = "\\sin(\\pi - \\alpha) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi - \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi - \\alpha) = -\\tan\\alpha";
      break;
    case "half_pi_minus":
      betaDeg = 90 - alphaDeg;
      formulaTitle = "公式五：π/2 - α";
      formulaTex = "\\frac{\\pi}{2} - \\alpha";
      symmetryType = "diag_pos";
      symmetryName = "关于直线 y = x 对称";
      symmetryLineTex = "y = x";
      kValue = 1;
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π/2-α 也在第 Ⅰ 象限";
      signDesc = "原函数在第 Ⅰ 象限全为正 ➔ 变换后全取正号 '+'";
      sinFormulaTex = "\\sin\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex = "\\cos\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\sin\\alpha";
      tanFormulaTex = "\\tan\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\frac{1}{\\tan\\alpha}";
      break;
    case "half_pi_plus":
      betaDeg = 90 + alphaDeg;
      formulaTitle = "公式六：π/2 + α";
      formulaTex = "\\frac{\\pi}{2} + \\alpha";
      symmetryType = "diag_neg";
      symmetryName = "关于直线 y = -x 对称 / 旋转 90°";
      symmetryLineTex = "y = -x";
      kValue = 1;
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π/2+α 落在第 Ⅱ 象限";
      signDesc = "原 sin 在第 Ⅱ 象限为正(得cosα)；原 cos 在第 Ⅱ 象限为负(得-sinα)";
      sinFormulaTex = "\\sin\\left(\\frac{\\pi}{2} + \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex = "\\cos\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\sin\\alpha";
      tanFormulaTex = "\\tan\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\frac{1}{\\tan\\alpha}";
      break;
  }
  const betaRad = betaDeg * Math.PI / 180;
  const sinBeta = Math.sin(betaRad);
  const cosBeta = Math.cos(betaRad);
  const isTanBetaDefined = Math.abs(cosBeta) > 1e-5;
  const tanBeta = isTanBetaDefined ? sinBeta / cosBeta : void 0;
  const pointPPrime = { x: cosBeta, y: sinBeta };
  const pointMPrime = { x: cosBeta, y: 0 };
  return {
    formulaType,
    formulaTitle,
    formulaTex,
    alphaDeg,
    betaDeg,
    betaRad,
    pointP,
    pointPPrime,
    pointMPrime,
    symmetryType,
    symmetryName,
    symmetryLineTex,
    kValue,
    isOdd,
    nameChangeDesc,
    assumedQuadrant,
    signDesc,
    sinFormulaTex,
    cosFormulaTex,
    tanFormulaTex,
    sinBeta,
    cosBeta,
    tanBeta
  };
}
function pointToAngleDeg(x, y, currentDeg) {
  const rawRad = Math.atan2(y, x);
  let rawDeg = rawRad * 180 / Math.PI;
  if (rawDeg < 0) rawDeg += 360;
  const currentNormalized = (currentDeg % 360 + 360) % 360;
  let diff = rawDeg - currentNormalized;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return Math.round(currentDeg + diff);
}
function buildTrigIdentityPanel(params, config) {
  const alphaDeg = params.alphaDeg ?? 30;
  const homoA = params.homoA ?? 1;
  const homoB = params.homoB ?? 1;
  const studyMode = config?.studyMode ?? "identity";
  const formulaType = config?.formulaType ?? "pi_plus";
  const trig = calculateTrigIdentity(alphaDeg, homoA, homoB);
  const ind = calculateInduction(alphaDeg, formulaType);
  const radStr = `${(trig.alphaRad / Math.PI).toFixed(2)}\\pi`;
  const sinStr = trig.sinVal.toFixed(3);
  const cosStr = trig.cosVal.toFixed(3);
  const tanStr = trig.isTanDefined && trig.tanVal !== void 0 ? trig.tanVal.toFixed(3) : "无意义";
  if (studyMode === "identity") {
    const quantities = [
      {
        label: "角 α 角度/弧度",
        symbol: "\\alpha",
        value: `${alphaDeg}° (${radStr})`,
        color: "#EF4444"
      },
      {
        label: "正弦与余弦值",
        symbol: "\\sin\\alpha, \\cos\\alpha",
        value: `sin=${sinStr}, cos=${cosStr}`,
        color: "#EF4444"
      },
      {
        label: "正切值",
        symbol: "\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}",
        value: tanStr,
        color: "#059669",
        highlight: !trig.isTanDefined ? "extreme" : void 0
      },
      {
        label: "平方关系验证",
        symbol: "\\sin^2\\alpha + \\cos^2\\alpha",
        value: `${trig.sinSq.toFixed(3)} + ${trig.cosSq.toFixed(3)} = ${trig.sqSum.toFixed(3)}`,
        color: "#3B82F6"
      },
      {
        label: "知一求二和与积",
        symbol: "(\\sin\\alpha + \\cos\\alpha)^2",
        value: `S=${trig.sumSC.toFixed(3)}, P=${trig.prodSC.toFixed(3)} (S²=1+2P=${trig.sumSqVerif.toFixed(3)})`,
        color: "#D97706"
      },
      {
        label: "齐次式化切求值",
        symbol: trig.homoFormulaTex,
        value: trig.isHomoDefined && trig.homoVal !== void 0 ? trig.homoVal.toFixed(3) : "分母为零无意义",
        color: "#059669",
        highlight: !trig.isHomoDefined ? "extreme" : void 0
      }
    ];
    const theorems = [
      {
        name: "同角平方关系 (单位圆勾股定理)",
        latex: "\\sin^2\\alpha + \\cos^2\\alpha = 1",
        condition: "$任意实数 \\alpha \\in \\mathbb{R}$",
        note: "直观几何解释：单位圆上动点 $P(\\cos\\alpha, \\sin\\alpha)$ 到原点距离 $OP^2 = x^2 + y^2 = 1$。",
        level: "core"
      },
      {
        name: "同角商数关系",
        latex: "\\tan\\alpha = \\frac{\\sin\\alpha}{\\cos\\alpha}",
        condition: "$\\alpha \\neq k\\pi + \\frac{\\pi}{2} \\quad (k \\in \\mathbb{Z})$",
        note: "直观几何解释：过点 $A(1,0)$ 作 $x$ 轴切线与终边交于 $T(1, \\tan\\alpha)$，由相似三角形得正切比值。",
        level: "core"
      },
      {
        name: "知一求二公式变形",
        latex: "(\\sin\\alpha \\pm \\cos\\alpha)^2 = 1 \\pm 2\\sin\\alpha\\cos\\alpha = 1 \\pm \\sin 2\\alpha",
        condition: "已知 sinα±cosα 或 sinα·cosα 相互转换",
        note: "注意：开方时必须结合象限符号决定正负 sign(sinα ± cosα)！",
        level: "important"
      },
      {
        name: "高考齐次式“化切”技巧",
        latex: "\\frac{A\\sin\\alpha + B\\cos\\alpha}{C\\sin\\alpha + D\\cos\\alpha} = \\frac{A\\tan\\alpha + B}{C\\tan\\alpha + D}",
        condition: "分子分母同除以 cosα (二次齐次式除以 cos²α，其中 1 = sin²α + cos²α)",
        note: "彻底消除弦函数，将已知 tanα 直接代入，属于高考选择填空秒杀题型。",
        level: "important"
      }
    ];
    const gaokaoPoints = [
      {
        text: "高考考点1：给值求值 —— 已知 tanα，求齐次分式或 1/(sinα·cosα) 的值",
        importance: "gaokao"
      },
      {
        text: "高考考点2：知一求二 —— 已知 sinα+cosα=k，利用平方关系求 sinα·cosα 与 sinα-cosα",
        importance: "gaokao"
      },
      {
        text: "高考考点3：“1”的巧用 —— 在式子中将 1 替换为 sin²α + cos²α 创造齐次条件",
        importance: "hard"
      }
    ];
    const warnings = [];
    if (!trig.isTanDefined) {
      warnings.push({
        text: `正切函数退化警告：当前 α = ${alphaDeg}° (cos α = 0)，正切线与正切值 tan α 无意义！`,
        level: "warning"
      });
    }
    if (!trig.isHomoDefined) {
      warnings.push({
        text: "齐次分式分母为零警告：sin α + cos α = 0，齐次分式分母为零无意义！",
        level: "danger"
      });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "同角关系牢记心：平方和为1，商数即正切。齐次同除cos，知一平方可求二！"
    };
  } else {
    const quantities = [
      {
        label: "原角 α",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444"
      },
      {
        label: "变换角 β",
        symbol: ind.formulaTex,
        value: `${ind.betaDeg}°`,
        color: "#D97706"
      },
      {
        label: "几何对称关系",
        symbol: "P \\to P'",
        value: ind.symmetryName,
        color: "#3B82F6"
      },
      {
        label: "奇变偶不变判断",
        symbol: `k = ${ind.kValue}`,
        value: ind.nameChangeDesc,
        color: ind.isOdd ? "#EF4444" : "#059669"
      },
      {
        label: "符号看象限判断",
        symbol: "\\text{象限分析}",
        value: ind.signDesc,
        color: "#D97706"
      },
      {
        label: "正弦变换值",
        symbol: ind.sinFormulaTex,
        value: `sin β = ${ind.sinBeta.toFixed(3)}`,
        color: "#EF4444"
      },
      {
        label: "余弦变换值",
        symbol: ind.cosFormulaTex,
        value: `cos β = ${ind.cosBeta.toFixed(3)}`,
        color: "#D97706"
      }
    ];
    const theorems = [
      {
        name: `诱导公式（${ind.formulaTitle}）`,
        latex: `${ind.sinFormulaTex}, \\quad ${ind.cosFormulaTex}`,
        condition: ind.symmetryName,
        note: `几何直观：终边 OP 与 OP' 呈现${ind.symmetryName}，对应直角三角形全等。`,
        level: "core"
      },
      {
        name: "诱导公式总法则",
        latex: "f\\left(k \\cdot \\frac{\\pi}{2} \\pm \\alpha\\right)",
        condition: "k 为整数",
        note: "奇变偶不变（k 为奇数时 sin↔cos，偶数时不变）；符号看象限（将 α 看作锐角，看原函数在对应象限的正负）。",
        level: "core"
      }
    ];
    const gaokaoPoints = [
      {
        text: "高考考点1：大角化小角，负角化正角，复杂角化锐角",
        importance: "gaokao"
      },
      {
        text: "高考考点2：互余/互补角关系应用 —— sin(π/2-α)=cosα, cos(π-α)=-cosα",
        importance: "gaokao"
      },
      {
        text: "高考考点3：结合周期性 (α+2kπ) 的三角化简求值",
        importance: "gaokao"
      }
    ];
    const warnings = [];
    if (ind.tanBeta === void 0) {
      warnings.push({
        text: `变换角正切无意义：当前变换角 β = ${ind.betaDeg}°，cos β = 0，tan β 无意义！`,
        level: "warning"
      });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "诱导公式口诀：奇变偶不变，符号看象限！（把 α 看做第一象限锐角判断原函数符号）"
    };
  }
}
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
function calculateSumDiff(alphaDeg, betaDeg, key = "cos_minus") {
  const alphaRad = alphaDeg * DEG_TO_RAD;
  const betaRad = betaDeg * DEG_TO_RAD;
  const cosAlpha = Math.cos(alphaRad);
  const sinAlpha = Math.sin(alphaRad);
  const cosBeta = Math.cos(betaRad);
  const sinBeta = Math.sin(betaRad);
  const dotProduct = cosAlpha * cosBeta + sinAlpha * sinBeta;
  const isTanAlphaDefined = Math.abs(cosAlpha) > 1e-6;
  const isTanBetaDefined = Math.abs(cosBeta) > 1e-6;
  const tanAlpha = isTanAlphaDefined ? sinAlpha / cosAlpha : void 0;
  const tanBeta = isTanBetaDefined ? sinBeta / cosBeta : void 0;
  let targetAngleRad = 0;
  let resultVal = 0;
  let isTanDefined = true;
  let formulaTitle = "";
  let formulaLatex = "";
  switch (key) {
    case "cos_minus":
      targetAngleRad = alphaRad - betaRad;
      resultVal = Math.cos(targetAngleRad);
      formulaTitle = "两角差的余弦";
      formulaLatex = "\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta";
      break;
    case "cos_plus":
      targetAngleRad = alphaRad + betaRad;
      resultVal = Math.cos(targetAngleRad);
      formulaTitle = "两角和的余弦";
      formulaLatex = "\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta";
      break;
    case "sin_plus":
      targetAngleRad = alphaRad + betaRad;
      resultVal = Math.sin(targetAngleRad);
      formulaTitle = "两角和的正弦";
      formulaLatex = "\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta";
      break;
    case "sin_minus":
      targetAngleRad = alphaRad - betaRad;
      resultVal = Math.sin(targetAngleRad);
      formulaTitle = "两角差的正弦";
      formulaLatex = "\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta";
      break;
    case "tan_plus":
      targetAngleRad = alphaRad + betaRad;
      if (!isTanAlphaDefined || !isTanBetaDefined || tanAlpha === void 0 || tanBeta === void 0) {
        isTanDefined = false;
        resultVal = NaN;
      } else {
        const denom = 1 - tanAlpha * tanBeta;
        if (Math.abs(denom) < 1e-6) {
          isTanDefined = false;
          resultVal = NaN;
        } else {
          resultVal = (tanAlpha + tanBeta) / denom;
        }
      }
      formulaTitle = "两角和的正切";
      formulaLatex = "\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}";
      break;
    case "tan_minus":
      targetAngleRad = alphaRad - betaRad;
      if (!isTanAlphaDefined || !isTanBetaDefined || tanAlpha === void 0 || tanBeta === void 0) {
        isTanDefined = false;
        resultVal = NaN;
      } else {
        const denom = 1 + tanAlpha * tanBeta;
        if (Math.abs(denom) < 1e-6) {
          isTanDefined = false;
          resultVal = NaN;
        } else {
          resultVal = (tanAlpha - tanBeta) / denom;
        }
      }
      formulaTitle = "两角差的正切";
      formulaLatex = "\\tan(\\alpha - \\beta) = \\frac{\\tan\\alpha - \\tan\\beta}{1 + \\tan\\alpha\\tan\\beta}";
      break;
  }
  const targetAngleDeg = (targetAngleRad * RAD_TO_DEG % 360 + 360) % 360;
  return {
    alphaRad,
    betaRad,
    cosAlpha,
    sinAlpha,
    cosBeta,
    sinBeta,
    tanAlpha,
    tanBeta,
    targetAngleRad,
    targetAngleDeg,
    resultVal,
    dotProduct,
    isTanDefined,
    formulaTitle,
    formulaLatex
  };
}
function calculateDoubleAngle(alphaDeg, key = "sin_2a") {
  const alphaRad = alphaDeg * DEG_TO_RAD;
  const doubleRad = 2 * alphaRad;
  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);
  const isTanAlphaDefined = Math.abs(cosAlpha) > 1e-6;
  const tanAlpha = isTanAlphaDefined ? sinAlpha / cosAlpha : void 0;
  const sin2Alpha = Math.sin(doubleRad);
  const cos2Alpha = Math.cos(doubleRad);
  const sinSqAlpha = sinAlpha * sinAlpha;
  const cosSqAlpha = cosAlpha * cosAlpha;
  let isTanDefined = true;
  let tan2Alpha;
  if (Math.abs(Math.cos(doubleRad)) > 1e-6) {
    tan2Alpha = Math.sin(doubleRad) / Math.cos(doubleRad);
  } else {
    isTanDefined = false;
  }
  let formulaTitle = "";
  let formulaLatex = "";
  switch (key) {
    case "sin_2a":
      formulaTitle = "二倍角正弦";
      formulaLatex = "\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha";
      break;
    case "cos_2a":
      formulaTitle = "二倍角余弦";
      formulaLatex = "\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha";
      break;
    case "tan_2a":
      formulaTitle = "二倍角正切";
      formulaLatex = "\\tan 2\\alpha = \\frac{2\\tan\\alpha}{1 - \\tan^2\\alpha}";
      break;
    case "sin2_a":
      formulaTitle = "正弦降幂公式";
      formulaLatex = "\\sin^2\\alpha = \\frac{1 - \\cos 2\\alpha}{2}";
      break;
    case "cos2_a":
      formulaTitle = "余弦降幂公式";
      formulaLatex = "\\cos^2\\alpha = \\frac{1 + \\cos 2\\alpha}{2}";
      break;
  }
  return {
    alphaRad,
    doubleRad,
    sinAlpha,
    cosAlpha,
    tanAlpha,
    sin2Alpha,
    cos2Alpha,
    tan2Alpha,
    sinSqAlpha,
    cosSqAlpha,
    isTanDefined,
    formulaTitle,
    formulaLatex
  };
}
function calculateAuxiliary(a, b) {
  const amplitude = Math.sqrt(a * a + b * b);
  const isDegenerate = amplitude < 1e-6;
  if (isDegenerate) {
    return {
      a,
      b,
      amplitude: 0,
      phiRad: 0,
      phiDeg: 0,
      cosPhi: 1,
      sinPhi: 0,
      tanPhi: 0,
      isDegenerate: true,
      formulaLatex: "0\\cdot\\sin x + 0\\cdot\\cos x = 0"
    };
  }
  const phiRad = Math.atan2(b, a);
  let phiDeg = phiRad * RAD_TO_DEG;
  if (phiDeg < 0) phiDeg += 360;
  const cosPhi = a / amplitude;
  const sinPhi = b / amplitude;
  const tanPhi = Math.abs(a) > 1e-6 ? b / a : void 0;
  const aStr = a.toFixed(2).replace(/\.00$/, "");
  const bStr = b >= 0 ? `+ ${b.toFixed(2).replace(/\.00$/, "")}` : `- ${Math.abs(b).toFixed(2).replace(/\.00$/, "")}`;
  const ampStr = amplitude.toFixed(2).replace(/\.00$/, "");
  const phiDegStr = phiDeg.toFixed(1).replace(/\.0$/, "");
  const formulaLatex = `${aStr}\\sin x ${bStr}\\cos x = ${ampStr}\\sin(x + ${phiDegStr}^\\circ)`;
  return {
    a,
    b,
    amplitude,
    phiRad,
    phiDeg,
    cosPhi,
    sinPhi,
    tanPhi,
    isDegenerate: false,
    formulaLatex
  };
}
function buildTrigFormulasPanel(params, config) {
  const alphaDeg = params.alphaDeg ?? 45;
  const betaDeg = params.betaDeg ?? 30;
  const coeffA = params.coeffA ?? 1;
  const coeffB = params.coeffB ?? 1.73;
  const studyMode = config?.studyMode ?? "sum_diff";
  const sumDiffKey = config?.sumDiffKey ?? "cos_minus";
  const doubleAngleKey = config?.doubleAngleKey ?? "sin_2a";
  if (studyMode === "sum_diff") {
    const res = calculateSumDiff(alphaDeg, betaDeg, sumDiffKey);
    const quantities = [
      {
        label: "角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444"
      },
      {
        label: "角 β 角度",
        symbol: "\\beta",
        value: `${betaDeg}°`,
        color: "#D97706"
      },
      {
        label: "目标角",
        symbol: "\\theta",
        value: `${res.targetAngleDeg.toFixed(1)}°`,
        color: "#2563EB"
      },
      {
        label: "sin与cos值",
        symbol: "\\sin\\alpha, \\cos\\alpha",
        value: `sin=${res.sinAlpha.toFixed(3)}, cos=${res.cosAlpha.toFixed(3)}`,
        color: "#EF4444"
      },
      {
        label: "向量点积 (cos(α-β))",
        symbol: "\\vec{u} \\cdot \\vec{v}",
        value: res.dotProduct.toFixed(3),
        color: "#059669"
      },
      {
        label: "公式展开计算值",
        symbol: res.formulaTitle,
        value: res.isTanDefined ? res.resultVal.toFixed(3) : "无意义",
        color: "#2563EB",
        highlight: !res.isTanDefined ? "extreme" : void 0
      }
    ];
    const theorems = [
      {
        name: "两角和与差的三角公式",
        latex: res.formulaLatex,
        condition: "$任意实数角 \\alpha, \\beta \\in \\mathbb{R}$",
        note: "几何推导：单位圆上向量 $u=(\\cos\\alpha,\\sin\\alpha)$ 与 $v=(\\cos\\beta,\\sin\\beta)$ 的数量积即为 $\\cos(\\alpha-\\beta)$。",
        level: "core"
      },
      {
        name: "两角和差正切公式",
        latex: "\\tan(\\alpha \\pm \\beta) = \\frac{\\tan\\alpha \\pm \\tan\\beta}{1 \\mp \\tan\\alpha\\tan\\beta}",
        condition: "$\\alpha, \\beta, \\alpha\\pm\\beta \\neq k\\pi + \\frac{\\pi}{2}$",
        note: "变形应用：$\\tan\\alpha + \\tan\\beta = \\tan(\\alpha+\\beta)(1 - \\tan\\alpha \\tan\\beta)$。",
        level: "important"
      }
    ];
    const gaokaoPoints = [
      {
        text: "高考考点1：给值求值 —— 巧用拼角拆角 α = (α+β) - β 或 2α = (α+β) + (α-β)",
        importance: "gaokao"
      },
      {
        text: "高考考点2：给值求角 —— 注意三角函数值的单调区间与角的范围限制，防止多解或错解",
        importance: "gaokao"
      }
    ];
    const warnings = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "正切无意义警告：分母为 0 或某个角的正切无意义！",
        level: "danger"
      });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "两角和差口诀：正余余正符号同（sin），余余正正符号反（cos）！"
    };
  } else if (studyMode === "double_angle") {
    const res = calculateDoubleAngle(alphaDeg, doubleAngleKey);
    const quantities = [
      {
        label: "单角 α 角度",
        symbol: "\\alpha",
        value: `${alphaDeg}°`,
        color: "#EF4444"
      },
      {
        label: "倍角 2α 角度",
        symbol: "2\\alpha",
        value: `${(alphaDeg * 2 % 360 + 360) % 360}°`,
        color: "#2563EB"
      },
      {
        label: "sin 2α 二倍角",
        symbol: "\\sin 2\\alpha",
        value: res.sin2Alpha.toFixed(3),
        color: "#2563EB"
      },
      {
        label: "cos 2α 二倍角",
        symbol: "\\cos 2\\alpha",
        value: res.cos2Alpha.toFixed(3),
        color: "#D97706"
      },
      {
        label: "sin²α 正弦降幂",
        symbol: "\\sin^2\\alpha",
        value: `${res.sinSqAlpha.toFixed(3)} = \\frac{1 - (${res.cos2Alpha.toFixed(3)})}{2}`,
        color: "#059669"
      },
      {
        label: "cos²α 余弦降幂",
        symbol: "\\cos^2\\alpha",
        value: `${res.cosSqAlpha.toFixed(3)} = \\frac{1 + (${res.cos2Alpha.toFixed(3)})}{2}`,
        color: "#059669"
      }
    ];
    const theorems = [
      {
        name: "二倍角公式",
        latex: "\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha, \\quad \\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha",
        condition: "$\\alpha \\in \\mathbb{R}$",
        note: "在两角和公式中令 $\\beta = \\alpha$ 即可导出。$\\cos 2\\alpha$ 有三种表现形式，在升降幂中极具威力。",
        level: "core"
      },
      {
        name: "升降幂公式",
        latex: "\\sin^2\\alpha = \\frac{1-\\cos 2\\alpha}{2}, \\quad \\cos^2\\alpha = \\frac{1+cos 2\\alpha}{2}",
        condition: "用于高考化简中将二次项降为一次项，周期减半",
        note: "降幂升角：二次变一次，角度翻倍！",
        level: "important"
      }
    ];
    const gaokaoPoints = [
      {
        text: "高考考点1：三角函数化简求最值 —— 运用降幂公式与倍角公式将 f(x)=a sin²x + b sin x cos x 转化为 Asin(ωx+φ)+C",
        importance: "gaokao"
      },
      {
        text: "高考考点2：二倍角余弦三变式灵活运用（已知 cos α 求 cos 2α 等）",
        importance: "gaokao"
      }
    ];
    const warnings = [];
    if (!res.isTanDefined) {
      warnings.push({
        text: "二倍角正切无意义：cos 2α = 0，tan 2α 无意义！",
        level: "warning"
      });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "倍角降幂口诀：二次降一次，次数降一半，角度翻一番！"
    };
  } else {
    const res = calculateAuxiliary(coeffA, coeffB);
    const quantities = [
      {
        label: "正弦系数 a",
        symbol: "a",
        value: `${coeffA}`,
        color: "#EF4444"
      },
      {
        label: "余弦系数 b",
        symbol: "b",
        value: `${coeffB}`,
        color: "#D97706"
      },
      {
        label: "合成振幅 A",
        symbol: "A = \\sqrt{a^2+b^2}",
        value: res.amplitude.toFixed(3),
        color: "#2563EB",
        highlight: res.isDegenerate ? "extreme" : void 0
      },
      {
        label: "辅助角 φ (°)",
        symbol: "\\varphi",
        value: `${res.phiDeg.toFixed(1)}°`,
        color: "#059669"
      },
      {
        label: "cos φ 与 sin φ",
        symbol: "\\cos\\varphi, \\sin\\varphi",
        value: `cos=${res.cosPhi.toFixed(3)}, sin=${res.sinPhi.toFixed(3)}`,
        color: "#059669"
      },
      {
        label: "tan φ 值",
        symbol: "\\tan\\varphi = \\frac{b}{a}",
        value: res.tanPhi !== void 0 ? res.tanPhi.toFixed(3) : "∞",
        color: "#D97706"
      }
    ];
    const theorems = [
      {
        name: "辅助角公式 (Asin(ωx+φ) 化简法)",
        latex: "a\\sin x + b\\cos x = \\sqrt{a^2+b^2}\\sin(x+\\varphi)",
        condition: "$a^2 + b^2 \\neq 0, \\quad \\cos\\varphi = \\frac{a}{\\sqrt{a^2+b^2}}, \\quad \\sin\\varphi = \\frac{b}{\\sqrt{a^2+b^2}}$",
        note: "几何本质：平面向量 $(a, b)$ 极坐标化 $(A, \\varphi)$。两同频正弦波与余弦波叠加仍为同频正弦波！",
        level: "core"
      },
      {
        name: "辅助角函数的最值与周期",
        latex: "y_{max} = \\sqrt{a^2+b^2}, \\quad y_{min} = -\\sqrt{a^2+b^2}, \\quad T = 2\\pi",
        condition: "$x \\in \\mathbb{R}$",
        note: "高考中结合单调性与对称轴分析。",
        level: "important"
      }
    ];
    const gaokaoPoints = [
      {
        text: "高考大题必考：将复杂三角函数式化为 Asin(ωx+φ)+C 形式，进而求定义域、最值、单调区间与对称轴",
        importance: "gaokao"
      },
      {
        text: "辅助角象限确定：tan φ = b/a，φ 的象限由点 (a, b) 所在象限唯一确定！",
        importance: "gaokao"
      }
    ];
    const warnings = [];
    if (res.isDegenerate) {
      warnings.push({
        text: "退化警告：a = 0 且 b = 0，合成波形退化为恒等于 0 的直线！",
        level: "danger"
      });
    }
    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: "辅助角化简口诀：提模长 sqrt(a²+b²)，余弦正弦填角 φ，点(a,b)象限定符号！"
    };
  }
}
const EMPTY = {
  quantities: [],
  theorems: [],
  gaokaoPoints: [],
  warnings: []
};
function buildMathQuantities(animId, params, config) {
  switch (animId) {
    case "anim-trig-identity":
    case "anim-trig-unit-circle":
      return buildTrigIdentityPanel(params, config);
    case "anim-trig-formulas":
      return buildTrigFormulasPanel(params, config);
    case "anim-stat-percentile":
      return buildStatPercentilePanel(params, config);
    case "anim-paired-data":
      return buildPairedDataPanel(params, config);
    case "anim-probability-normal":
      return buildProbabilityNormalPanel(params, config);
    case "anim-probability-distribution":
      return buildProbabilityDistributionPanel(params, config);
    case "anim-probability-bayes":
      return buildProbabilityBayesPanel(params, config);
    case "anim-probability-counting":
      return buildProbabilityCountingPanel(params, config);
    case "anim-derivative-shift":
      return buildDerivativeShiftPanel(params, config);
    case "anim-derivative-transcendental":
      return buildTranscendentalPanel(params, config);
    case "anim-nike":
      return buildNikePanel(params, config);
    case "anim-quadratic":
      return buildQuadraticPanel(params, config);
    case "anim-derivative-tangent":
      return buildDerivativePanel(params, config);
    case "anim-constant-single":
      return buildConstantSinglePanel(params, config);
    case "anim-constant-double":
      return buildConstantDoublePanel(params, config);
    case "anim-set-venn":
    case "anim-logic-conditions":
      return buildSetPanel(params);
    case "anim-func-properties":
      return buildFuncPropertiesPanel(params, config);
    case "anim-func-explog":
      return buildFuncExpLogPanel(params, config);
    case "anim-func-zero":
      return buildFuncZeroPanel(params);
    case "anim-func-transform":
      return buildFuncTransformPanel(params, config);
    case "anim-func-composite":
      return buildFuncCompositePanel(params, config);
    case "anim-solid-angle":
    case "anim-solid-distance":
      return buildSpatialAnglePanel(params, config);
    case "anim-solid-position":
    case "anim-solid-surface-relation":
      return buildLinePlaneRelationPanel(params, config);
    case "anim-solid-section":
      return buildSectionPanel(params, config);
    case "anim-solid-ball":
      return buildCircumSpherePanel(params, config);
    case "anim-solid-rotation-body":
      return buildRotationBodyPanel(params);
    case "anim-vector3d-basis":
      return buildVector3DBasisPanel(params, config);
    case "anim-sequence":
    case "anim-sequence-geom":
    case "anim-sequence-recurrence":
    case "anim-sequence-sum":
      return buildSequencePanel(params, config);
    case "anim-conic-definition":
      return buildConicDefinitionPanel(params, config);
    case "anim-line-equation":
      return buildLineEquationPanel(params, config);
    case "anim-trig-lines":
      return buildTrigLinesPanel(params);
    default:
      return EMPTY;
  }
}
export {
  estimateHistogramStats as $,
  solveConstantSingleSepTrans as A,
  solveConstantSingleSep as B,
  solveConstantSingleDirectTrans as C,
  solveConstantSingleDirect as D,
  evalFTrans as E,
  evalGParamTrans as F,
  evalFTransC as G,
  evalFTransD as H,
  evalF as I,
  evalGParam as J,
  evalTransDerivative as K,
  solveConstantDouble as L,
  solveNike as M,
  evalNikeAt as N,
  solveImplicitZero as O,
  PRESET_FUNCTIONS as P,
  solveExtremumShift as Q,
  solveLogMean as R,
  getPascalTriangle as S,
  getAllBinomialTerms as T,
  perm as U,
  comb as V,
  buildMultiplicationTree as W,
  buildAdditionTree as X,
  getBinomialTerm as Y,
  factorial as Z,
  generateHistogramBins$1 as _,
  calcGeometricSequence as a,
  normalPdf as a0,
  calcIntervalProbability as a1,
  REGRESSION_PRESETS as a2,
  calculateLinearRegression as a3,
  INDEPENDENCE_PRESETS as a4,
  calculateIndependenceTest as a5,
  getLineDirection as a6,
  scale as a7,
  add as a8,
  normalize as a9,
  calculateAuxiliary as aA,
  cross as aa,
  sub as ab,
  dot as ac,
  lerp as ad,
  calculateParallelepipedVertices as ae,
  checkCoplanarCondition as af,
  cuboidCircumRadius as ag,
  regularPyramidCircumRadius as ah,
  coneCircumRadius as ai,
  isPointInCircle as aj,
  generateHistogramBins as ak,
  calculateHistogramStats as al,
  calculatePercentileShadeBins as am,
  calculateStratifiedSampling as an,
  convertFormToGeneral as ao,
  getLineSegmentInBounds as ap,
  getLineProperties as aq,
  calcPointToLineDistance as ar,
  calcTwoLinesRelation as as,
  calculateTrigLines as at,
  pointToAngleDeg$1 as au,
  calculateTrigIdentity as av,
  calculateInduction as aw,
  pointToAngleDeg as ax,
  calculateSumDiff as ay,
  calculateDoubleAngle as az,
  buildMathQuantities as b,
  calcArithmeticSequence as c,
  calcLinearRecurrence as d,
  calcAccumulationRecurrence as e,
  calcMultiplicationRecurrence as f,
  calcReciprocalRecurrence as g,
  calcSecondOrderRecurrence as h,
  calcArithGeoSplit as i,
  calcTelescoping as j,
  calcCrossTelescoping as k,
  calcGroupedSequence as l,
  calcOddEvenSequence as m,
  evalSecantSlope as n,
  evalSymmetryPeriod as o,
  evalFunctionParity as p,
  calculatePowerFunction as q,
  calculateExpLog as r,
  solveBisection as s,
  calculateTransform as t,
  evalBaseFunction as u,
  evalTransformedFunction as v,
  calculatePiecewise as w,
  calculateComposite as x,
  solveQuadratic as y,
  solveDerivative as z
};
