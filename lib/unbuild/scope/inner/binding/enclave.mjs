import { reportLimitation } from "../../../../limitation.mjs";
import { StaticError } from "../../../../util/index.mjs";
import {
  makeApplyExpression,
  makeDeclareGlobalStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeReadGlobalExpression,
  makeTypeofGlobalExpression,
  makeWriteGlobalEffect,
} from "../../../node.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @typedef {{
 *   kind: "let" | "const" | "var" | "missing",
 *   site: "local" | "global",
 * }} Binding
 */

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
) => [makeDeclareGlobalStatement(kind, variable, makeReadExpression(right))];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  _strict,
  { site },
  variable,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.read"),
        makePrimitiveExpression({ undefined: null }),
        [makePrimitiveExpression(variable)],
      );
    case "global":
      return makeReadGlobalExpression(variable);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _strict,
  { site },
  variable,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.typeof"),
        makePrimitiveExpression({ undefined: null }),
        [makePrimitiveExpression(variable)],
      );
    case "global":
      return makeTypeofGlobalExpression(variable);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _strict,
  _binding,
  variable,
) => {
  reportLimitation(
    `ignoring external variable deletion ${stringifyJSON(variable)}`,
  );
  return makePrimitiveExpression(false);
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  { site },
  variable,
  right,
) => {
  if (!strict) {
    reportLimitation(
      `turning strict sloppy variable assignment ${stringifyJSON(variable)}`,
    );
  }
  switch (site) {
    case "local":
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression("scope.write"),
            makePrimitiveExpression({ undefined: null }),
            [makePrimitiveExpression(variable), makeReadExpression(right)],
          ),
        ),
      ];
    case "global":
      return [makeWriteGlobalEffect(variable, makeReadExpression(right))];
    default:
      throw new StaticError("invalid site", site);
  }
};
