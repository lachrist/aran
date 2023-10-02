import { unbuild } from "./unbuild/index.mjs";
import { weave } from "./weave/index.mjs";
import { rebuild } from "./rebuild/index.mjs";

export { generate } from "./generate.mjs";

/**
 * @template S
 * @typedef {import("./options.d.ts").Options<S>} Options
 */

/**
 * @type {(
 *   node: estree.Node,
 *   root: unbuild.Root,
 *   path: unbuild.Path,
 * ) => string}
 */
export const serializeDefault = (_node, root, path) => `${root}.${path}`;

/**
 * @type {(
 *   node: estree.Node,
 *   root: unbuild.Root,
 *   path: unbuild.Path,
 * ) => unbuild.Hash}
 */
export const digesthDefault = (_node, _root, path) =>
  /** @type {unbuild.Hash} */ (/** @type {unknown} */ (path));

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
  digest: digesthDefault,
  pointcut: false,
  advice: /** @type {estree.Variable} */ ("__ARAN_ADVICE__"),
  intrinsic: /** @type {estree.Variable} */ ("__ARAN_INTRINSIC__"),
  prefix: /** @type {estree.Variable} */ ("$ARAN"),
  serial: "inline",
  annotation: "copy",
};

/**
 * @type {<S>(options: Options<S>) => import("./unbuild/index.mjs").Options<S>}
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
 * @template {Json} S
 * @param {estree.Program} program
 * @param {Options<S>} user_options
 * @return {estree.Program}
 */
export const instrument = (program, user_options) => {
  const options = /** @type {Options<S>} */ ({
    ...user_options,
    ...default_options,
  });
  const root = options.context === null ? options.root : options.context.root;
  const { serial, pointcut, advice, prefix, intrinsic } = options;
  return rebuild(
    /** @type {aran.Program<rebuild.Atom>} */ (
      /** @type {unknown} */ (
        weave(
          /** @type {aran.Program<weave.ArgAtom<S>>} */ (
            /** @type {unknown} */ (
              unbuild(program, extractUnbuildOptions(options))
            )
          ),
          { root, serial, pointcut, advice },
        )
      )
    ),
    { root, prefix, intrinsic },
  );
};
