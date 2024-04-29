import { cwd } from "node:process";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

const CWD = cwd();

const GLOBAL = /** @type {estree.Variable} */ ("globalThis");

const INTRINSIC = /** @type {estree.Variable} */ ("_ARAN_INTRINSIC_");

/**
 * @type {(
 *   location: import("./aran").Location,
 * ) => import("./aran").Base}
 */
export const makeNodeBase = (location) =>
  /** @type {import("./aran").Base} */ (/** @type {string} */ (location));

/**
 * @type {(
 *   url: URL,
 * ) => import("./aran").Base}
 */
export const makeRootBase = (url) =>
  /** @type {import("./aran").Base} */ (
    url.protocol === "file:" ? relative(CWD, fileURLToPath(url)) : url.href
  );

/**
 * @type {import("../../../../lib/config").Config<
 *   import("./aran").Base,
 *   import("./aran").Location
 * >}
 */
export const CONFIG = {
  pointcut: ["eval.before"],
  locate: (path, base) =>
    /** @type {import("./aran").Location} */ (`${base}#${path}`),
  global_variable: GLOBAL,
  advice_variable: /** @type {estree.Variable} */ ("_ARAN_ADVICE_"),
  intrinsic_variable: INTRINSIC,
  escape_prefix: /** @type {estree.Variable} */ ("_ARAN_ESCAPE_"),
  global_declarative_record: "native",
  warning: "ignore",
  early_syntax_error: "embed",
};

export const SETUP_CONFIG = {
  global_variable: GLOBAL,
  intrinsic_variable: INTRINSIC,
};
