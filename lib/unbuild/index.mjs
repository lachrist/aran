import { AranTypeError } from "../util/index.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";
import { listLog } from "./node.mjs";

/**
 * @typedef {{
 *   kind: "script" | "module" | "eval",
 *   site: "global",
 *   path: null,
 *   enclave: boolean,
 *   context: {
 *     strict: false,
 *     root: import("../../type/options.d.ts").Root,
 *   },
 * }} GlobalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   site: "local",
 *   path: unbuild.Path,
 *   enclave: false,
 *   context: import("./context.d.ts").Context,
 * }} InternalLocalOptions
 */

/**
 * @typedef {{
 *   kind: "eval",
 *   site: "local",
 *   path: null,
 *   enclave: true,
 *   context: {
 *     strict: boolean,
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
export const unbuild = (node, { kind, site, namespace, enclave, context }) => {
  switch (site) {
    case "global": {
      return revealLog(
        unbuildProgram(
          { node, path: ROOT },
          {
            strict: kind === "module" || hasUseStrictDirective(node.body),
            root: context.root,
            scope: makeRootScope({ site, enclave }),
            private: {},
          },
          { kind, site, enclave },
        ),
      );
    }
    case "local": {
      return revealLog(
        enclave
          ? unbuildProgram(
              { node, path: ROOT },
              {
                strict: context.strict,
                root: context.root,
                scope: makeRootScope({ site, enclave }),
                private: {},
              },
              { kind, site, enclave },
            )
          : unbuildProgram({ node, ROOT }, context, {
              kind,
              site,
              enclave,
            }),
      );
    }
    default: {
      throw new AranTypeError("invalid site", site);
    }
  }
};
