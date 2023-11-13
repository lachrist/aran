import { AranTypeError, join, reduce } from "../util/index.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { unbuildProgram } from "./visitors/program.mjs";
import { listLog, log } from "./node.mjs";
import { ROOT_META } from "./mangle.mjs";
import { ROOT_CLOSURE, extendClosure } from "./param/index.mjs";
import { hoistBlock, hoistClosure } from "./query/index.mjs";
import { isNodeProgram, isRootProgram } from "../program.mjs";

const {
  BigInt,
  Error,
  Object: { keys: listKey },
} = globalThis;

/**
 * @typedef {{
 *   base: import("../../type/options.d.ts").Base,
 *   program: import("../program.js").GlobalProgram,
 *   context: { mode: "sloppy" },
 * }} GlobalOptions
 */

/**
 * @typedef {{
 *   base: import("../../type/options.d.ts").Base,
 *   program: import("../program.js").AlienLocalProgram,
 *   context: { mode: "strict" | "sloppy" },
 * }} AlienLocalOptions
 */

/**
 * @typedef {{
 *   base: import("../../type/options.d.ts").Base,
 *   program: import("../program.js").ReifyLocalProgram,
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
const isRootOptions = (options) => isRootProgram(options.program);

/**
 * @type {(options: Options) => options is NodeOptions}
 */
const isNodeOptions = (options) => isNodeProgram(options.program);

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
 *   options: {
 *     mode: "strict" | "sloppy",
 *     program: import("../program.js").Program,
 *   },
 * ) => {
 *   root: {[k in estree.Variable]: estree.VariableKind},
 *   node: {[k in estree.Variable]: estree.VariableKind},
 *   logs: unbuild.Log[],
 * }}
 */
const hoistProgram = (node, { mode, program }) => {
  switch (program.kind) {
    case "eval": {
      switch (mode) {
        case "strict": {
          return {
            root: {},
            node: {
              ...hoistClosure(node.body),
              ...hoistBlock(node.body),
            },
            logs: [],
          };
        }
        case "sloppy": {
          switch (program.situ) {
            case "local": {
              const kinds = hoistClosure(node.body);
              const variables = listKey(kinds);
              return {
                root: {},
                node: {
                  ...kinds,
                  ...hoistBlock(node.body),
                },
                logs:
                  variables.length > 0
                    ? [
                        {
                          name: "EnclaveLimitation",
                          message: `Internalizing declaration of external variables: ${join(
                            variables,
                            ",",
                          )}`,
                        },
                      ]
                    : [],
              };
            }
            case "global": {
              switch (program.plug) {
                case "alien": {
                  const kinds = hoistClosure(node.body);
                  const variables = listKey(kinds);
                  return {
                    root: kinds,
                    node: hoistBlock(node.body),
                    logs:
                      variables.length > 9
                        ? [
                            {
                              name: "EnclaveLimitation",
                              message: `Turning strict declaration of sloppy global variables: ${join(
                                variables,
                                ", ",
                              )}`,
                            },
                          ]
                        : [],
                  };
                }
                case "reify": {
                  return {
                    root: hoistClosure(node.body),
                    node: hoistBlock(node.body),
                    logs: [],
                  };
                }
                default: {
                  throw new AranTypeError("invalid program plug", program);
                }
              }
            }
            default: {
              throw new AranTypeError("invalid program situ", program);
            }
          }
        }
        default: {
          throw new AranTypeError("invalid mode", mode);
        }
      }
    }
    case "script": {
      return {
        root: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
        node: {},
        logs: [],
      };
    }
    case "module": {
      return {
        root: {},
        node: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
        logs: [],
      };
    }
    default: {
      throw new AranTypeError("invalid program kind", program);
    }
  }
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
    options.context.mode === "strict" ||
    options.program.kind === "module" ||
    hasUseStrictDirective(node.body)
      ? "strict"
      : "sloppy";
  const hoisting = hoistProgram(node, {
    mode,
    program: options.program,
  });
  if (isRootOptions(options)) {
    return revealLog(
      reduce(
        hoisting.logs,
        log,
        unbuildProgram(
          { node, path: ROOT_PATH, meta: ROOT_META },
          {
            mode,
            base: options.base,
            root: options.program,
            catch: false,
            privates: {},
            closure: ROOT_CLOSURE,
            scope: makeRootScope(
              {},
              {
                root: true,
                link: null,
                kinds: hoisting.root,
              },
            ),
          },
          { kind: options.program.kind, hoisting: hoisting.node },
        ),
      ),
    );
  } else if (isNodeOptions(options)) {
    if (listKey(hoisting.root).length > 0) {
      throw new Error("unexpected root hoisting");
    }
    return revealLog(
      reduce(
        hoisting.logs,
        log,
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
          { kind: options.program.kind, hoisting: hoisting.node },
        ),
      ),
    );
  } else {
    throw new AranTypeError("invalid options", options);
  }
};
