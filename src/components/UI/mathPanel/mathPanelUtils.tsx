import React from "react";
import { KatexFormula } from "../KatexFormula";
import { createDepthState, advanceLatexDepth, isTopLevel } from "../latexUtils";

/**
 * 混合内容渲染：中文句子中用 $...$ 标记数学片段，其余纯文本正常换行。
 * 若为包含 LaTeX 命令的表达式，自动作为 KaTeX 公式渲染。
 */
export function renderMixedLatex(text: string): React.ReactNode {
  if (!text) return null;

  // 1. 若文本中显式包含 $...$ 数学定界符，严格按 $...$ 切分混合渲染
  if (text.includes("$")) {
    const parts = text.split(/(\$[^$]+\$)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("$") && part.endsWith("$")) {
            const formula = part.slice(1, -1).trim();
            if (!formula) return null;
            return (
              <KatexFormula
                key={i}
                formula={formula}
                mode="inline"
                className="!my-0 !mx-0.5"
              />
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </>
    );
  }

  // 2. 若无中文字符且包含 LaTeX 命令或数学运算符，作为整段公式渲染
  if (
    !/[\u4e00-\u9fa5]/.test(text) &&
    (/\\[a-zA-Z]|[_^]\{?[\w]|=|<|>|\+|-|\*|\//.test(text) ||
      text.includes("\\text{"))
  ) {
    return (
      <KatexFormula formula={text} mode="inline" className="!my-0 !mx-0.5" />
    );
  }

  // 3. 若无 $ 但包含反斜杠 LaTeX 控制序列（如 \triangle, \vec 等），按「公式原子」拆分渲染
  if (/\\[a-zA-Z]+/.test(text)) {
    const isCJK = (ch: string) =>
      /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch);
    const runs: Array<{ math: boolean; content: string }> = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] === "\\") {
        let j = i;
        let buf = "";
        const depthState = createDepthState();
        while (j < text.length) {
          if (isTopLevel(depthState) && isCJK(text[j])) break;
          const step = advanceLatexDepth(text, j, depthState);
          buf += text.slice(j, j + step);
          j += step;
        }
        runs.push({ math: true, content: buf.trimEnd() });
        i = j;
      } else {
        let j = i;
        while (j < text.length && text[j] !== "\\") j++;
        runs.push({ math: false, content: text.slice(i, j) });
        i = j;
      }
    }
    return (
      <>
        {runs.map((run, idx) => {
          if (run.math && run.content) {
            return (
              <KatexFormula
                key={idx}
                formula={run.content}
                mode="inline"
                className="!my-0 !mx-0.5"
              />
            );
          }
          return <React.Fragment key={idx}>{run.content}</React.Fragment>;
        })}
      </>
    );
  }

  // 4. 纯文本原样输出
  return text;
}

/** 宽松检测：\cmd 命令、\, \; \! 间距命令或 _^ 上下标即视为 LaTeX */
export function hasLatex(text: string): boolean {
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return text.includes("$") || text.includes("\\text{");
  }
  return /\\[a-zA-Z]|\\[,;!]|[_^]\{?[\w]|=|<|>|\+|-|\*/.test(text);
}
