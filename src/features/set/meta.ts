import type { KnowledgeNode } from "@/data/types";

/**
 * Set feature — 知识节点声明（纯数据，可序列化）
 *
 * 路由映射：
 *   /set → SetVennPage（集合的基本运算）
 *   /set-logic → SetLogicPage（充分必要条件）
 *   /set-quantifiers → SetQuantifiersPage（全称量词与存在量词及其否定）
 */
export const vennNode: KnowledgeNode = {
  id: "know-set-venn",
  title: "集合的基本运算与 Venn 图",
  labTitle: "集合运算实验室",
  chapter: "集合与常用逻辑",
  module: "集合运算",
  importance: "basic",
  animationIds: ["anim-set-venn"],
  prerequisites: [],
  route: "/set",
};

export const logicNode: KnowledgeNode = {
  id: "know-logic-conditions",
  title: "充分必要条件与 Venn 包含图",
  labTitle: "充分必要条件实验室",
  chapter: "集合与常用逻辑",
  module: "常用逻辑用语",
  importance: "basic",
  animationIds: ["anim-logic-conditions"],
  prerequisites: [],
  route: "/set-logic",
};

export const quantifiersNode: KnowledgeNode = {
  id: "know-logic-quantifiers",
  title: "全称量词与存在量词及其否定",
  labTitle: "全称与存在量词实验室",
  chapter: "集合与常用逻辑",
  module: "常用逻辑用语",
  importance: "basic",
  animationIds: ["anim-logic-quantifiers"],
  prerequisites: ["know-logic-conditions"],
  route: "/set-quantifiers",
};

/** 独立 loader，不进入 KnowledgeNode 类型 */
export const vennLoader = () => import("./SetVennPage");
export const logicLoader = () => import("./SetLogicPage");
export const quantifiersLoader = () => import("./SetQuantifiersPage");
