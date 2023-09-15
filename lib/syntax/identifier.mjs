const {
  Reflect: { apply },
  String: {
    prototype: { replace, substring },
  },
} = globalThis;

const ONE = [1];

/** @type {[RegExp, (match: string) => string]} */
const CONVERT = [
  /_+/gu,
  (match) => (match === "_" ? "." : apply(substring, match, ONE)),
];

/** @type {[RegExp, (match: string) => string]} */
const REVERT = [/\.|(_+)/gu, (match) => (match === "." ? "_" : `_${match}`)];

/** @type {[aran.Parameter, estree.Variable][]} */
const PARAMETERS = [
  ["this", /** @type {estree.Variable} */ ("_this")],
  ["new.target", /** @type {estree.Variable} */ ("_new_target")],
  ["import", /** @type {estree.Variable} */ ("_import")],
  ["super.get", /** @type {estree.Variable} */ ("_super_get")],
  ["super.set", /** @type {estree.Variable} */ ("_super_set")],
  ["super.call", /** @type {estree.Variable} */ ("_super_call")],
  [
    "function.arguments",
    /** @type {estree.Variable} */ ("_function_arguments"),
  ],
  ["catch.error", /** @type {estree.Variable} */ ("_catch_error")],
];

///////////
// Label //
/////////

/** @type {(label: estree.Label) => aran.Label}  */
export const convertLabel = (label) =>
  /** @type {aran.Label} */ (apply(replace, label, CONVERT));

/** @type {(label: aran.Label) => estree.Label}  */
export const revertLabel = (label) =>
  /** @type {estree.Label} */ (apply(replace, label, REVERT));

//////////////
// Variable //
//////////////

/** @type {(variable1: aran.Parameter | aran.Variable) => estree.Variable} */
export const revertVariable = (variable1) => {
  for (const [parameter, variable2] of PARAMETERS) {
    if (variable1 === parameter) {
      return variable2;
    }
  }
  return /** @type {estree.Variable} */ (apply(replace, variable1, REVERT));
};

/** @type {(variable: estree.Variable) => aran.Parameter | aran.Variable} */
export const convertVariable = (variable1) => {
  for (const [parameter, variable2] of PARAMETERS) {
    if (variable1 === variable2) {
      return parameter;
    }
  }
  return /** @type {aran.Variable} */ (apply(replace, variable1, CONVERT));
};
