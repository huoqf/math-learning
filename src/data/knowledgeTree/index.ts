/**
 * src/data/knowledgeTree/index.ts
 * 知识树统一出口：按章节聚合各分片，导出完整知识树与索引查找。
 */
import type { KnowledgeNode } from "../types";
import { resolveSyllabus } from "../syllabus";
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
const rawNodes: KnowledgeNode[] = [
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

/**
 * 统一回填课标分册定位（SSOT：src/data/syllabus.ts）。
 * 节点如已显式声明 syllabus 则以显式声明为准，其余按章节/模块映射自动推导，
 * 从而保证 100% 覆盖，无需在各 builder / meta 中手写册次 badge。
 */
export const knowledgeTree: KnowledgeNode[] = rawNodes.map((node) => ({
  ...node,
  syllabus: node.syllabus ?? resolveSyllabus(node),
}));

export const knowledgeIndex: Record<string, KnowledgeNode> = {};

knowledgeTree.forEach((node) => {
  knowledgeIndex[node.id] = node;
});

export function getKnowledgeNode(id: string): KnowledgeNode | undefined {
  return knowledgeIndex[id];
}
