import { describe, it, expect } from "vitest";
import {
  calcArithmeticSequence,
  calcGeometricSequence,
  calcArithGeoSplit,
  calcTelescoping,
  calcGroupedSequence,
  calcCrossTelescoping,
  calcOddEvenSequence,
  calcAbsSumSequence,
  calcRadicalTelescoping,
  calcLinearRecurrence,
  calcAccumulationRecurrence,
  calcMultiplicationRecurrence,
  calcNonHomogeneousExpRecurrence,
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
} from "./sequence";

describe("Sequence Math Calculations — 高中数学数列核心计算与高考模型测试", () => {
  // ==========================================
  // 1. 等差数列及其函数性质
  // ==========================================
  describe("1. 等差数列 (Arithmetic Sequence)", () => {
    it("应正确计算常规等差数列通项 an、前 n 项和 Sn 及母函数", () => {
      const res = calcArithmeticSequence(2, 3, 5);
      expect(res.isValid).toBe(true);
      expect(res.terms.length).toBe(5);
      expect(res.terms[0].an).toBe(2);
      expect(res.terms[4].an).toBe(14);
      expect(res.terms[4].Sn).toBe(40);
      expect(res.lineFn(1)).toBe(2);
      expect(res.lineFn(5)).toBe(14);
      expect(res.parabolaFn(1)).toBe(2);
      expect(res.parabolaFn(5)).toBe(40);
    });

    it("公差 d < 0 时应正确求出 Sn 最大值、变号零点与正项分界点", () => {
      const res = calcArithmeticSequence(7, -2, 6);
      expect(res.maxSnInfo?.nMax).toBe(4);
      expect(res.maxSnInfo?.maxSn).toBe(16);
      expect(res.continuousAxis).toBeCloseTo(4, 4);
      expect(res.lastPositiveN).toBe(4);
      expect(res.zeroPointExact).toBeCloseTo(4.5, 4);
    });

    it("对称轴为半整数时应正确识别双最大值 (如 S3 = S4)", () => {
      // a1 = 6, d = -2 => terms: 6, 4, 2, 0, -2 => S3 = 12, S4 = 12
      const res = calcArithmeticSequence(6, -2, 5);
      expect(res.continuousAxis).toBe(3.5);
      expect(res.maxSnInfo?.isDual).toBe(true);
      expect(res.maxSnInfo?.nMax).toBe(3);
      expect(res.maxSnInfo?.dualN).toBe(4);
      expect(res.maxSnInfo?.maxSn).toBe(12);
    });

    it("公差 d > 0 时应正确求出 Sn 最小值与单调递增性", () => {
      // a1 = -5, d = 2, N = 5 => terms: -5, -3, -1, 1, 3 => Sn: -5, -8, -9, -8, -5
      const res = calcArithmeticSequence(-5, 2, 5);
      expect(res.isValid).toBe(true);
      expect(res.maxSnInfo?.nMax).toBe(3);
      expect(res.maxSnInfo?.maxSn).toBe(-9);
    });

    it("应正确计算绝对值和 Tn 与等长片段和性质 (公差为 k^2 * d)", () => {
      // a1 = 5, d = -2, N = 6 => an: 5, 3, 1, -1, -3, -5
      // Sn: 5, 8, 9, 8, 5, 0
      // Tn: 5, 8, 9, 10, 13, 18
      const res = calcArithmeticSequence(5, -2, 6, 3);
      expect(res.terms[0].Tn).toBe(5);
      expect(res.terms[2].Tn).toBe(9);
      expect(res.terms[3].Tn).toBe(10);
      expect(res.terms[5].Tn).toBe(18);

      // 片段和 k = 3: Seg 1 (n=1..3, sum=9), Seg 2 (n=4..6, sum=-9) => 公差 Δ = 3^2 * (-2) = -18
      expect(res.segmentedSums).not.toBeNull();
      expect(res.segmentedSums?.segments.length).toBe(2);
      expect(res.segmentedSums?.segments[0].sumValue).toBe(9);
      expect(res.segmentedSums?.segments[1].sumValue).toBe(-9);
      expect(res.segmentedSums?.diff).toBe(-18);
    });

    it("应妥善处理异常与退化输入 (N <= 0 或 d = 0)", () => {
      const invalidRes = calcArithmeticSequence(1, 1, 0);
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.terms.length).toBe(0);

      // d = 0 退化常数列
      const constRes = calcArithmeticSequence(3, 0, 4);
      expect(constRes.isValid).toBe(true);
      expect(constRes.terms[3].Sn).toBe(12);
      expect(constRes.continuousAxis).toBeNull();
    });
  });

  // ==========================================
  // 2. 等比数列及其指数性质
  // ==========================================
  describe("2. 等比数列 (Geometric Sequence)", () => {
    it("应正确计算衰减收敛型等比数列 (0 < q < 1)、极限和与乘积双最大值", () => {
      const res = calcGeometricSequence(4, 0.5, 4, 2);
      expect(res.isValid).toBe(true);
      expect(res.terms[0].an).toBe(4);
      expect(res.terms[3].an).toBe(0.5);
      expect(res.terms[3].Sn).toBe(7.5);
      expect(res.terms[0].Pn).toBe(4);
      expect(res.terms[1].Pn).toBe(8);
      expect(res.terms[2].Pn).toBe(8); // a3 = 1 => dual max P2 = P3 = 8
      expect(res.terms[3].Pn).toBe(4);
      expect(res.limitSum).toBe(8);
      expect(res.qType).toBe("decay");
      expect(res.maxPnInfo?.nMax).toBe(2);
      expect(res.maxPnInfo?.maxPn).toBe(8);

      // 等长片段和: Seg 1 (n=1..2, sum=6), Seg 2 (n=3..4, sum=1.5) => ratio = 0.25 (q^2)
      expect(res.segmentedSums).not.toBeNull();
      expect(res.segmentedSums?.segments[0].sumValue).toBe(6);
      expect(res.segmentedSums?.segments[1].sumValue).toBe(1.5);
      expect(res.segmentedSums?.ratio).toBeCloseTo(0.25, 4);

      // 错位相减数据
      expect(res.staggerData.diffLeft.val).toBe(4);
      expect(res.staggerData.diffRight.val).toBe(4 * Math.pow(0.5, 4));
    });

    it("应正确计算指数增长型等比数列 (q > 1) 与乘积极小值 (a1 < 1)", () => {
      // a1 = 0.25, q = 2, N = 4 => an: 0.25, 0.5, 1, 2 => Pn: 0.25, 0.125, 0.125, 0.25
      const res = calcGeometricSequence(0.25, 2, 4);
      expect(res.qType).toBe("growth");
      expect(res.limitSum).toBeNull();
      expect(res.terms[3].an).toBe(2);
      expect(res.terms[3].Sn).toBe(3.75);
      expect(res.maxPnInfo?.isMax).toBe(false); // 极小值
      expect(res.maxPnInfo?.nMax).toBe(2);
      expect(res.maxPnInfo?.maxPn).toBe(0.125);
    });

    it("应正确识别负公比衰减震荡 (-1 < q < 0)", () => {
      const res = calcGeometricSequence(2, -0.5, 4);
      expect(res.terms[0].an).toBe(2);
      expect(res.terms[1].an).toBe(-1);
      expect(res.terms[2].an).toBe(0.5);
      expect(res.terms[3].an).toBe(-0.25);
      expect(res.limitSum).toBeCloseTo(2 / 1.5, 4);
      expect(res.qType).toBe("oscillate-decay");
    });

    it("应正确识别周期摆动 (q = -1) 与发散震荡 (q < -1)", () => {
      const periodRes = calcGeometricSequence(3, -1, 4);
      expect(periodRes.qType).toBe("oscillate-period");
      expect(periodRes.terms[0].Sn).toBe(3);
      expect(periodRes.terms[1].Sn).toBe(0);
      expect(periodRes.terms[2].Sn).toBe(3);
      expect(periodRes.terms[3].Sn).toBe(0);

      const divergeRes = calcGeometricSequence(1, -2, 3);
      expect(divergeRes.qType).toBe("oscillate-diverge");
      expect(divergeRes.terms[2].an).toBe(4);
    });

    it("应正确识别退化常数列 (q = 1) 与公比为 0 的边界", () => {
      const constRes = calcGeometricSequence(3, 1, 5);
      expect(constRes.qType).toBe("constant");
      expect(constRes.terms[4].Sn).toBe(15);

      const zeroQRes = calcGeometricSequence(5, 0, 4);
      expect(zeroQRes.isValid).toBe(true);
      expect(zeroQRes.terms[0].an).toBe(5);
      expect(zeroQRes.terms[1].an).toBe(0);
      expect(zeroQRes.terms[1].lnAn).toBeNull();
    });
  });

  // ==========================================
  // 3. 高考五大求和模型
  // ==========================================
  describe("3. 高考数列求和模型 (Summation Models)", () => {
    it("模型一：错位相减法 (差比数列求和)", () => {
      // cn = (1 + (n-1)*2) * (0.5)^(n-1) => c1 = 1, c2 = 3*0.5=1.5, c3 = 5*0.25=1.25
      const res = calcArithGeoSplit(1, 2, 0.5, 3);
      expect(res.isValid).toBe(true);
      expect(res.terms[0].cn).toBe(1);
      expect(res.terms[1].cn).toBe(1.5);
      expect(res.terms[2].cn).toBe(1.25);
      expect(res.terms[2].Tn).toBe(3.75);
    });

    it("模型二：标准裂项相消法 (分母差为 1)", () => {
      // cn = 1 / (n*(n+1)) = 1/n - 1/(n+1)
      const res = calcTelescoping(4);
      expect(res.isValid).toBe(true);
      expect(res.terms[0].partA).toBe(1);
      expect(res.terms[0].partB).toBe(0.5);
      expect(res.terms[3].Tn).toBe(0.8); // 1 - 1/5 = 0.8
      expect(res.limitSum).toBe(1);
    });

    it("模型三：跨项裂项相消法 (分母差为 2)", () => {
      // cn = 1 / (n*(n+2)) = 0.5 * (1/n - 1/(n+2))
      const res = calcCrossTelescoping(4);
      expect(res.isValid).toBe(true);
      expect(res.limitSum).toBe(0.75); // 0.5 * (1 + 1/2) = 0.75
      expect(res.terms[0].cn).toBeCloseTo(1 / 3, 4);
      // T4 = 0.5 * (1 + 1/2 - 1/5 - 1/6) = 0.5 * (1.5 - 0.2 - 0.166667) = 0.5 * 1.13333 = 0.56667
      expect(res.terms[3].Tn).toBeCloseTo(0.56667, 4);
    });

    it("模型四：根式有理化裂项相消法", () => {
      // cn = 1 / (sqrt(n) + sqrt(n+1)) = sqrt(n+1) - sqrt(n)
      const res = calcRadicalTelescoping(3);
      expect(res.isValid).toBe(true);
      expect(res.terms.length).toBe(3);
      // T3 = sqrt(4) - 1 = 1
      expect(res.finalTn).toBe(1);
      expect(res.terms[2].Tn).toBeCloseTo(1, 4);
    });

    it("模型五：分组转化求和法", () => {
      // cn = (2 + (n-1)*2) + 2^(n-1) = 2n + 2^(n-1) => c1=3, c2=6, c3=10
      const res = calcGroupedSequence(2, 2, 2, 3);
      expect(res.isValid).toBe(true);
      expect(res.terms[0].cn).toBe(3);
      expect(res.terms[1].cn).toBe(6);
      expect(res.terms[2].cn).toBe(10);
      expect(res.terms[2].Tn).toBe(19);
      expect(res.terms[2].San).toBe(12); // 2 + 4 + 6 = 12
      expect(res.terms[2].Sbn).toBe(7); // 1 + 2 + 4 = 7
    });

    it("模型六：奇偶并项求和法 (摆动交替数列)", () => {
      // cn = (-1)^n * n => c1=-1, c2=2, c3=-3, c4=4, c5=-5
      const res = calcOddEvenSequence(5);
      expect(res.isValid).toBe(true);
      expect(res.terms[0].cn).toBe(-1);
      expect(res.terms[1].cn).toBe(2);
      expect(res.terms[1].pairSum).toBe(1);
      expect(res.terms[3].pairSum).toBe(1);
      expect(res.terms[3].Tn).toBe(2); // S4 = 1 + 1 = 2
      expect(res.terms[4].Tn).toBe(-3); // S5 = 2 - 5 = -3
    });

    it("模型七：绝对值变号分段求和法 (正变负 posToNeg 与 负变正 negToPos)", () => {
      // 1. 正变负：a1 = 5, d = -2 => 5, 3, 1, -1, -3
      const posToNeg = calcAbsSumSequence(5, -2, 5);
      expect(posToNeg.isValid).toBe(true);
      expect(posToNeg.zeroPoint).toBe(3.5);
      expect(posToNeg.n0).toBe(3);
      expect(posToNeg.signChangeType).toBe("posToNeg");
      expect(posToNeg.terms[2].absAn).toBe(1);
      expect(posToNeg.terms[3].absAn).toBe(1);
      expect(posToNeg.terms[3].isNegative).toBe(true);
      expect(posToNeg.terms[4].Tn).toBe(13); // 5+3+1+1+3 = 13

      // 2. 负变正：a1 = -5, d = 2 => -5, -3, -1, 1, 3
      const negToPos = calcAbsSumSequence(-5, 2, 5);
      expect(negToPos.signChangeType).toBe("negToPos");
      expect(negToPos.n0).toBe(3);
      expect(negToPos.terms[0].isNegative).toBe(true);
      expect(negToPos.terms[2].isNegative).toBe(true);
      expect(negToPos.terms[3].isNegative).toBe(false);
      expect(negToPos.terms[4].Tn).toBe(13);

      // 3. 恒正与恒负
      const allPos = calcAbsSumSequence(2, 3, 4);
      expect(allPos.signChangeType).toBe("allPositive");
      const allNeg = calcAbsSumSequence(-2, -3, 4);
      expect(allNeg.signChangeType).toBe("allNegative");
    });
  });

  // ==========================================
  // 4. 高考递推数列与构造法求通项
  // ==========================================
  describe("4. 高考递推数列与构造求通项 (Recurrence & Construction)", () => {
    it("递推模型 1：一阶常系数线性递推 a_{n+1} = p*a_n + q (不动点待定平移法)", () => {
      // a1 = 3, p = 2, q = 1 => c = 1 / (1-2) = -1
      // an: a1=3, a2=7, a3=15, a4=31
      // bn = an - c = an + 1: b1=4, b2=8, b3=16, b4=32
      const res = calcLinearRecurrence(3, 2, 1, 4);
      expect(res.isValid).toBe(true);
      expect(res.fixedPoint).toBe(-1);
      expect(res.terms[0].an).toBe(3);
      expect(res.terms[1].an).toBe(7);
      expect(res.terms[2].an).toBe(15);
      expect(res.terms[3].an).toBe(31);
      expect(res.terms[0].bn).toBe(4);
      expect(res.terms[3].bn).toBe(32);
      expect(res.cobwebPoints.length).toBe(9); // 初始点 + 4*(垂直+水平) = 9
    });

    it("递推模型 1 退化：p = 1 时退化为等差数列", () => {
      const res = calcLinearRecurrence(2, 1, 3, 4);
      expect(res.isDegenerateArith).toBe(true);
      expect(res.fixedPoint).toBeNull();
      expect(res.terms[0].an).toBe(2);
      expect(res.terms[1].an).toBe(5);
      expect(res.terms[2].an).toBe(8);
    });

    it("递推模型 2：累加法 a_{n+1} = a_n + f(n) (等差、指数、裂项三种增量)", () => {
      // 1. 等差增量 f(n) = 2n => a1=1, a2=3, a3=7, a4=13 (an = 1 + 2*n*(n-1)/2 = n^2 - n + 1)
      const resLinear = calcAccumulationRecurrence(1, "linear", 2, 4);
      expect(resLinear.isValid).toBe(true);
      expect(resLinear.terms[0].an).toBe(1);
      expect(resLinear.terms[1].an).toBe(3);
      expect(resLinear.terms[2].an).toBe(7);
      expect(resLinear.terms[3].an).toBe(13);

      // 2. 指数增量 f(n) = 2^n => a1=1, a2=1+2=3, a3=3+4=7, a4=7+8=15 (an = 2^n - 1)
      const resExp = calcAccumulationRecurrence(1, "geometric", 2, 4);
      expect(resExp.terms[3].an).toBe(15);

      // 3. 裂项增量 f(n) = 1/(n(n+1)) => a1=1, a2=1+1/2=1.5, a3=1.5+1/6=5/3 (an = 1 + 1 - 1/n = 2 - 1/n)
      const resTele = calcAccumulationRecurrence(1, "telescoping", 1, 3);
      expect(resTele.terms[2].an).toBeCloseTo(2 - 1 / 3, 4);
    });

    it("递推模型 3：累乘法 a_{n+1} = f(n)*a_n (n/(n+1)、(n+1)/n、2^n)", () => {
      // 1. f(n) = n/(n+1) => an = a1/n => a1=1, a2=0.5, a3=1/3, a4=0.25
      const res1 = calcMultiplicationRecurrence(1, "n_over_n1", 4);
      expect(res1.isValid).toBe(true);
      expect(res1.terms[0].an).toBe(1);
      expect(res1.terms[1].an).toBe(0.5);
      expect(res1.terms[2].an).toBeCloseTo(1 / 3, 4);
      expect(res1.terms[3].an).toBe(0.25);

      // 2. f(n) = (n+1)/n => an = n * a1 => a1=2, a2=4, a3=6, a4=8
      const res2 = calcMultiplicationRecurrence(2, "n1_over_n", 4);
      expect(res2.terms[3].an).toBe(8);

      // 3. f(n) = 2^n => an = a1 * 2^(n(n-1)/2) => a1=1, a2=2, a3=8, a4=64
      const res3 = calcMultiplicationRecurrence(1, "pow_two", 4);
      expect(res3.terms[0].an).toBe(1);
      expect(res3.terms[1].an).toBe(2);
      expect(res3.terms[2].an).toBe(8);
      expect(res3.terms[3].an).toBe(64);
    });

    it("递推模型 4：指数非齐次递推 a_{n+1} = p*a_n + q*r^n (同除构造法与共振临界)", () => {
      // 1. 共振情形 p = r = 2: a1=1, p=2, q=1, r=2
      // a_{n+1} = 2a_n + 2^n => a1=1, a2=2+2=4, a3=8+4=12, a4=24+8=32
      // 理论通项 an = [a1 + (n-1)q] * p^(n-1) = n * 2^(n-1) => a1=1, a2=4, a3=12, a4=32
      const resResonant = calcNonHomogeneousExpRecurrence(1, 2, 1, 2, 4);
      expect(resResonant.isValid).toBe(true);
      expect(resResonant.isResonant).toBe(true);
      expect(resResonant.terms[0].an).toBe(1);
      expect(resResonant.terms[1].an).toBe(4);
      expect(resResonant.terms[2].an).toBe(12);
      expect(resResonant.terms[3].an).toBe(32);
      // bn = an / 2^n: b1=0.5, b2=1.0, b3=1.5, b4=2.0 (公差 d = 0.5 的等差数列)
      expect(resResonant.terms[0].bn).toBe(0.5);
      expect(resResonant.terms[3].bn).toBe(2.0);

      // 2. 非共振情形 p != r: a1=2, p=2, q=1, r=3
      // a_{n+1} = 2a_n + 3^n => a1=2, a2=2*2+3=7, a3=2*7+9=23, a4=2*23+27=73
      const resNonRes = calcNonHomogeneousExpRecurrence(2, 2, 1, 3, 4);
      expect(resNonRes.isResonant).toBe(false);
      expect(resNonRes.terms[0].an).toBe(2);
      expect(resNonRes.terms[1].an).toBe(7);
      expect(resNonRes.terms[2].an).toBe(23);
      expect(resNonRes.terms[3].an).toBe(73);
    });

    it("递推模型 5：倒数与分式递推构造法 a_{n+1} = A*a_n / (B*a_n + C)", () => {
      // 1. A = C = 1 (等差倒数型): a1=1, A=1, B=1, C=1 => 1/a_{n+1} = 1/a_n + 1 => bn = n => a_n = 1/n
      const res1 = calcReciprocalRecurrence(1, 1, 1, 1, 3);
      expect(res1.isValid).toBe(true);
      expect(res1.isReciprocalLinear).toBe(true);
      expect(res1.terms[0].an).toBe(1);
      expect(res1.terms[1].an).toBe(0.5);
      expect(res1.terms[2].an).toBeCloseTo(1 / 3, 4);
      expect(res1.terms[2].bn).toBeCloseTo(3, 4);

      // 2. A != C (一阶线性倒数型): a1=1, A=2, B=1, C=1 => 1/a_{n+1} = 0.5*(1/a_n) + 0.5
      // b1=1, b2=0.5*1+0.5=1, b3=1 => 稳态常数列 an=1
      const res2 = calcReciprocalRecurrence(1, 2, 1, 1, 3);
      expect(res2.isReciprocalLinear).toBe(false);
      expect(res2.terms[2].an).toBe(1);
      expect(res2.fixedPoints).toContain(0);
      expect(res2.fixedPoints).toContain(1); // 不动点 (2-1)/1 = 1
    });

    it("递推模型 6：二阶常系数线性递推 a_{n+2} = p*a_{n+1} + q*a_n (特征方程与降阶构造)", () => {
      // 1. 斐波那契模型 (p=1, q=1, Δ=5 > 0): a1=1, a2=1 => 1, 1, 2, 3, 5, 8
      const fibRes = calcSecondOrderRecurrence(1, 1, 1, 1, 6);
      expect(fibRes.isValid).toBe(true);
      expect(fibRes.terms[0].an).toBe(1);
      expect(fibRes.terms[1].an).toBe(1);
      expect(fibRes.terms[2].an).toBe(2);
      expect(fibRes.terms[3].an).toBe(3);
      expect(fibRes.terms[4].an).toBe(5);
      expect(fibRes.terms[5].an).toBe(8);

      // 2. 经典高考题模型：a_{n+2} = 3a_{n+1} - 2a_n (特征根 r1=2, r2=1)
      // a1=1, a2=3 => a3=3*3-2*1=7, a4=3*7-2*3=15, a5=3*15-2*7=31 (an = 2^n - 1)
      const classicRes = calcSecondOrderRecurrence(1, 3, 3, -2, 5);
      expect(classicRes.delta).toBe(1); // p^2 + 4q = 9 - 8 = 1
      expect(classicRes.r1).toBe(2);
      expect(classicRes.r2).toBe(1);
      expect(classicRes.terms[2].an).toBe(7);
      expect(classicRes.terms[3].an).toBe(15);
      expect(classicRes.terms[4].an).toBe(31);
      // 降阶等比数列 bn = a_{n+1} - 2*an => b1 = 3 - 2 = 1, b2 = 7 - 6 = 1, b3 = 15 - 14 = 1 (公比 r2 = 1)
      expect(classicRes.terms[0].bn).toBe(1);
      expect(classicRes.terms[1].bn).toBe(1);
      expect(classicRes.terms[2].bn).toBe(1);
    });
  });
});
