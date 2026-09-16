import React from "react";
import { KatexFormula } from "../KatexFormula";
import { createDepthState, advanceLatexDepth, isTopLevel } from "../latexUtils";

/**
 * 混合内容渲染：中文句子中用 $...$ 标记数学片段，其余纯文本正常换行。
 * 若为包含 LaTeX 命令的表达式，自动作为 KaTeX 公式渲染。
 *
 * @param options.responsive 行内公式是否启用自适应缩放（默认 true）。
 *   在 `truncate`（单行 + 省略号）之类的容器中必须传 false：
 *   此时行内公式作为 inline-flex 盒参与行内 fit-content 协商，
 *   会被行内剩余空间挤压到几像素宽，自适应缩放随即把公式缩到不可读的字号。
 *   单行标题场景的正确行为是保持自然字号，由文本省略号负责截断。
 */
export function renderMixedLatex(
  text: string,
  options: { responsive?: boolean } = {},
): React.ReactNode {
  const { responsive = true } = options;
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
                responsive={responsive}
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
      <KatexFormula
        formula={text}
        mode="inline"
        responsive={responsive}
        className="!my-0 !mx-0.5"
      />
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
                responsive={responsive}
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

/**
 * 将含 $...$ 定界符与 LaTeX 命令的文本降级为可读纯文本。
 * 仅供 title / aria-label 等「只能承载纯文本」的属性使用——
 * 这些属性不会走 KaTeX 渲染，若原样传入会在悬停提示中暴露 $x_0$、\color{...} 之类的标记。
 */
export function toPlainMathText(text: string): string {
  if (!text) return "";
  let s = text.replace(/\\color\{[^}]*\}/g, "");
  s = s.replace(/\\text\{([^}]*)\}/g, "$1");
  s = s.replace(/\$([^$\n]*)\$/g, "$1");
  s = s.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1");
  s = s.replace(/\\[a-zA-Z]+/g, "");
  s = s.replace(/[{}]/g, "");
  return s.replace(/\s+/g, " ").trim();
}
