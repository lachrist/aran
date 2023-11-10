import { AranTypeError } from "../util/index.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";
import { listLog } from "./node.mjs";
import { ROOT_META } from "./mangle.mjs";
import { ROOT_CLOSURE, extendClosure } from "./param/index.mjs";

/**
 * @typedef {{
 *   kind: "script" | "module" | "eval",
 *   situ: "global",
 *   meta: null,
 *   plug: "reify" | "alien",
 *   context: {
 *     mode: "sloppy",
 *     base: import("../../type/options.d.ts").Base,
 *   },
 * }} GlobalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   situ: "local",
 *   meta: unbuild.Meta,
 *   plug: "reify",
 *   context: import("./context.d.ts").Context,
 * }} InternalLocalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   situ: "local",
 *   meta: null,
 *   plug: "alien",
 *   context: {
 *     mode: "strict" | "sloppy",
 *     base: import("../../type/options.d.ts").Base,
 *   },
 * }} ExternalLocalOptions
 */

/**
 * @typedef {(
 *   GlobalOptions | InternalLocalOptions | ExternalLocalOptions
 * )} Options
 */

const ROOT = /** @type {unbuild.Path} */ ("$");

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
export const unbuild = (node, { kind, situ, plug, meta, context }) => {
  switch (situ) {
    case "global": {
      return revealLog(
        unbuildProgram(
          { node, path: ROOT, meta: ROOT_META },
          {
            mode:
              kind === "module" || hasUseStrictDirective(node.body)
                ? "strict"
                : "sloppy",
            base: context.base,
            root: { kind, situ, plug },
            catch: false,
            privates: {},
            closure: ROOT_CLOSURE,
            scope: makeRootScope(plug),
          },
          { kind },
        ),
      );
    }
    case "local": {
      switch (plug) {
        case "alien": {
          return revealLog(
            unbuildProgram(
              { node, path: ROOT, meta: ROOT_META },
              {
                ...context,
                root: { kind, situ, plug },
                catch: false,
                privates: {},
                closure: ROOT_CLOSURE,
                scope: makeRootScope(plug),
              },
              { kind },
            ),
          );
        }
        case "reify": {
          return revealLog(
            unbuildProgram(
              { node, path: ROOT, meta },
              {
                ...context,
                closure: extendClosure(context.closure, { type: "eval" }),
              },
              { kind },
            ),
          );
        }
        default: {
          throw new AranTypeError("invalid plug", plug);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};
