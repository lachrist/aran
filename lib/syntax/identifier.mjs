import { escapeDot, unescapeDot } from "../util/index.mjs";

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
///////////

export const convertLabel =
  /** @type {(label: estree.Label) => convert.Label}  */ (
    /** @type {unknown} */ (unescapeDot)
  );

export const revertLabel =
  /** @type {(label: revert.Label) => estree.Label} */ (
    /** @type {unknown} */ (escapeDot)
  );

//////////////
// Variable //
//////////////

/** @type {(variable: estree.Variable) => aran.Parameter | convert.Variable} */
export const convertVariable = (variable1) => {
  for (const [parameter, variable2] of PARAMETERS) {
    if (variable1 === variable2) {
      return parameter;
    }
  }
  return /** @type {convert.Variable} */ (unescapeDot(variable1));
};

/** @type {(variable1: aran.Parameter | revert.Variable) => estree.Variable} */
export const revertVariable = (variable1) => {
  for (const [parameter, variable2] of PARAMETERS) {
    if (variable1 === parameter) {
      return variable2;
    }
  }
  return /** @type {estree.Variable} */ (escapeDot(variable1));
};
