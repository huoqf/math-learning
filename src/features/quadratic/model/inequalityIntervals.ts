/**
 * src/features/quadratic/model/inequalityIntervals.ts
 * 一元二次不等式解区间计算（纯函数，零外部依赖）
 */

export interface SolutionInterval {
  x1: number;
  x2: number;
  isLeftInfinity?: boolean;
  isRightInfinity?: boolean;
}

/** 计算一元二次不等式的数学满足区间列表 */
export function getSolutionIntervals(
  a: number,
  b: number,
  c: number,
  ineqType: ">" | "<",
  xMin: number,
  xMax: number,
  roots: number[],
): SolutionInterval[] {
  const intervals: SolutionInterval[] = [];

  if (Math.abs(a) > 1e-9) {
    if (roots.length === 2) {
      const r1 = roots[0];
      const r2 = roots[1];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: r1, x2: r2 });
        }
      } else {
        // ineqType === '<'
        if (a > 0) {
          intervals.push({ x1: r1, x2: r2 });
        } else {
          intervals.push({ x1: xMin - 1, x2: r1, isLeftInfinity: true });
          intervals.push({ x1: r2, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else if (roots.length === 1) {
      const r0 = roots[0];
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      } else {
        // ineqType === '<'
        if (a < 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      // roots.length === 0
      if (ineqType === ">") {
        if (a > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      } else {
        // ineqType === '<'
        if (a < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      }
    }
  } else {
    // a === 0 退化为 bx + c
    if (Math.abs(b) > 1e-9) {
      const r0 = -c / b;
      if (ineqType === ">") {
        if (b > 0) {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        } else {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        }
      } else {
        // ineqType === '<'
        if (b > 0) {
          intervals.push({ x1: xMin - 1, x2: r0, isLeftInfinity: true });
        } else {
          intervals.push({ x1: r0, x2: xMax + 1, isRightInfinity: true });
        }
      }
    } else {
      // b === 0 => c
      if (ineqType === ">") {
        if (c > 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      } else {
        // ineqType === '<'
        if (c < 0) {
          intervals.push({
            x1: xMin - 1,
            x2: xMax + 1,
            isLeftInfinity: true,
            isRightInfinity: true,
          });
        }
      }
    }
  }
  return intervals;
}
