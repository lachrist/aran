import { AranTypeError } from "../error.mjs";
// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { makeRootScope } from "./scope/index.mjs";

/**
 * @type {(
 *   options: import("./index").Options,
 * ) => options is import("./index").RootOptions}
 */
const isRootOptions = (options) => options.context === null;

/**
 * @type {(
 *   options: import("./index").Options,
 * ) => options is import("./index").NodeOptions}
 */
const isNodeOptions = (options) => options.context !== null;

const ROOT_PATH = /** @type {unbuild.Path} */ ("$");

/**
 * @type {(
 *   node: aran.Program<unbuild.Atom>,
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: import("./log").Log[],
 * }}
 */
const revealLog = (node) => ({
  node,
  logs: listLog(node),
});

/**
 * @type {(
 *   node: estree.Program,
 *   options: import("./index").Options,
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: import("./log").Log[],
 * }}
 */
export const unbuild = (node, options) => {
  if (isRootOptions(options)) {
    return revealLog(
      unbuildProgram(
        { node, path: ROOT_PATH, meta: ROOT_META },
        makeRootScope({ type: "root", situ: options.situ }),
        {
          situ: options.situ,
        },
      ),
    );
  } else if (isNodeOptions(options)) {
    return revealLog(
      unbuildProgram(
        {
          node,
          path: ROOT_PATH,
          meta: unpackMeta(options.context.meta),
        },
        options.context.scope,
        { situ: options.situ },
      ),
    );
  } else {
    throw new AranTypeError(options);
  }
};
