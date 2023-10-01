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
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _serial,
) => [];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  serial,
) => [
  makeDeclareGlobalStatement(
    kind,
    variable,
    makeReadExpression(right, serial),
    serial,
  ),
];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeEnclaveBindingReadExpression = (
  _strict,
  { site },
  variable,
  serial,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.read", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makePrimitiveExpression(variable, serial)],
        serial,
      );
    case "global":
      return makeReadGlobalExpression(variable, serial);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _strict,
  { site },
  variable,
  serial,
) => {
  switch (site) {
    case "local":
      return makeApplyExpression(
        makeReadExpression("scope.typeof", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makePrimitiveExpression(variable, serial)],
        serial,
      );
    case "global":
      return makeTypeofGlobalExpression(variable, serial);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _strict,
  _binding,
  variable,
  serial,
) => {
  reportLimitation(
    `ignoring external variable deletion ${stringifyJSON(variable)}`,
  );
  return makePrimitiveExpression(false, serial);
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  { site },
  variable,
  right,
  serial,
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
            makeReadExpression("scope.write", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [
              makePrimitiveExpression(variable, serial),
              makeReadExpression(right, serial),
            ],
            serial,
          ),
          serial,
        ),
      ];
    case "global":
      return [
        makeWriteGlobalEffect(
          variable,
          makeReadExpression(right, serial),
          serial,
        ),
      ];
    default:
      throw new StaticError("invalid site", site);
  }
};
