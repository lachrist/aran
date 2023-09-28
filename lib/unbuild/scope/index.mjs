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
 * @typedef {import("./inner/index.mjs").FrameMaterial} Frame
 */

/**
 * @typedef {import("./inner/index.mjs").Scope} Scope
 */
