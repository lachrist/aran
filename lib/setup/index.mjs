import { makeIntrinsicArrow } from "./layout.mjs";

/**
 * @type {(
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const setupile = ({
  global_object_variable,
  intrinsic_global_variable,
}) => ({
  type: "Program",
  sourceType: "script",
  body: [
    {
      type: "ExpressionStatement",
      directive: /** @type {import("estree-sentry").Directive} */ (
        "use strict"
      ),
      expression: {
        type: "Literal",
        value: "use strict",
        raw: null,
        bigint: null,
        regex: null,
      },
    },
    {
      type: "ExpressionStatement",
      directive: null,
      expression: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: false,
          object: {
            type: "Identifier",
            name: global_object_variable,
          },
          property: {
            type: "Identifier",
            name: /** @type {import("estree-sentry").PublicKeyName} */ (
              /** @type {string} */ (intrinsic_global_variable)
            ),
          },
        },
        right: {
          type: "CallExpression",
          callee: makeIntrinsicArrow({ directive: false }),
          optional: false,
          arguments: [
            {
              type: "Identifier",
              name: global_object_variable,
            },
          ],
        },
      },
    },
  ],
});

/**
 * @type {() => import("estree-sentry").ModuleProgram<{}>}
 */
export const generateIntrinsicRecordModule = () => ({
  type: "Program",
  sourceType: "module",
  body: [
    {
      type: "ExportNamedDeclaration",
      declaration: {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: /** @type {import("estree-sentry").VariableName} */ (
                "compileIntrinsicRecord"
              ),
            },
            init: makeIntrinsicArrow({ directive: false }),
          },
        ],
      },
      specifiers: [],
      source: null,
    },
  ],
});

/**
 * @type {(
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
export const generateIntrinsicRecord = ({ global_object_variable }) => ({
  type: "CallExpression",
  optional: false,
  callee: makeIntrinsicArrow({ directive: true }),
  arguments: [
    {
      type: "Identifier",
      name: global_object_variable,
    },
  ],
});
