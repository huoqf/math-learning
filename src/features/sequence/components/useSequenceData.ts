/**
 * src/features/sequence/components/useSequenceData.ts
 * 数列实验室共享数据 hook：解析公共参数并通过 useMemo 计算全部数列数据。
 * 数据源与计算逻辑与原 SequenceScene 顶层完全一致。
 */
import { useMemo } from "react";
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
  calcReciprocalRecurrence,
  calcSecondOrderRecurrence,
} from "@/math/sequence";

export function useSequenceParams(params: Record<string, number>) {
  const a1 = params.a1 ?? 3;
  const d = params.d ?? -1;
  const q = params.q ?? 0.5;
  const N = Math.max(3, Math.min(15, Math.round(params.N ?? 8)));
  const kSegment = params.kSegment ?? 3;
  const gaussRatio = params.gaussRatio ?? 1;
  const sumStep = params.sumStep ?? 1;
  const teleGap = params.teleGap ?? 1;
  const p_rec = params.p_rec ?? 2;
  const q_rec = params.q_rec ?? 1;
  const a2 = params.a2 ?? 2;
  const coefA = params.coefA ?? 2;
  const coefB = params.coefB ?? 1;
  const coefC = params.coefC ?? 1;

  // 计算数列数据
  const arithData = useMemo(
    () => calcArithmeticSequence(a1, d, N, kSegment),
    [a1, d, N, kSegment],
  );
  const geoData = useMemo(
    () => calcGeometricSequence(a1, q, N, kSegment),
    [a1, q, N, kSegment],
  );
  const linearRecData = useMemo(
    () => calcLinearRecurrence(a1, p_rec, q_rec, N),
    [a1, p_rec, q_rec, N],
  );
  const accumRecData = useMemo(
    () => calcAccumulationRecurrence(a1, "linear", d, N),
    [a1, d, N],
  );
  const multRecData = useMemo(
    () => calcMultiplicationRecurrence(a1, "n_over_n1", N),
    [a1, N],
  );
  const recipRecData = useMemo(
    () => calcReciprocalRecurrence(a1, coefA, coefB, coefC, N),
    [a1, coefA, coefB, coefC, N],
  );
  const secondRecData = useMemo(
    () => calcSecondOrderRecurrence(a1, a2, p_rec, q_rec, N),
    [a1, a2, p_rec, q_rec, N],
  );

  const arithGeoData = useMemo(
    () => calcArithGeoSplit(a1, d, q, N),
    [a1, d, q, N],
  );
  const telescopingData = useMemo(() => calcTelescoping(N), [N]);
  const crossTelescopingData = useMemo(() => calcCrossTelescoping(N), [N]);
  const groupedData = useMemo(
    () => calcGroupedSequence(a1, d, q, N),
    [a1, d, q, N],
  );
  const oddEvenData = useMemo(() => calcOddEvenSequence(N), [N]);
  const absSumData = useMemo(() => calcAbsSumSequence(a1, d, N), [a1, d, N]);
  const radicalTeleData = useMemo(() => calcRadicalTelescoping(N), [N]);

  return {
    a1,
    d,
    q,
    N,
    kSegment,
    gaussRatio,
    sumStep,
    teleGap,
    p_rec,
    q_rec,
    a2,
    coefA,
    coefB,
    coefC,
    arithData,
    geoData,
    linearRecData,
    accumRecData,
    multRecData,
    recipRecData,
    secondRecData,
    arithGeoData,
    telescopingData,
    crossTelescopingData,
    groupedData,
    oddEvenData,
    absSumData,
    radicalTeleData,
  };
}
