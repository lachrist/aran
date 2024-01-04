import { AranTypeError } from "../error.mjs";
// eslint-disable-next-line local/no-deep-import
import { unbuildProgram } from "./visitors/program.mjs";
import { ROOT_META, unpackMeta } from "./meta.mjs";
import { makeRootScope } from "./scope/index.mjs";
import { isContextPrelude, isLogPrelude } from "./prelude.mjs";
import { map, filterNarrow, compileGet } from "../util/index.mjs";

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

const getData = compileGet("data");

/**
 * @type {(
 *   node: import("./sequence").ProgramSequence
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: import("./log").Log[],
 *   contexts: import("./context").Context[],
 * }}
 */
const unsequenceProgram = ({ head, tail }) => ({
  node: tail,
  logs: map(filterNarrow(head, isLogPrelude), getData),
  contexts: map(filterNarrow(head, isContextPrelude), getData),
});

/**
 * @type {(
 *   node: estree.Program,
 *   options: import("./index").Options,
 * ) => {
 *   node: aran.Program<unbuild.Atom>,
 *   logs: import("./log").Log[],
 *   contexts: import("./context").Context[],
 * }}
 */
export const unbuild = (node, options) => {
  if (isRootOptions(options)) {
    return unsequenceProgram(
      unbuildProgram(
        { node, path: ROOT_PATH, meta: ROOT_META },
        makeRootScope({ type: "root", situ: options.situ }),
        {
          situ: options.situ,
        },
      ),
    );
  } else if (isNodeOptions(options)) {
    return unsequenceProgram(
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
