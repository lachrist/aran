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
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _origin,
) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  origin,
) => [
  makeDeclareGlobalStatement(
    kind,
    variable,
    makeReadExpression(right, origin),
    origin,
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  _strict,
  { site },
  variable,
  origin,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.read", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [makePrimitiveExpression(variable, origin)],
        origin,
      );
    case "global":
      return makeReadGlobalExpression(variable, origin);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _strict,
  { site },
  variable,
  origin,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.typeof", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [makePrimitiveExpression(variable, origin)],
        origin,
      );
    case "global":
      return makeTypeofGlobalExpression(variable, origin);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _strict,
  _binding,
  variable,
  origin,
) => {
  reportLimitation(
    `ignoring external variable deletion ${stringifyJSON(variable)}`,
  );
  return makePrimitiveExpression(false, origin);
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  { site },
  variable,
  right,
  origin,
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
            makeReadExpression("scope.write", origin),
            makePrimitiveExpression({ undefined: null }, origin),
            [
              makePrimitiveExpression(variable, origin),
              makeReadExpression(right, origin),
            ],
            origin,
          ),
          origin,
        ),
      ];
    case "global":
      return [
        makeWriteGlobalEffect(
          variable,
          makeReadExpression(right, origin),
          origin,
        ),
      ];
    default:
      throw new StaticError("invalid site", site);
  }
};
