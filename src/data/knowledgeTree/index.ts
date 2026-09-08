/**
 * src/data/knowledgeTree/index.ts
 * 知识树统一出口：按章节聚合各分片，导出完整知识树与索引查找。
 */
import type { KnowledgeNode } from "../types";
import { setLogicNodes } from "./setLogic";
import { inequalityNodes } from "./inequality";
import { functionNodes } from "./function";
import { derivativeNodes } from "./derivative";
import { trigNodes } from "./trig";
import { vectorComplexNodes } from "./vectorComplex";
import { sequenceNodes } from "./sequence";
import { solidNodes } from "./solid";
import { conicNodes } from "./conic";
import { probabilityNodes } from "./probability";
import { challengeNodes } from "./challenge";

// 顺序与导航展示层级一致（攻坚微专题固定追加于末尾）
export const knowledgeTree: KnowledgeNode[] = [
  ...setLogicNodes,
  ...inequalityNodes,
  ...functionNodes,
  ...derivativeNodes,
  ...trigNodes,
  ...vectorComplexNodes,
  ...sequenceNodes,
  ...solidNodes,
  ...conicNodes,
  ...probabilityNodes,
  ...challengeNodes,
];

export const knowledgeIndex: Record<string, KnowledgeNode> = {};

knowledgeTree.forEach((node) => {
  knowledgeIndex[node.id] = node;
});

export function getKnowledgeNode(id: string): KnowledgeNode | undefined {
  return knowledgeIndex[id];
}
