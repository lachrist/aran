import { includes } from "../util/index.mjs";
import { mangleParameter } from "./internal.mjs";
import { makePreludeExpression } from "./prelude.mjs";

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
 *     escape: estree.Variable,
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
 *     escape: estree.Variable,
 *     hidden: aran.Parameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
export const makeParameterReadExpression = (parameter, options) =>
  includes(options.hidden, parameter)
    ? makeParameterMember(parameter, options)
    : makeParameterIdentifier(parameter, options);

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   right: estree.Expression,
 *   options: {
 *     escape: estree.Variable,
 *     hidden: aran.Parameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
export const makeParameterWriteExpression = (parameter, right, options) => ({
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
 *     escape: estree.Variable,
 *     hidden: aran.Parameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Statement}
 */
export const makeParameterPreludeStatement = (parameter, options) =>
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
 *   parameter: "this" | "new.target",
 *   right: estree.Expression,
 *   options: {
 *     escape: estree.Variable,
 *     hidden: aran.Parameter[],
 *     root: import("../../type/options.d.ts").Root,
 *     intrinsic: estree.Variable,
 *   },
 * ) => estree.Statement}
 */
export const makeParameterDeclareStatement = (parameter, right, options) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: makeParameterIdentifier(parameter, options),
      init: right,
    },
  ],
});

/**
 * @type {(
 *   parameter: "catch.error" | "function.arguments",
 *   options: {
 *     escape: estree.Variable,
 *   },
 * ) => estree.Pattern}
 */
export const makeParameterDeclarePattern = makeParameterIdentifier;
