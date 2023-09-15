/* eslint-disable no-use-before-define */

import {
  isClosureBlockNode,
  isControlBlockNode,
  isEffectNode,
  isExpressionNode,
  isLinkNode,
  isProgramNode,
  isStatementNode,
} from "../node.mjs";

import {
  StaticError,
  DynamicError,
  reduceReverse,
  map,
  hasOwn,
} from "../util/index.mjs";

import { revertLabel, revertVariable } from "./identifier.mjs";

const {
  BigInt,
  JSON: { stringify: stringifyJSON },
} = globalThis;

////////////
// Revert //
////////////

/** @type {<V extends string, T>(node: aran.Program<V, T>) => estree.Program} */
export const revertProgram = (node) => {
  switch (node.type) {
    case "ScriptProgram":
      return {
        type: "Program",
        sourceType: "script",
        body: [
          /** @type {estree.ProgramStatement} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "script",
              raw: "'script'",
            },
            directive: "script",
          }),
          ...revertPseudoBlock(node.body),
        ],
      };
    case "ModuleProgram":
      return {
        type: "Program",
        sourceType: "module",
        body: [
          /** @type {estree.ProgramStatement} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "module",
              raw: "'module'",
            },
            directive: "module",
          }),
          ...map(node.links, revertLink),
          revertClosureBlock(node.body),
        ],
      };
    case "EvalProgram":
      return {
        type: "Program",
        sourceType: "script",
        body: [
          /** @type {estree.ProgramStatement} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "eval",
              raw: "'eval'",
            },
            directive: "eval",
          }),
          revertClosureBlock(node.body),
        ],
      };
    /* c8 ignore start */
    default:
      throw new StaticError("invalid program node", node);
    /* c8 ignore stop */
  }
};

/** @type {<T>(node: aran.Link<T>) => estree.ModuleDeclaration} */
export const revertLink = (node) => {
  switch (node.type) {
    case "ImportLink":
      return {
        type: "ImportDeclaration",
        specifiers:
          node.import === null
            ? []
            : [
                {
                  type: "ImportSpecifier",
                  local: {
                    type: "Identifier",
                    name: node.import,
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
          raw: stringifyJSON(node.source),
        },
      };
    case "ExportLink":
      return {
        type: "ExportNamedDeclaration",
        declaration: null,
        specifiers: [
          {
            type: "ExportSpecifier",
            local: {
              type: "Identifier",
              name: node.export,
            },
            exported: {
              type: "Identifier",
              name: node.export,
            },
          },
        ],
        source: null,
      };
    case "AggregateLink":
      if (node.import === null) {
        return {
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
            raw: stringifyJSON(node.source),
          },
        };
      } else {
        /* c8 ignore start */
        if (node.export === null) {
          throw new DynamicError(
            "aggregate named link requires an export",
            node,
          );
        }
        /* c8 ignore stop */
        return {
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
          source: {
            type: "Literal",
            value: node.source,
            raw: stringifyJSON(node.source),
          },
        };
      }
    /* c8 ignore start */
    default:
      throw new StaticError("invalid link node", node);
    /* c8 ignore stop */
  }
};

/** @type {(node: estree.Statement, label: aran.Label) => estree.Statement} */
export const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: revertLabel(label),
  },
  body: node,
});

/** @type {<V extends string>(variable: V) => estree.VariableDeclarator} */
export const makeVariableDeclarator = (variable) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: revertVariable(
      /** @type {aran.Variable} */ (/** @type {string} */ (variable)),
    ),
  },
  init: null,
});

/** @type {<V extends string>(variables: V[]) => estree.VariableDeclaration[]} */
export const listVariableDeclaration = (variables) =>
  variables.length === 0
    ? []
    : [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: map(variables, makeVariableDeclarator),
        },
      ];

/** @type {<V extends string, T>(node: aran.ControlBlock<V, T>) => estree.BlockStatement} */
const revertControlBlockInner = (node) => ({
  type: "BlockStatement",
  body: [
    ...listVariableDeclaration(node.variables),
    ...map(node.statements, revertStatement),
  ],
});

/** @type {<V extends string, T>(node: aran.ControlBlock<V, T>) => estree.Statement} */
export const revertControlBlock = (node) =>
  reduceReverse(node.labels, accumulateLabel, revertControlBlockInner(node));

// TODO: differentiate with genuinely nested labeled statement.
/** @type {<V extends string, T>(node: aran.ControlBlock<V, T>) => estree.BlockStatement} */
export const revertNakedControlBlock = (node) =>
  node.labels.length === 0
    ? revertControlBlockInner(node)
    : {
        type: "BlockStatement",
        body: [revertControlBlock(node)],
      };

/** @type {<V extends string, T>(node: aran.PseudoBlock<V, T>) => estree.Statement[]} */
export const revertPseudoBlock = (node) => [
  ...map(node.statements, revertStatement),
  {
    type: "ExpressionStatement",
    expression: revertExpression(node.completion),
  },
];

/** @type {<V extends string, T>(node: aran.ClosureBlock<V, T>) => estree.BlockStatement} */
export const revertClosureBlock = (node) => ({
  type: "BlockStatement",
  body: [
    ...listVariableDeclaration(node.variables),
    ...map(node.statements, revertStatement),
    {
      type: "ExpressionStatement",
      expression: revertExpression(node.completion),
    },
  ],
});

/** @type {<V extends string, T>(node: aran.Statement<V, T>) => estree.Statement} */
export const revertStatement = (node) => {
  switch (node.type) {
    case "DebuggerStatement":
      return {
        type: "DebuggerStatement",
      };
    case "ReturnStatement":
      return {
        type: "ReturnStatement",
        argument: revertExpression(node.result),
      };
    case "BreakStatement":
      return {
        type: "BreakStatement",
        label: {
          type: "Identifier",
          name: node.label,
        },
      };
    case "BlockStatement":
      return revertControlBlock(node.do);
    case "IfStatement":
      return {
        type: "IfStatement",
        test: revertExpression(node.if),
        consequent: revertControlBlock(node.then),
        alternate: revertControlBlock(node.else),
      };
    case "WhileStatement":
      return {
        type: "WhileStatement",
        test: revertExpression(node.while),
        body: revertControlBlock(node.do),
      };
    case "TryStatement":
      return {
        type: "TryStatement",
        block: revertNakedControlBlock(node.try),
        handler: {
          type: "CatchClause",
          param: null,
          body: revertNakedControlBlock(node.catch),
        },
        finalizer: revertNakedControlBlock(node.finally),
      };
    case "EffectStatement":
      return {
        type: "ExpressionStatement",
        expression: revertEffect(node.inner),
      };
    case "DeclareEnclaveStatement":
      return {
        type: "VariableDeclaration",
        kind: node.kind,
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "ArrayPattern",
              elements: [
                {
                  type: "Identifier",
                  name: node.variable,
                },
              ],
            },
            init: revertExpression(node.right),
          },
        ],
      };
    /* c8 ignore start */
    default:
      throw new StaticError("invalid statement node", node);
    /* c8 ignore stop */
  }
};

/** @type {<V extends string, T>(effects: aran.Effect<V, T>[]) => estree.Expression} */
export const revertEffectArray = (effects) => {
  if (effects.length === 0) {
    return {
      type: "Identifier",
      name: "undefined",
    };
  } else if (effects.length === 1) {
    return revertEffect(effects[0]);
  } else {
    return {
      type: "SequenceExpression",
      expressions: map(effects, revertEffect),
    };
  }
};

/** @type {<V extends string, T>(effect: aran.Effect<V, T>) => estree.Expression} */
export const revertEffect = (node) => {
  switch (node.type) {
    case "WriteEffect":
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: revertVariable(
            /** @type {aran.Parameter | aran.Variable} */ (node.variable),
          ),
        },
        right: revertExpression(node.right),
      };
    case "WriteEnclaveEffect":
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "ArrayPattern",
          elements: [
            {
              type: "Identifier",
              name: node.variable,
            },
          ],
        },
        right: revertExpression(node.right),
      };
    case "ExportEffect":
      return {
        type: "BinaryExpression",
        operator: "<<",
        left: {
          type: "Literal",
          value: node.export,
          raw: stringifyJSON(node.export),
        },
        right: revertExpression(node.right),
      };
    case "ConditionalEffect":
      return {
        type: "ConditionalExpression",
        test: revertExpression(node.condition),
        consequent: revertEffectArray(node.positive),
        alternate: revertEffectArray(node.negative),
      };
    case "ExpressionEffect":
      return {
        type: "UnaryExpression",
        operator: "void",
        prefix: true,
        argument: revertExpression(node.discard),
      };
    /* c8 ignore start */
    default:
      throw new StaticError("invalid effect node", node);
    /* c8 ignore stop */
  }
};

/** @type {<V extends string, T>(node: aran.Expression<V, T>) => estree.Expression} */
export const revertExpression = (node) => {
  switch (node.type) {
    case "PrimitiveExpression":
      if (typeof node.primitive === "object" && node.primitive !== null) {
        if (hasOwn(node.primitive, "undefined")) {
          return {
            type: "Identifier",
            name: "undefined",
          };
        } else if (hasOwn(node.primitive, "bigint")) {
          return {
            type: "Literal",
            value: BigInt(node.primitive.bigint),
            bigint: node.primitive.bigint,
            raw: `${node.primitive.bigint}n`,
          };
        } /* c8 ignore start */ else {
          throw new StaticError("invalid primitive node", node.primitive);
        } /* c8 ignore stop */
      } else {
        return {
          type: "Literal",
          value: node.primitive,
          raw: stringifyJSON(node.primitive),
        };
      }
    case "IntrinsicExpression":
      return {
        type: "MemberExpression",
        computed: true,
        optional: false,
        object: {
          type: "Identifier",
          name: "intrinsic",
        },
        property: {
          type: "Literal",
          value: node.intrinsic,
          raw: stringifyJSON(node.intrinsic),
        },
      };
    case "ImportExpression":
      return {
        type: "BinaryExpression",
        operator: ">>",
        left: {
          type: "Literal",
          value: node.source,
          raw: stringifyJSON(node.source),
        },
        right: {
          type: "Literal",
          value: node.import === null ? "*" : node.import,
          raw: stringifyJSON(node.import === null ? "*" : node.import),
        },
      };
    case "ReadExpression":
      return {
        type: "Identifier",
        name: revertVariable(
          /** @type {aran.Parameter | aran.Variable} */ (node.variable),
        ),
      };
    case "ReadEnclaveExpression":
      return {
        type: "ArrayExpression",
        elements: [
          {
            type: "Identifier",
            name: node.variable,
          },
        ],
      };
    case "TypeofEnclaveExpression":
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "ArrayExpression",
          elements: [
            {
              type: "Identifier",
              name: node.variable,
            },
          ],
        },
      };
    case "ClosureExpression":
      if (node.kind === "arrow") {
        /* c8 ignore start */
        if (node.generator) {
          throw new DynamicError("arrow cannot be generator", node);
        }
        /* c8 ignore stop */
        return {
          type: "ArrowFunctionExpression",
          expression: false,
          async: node.asynchronous,
          generator: false,
          params: [],
          body: revertClosureBlock(node.body),
        };
      } else {
        return {
          type: "FunctionExpression",
          id:
            node.kind === "function"
              ? null
              : {
                  type: "Identifier",
                  name: node.kind,
                },
          async: node.asynchronous,
          generator: node.generator,
          params: [],
          body: revertClosureBlock(node.body),
        };
      }
    case "AwaitExpression":
      return {
        type: "AwaitExpression",
        argument: revertExpression(node.promise),
      };
    case "YieldExpression":
      return {
        type: "YieldExpression",
        delegate: node.delegate,
        argument: revertExpression(node.item),
      };
    case "SequenceExpression":
      return {
        type: "SequenceExpression",
        expressions: [revertEffect(node.head), revertExpression(node.tail)],
      };
    case "ConditionalExpression":
      return {
        type: "ConditionalExpression",
        test: revertExpression(node.condition),
        consequent: revertExpression(node.consequent),
        alternate: revertExpression(node.alternate),
      };
    case "EvalExpression":
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "Identifier",
          name: "eval",
        },
        arguments: [revertExpression(node.code)],
      };
    case "ApplyExpression":
      return {
        type: "CallExpression",
        callee: revertExpression(node.callee),
        optional: false,
        arguments: [
          {
            type: "UnaryExpression",
            operator: "!",
            prefix: true,
            argument: revertExpression(node.this),
          },
          ...map(node.arguments, revertExpression),
        ],
      };
    case "ConstructExpression":
      return {
        type: "NewExpression",
        callee: revertExpression(node.callee),
        arguments: map(node.arguments, revertExpression),
      };
    /* c8 ignore start */
    default:
      throw new StaticError("invalid expression node", node);
    /* c8 ignore stop */
  }
};

/** @type {(directive: string) => estree.Statement} */
const makeDirective = (directive) => ({
  type: "ExpressionStatement",
  expression: {
    type: "Literal",
    value: directive,
  },
});

/** @type {<V extends string, T>(node: aran.Node<V, T>) => estree.Program} */
export const revert = (node) => {
  if (isProgramNode(node)) {
    return revertProgram(node);
  } else if (isLinkNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [makeDirective("link"), revertLink(node)],
    };
  } else if (node.type === "PseudoBlock") {
    return {
      type: "Program",
      sourceType: "module",
      body: [makeDirective("pseudo-block"), ...revertPseudoBlock(node)],
    };
  } else if (isControlBlockNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [makeDirective("control-block"), revertControlBlock(node)],
    };
  } else if (isClosureBlockNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [makeDirective("closure-block"), revertClosureBlock(node)],
    };
  } else if (isStatementNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [makeDirective("statement"), revertStatement(node)],
    };
  } else if (isEffectNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [
        makeDirective("effect"),
        { type: "ExpressionStatement", expression: revertEffect(node) },
      ],
    };
  } else if (isExpressionNode(node)) {
    return {
      type: "Program",
      sourceType: "module",
      body: [
        makeDirective("expression"),
        { type: "ExpressionStatement", expression: revertExpression(node) },
      ],
    };
  } /* c8 ignore start */ else {
    throw new StaticError("invalid node", node);
  } /* c8 ignore stop */
};
