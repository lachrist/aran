export {
  makeScopeClosureBlock,
  makeScopeControlBlock,
  makeScopePseudoBlock,
} from "./block.mjs";

export {
  listScopeInitializeStatement,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  listScopeWriteEffect,
} from "./inner/index.mjs";

/**
 * @template T
 * @typedef {import("./inner/index.mjs").FrameMaterial<T>} Frame
 */
