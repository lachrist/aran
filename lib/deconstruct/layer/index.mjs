export * from "./variable_old.mjs";

// Not export * because of (Base|Meta)Variable conflict
export {
  makeBaseReadExpression,
  makeBaseWriteEffect,
  makeMetaReadExpression,
  makeMetaWriteEffect,
  makeLayerPseudoBlock,
  makeLayerControlBlock,
  makeLayerClosureBlock,
} from "./build.mjs";
