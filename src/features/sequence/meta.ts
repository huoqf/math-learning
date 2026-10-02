export {
  arithmeticSequenceNode,
  geometricSequenceNode,
  recurrenceSequenceNode,
  modelsSequenceNode,
} from "@/data/knowledgeTree/sequence";

export const arithmeticSequenceLoader = () => import("./ArithmeticPage");
export const geometricSequenceLoader = () => import("./GeometricPage");
export const recurrenceSequenceLoader = () => import("./RecurrencePage");
export const modelsSequenceLoader = () => import("./ModelsPage");
