export {
  makeScopeClosureBlock,
  makeScopeControlBlock,
  makeScopePseudoBlock,
} from "./block.mjs";

export {
  ROOT_SCOPE,
  extendDynamicScope,
  extendFakeScope,
  listScopeInitializeEffect,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  listScopeWriteEffect,
} from "./inner/index.mjs";

/**
 * @typedef {import("./inner/index.mjs").StaticFrame} StaticFrame
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */
