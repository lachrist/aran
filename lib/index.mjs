import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";
import { generateSetup } from "./setup.mjs";

/**
 * @template L
 * @typedef {import("../type/options.js").Options<L>} Options
 */

/**
 * @typedef {import("../type/advice.d.ts").LinkData} Link
 */

/**
 * @typedef {estree.Variable} EstreeVariable
 */

/**
 * @typedef {import("../type/advice.d.ts").Variable} Variable
 */

/**
 * @template V
 * @template L
 * @typedef {import("../type/advice.d.ts").Point<V, L>} Point
 */

/**
 * @typedef {import("../type/advice.d.ts").Label} Label
 */

/**
 * @template V
 * @template L
 * @typedef {import("../type/advice.d.ts").Advice<V, L>} Advice
 */

const DEFAULT_PREFIX = /** @type {estree.Variable} */ ("$ARAN");

const DEFAULT_INTRINSIC = /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__");

const DEFAULT_ADVICE = /** @type {estree.Variable} */ ("__ARAN_ADVICE__");

const DEFAULT_ROOT = /** @type {unbuild.Root} */ ("main");

/**
 * @type {(
 *   node: estree.Node,
 *   path: unbuild.Path,
 * ) => unbuild.Hash}
 */
export const digestDefault = (_node, path) =>
  /** @type {unbuild.Hash} */ (/** @type {unknown} */ (path));

/**
 * @type {(
 *   node: estree.Node,
 *   path: unbuild.Path,
 * ) => unbuild.Path}
 */
export const serializeDefault = (_node, path) => path;

/**
 * @type {(
 *   root: unbuild.Root,
 *   origin: unbuild.Path,
 *   target: weave.Path,
 * ) => string}
 */
export const locateDefault = (root, origin, _target) => `${root}.${origin}`;

/**
 * @type {import("../type/options.d.ts").GlobalOptions<string>}
 */
const default_options = {
  kind: "script",
  site: "global",
  enclave: true,
  strict: false,
  root: DEFAULT_ROOT,
  context: null,
  pointcut: false,
  advice: DEFAULT_ADVICE,
  intrinsic: DEFAULT_INTRINSIC,
  prefix: DEFAULT_PREFIX,
  location: "inline",
  annotation: "copy",
  serialize: serializeDefault,
  locate: locateDefault,
  digest: digestDefault,
};

/**
 * @type {<L>(options: Options<L>) => import("./unbuild/index.mjs").Options<unbuild.Path>}
 */
const extractUnbuildOptions = (options) => {
  if (options.site === "global") {
    return {
      ...options,
      context: { strict: false, root: options.root },
    };
  } else if (options.enclave) {
    return {
      ...options,
      context: { strict: options.strict, root: options.root },
    };
  } else {
    return options;
  }
};

/**
 * @type {(
 *   options: {
 *     intrinsic: estree.Variable,
 *     global: estree.Variable,
 *   },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const setup = (options) => {
  const { intrinsic, global } = {
    ...options,
    intrinsic: DEFAULT_INTRINSIC,
    global: /** @type {estree.Variable} */ ("globalThis"),
  };
  return generateSetup(intrinsic, global);
};

/**
 * @template {Json} L
 * @param {estree.Program} program
 * @param {Options<L>} user_options
 * @return {estree.Program}
 */
export const instrument = (program, user_options) => {
  const options = /** @type {Options<L>} */ ({
    ...user_options,
    ...default_options,
  });
  const root = options.context === null ? options.root : options.context.root;
  const { locate, location, pointcut, advice, prefix, intrinsic } = options;
  return rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (
      /** @type {unknown} */ (
        weave(
          /** @type {aran.Program<weave.ArgAtom<unbuild.Path>>} */ (
            /** @type {unknown} */ (
              unbuild(program, extractUnbuildOptions(options))
            )
          ),
          { root, location, locate, pointcut, advice },
        )
      )
    ),
    { root, prefix, intrinsic },
  );
};
