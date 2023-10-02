import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";

export { generate } from "./generate.mjs";

/**
 * @template L
 * @typedef {import("./options.d.ts").Options<L>} Options
 */

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
 * @type {import("./options.js").GlobalOptions<string>}
 */
const default_options = {
  kind: "script",
  site: "global",
  enclave: true,
  strict: false,
  root: /** @type {unbuild.Root} */ ("main"),
  context: null,
  serialize: serializeDefault,
  locate: locateDefault,
  digest: digestDefault,
  pointcut: false,
  advice: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
  intrinsic: /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__"),
  prefix: /** @type {estree.Variable} */ ("$ARAN"),
  location: "inline",
  annotation: "copy",
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
