/**
 * src/features/sequence/components/SequenceText.ts
 * 数列实验室共享字符串工具：数字 → 下标/上标 Unicode
 */

/** 数字（或数字字符串）转下标 Unicode，如 5 → ₅ */
export const toSub = (n: number | string | undefined) =>
  n === undefined
    ? ""
    : String(n)
        .split("")
        .map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)] ?? c)
        .join("");

/** 数字（或数字字符串）转上标 Unicode，如 2 → ² */
export const toSup = (n: number | string | undefined) =>
  n === undefined
    ? ""
    : String(n)
        .split("")
        .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)] ?? c)
        .join("");
