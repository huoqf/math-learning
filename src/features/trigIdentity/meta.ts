import type { KnowledgeNode } from "@/data/types";

export const trigIdentityNode: KnowledgeNode = {
  id: "know-trig-identity",
  title: "同角三角函数关系与诱导公式",
  labTitle: "同角关系与诱导公式实验室",
  chapter: "三角函数",
  module: "三角恒等变换",
  importance: "basic",
  animationIds: ["anim-trig-identity"],
  prerequisites: ["know-trig-lines"],
  route: "/trig-identity",
};

export const trigIdentityLoader = () => import("./TrigIdentityAnimation");
