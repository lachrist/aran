import { finalizeMeta } from "./meta.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
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

// To enforce the scope abstraction:
// This should only be accessed by:
//   lib/trans/scope/inner/static/binding/regular.mjs
/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("./variable.d.ts").BaseVariable}
 */
export const mangleBaseVariable = (variable) =>
  /** @type {import("./variable.d.ts").BaseVariable} */ (
    /** @type {string} */ (variable)
  );

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 * ) => import("./variable.d.ts").ConstantMetaVariable}
 */
export const mangleConstantMetaVariable = (meta) =>
  /** @type {import("./variable.d.ts").ConstantMetaVariable} */ (
    `${META}.${CONSTANT}.${finalizeMeta(meta)}`
  );

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 * ) => import("./variable.d.ts").WritableMetaVariable}
 */
export const mangleWritableMetaVariable = (meta) =>
  /** @type {import("./variable.d.ts").WritableMetaVariable} */ (
    `${META}.${WRITABLE}.${finalizeMeta(meta)}`
  );

////////////////////
// Query Variable //
////////////////////

/**
 * @type {(
 *   variable: (
 *     | import("./variable.d.ts").Variable
 *     | import("../lang/syntax.d.ts").Parameter
 *   ),
 * ) => variable is import("./variable.d.ts").MetaVariable}
 */
export const isMetaVariable = (variable) =>
  apply(startsWith, variable, META_SINGLETON);

/**
 * @type {(
 *   variable: (
 *     | import("./variable.d.ts").Variable
 *     | import("../lang/syntax.d.ts").Parameter
 *   ),
 * ) => variable is import("./variable.d.ts").ConstantMetaVariable}
 */
export const isConstantMetaVariable = (variable) =>
  apply(startsWith, variable, META_CONSTANT_SINGLETON);

/**
 * @type {(
 *   variable: (
 *     | import("./variable.d.ts").Variable
 *     | import("../lang/syntax.d.ts").Parameter
 *   ),
 * ) => variable is import("./variable.d.ts").WritableMetaVariable}
 */
export const isWritableMetaVariable = (variable) =>
  apply(startsWith, variable, META_WRITABLE_SINGLETON);

/**
 * @type {(
 *   variable: import("./variable.d.ts").Variable,
 * ) => variable is import("./variable.d.ts").BaseVariable}
 */
export const isBaseVariable = (variable) => !isMetaVariable(variable);

//////////////////
// Mangle Label //
//////////////////

export const RETURN_BREAK_LABEL = /** @type {import("./atom.d.ts").Label} */ (
  "break.return"
);

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 * ) => import("./atom.d.ts").Label}
 */
export const mangleEmptyBreakLabel = (meta) =>
  /** @type {import("./atom.d.ts").Label} */ (
    `break.loop.${finalizeMeta(meta)}`
  );

/**
 * @type {(
 *   label: import("estree-sentry").LabelName,
 * ) => import("./atom.d.ts").Label}
 */
export const mangleBreakLabel = (label) =>
  /** @type {import("./atom.d.ts").Label} */ (`break.${label}`);

/**
 * @type {(
 *   meta: import("./meta.d.ts").Meta,
 * ) => import("./atom.d.ts").Label}
 */
export const mangleEmptyContinueLabel = (meta) =>
  /** @type {import("./atom.d.ts").Label} */ (
    `continue.loop.${finalizeMeta(meta)}`
  );

/**
 * @type {(
 *   label: import("estree-sentry").LabelName,
 * ) => import("./atom.d.ts").Label}
 */
export const mangleContinueLabel = (label) =>
  /** @type {import("./atom.d.ts").Label} */ (
    label === null ? "continue" : `continue.${label}`
  );
