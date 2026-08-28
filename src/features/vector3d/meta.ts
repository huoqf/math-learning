import type { KnowledgeNode } from "@/data/types";

export const vector3dBasisNode: KnowledgeNode = {
  id: "know-vector3d-basis",
  title: "空间向量基本定理与基底分解及共面向量",
  labTitle: "空间向量基底分解实验室",
  chapter: "立体几何与空间向量",
  module: "空间向量",
  importance: "core",
  animationIds: ["anim-vector3d-basis"],
  prerequisites: ["know-vector-basis"],
  route: "/vector3d-basis",
};

export const vector3dBasisLoader = () => import("./Vector3DBasisAnimation");
