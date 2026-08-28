import type { KnowledgeNode } from "@/data/types";

export const domainNode: KnowledgeNode = {
  id: "know-func-domain-range",
  title: "函数的概念、定义域与值域",
  labTitle: "定义域与值域实验室",
  chapter: "函数概念与性质",
  module: "函数概念",
  importance: "basic",
  animationIds: ["anim-func-domain"],
  prerequisites: [],
  route: "/function-domain",
};

export const parityNode: KnowledgeNode = {
  id: "know-func-properties",
  title: "函数的单调性与奇偶性",
  labTitle: "单调奇偶性实验室",
  chapter: "函数概念与性质",
  module: "函数的基本性质",
  importance: "core",
  animationIds: ["anim-func-parity"],
  prerequisites: ["know-func-domain-range"],
  route: "/function-parity",
};

export const symmetryNode: KnowledgeNode = {
  id: "know-func-symmetry",
  title: "函数的对称性、周期性与轴/中心对称",
  labTitle: "对称与周期实验室",
  chapter: "函数概念与性质",
  module: "函数的基本性质",
  importance: "gaokao",
  animationIds: ["anim-func-symmetry"],
  prerequisites: ["know-func-properties"],
  route: "/function-symmetry",
};

export const domainLoader = () => import("./DomainPage");
export const parityLoader = () => import("./ParityPage");
export const symmetryLoader = () => import("./SymmetryPage");
