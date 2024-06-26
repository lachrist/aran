const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
  BigInt: {
    prototype: { toString },
  },
} = globalThis;

/////////////////////
// Mangle Variable //
/////////////////////

const META = "";

const WRITABLE = "w";

const CONSTANT = "r";

const META_CONSTANT_SINGLETON = [`${META}.${CONSTANT}.`];

const META_WRITABLE_SINGLETON = [`${META}.${WRITABLE}.`];

const META_SINGLETON = [`${META}.`];

const RADIX = 32;

const RADIX_SINGLETON = [RADIX];

// To enforce the scope abstraction:
// This should only be accessed by:
//   lib/unbuild/scope/inner/static/binding/regular.mjs
/**
 * @type {(
 *   variable: estree.Variable,
 * ) => import("./variable").BaseVariable}
 */
export const mangleBaseVariable = (variable) =>
  /** @type {import("./variable").BaseVariable} */ (
    /** @type {string} */ (variable)
  );

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./variable").ConstantMetaVariable}
 */
export const mangleConstantMetaVariable = (meta) =>
  /** @type {import("./variable").ConstantMetaVariable} */ (
    `${META}.${CONSTANT}.${apply(toString, meta.product, RADIX_SINGLETON)}`
  );

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./variable").WritableMetaVariable}
 */
export const mangleWritableMetaVariable = (meta) =>
  /** @type {import("./variable").WritableMetaVariable} */ (
    `${META}.${WRITABLE}.${apply(toString, meta.product, RADIX_SINGLETON)}`
  );

////////////////////
// Query Variable //
////////////////////

/**
 * @type {(
 *   variable: import("./variable").Variable | aran.Parameter,
 * ) => variable is import("./variable").MetaVariable}
 */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/**
 * @type {(
 *   variable: import("./variable").Variable | aran.Parameter,
 * ) => variable is import("./variable").ConstantMetaVariable}
 */
export const isConstantMetaVariable = (variable) =>
  apply(startsWith, variable, META_CONSTANT_SINGLETON);

/**
 * @type {(
 *   variable: import("./variable").Variable | aran.Parameter,
 * ) => variable is import("./variable").WritableMetaVariable}
 */
export const isWritableMetaVariable = (variable) =>
  apply(startsWith, variable, META_WRITABLE_SINGLETON);

/**
 * @type {(
 *   variable: import("./variable").Variable,
 * ) => variable is import("./variable").BaseVariable}
 */
export const isBaseVariable = (variable) => !isMetaVariable(variable);

//////////////////
// Mangle Label //
//////////////////

/** @type {(label: unbuild.Path) => unbuild.Label}  */
export const mangleEmptyBreakLabel = (path) =>
  /** @type {unbuild.Label} */ (`break.loop.${path}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleBreakLabel = (label) =>
  /** @type {unbuild.Label} */ (`break.${label}`);

/** @type {(label: unbuild.Path) => unbuild.Label}  */
export const mangleEmptyContinueLabel = (path) =>
  /** @type {unbuild.Label} */ (`continue.loop.${path}`);

/** @type {(label: estree.Label) => unbuild.Label}  */
export const mangleContinueLabel = (label) =>
  /** @type {unbuild.Label} */ (
    label === null ? "continue" : `continue.${label}`
  );
