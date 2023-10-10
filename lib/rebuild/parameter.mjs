import { includes } from "../util/index.mjs";
import { mangleParameter } from "./mangle.mjs";
import { makePreludeExpression } from "./prelude.mjs";

/**
 * @typedef {(
 *   | "this"
 *   | "new.target"
 *   | "function.arguments"
 *   | "catch.error"
 * )} LocalParameter
 */

/**
 * @typedef {Exclude<aran.Parameter, LocalParameter>} GlobalParameter
 */

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: {
 *     intrinsic: estree.Variable,
 *     root: import("../../type/options.d.ts").Root,
 *   },
 * ) => estree.MemberExpression}
 */
const makeParameterMember = (parameter, { intrinsic, root }) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "MemberExpression",
    optional: false,
    computed: true,
    object: {
      type: "Identifier",
      name: intrinsic,
    },
    property: {
      type: "Literal",
      value: "aran.hidden.rebuild",
    },
  },
  property: {
    type: "Literal",
    value: `${root}.${parameter}`,
  },
});

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: {
 *     prefix: estree.Variable,
 *   },
 * ) => estree.Identifier}
 */
const makeParameterIdentifier = (parameter, options) => ({
  type: "Identifier",
  name: mangleParameter(parameter, options),
});

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: {
 *     prefix: estree.Variable,
 *     hidden: GlobalParameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
export const makeReadParameterExpression = (parameter, options) =>
  includes(options.hidden, parameter)
    ? makeParameterMember(parameter, options)
    : makeParameterIdentifier(parameter, options);

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   right: estree.Expression,
 *   options: {
 *     prefix: estree.Variable,
 *     hidden: GlobalParameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
export const makeWriteParameterExpression = (parameter, right, options) => ({
  type: "AssignmentExpression",
  operator: "=",
  left: includes(options.hidden, parameter)
    ? makeParameterMember(parameter, options)
    : makeParameterIdentifier(parameter, options),
  right,
});

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: {
 *     prefix: estree.Variable,
 *     hidden: GlobalParameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Statement}
 */
export const makePreludeParameterStatement = (parameter, options) =>
  includes(options.hidden, parameter)
    ? {
        type: "ExpressionStatement",
        expression: {
          type: "AssignmentExpression",
          operator: "=",
          left: makeParameterMember(parameter, options),
          right: makePreludeExpression(parameter, options),
        },
      }
    : {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [
          {
            type: "VariableDeclarator",
            id: makeParameterIdentifier(parameter, options),
            init: makePreludeExpression(parameter, options),
          },
        ],
      };

/**
 * @type {(
 *   parameter: LocalParameter,
 *   options: {
 *     prefix: estree.Variable,
 *   },
 * ) => estree.Pattern}
 */
export const makeParameterPattern = makeParameterIdentifier;
