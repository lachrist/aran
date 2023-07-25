/* eslint-disable no-use-before-define */

import {
  reduceReverse,
  concat$$,
  concat_$_,
  map,
  hasOwn,
  concat_$,
} from "../util/index.mjs";

const {
  SyntaxError,
  TypeError,
  BigInt,
  JSON: { stringify: stringifyJSON },
} = globalThis;

////////////
// Revert //
////////////

/** @type {Record<Parameter, EstreeExpression>} */
const parameters = {
  "error": {
    type: "Identifier",
    name: "error",
  },
  "arguments": {
    type: "Identifier",
    name: "arguments",
  },
  "this": {
    type: "ThisExpression",
  },
  "new.target": {
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
  "import.meta": {
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "import",
    },
    property: {
      type: "Identifier",
      name: "meta",
    },
  },
  "import": {
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "import",
    },
    property: {
      type: "Identifier",
      name: "dynamic",
    },
  },
  "super.get": {
    type: "MemberExpression",
    computed: false,
    optional: false,
    object: {
      type: "Super",
    },
    property: {
      type: "Identifier",
      name: "get",
    },
  },
  "super.set": {
    type: "MemberExpression",
    computed: false,
    optional: false,
    object: {
      type: "Super",
    },
    property: {
      type: "Identifier",
      name: "set",
    },
  },
  "super.call": {
    type: "MemberExpression",
    computed: false,
    optional: false,
    object: {
      type: "Super",
    },
    property: {
      type: "Identifier",
      name: "call",
    },
  },
};

/** @type {(parameter: Parameter) => EstreeExpression} */
const revertParameter = (parameter) => parameters[parameter];

/** @type {(node: Program<unknown>) => EstreeProgram} */
export const revertProgram = (node) => {
  if (node.type === "ScriptProgram") {
    return {
      type: "Program",
      sourceType: "script",
      body: concat_$(
        /** @type {EstreeProgramStatement} */ ({
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "script",
            raw: "'script'",
          },
          directive: "script",
        }),
        map(node.statements, revertStatement),
      ),
    };
  } else if (node.type === "ModuleProgram") {
    return {
      type: "Program",
      sourceType: "module",
      body: concat_$_(
        /** @type {EstreeProgramStatement} */ ({
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "module",
            raw: "'module'",
          },
          directive: "module",
        }),
        map(node.links, revertLink),
        revertBlock(node.body),
      ),
    };
  } else if (node.type === "EvalProgram") {
    return {
      type: "Program",
      sourceType: "script",
      body: [
        /** @type {EstreeProgramStatement} */ ({
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "eval",
            raw: "'eval'",
          },
          directive: "eval",
        }),
        revertBlock(node.body),
      ],
    };
  } else {
    throw new TypeError("invalid program");
  }
};

/** @type {(node: Link<unknown>) => EstreeModuleDeclaration} */
export const revertLink = (node) => {
  if (node.type === "ImportLink") {
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
  } else if (node.type === "ExportLink") {
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
  } else if (node.type === "AggregateLink") {
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
      if (node.export === null) {
        throw new SyntaxError("aggregate named link requires an export");
      }
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
  } else {
    throw new TypeError("invalid link type");
  }
};

/** @type {(node: EstreeStatement, label: Label) => EstreeStatement} */
export const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: label,
  },
  body: node,
});

/** @type {(variable: Variable) => EstreeVariableDeclarator} */
export const makeVariableDeclarator = (variable) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: variable,
  },
  init: null,
});

/** @type {(node: Block<unknown>) => EstreeBlockStatement} */
const revertInnerBlock = (node) => ({
  type: "BlockStatement",
  body: concat$$(
    node.variables.length === 0
      ? []
      : [
          {
            type: "VariableDeclaration",
            kind: "let",
            declarations: map(node.variables, makeVariableDeclarator),
          },
        ],
    map(node.statements, revertStatement),
  ),
});

/** @type {(node: Block<unknown>) => EstreeStatement} */
export const revertBlock = (node) =>
  reduceReverse(node.labels, accumulateLabel, revertInnerBlock(node));

/** @type {(node: Block<unknown>) => EstreeBlockStatement} */
export const revertNakedBlock = (node) => {
  if (node.labels.length > 0) {
    throw new SyntaxError("unexpected label in block");
  }
  return revertInnerBlock(node);
};

/** @type {(node:Statement<unknown>) => EstreeStatement} */
export const revertStatement = (node) => {
  if (node.type === "DebuggerStatement") {
    return {
      type: "DebuggerStatement",
    };
  } else if (node.type === "ReturnStatement") {
    return {
      type: "ReturnStatement",
      argument: revertExpression(node.value),
    };
  } else if (node.type === "BreakStatement") {
    return {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: node.label,
      },
    };
  } else if (node.type === "BlockStatement") {
    return revertBlock(node.body);
  } else if (node.type === "IfStatement") {
    return {
      type: "IfStatement",
      test: revertExpression(node.test),
      consequent: revertBlock(node.then),
      alternate: revertBlock(node.else),
    };
  } else if (node.type === "WhileStatement") {
    return {
      type: "WhileStatement",
      test: revertExpression(node.test),
      body: revertBlock(node.body),
    };
  } else if (node.type === "TryStatement") {
    return {
      type: "TryStatement",
      block: revertNakedBlock(node.body),
      handler: {
        type: "CatchClause",
        param: null,
        body: revertNakedBlock(node.catch),
      },
      finalizer: revertNakedBlock(node.finally),
    };
  } else if (node.type === "EffectStatement") {
    return {
      type: "ExpressionStatement",
      expression: revertEffect(node.effect),
    };
  } else if (node.type === "DeclareExternalStatement") {
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
          init: revertExpression(node.value),
        },
      ],
    };
  } else {
    throw new TypeError("invalid statement type");
  }
};

/** @type {(effects: Effect<unknown>[]) => EstreeExpression} */
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

/** @type {(effect: Effect<unknown>) => EstreeExpression} */
export const revertEffect = (node) => {
  if (node.type === "WriteEffect") {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: node.variable,
      },
      right: revertExpression(node.value),
    };
  } else if (node.type === "WriteExternalEffect") {
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
      right: revertExpression(node.value),
    };
  } else if (node.type === "ExportEffect") {
    return {
      type: "BinaryExpression",
      operator: "<<",
      left: {
        type: "Literal",
        value: node.export,
        raw: stringifyJSON(node.export),
      },
      right: revertExpression(node.value),
    };
  } else if (node.type === "ConditionalEffect") {
    return {
      type: "ConditionalExpression",
      test: revertExpression(node.test),
      consequent: revertEffectArray(node.positive),
      alternate: revertEffectArray(node.negative),
    };
  } else if (node.type === "ExpressionEffect") {
    return {
      type: "UnaryExpression",
      operator: "void",
      prefix: true,
      argument: revertExpression(node.discard),
    };
  } else {
    throw new TypeError("invalid effect type");
  }
};

/** @type {(node: Expression<unknown>) => EstreeExpression} */
export const revertExpression = (node) => {
  if (node.type === "ParameterExpression") {
    return revertParameter(node.parameter);
  } else if (node.type === "PrimitiveExpression") {
    if (typeof node.primitive === "object" && node.primitive !== null) {
      if (hasOwn(node.primitive, "undefined")) {
        return {
          type: "Identifier",
          name: "undefined",
        };
      } else if (hasOwn(node.primitive, "bigint")) {
        return {
          type: "Literal",
          value: BigInt(
            /** @type {{bigint: string}} */ (node.primitive).bigint,
          ),
          bigint: /** @type {{bigint: string}} */ (node.primitive).bigint,
          raw: `${/** @type {{bigint: string}} */ (node.primitive).bigint}n`,
        };
      } else {
        throw new TypeError("invalid primitive");
      }
    } else {
      return {
        type: "Literal",
        value: node.primitive,
        raw: stringifyJSON(node.primitive),
      };
    }
  } else if (node.type === "IntrinsicExpression") {
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
  } else if (node.type === "ImportExpression") {
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
  } else if (node.type === "ReadExpression") {
    return {
      type: "Identifier",
      name: node.variable,
    };
  } else if (node.type === "ReadExternalExpression") {
    return {
      type: "ArrayExpression",
      elements: [
        {
          type: "Identifier",
          name: node.variable,
        },
      ],
    };
  } else if (node.type === "TypeofExternalExpression") {
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
  } else if (node.type === "ClosureExpression") {
    if (node.kind === "arrow") {
      if (node.generator) {
        throw new SyntaxError("arrow cannot be generator");
      }
      return {
        type: "ArrowFunctionExpression",
        expression: false,
        async: node.asynchronous,
        generator: false,
        params: [],
        body: revertNakedBlock(node.body),
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
        body: revertNakedBlock(node.body),
      };
    }
  } else if (node.type === "AwaitExpression") {
    return {
      type: "AwaitExpression",
      argument: revertExpression(node.value),
    };
  } else if (node.type === "YieldExpression") {
    return {
      type: "YieldExpression",
      delegate: node.delegate,
      argument: revertExpression(node.value),
    };
  } else if (node.type === "SequenceExpression") {
    return {
      type: "SequenceExpression",
      expressions: [revertEffect(node.effect), revertExpression(node.value)],
    };
  } else if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalExpression",
      test: revertExpression(node.test),
      consequent: revertExpression(node.consequent),
      alternate: revertExpression(node.alternate),
    };
  } else if (node.type === "EvalExpression") {
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [revertExpression(node.argument)],
    };
  } else if (node.type === "ApplyExpression") {
    return {
      type: "CallExpression",
      callee: revertExpression(node.callee),
      optional: false,
      arguments: concat_$(
        {
          type: "UnaryExpression",
          operator: "!",
          prefix: true,
          argument: revertExpression(node.this),
        },
        map(node.arguments, revertExpression),
      ),
    };
  } else if (node.type === "ConstructExpression") {
    return {
      type: "NewExpression",
      callee: revertExpression(node.callee),
      arguments: map(node.arguments, revertExpression),
    };
  } else {
    throw new TypeError("invalid expression");
  }
};
