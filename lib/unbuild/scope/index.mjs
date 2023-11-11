export {
  makeScopeClosureBlock,
  makeScopeControlBlock,
  makeScopePseudoBlock,
} from "./block.mjs";

export {
  makeRootScope,
  extendDynamicScope,
  listScopeInitializeStatement,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  listScopeWriteEffect,
} from "./inner/index.mjs";

/**
 * @typedef {import("./inner/index.mjs").Frame} Frame
 * @typedef {import("./inner/index.mjs").NodeFrame} NodeFrame
 * @typedef {import("./inner/index.mjs").RootFrame} RootFrame
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */
