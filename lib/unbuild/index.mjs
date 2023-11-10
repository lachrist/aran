import { AranTypeError } from "../util/index.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";
import { listLog } from "./node.mjs";
import { ROOT_META } from "./mangle.mjs";
import { extendParamEval, makeRootParam } from "./param/index.mjs";

/**
 * @typedef {{
 *   kind: "script" | "module" | "eval",
 *   situ: "global",
 *   meta: null,
 *   enclave: boolean,
 *   context: {
 *     mode: "sloppy",
 *     root: import("../../type/options.d.ts").Root,
 *   },
 * }} GlobalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   situ: "local",
 *   meta: unbuild.Meta,
 *   enclave: false,
 *   context: import("./context.d.ts").Context,
 * }} InternalLocalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   situ: "local",
 *   meta: null,
 *   enclave: true,
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: import("../../type/options.d.ts").Root,
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
export const unbuild = (node, { kind, situ, meta, enclave, context }) => {
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
            root: context.root,
            scope: makeRootScope(enclave),
            param: makeRootParam(kind, situ),
          },
          { kind, situ, enclave },
        ),
      );
    }
    case "local": {
      return revealLog(
        enclave
          ? unbuildProgram(
              { node, path: ROOT, meta: ROOT_META },
              {
                mode: context.mode,
                root: context.root,
                scope: makeRootScope(enclave),
                param: makeRootParam(kind, situ),
              },
              { kind, situ, enclave },
            )
          : unbuildProgram(
              { node, path: ROOT, meta },
              {
                ...context,
                param: extendParamEval(context.param),
              },
              {
                kind,
                situ,
                enclave,
              },
            ),
      );
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};
