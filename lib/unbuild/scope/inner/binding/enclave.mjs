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
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _path,
) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  path,
) => [
  makeDeclareGlobalStatement(
    kind,
    variable,
    makeReadExpression(right, path),
    path,
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  _strict,
  { site },
  variable,
  path,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    case "global":
      return makeReadGlobalExpression(variable, path);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _strict,
  { site },
  variable,
  path,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    case "global":
      return makeTypeofGlobalExpression(variable, path);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _strict,
  _binding,
  variable,
  path,
) => {
  reportLimitation(
    `ignoring external variable deletion ${stringifyJSON(variable)}`,
  );
  return makePrimitiveExpression(false, path);
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  { site },
  variable,
  right,
  path,
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
            makeReadExpression("scope.write", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(variable, path),
              makeReadExpression(right, path),
            ],
            path,
          ),
          path,
        ),
      ];
    case "global":
      return [
        makeWriteGlobalEffect(variable, makeReadExpression(right, path), path),
      ];
    default:
      throw new StaticError("invalid site", site);
  }
};
