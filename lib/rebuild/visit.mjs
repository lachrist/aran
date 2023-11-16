/* eslint-disable no-use-before-define */

import {
  reduceReverse,
  map,
  flatMap,
  enumerate,
  hasOwn,
  filter,
  filterOut,
} from "../util/index.mjs";
import {
  isBigIntPrimitive,
  isParameter,
  isUndefinedPrimitive,
  unpackPrimitive,
  hasParameter,
  isNanPrimitive,
  isInfinityPrimitive,
  isZeroPrimitive,
} from "../lang.mjs";
import {
  mangleExport,
  mangleImport,
  mangleLabel,
  mangleRegular,
} from "./internal.mjs";
import {
  makeParameterDeclarePattern,
  makeParameterReadExpression,
  makeParameterWriteExpression,
  makeParameterPreludeStatement,
  makeParameterDeclareStatement,
} from "./parameter.mjs";
import { BINARY_OPERATOR_RECORD, UNARY_OPERATOR_RECORD } from "../estree.mjs";
import { LOG_KEY } from "./log.mjs";
import { listClash } from "./external.mjs";
import { AranTypeError } from "../error.mjs";

const { BigInt } = globalThis;

/**
 * @typedef {{
 *   base: import("../../type/options.d.ts").Base,
 *   escape: estree.Variable,
 *   intrinsic: estree.Variable,
 *   advice: estree.Variable,
 *   hidden: aran.Parameter[],
 * }} Context
 */

/**
 * @type {{
 *   ScriptProgram: aran.Parameter[],
 *   ModuleProgram: aran.Parameter[],
 *   EvalProgram: aran.Parameter[],
 * }}
 */
const PARAMETERS = {
  ScriptProgram: ["this", "import"],
  ModuleProgram: ["this", "import", "import.meta"],
  EvalProgram: [
    "this",
    "new.target",
    "import.meta",
    "import",
    "super.get",
    "super.set",
    "super.call",
    "private.get",
    "private.set",
  ],
};

///////////
// Other //
///////////

/** @type {(nodes: estree.Expression[]) => estree.Expression} */
const sequence = (nodes) => {
  if (nodes.length === 0) {
    return {
      type: "Literal",
      value: null,
    };
  } else if (nodes.length === 1) {
    return nodes[0];
  } else {
    return {
      type: "SequenceExpression",
      expressions: nodes,
    };
  }
};

/** @type {(node: estree.Expression) => estree.Expression} */
const sanitizeMemberExpression = (node) =>
  node.type === "MemberExpression"
    ? {
        type: "SequenceExpression",
        expressions: [{ type: "Literal", value: null }, node],
      }
    : node;

/**
 * @type {(
 * node1: aran.Expression<rebuild.Atom>,
 * node2: aran.Expression<rebuild.Atom>,
 * ) => boolean}
 */
const isInvocable = (node1, node2) => {
  if (
    node1.type === "IntrinsicExpression" &&
    node2.type === "IntrinsicExpression" &&
    node1.intrinsic === node2.intrinsic
  ) {
    return true;
  }
  if (
    node1.type === "ReadExpression" &&
    node2.type === "ReadExpression" &&
    node1.variable === node2.variable
  ) {
    return true;
  }
  if (
    node1.type === "PrimitiveExpression" &&
    node2.type === "PrimitiveExpression" &&
    unpackPrimitive(node1.primitive) === unpackPrimitive(node2.primitive)
  ) {
    return true;
  }
  return false;
};

//////////////
// Operator //
//////////////

/** @type {(operator: string) => operator is estree.UnaryOperator}  */
const isUnaryOperator = (operator) => hasOwn(UNARY_OPERATOR_RECORD, operator);

/** @type {(operator: string) => operator is estree.BinaryOperator}  */
const isBinaryOperator = (operator) => hasOwn(BINARY_OPERATOR_RECORD, operator);

/////////////
// Builder //
/////////////

/** @type {(node: estree.Statement, label: rebuild.Label) => estree.Statement} */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: mangleLabel(label),
  },
  body: node,
});

/** @type {(node: estree.VariableDeclaration) => estree.Statement[]} */
const cleanVariableDeclaration = (node) =>
  node.declarations.length === 0 ? [] : [node];

/** @type {(node: estree.Statement) => estree.BlockStatement} */
const wrapBlock = (node) =>
  node.type === "BlockStatement"
    ? node
    : { type: "BlockStatement", body: [node] };

/** @type {(node: estree.Expression) => estree.Expression[]} */
const extractSequence = (node) =>
  node.type === "SequenceExpression" ? node.expressions : [node];

/////////////
// Rebuild //
/////////////

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   options: {
 *     escape: estree.Variable,
 *     intrinsic: estree.Variable,
 *     advice: estree.Variable,
 *     base: import("../../type/options.d.ts").Base,
 *   },
 * ) => estree.Program}
 */
export const rebuildProgram = (node, options) => {
  const context = {
    ...options,
    hidden: node.type === "ScriptProgram" ? PARAMETERS.ScriptProgram : [],
  };
  const prelude = map(
    filter(PARAMETERS[node.type], (parameter) =>
      hasParameter([node.body], parameter),
    ),
    (parameter) => makeParameterPreludeStatement(parameter, context),
  );
  switch (node.type) {
    case "ScriptProgram": {
      return {
        type: "Program",
        sourceType: "script",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict",
            },
            directive: "use strict",
          },
          ...prelude,
          ...rebuildPseudoBlock(node.body, context, "script"),
        ],
      };
    }
    case "EvalProgram": {
      return {
        type: "Program",
        sourceType: "script",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict",
            },
            directive: "use strict",
          },
          ...prelude,
          rebuildClosureBlock(node.body, context, "eval"),
        ],
      };
    }
    case "ModuleProgram": {
      return {
        type: "Program",
        sourceType: "module",
        body: [
          ...flatMap(node.links, (child) => rebuildLink(child, context)),
          ...prelude,
          rebuildClosureBlock(node.body, context, "module"),
        ],
      };
    }
    default: {
      throw new AranTypeError("invalid program node", node);
    }
  }
};

/** @type {(node: aran.ControlBlock<rebuild.Atom>, context: Context) => estree.Statement} */
const rebuildControlBlock = (node, context) =>
  reduceReverse(node.labels, accumulateLabel, {
    type: "BlockStatement",
    body: [
      ...cleanVariableDeclaration({
        type: "VariableDeclaration",
        kind: "let",
        declarations: map(node.variables, (variable) => ({
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: mangleRegular(variable, context),
          },
          init: null,
        })),
      }),
      ...map(node.statements, (child) => rebuildStatement(child, context)),
    ],
  });

/**
 * @type {(
 *   node: aran.ClosureBlock<rebuild.Atom>,
 *   context: Context,
 *   kind: "module" | "eval" | "arrow" | "function",
 * ) => estree.BlockStatement}
 */
const rebuildClosureBlock = (node, context, kind) => ({
  type: "BlockStatement",
  body: [
    ...(kind === "function"
      ? [
          makeParameterDeclareStatement(
            "new.target",
            {
              type: "MetaProperty",
              meta: {
                type: "Identifier",
                name: "new",
              },
              property: {
                type: "Identifier",
                name: "target",
              },
            },
            context,
          ),
          makeParameterDeclareStatement(
            "this",
            {
              type: "ConditionalExpression",
              test: {
                type: "MetaProperty",
                meta: {
                  type: "Identifier",
                  name: "new",
                },
                property: {
                  type: "Identifier",
                  name: "target",
                },
              },
              consequent: {
                type: "UnaryExpression",
                operator: "void",
                prefix: true,
                argument: {
                  type: "Literal",
                  value: 0,
                },
              },
              alternate: {
                type: "ThisExpression",
              },
            },
            context,
          ),
        ]
      : []),
    ...cleanVariableDeclaration({
      type: "VariableDeclaration",
      kind: "let",
      declarations: map(node.variables, (variable) => ({
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          name: mangleRegular(variable, context),
        },
        init: null,
      })),
    }),
    ...map(node.statements, (child) => rebuildStatement(child, context)),
    kind === "module" || kind === "eval"
      ? {
          type: "ExpressionStatement",
          expression: rebuildExpression(node.completion, context),
        }
      : {
          type: "ReturnStatement",
          argument: rebuildExpression(node.completion, context),
        },
  ],
});

/**
 * @type {(
 *   node: aran.PseudoBlock<rebuild.Atom>,
 *   context: Context,
 *   kind: "script",
 * ) => estree.Statement[]}
 */
const rebuildPseudoBlock = (node, context, _kind) => [
  ...map(node.statements, (child) => rebuildStatement(child, context)),
  {
    type: "ExpressionStatement",
    expression: rebuildExpression(node.completion, context),
  },
];

/**
 * @type {(
 *   link: aran.Link<rebuild.Atom>,
 *   context: Context,
 * ) => (estree.ModuleDeclaration | estree.Statement)[]}
 */
const rebuildLink = (node, context) => {
  switch (node.type) {
    case "ImportLink": {
      return [
        {
          type: "ImportDeclaration",
          specifiers: [
            node.import === null
              ? {
                  type: "ImportNamespaceSpecifier",
                  local: {
                    type: "Identifier",
                    name: mangleImport(node.source, node.import, context),
                  },
                }
              : {
                  type: "ImportSpecifier",
                  local: {
                    type: "Identifier",
                    name: mangleImport(node.source, node.import, context),
                  },
                  imported: {
                    type: "Identifier",
                    name: node.import,
                  },
                },
          ],
          source: {
            type: "Literal",
            value: node.source,
          },
        },
      ];
    }
    case "ExportLink": {
      return [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: [
            {
              type: "VariableDeclarator",
              id: {
                type: "Identifier",
                name: mangleExport(node.export, context),
              },
            },
          ],
        },
        {
          type: "ExportNamedDeclaration",
          declaration: null,
          specifiers: [
            {
              type: "ExportSpecifier",
              local: {
                type: "Identifier",
                name: mangleExport(node.export, context),
              },
              exported: {
                type: "Identifier",
                name: node.export,
              },
            },
          ],
        },
      ];
    }
    case "AggregateLink": {
      if (node.import === null) {
        return [
          {
            type: "ExportAllDeclaration",
            exported:
              node.export === null
                ? null
                : {
                    type: "Identifier",
                    name: node.export,
                  },
            source: {
              type: "Literal",
              value: node.source,
            },
          },
        ];
      } else {
        return [
          {
            type: "ExportNamedDeclaration",
            declaration: null,
            specifiers: [
              {
                type: "ExportSpecifier",
                local: {
                  type: "Identifier",
                  name: node.import,
                },
                exported: {
                  type: "Identifier",
                  name: node.export,
                },
              },
            ],
          },
        ];
      }
    }
    default: {
      throw new AranTypeError("invalid link node", node);
    }
  }
};

/** @type {(node: aran.Statement<rebuild.Atom>, context: Context) => estree.Statement} */
const rebuildStatement = (node, context) => {
  switch (node.type) {
    case "DeclareGlobalStatement": {
      return {
        type: "VariableDeclaration",
        kind: node.kind,
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: node.variable,
            },
            init: rebuildExpression(node.right, context),
          },
        ],
        [/** @type {any} */ (LOG_KEY)]: listClash(node.variable, context),
      };
    }
    case "BreakStatement": {
      return {
        type: "BreakStatement",
        label: {
          type: "Identifier",
          name: mangleLabel(node.label),
        },
      };
    }
    case "DebuggerStatement": {
      return {
        type: "DebuggerStatement",
      };
    }
    case "ReturnStatement": {
      return {
        type: "ReturnStatement",
        argument: rebuildExpression(node.result, context),
      };
    }
    case "EffectStatement": {
      return {
        type: "ExpressionStatement",
        expression: rebuildEffect(node.inner, context),
      };
    }
    case "BlockStatement": {
      return rebuildControlBlock(node.do, context);
    }
    case "IfStatement": {
      return {
        type: "IfStatement",
        test: rebuildExpression(node.if, context),
        consequent: rebuildControlBlock(node.then, context),
        alternate: rebuildControlBlock(node.else, context),
      };
    }
    case "TryStatement": {
      return {
        type: "TryStatement",
        block: wrapBlock(rebuildControlBlock(node.try, context)),
        handler: {
          type: "CatchClause",
          param: makeParameterDeclarePattern("catch.error", context),
          body: wrapBlock(
            rebuildControlBlock(node.catch, {
              ...context,
              hidden: filterOut(context.hidden, isCatchParameter),
            }),
          ),
        },
        finalizer: wrapBlock(rebuildControlBlock(node.finally, context)),
      };
    }
    case "WhileStatement": {
      return {
        type: "WhileStatement",
        test: rebuildExpression(node.while, context),
        body: rebuildControlBlock(node.do, context),
      };
    }
    default: {
      throw new AranTypeError("invalid statement node", node);
    }
  }
};

/** @type {(node: aran.Effect<rebuild.Atom>, context: Context) => estree.Expression} */
const rebuildEffect = (node, context) => {
  switch (node.type) {
    case "ExpressionEffect": {
      return rebuildExpression(node.discard, context);
    }
    case "ConditionalEffect": {
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.condition, context),
        consequent: sequence(
          map(node.positive, (effect) => rebuildEffect(effect, context)),
        ),
        alternate: sequence(
          map(node.negative, (effect) => rebuildEffect(effect, context)),
        ),
      };
    }
    case "WriteEffect": {
      return isParameter(node.variable)
        ? makeParameterWriteExpression(
            node.variable,
            rebuildExpression(node.right, context),
            context,
          )
        : {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "Identifier",
              name: mangleRegular(node.variable, context),
            },
            right: rebuildExpression(node.right, context),
          };
    }
    case "WriteGlobalEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: node.variable,
        },
        right: rebuildExpression(node.right, context),
        [/** @type {any} */ (LOG_KEY)]: listClash(node.variable, context),
      };
    }
    case "ExportEffect": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: mangleExport(node.export, context),
        },
        right: rebuildExpression(node.right, context),
      };
    }
    default: {
      throw new AranTypeError("invalid effect node", node);
    }
  }
};

/**
 * @type {(parameter: aran.Parameter) => boolean}
 */
const isFunctionParameter = (parameter) =>
  parameter === "this" ||
  parameter === "new.target" ||
  parameter === "function.arguments";

/**
 * @type {(parameter: aran.Parameter) => boolean}
 */
const isArrowParameter = (parameter) => parameter === "function.arguments";

/**
 * @type {(parameter: aran.Parameter) => boolean}
 */
const isCatchParameter = (parameter) => parameter === "catch.error";

/** @type {(node: aran.Expression<rebuild.Atom>, context: Context) => estree.Expression} */
const rebuildExpression = (node, context) => {
  switch (node.type) {
    case "FunctionExpression": {
      return {
        type: "FunctionExpression",
        id: null,
        async: node.asynchronous,
        generator: node.generator,
        params: [
          {
            type: "RestElement",
            argument: makeParameterDeclarePattern(
              "function.arguments",
              context,
            ),
          },
        ],
        body: rebuildClosureBlock(
          node.body,
          {
            ...context,
            hidden: filterOut(context.hidden, isFunctionParameter),
          },
          "function",
        ),
      };
    }
    case "ArrowExpression": {
      return {
        type: "ArrowFunctionExpression",
        async: node.asynchronous,
        expression: false,
        params: [
          {
            type: "RestElement",
            argument: makeParameterDeclarePattern(
              "function.arguments",
              context,
            ),
          },
        ],
        body: rebuildClosureBlock(
          node.body,
          {
            ...context,
            hidden: filterOut(context.hidden, isArrowParameter),
          },
          "arrow",
        ),
      };
    }
    case "PrimitiveExpression": {
      if (isUndefinedPrimitive(node.primitive)) {
        return {
          type: "UnaryExpression",
          operator: "void",
          prefix: true,
          argument: {
            type: "Literal",
            value: 0,
          },
        };
      } else if (isNanPrimitive(node.primitive)) {
        return {
          type: "BinaryExpression",
          operator: "/",
          left: {
            type: "Literal",
            value: 0,
          },
          right: {
            type: "Literal",
            value: 0,
          },
        };
      } else if (isZeroPrimitive(node.primitive)) {
        switch (node.primitive.zero) {
          case "+": {
            return {
              type: "Literal",
              value: 0,
            };
          }
          case "-": {
            return {
              type: "UnaryExpression",
              operator: "-",
              prefix: true,
              argument: {
                type: "Literal",
                value: 0,
              },
            };
          }
          default: {
            throw new AranTypeError(
              "invalid zero primitive",
              node.primitive.zero,
            );
          }
        }
      } else if (isInfinityPrimitive(node.primitive)) {
        switch (node.primitive.infinity) {
          case "+": {
            return {
              type: "BinaryExpression",
              operator: "/",
              left: {
                type: "Literal",
                value: 1,
              },
              right: {
                type: "Literal",
                value: 0,
              },
            };
          }
          case "-": {
            return {
              type: "BinaryExpression",
              operator: "/",
              left: {
                type: "UnaryExpression",
                operator: "-",
                prefix: true,
                argument: {
                  type: "Literal",
                  value: 1,
                },
              },
              right: {
                type: "Literal",
                value: 0,
              },
            };
          }
          default: {
            throw new AranTypeError(
              "invalid infinity primitive",
              node.primitive.infinity,
            );
          }
        }
      } else if (isBigIntPrimitive(node.primitive)) {
        return {
          type: "Literal",
          value: BigInt(node.primitive.bigint),
          bigint: node.primitive.bigint,
        };
      } else {
        return {
          type: "Literal",
          value: node.primitive,
        };
      }
    }
    case "IntrinsicExpression": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Identifier",
          name: context.intrinsic,
        },
        property: {
          type: "Literal",
          value: node.intrinsic,
        },
      };
    }
    case "ReadExpression": {
      return isParameter(node.variable)
        ? makeParameterReadExpression(node.variable, context)
        : {
            type: "Identifier",
            name: mangleRegular(node.variable, context),
          };
    }
    case "ImportExpression": {
      return {
        type: "Identifier",
        name: mangleImport(node.source, node.import, context),
      };
    }
    case "ReadGlobalExpression": {
      return {
        type: "Identifier",
        name: node.variable,
        [/** @type {any} */ (LOG_KEY)]: listClash(node.variable, context),
      };
    }
    case "TypeofGlobalExpression": {
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "Identifier",
          name: node.variable,
        },
        [/** @type {any} */ (LOG_KEY)]: listClash(node.variable, context),
      };
    }
    case "AwaitExpression": {
      return {
        type: "AwaitExpression",
        argument: rebuildExpression(node.promise, context),
      };
    }
    case "YieldExpression": {
      return {
        type: "YieldExpression",
        delegate: node.delegate,
        argument: rebuildExpression(node.item, context),
      };
    }
    case "ConditionalExpression": {
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.condition, context),
        consequent: rebuildExpression(node.consequent, context),
        alternate: rebuildExpression(node.alternate, context),
      };
    }
    case "SequenceExpression": {
      return {
        type: "SequenceExpression",
        expressions: [
          ...extractSequence(rebuildEffect(node.head, context)),
          ...extractSequence(rebuildExpression(node.tail, context)),
        ],
      };
    }
    case "EvalExpression": {
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "Identifier",
          name: "eval",
        },
        arguments: [rebuildExpression(node.code, context)],
      };
    }
    case "ConstructExpression": {
      return {
        type: "NewExpression",
        callee: rebuildExpression(node.callee, context),
        arguments: map(node.arguments, (child) =>
          rebuildExpression(child, context),
        ),
      };
    }
    case "ApplyExpression": {
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.get" &&
        node.this.type === "PrimitiveExpression" &&
        node.arguments.length === 2
      ) {
        return {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: rebuildExpression(node.arguments[0], context),
          property: rebuildExpression(node.arguments[1], context),
        };
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.set.strict" &&
        node.arguments.length === 3
      ) {
        return {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "MemberExpression",
            optional: false,
            computed: true,
            object: rebuildExpression(node.arguments[0], context),
            property: rebuildExpression(node.arguments[1], context),
          },
          right: rebuildExpression(node.arguments[2], context),
        };
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.delete.strict" &&
        node.arguments.length === 2
      ) {
        return {
          type: "UnaryExpression",
          prefix: true,
          operator: "delete",
          argument: {
            type: "MemberExpression",
            optional: false,
            computed: true,
            object: rebuildExpression(node.arguments[0], context),
            property: rebuildExpression(node.arguments[1], context),
          },
        };
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.unary" &&
        node.arguments.length === 2 &&
        node.arguments[0].type === "PrimitiveExpression" &&
        typeof node.arguments[0].primitive === "string" &&
        isUnaryOperator(node.arguments[0].primitive)
      ) {
        if (node.arguments[0].primitive === "delete") {
          return {
            type: "SequenceExpression",
            expressions: [
              rebuildExpression(node.arguments[1], context),
              {
                type: "Literal",
                value: true,
              },
            ],
          };
        } else {
          return {
            type: "UnaryExpression",
            operator: node.arguments[0].primitive,
            prefix: true,
            argument: rebuildExpression(node.arguments[1], context),
          };
        }
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.binary" &&
        node.this.type === "PrimitiveExpression" &&
        node.arguments.length === 3 &&
        node.arguments[0].type === "PrimitiveExpression" &&
        typeof node.arguments[0].primitive === "string" &&
        isBinaryOperator(node.arguments[0].primitive)
      ) {
        return {
          type: "BinaryExpression",
          operator: node.arguments[0].primitive,
          left: rebuildExpression(node.arguments[1], context),
          right: rebuildExpression(node.arguments[2], context),
        };
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "aran.createObject" &&
        node.this.type === "PrimitiveExpression" &&
        node.arguments.length % 2 === 1
      ) {
        return {
          type: "ObjectExpression",
          properties: /** @type {estree.Property[]} */ ([
            ...(node.arguments[0].type === "IntrinsicExpression" &&
            node.arguments[0].intrinsic === "Object.prototype"
              ? []
              : [
                  {
                    type: "Property",
                    kind: "init",
                    method: false,
                    computed: false,
                    shorthand: false,
                    key: {
                      type: "Identifier",
                      name: "__proto__",
                    },
                    value: rebuildExpression(node.arguments[0], context),
                  },
                ]),
            ...map(enumerate((node.arguments.length - 1) / 2), (index) => ({
              type: "Property",
              kind: "init",
              method: false,
              computed: true,
              shorthand: false,
              key: rebuildExpression(node.arguments[2 * index + 1], context),
              value: rebuildExpression(node.arguments[2 * index + 2], context),
            })),
          ]),
        };
      }
      if (
        node.callee.type === "IntrinsicExpression" &&
        node.callee.intrinsic === "Array.of" &&
        node.this.type === "PrimitiveExpression"
      ) {
        return {
          type: "ArrayExpression",
          elements: map(node.arguments, (child) =>
            rebuildExpression(child, context),
          ),
        };
      }
      if (
        node.this.type === "PrimitiveExpression" &&
        isUndefinedPrimitive(node.this.primitive)
      ) {
        return {
          type: "CallExpression",
          optional: false,
          callee: sanitizeMemberExpression(
            rebuildExpression(node.callee, context),
          ),
          arguments: map(node.arguments, (child) =>
            rebuildExpression(child, context),
          ),
        };
      }
      if (
        node.callee.type === "ApplyExpression" &&
        node.callee.callee.type === "IntrinsicExpression" &&
        node.callee.callee.intrinsic === "aran.get" &&
        node.callee.this.type === "PrimitiveExpression" &&
        node.callee.arguments.length === 2 &&
        isInvocable(node.this, node.callee.arguments[0])
      ) {
        return {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "MemberExpression",
            optional: false,
            computed: true,
            object: rebuildExpression(node.callee.arguments[0], context),
            property: rebuildExpression(node.callee.arguments[1], context),
          },
          arguments: map(node.arguments, (child) =>
            rebuildExpression(child, context),
          ),
        };
      }
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: context.intrinsic,
          },
          property: {
            type: "Literal",
            value: "Reflect.apply",
          },
        },
        arguments: [
          rebuildExpression(node.callee, context),
          rebuildExpression(node.this, context),
          {
            type: "ArrayExpression",
            elements: map(node.arguments, (child) =>
              rebuildExpression(child, context),
            ),
          },
        ],
      };
    }
    default: {
      throw new AranTypeError("invalid expression node", node);
    }
  }
};
