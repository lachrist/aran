import { reportLimitation } from "../../../../limitation.mjs";
import { StaticError } from "../../../../util/index.mjs";
import {
  makeApplyExpression,
  makeDeclareEnclaveStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
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
 * @type {<S>(
 *   site: "local" | "global",
 *   operation: "read" | "typeof" | "write",
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeFunctionExpression = (site, operation, serial) => {
  switch (site) {
    case "local":
      return makeReadExpression(`scope.${operation}`, serial);
    case "global":
      return makeIntrinsicExpression(`aran.${operation}Global`, serial);
    default:
      throw new StaticError("invalid site", site);
  }
};

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
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
 *   binding: Binding & { kind: "let" | "const" | "var" },
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
  makeDeclareEnclaveStatement(
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
) =>
  makeApplyExpression(
    makeFunctionExpression(site, "read", serial),
    makePrimitiveExpression({ undefined: null }, serial),
    [makePrimitiveExpression(variable, serial)],
    serial,
  );

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
) =>
  makeApplyExpression(
    makeFunctionExpression(site, "typeof", serial),
    makePrimitiveExpression({ undefined: null }, serial),
    [makePrimitiveExpression(variable, serial)],
    serial,
  );

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
  return [
    makeExpressionEffect(
      makeApplyExpression(
        makeFunctionExpression(site, "write", serial),
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
};
