import { AranTypeError } from "../util/index.mjs";
import { ROOT_SCOPE } from "./scope/index.mjs";
// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { listLog } from "./node.mjs";
import { ROOT_META } from "./mangle.mjs";
import { ROOT_CLOSURE, extendClosure } from "./param/index.mjs";
import { isNodeProgram, isRootProgram } from "./program.mjs";

const { BigInt } = globalThis;

/**
 * @typedef {import("./program.js").GlobalProgram & {
 *   mode: "sloppy",
 *   base: import("../../type/options.d.ts").Base,
 *   context: null,
 * }} GlobalOptions
 */

/**
 * @typedef {import("./program.js").AlienLocalProgram & {
 *   mode: "strict" | "sloppy",
 *   base: import("../../type/options.d.ts").Base,
 *   context: null,
 * }} AlienLocalOptions
 */

/**
 * @typedef {import("./program.js").ReifyLocalProgram & {
 *   mode: null,
 *   base: import("../../type/options.d.ts").Base,
 *   context: import("./context.d.ts").EvalContext,
 * }} ReifyLocalOptions
 */

/**
 * @typedef {GlobalOptions | AlienLocalOptions} RootOptions
 */

/**
 * @typedef {ReifyLocalOptions} NodeOptions
 */

/**
 * @typedef {RootOptions | NodeOptions} Options
 */

/**
 * @type {(options: Options) => options is RootOptions}
 */
const isRootOptions = (options) => isRootProgram(options);

/**
 * @type {(options: Options) => options is NodeOptions}
 */
const isNodeOptions = (options) => isNodeProgram(options);

const ROOT_PATH = /** @type {unbuild.Path} */ ("$");

/**
 * @type {(
 *   node: aran.Program<unbuild.Atom>,
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: unbuild.Log[],
 * }}
 */
const revealLog = (node) => ({
  node,
  logs: listLog(node),
});

/** @type {(nodes: estree.Node[]) => boolean} */
const hasUseStrictDirective = (nodes) => {
  for (const node of nodes) {
    if (
      node.type !== "ExpressionStatement" ||
      node.expression.type !== "Literal" ||
      typeof node.expression.value !== "string"
    ) {
      return false;
    }
    if (node.expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

/**
 * @type {(
 *   node: estree.Program,
 *   options: Options,
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: unbuild.Log[],
 * }}
 */
export const unbuild = (node, options) => {
  const mode =
    (options.context != null
      ? options.context.mode === "strict"
      : options.mode === "strict") ||
    options.kind === "module" ||
    hasUseStrictDirective(node.body)
      ? "strict"
      : "sloppy";
  if (isRootOptions(options)) {
    const { base, mode: _mode, context: _context, ...root } = options;
    return revealLog(
      unbuildProgram(
        { node, path: ROOT_PATH, meta: ROOT_META },
        {
          mode,
          base,
          root,
          catch: false,
          privates: {},
          closure: ROOT_CLOSURE,
          scope: ROOT_SCOPE,
        },
        { kind: options.kind },
      ),
    );
  } else if (isNodeOptions(options)) {
    return revealLog(
      unbuildProgram(
        {
          node,
          path: ROOT_PATH,
          meta: /** @type {unbuild.Meta} */ (BigInt(options.context.meta)),
        },
        {
          ...options.context,
          mode,
          base: options.base,
          closure: extendClosure(options.context.closure, { type: "eval" }),
        },
        { kind: options.kind },
      ),
    );
  } else {
    throw new AranTypeError("invalid options", options);
  }
};
