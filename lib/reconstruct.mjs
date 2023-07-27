/* eslint-disable no-use-before-define */

import {
  reduceReverse,
  map,
  flatMap,
  StaticError,
  DynamicError,
  removeDuplicate,
  hasOwn,
  includes,
  pairup,
  slice,
  some,
  flat,
} from "./util/index.mjs";

import {
  UNARY_OPERATOR_ARRAY,
  BINARY_OPERATOR_ARRAY,
} from "./estree/enumeration.mjs";

import { unpackPrimitive } from "./syntax.mjs";

import {
  hasImportParameter,
  hasSuperGetParameter,
  hasSuperSetParameter,
  hasSuperCallParameter,
} from "./query.mjs";

import { AranError } from "./error.mjs";

const {
  BigInt,
  Reflect: { apply },
  Number: {
    prototype: { toString },
  },
  String: {
    prototype: { charCodeAt, padStart, replace, startsWith },
  },
} = globalThis;

/**
 * @typedef {object} Context
 * @property {string} prefix
 * @property {string} intrinsic
 * @property {Record<Parameter, string>} parameters
 */

///////////
// Other //
///////////

/** @type {(node: EstreeExpression) => EstreeExpression} */
const sanitizeMemberExpression = (node) =>
  node.type === "MemberExpression"
    ? {
        type: "SequenceExpression",
        expressions: [{ type: "Literal", value: null }, node],
      }
    : node;

/** @type {(node1: Expression<unknown>, node2: Expression<unknown>) => boolean} */
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

/** @type {(unknown: unknown) => unknown is EstreeUnaryOperator}  */
const isUnaryOperator = (unknown) => includes(UNARY_OPERATOR_ARRAY, unknown);

/** @type {(unknown: unknown) => unknown is EstreeBinaryOperator}  */
const isBinaryOperator = (unknown) => includes(BINARY_OPERATOR_ARRAY, unknown);

//////////////
// Variable //
//////////////

/** @type {(prefix: string, kind: "reg" | "imp" | "exp" | "prm" | "tmp", variable: string) => string} */
const encodeInternal = (prefix, kind, variable) =>
  `${prefix}_${kind}_${variable}`;

/** @type {(variable: string, context: Context) => void} */
const checkExternal = (variable, context) => {
  if (variable === context.intrinsic) {
    throw new AranError(
      `external variable clashes with intrinsic name: ${variable}`,
    );
  }
  if (apply(startsWith, variable, [context.prefix])) {
    throw new AranError(
      `external variable clashes with internal prefix: ${variable}`,
    );
  }
};

////////////
// Escape //
////////////

const PAD = [4, "0"];

const HEX = [16];

const FIRST = [0];

/** @type {(character: string) => string} */
const escapeCharacter = (character) =>
  `$${apply(
    padStart,
    apply(toString, apply(charCodeAt, character, FIRST), HEX),
    PAD,
  )}`;

const ESCAPE = [/[^a-zA-Z0-9]/gu, escapeCharacter];

/** @type {(character: string) => string} */
const escape = (string) => apply(replace, string, ESCAPE);

/** @type {(prefix: string, source: string, specifier: string | null) => string} */
const encodeImport = (prefix, source, specifier) => {
  if (specifier === null) {
    return encodeInternal(prefix, "imp", escape(source));
  } else {
    return encodeInternal(
      prefix,
      "imp",
      `${escape(source)}_${escape(specifier)}`,
    );
  }
};

/** @type {(prefix: string, specifier: string) => string} */
const encodeExport = (prefix, specifier) =>
  encodeInternal(prefix, "exp", escape(specifier));

/** @type {(prefix: string, variable: string) => string} */
const encodeRegular = (prefix, variable) =>
  encodeInternal(prefix, "prm", variable);

/** @type {(parameter: Parameter) => string} */
const sanitizeParameter = (parameter) => {
  switch (parameter) {
    case "new.target":
      return "new_target";
    case "import.meta":
      return "import_meta";
    case "super.get":
      return "super_get";
    case "super.set":
      return "super_set";
    case "super.call":
      return "super_call";
    default:
      return parameter;
  }
};

/** @type {(prefix: string, parameter: Parameter) => string} */
const encodeParameter = (prefix, parameter) =>
  encodeInternal(prefix, "prm", sanitizeParameter(parameter));

/** @type {(prefix: string, variable: "src" | "key" | "val" | "arg" | "mtd") => string} */
const encodeTemporary = (prefix, variable) =>
  encodeInternal(prefix, "tmp", variable);

/////////////
// Builder //
/////////////

/** @type {(node: EstreeStatement, label: string) => EstreeStatement} */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: label,
  },
  body: node,
});

/** @type {(kind: "var" | "let" | "const", declarators: EstreeVariableDeclarator[]) => EstreeStatement[]} */
const makeVariableDeclaration = (kind, declarators) =>
  declarators.length === 0
    ? []
    : [
        {
          type: "VariableDeclaration",
          kind,
          declarations: declarators,
        },
      ];

//////////////////////////
// Parameter Declarator //
//////////////////////////

/** @type {(context: Context) => EstreeVariableDeclarator} */
const makeSuperGetDeclarator = (context) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: encodeParameter(context.prefix, "super.get"),
  },
  init: {
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "key"),
      },
    ],
    body: {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: {
        type: "Super",
      },
      property: {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "key"),
      },
    },
  },
});

/** @type {(context: Context) => EstreeVariableDeclarator} */
const makeSuperSetDeclarator = (context) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: encodeParameter(context.prefix, "super.set"),
  },
  init: {
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "key"),
      },
      {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "val"),
      },
    ],
    body: {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Super",
        },
        property: {
          type: "Identifier",
          name: encodeTemporary(context.prefix, "key"),
        },
      },
      right: {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "val"),
      },
    },
  },
});

/** @type {(context: Context) => EstreeVariableDeclarator} */
const makeSuperCallDeclarator = (context) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: encodeParameter(context.prefix, "super.call"),
  },
  init: {
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "arg"),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Super",
      },
      arguments: [
        {
          type: "SpreadElement",
          argument: {
            type: "Identifier",
            name: encodeTemporary(context.prefix, "arg"),
          },
        },
      ],
    },
  },
});

/** @type {(context: Context) => EstreeVariableDeclarator} */
const makeImportDeclarator = (context) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: encodeParameter(context.prefix, "import"),
  },
  init: {
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "src"),
      },
    ],
    body: {
      type: "ImportExpression",
      source: {
        type: "Identifier",
        name: encodeTemporary(context.prefix, "src"),
      },
    },
  },
});

/** @type {(nodes: Node<unknown>[], context: Context) => EstreeStatement[]} */
const makeImportPrelude = (nodes, context) =>
  makeVariableDeclaration(
    "const",
    some(nodes, hasImportParameter) ? [makeImportDeclarator(context)] : [],
  );

// It is important to declare super-related parameters only when they are used.
// That is because they throw an early syntax error outside of functions.
/** @type {(nodes: Node<unknown>[], context: Context) => EstreeStatement[]} */
const makeSuperPrelude = (nodes, context) =>
  makeVariableDeclaration(
    "const",
    flat([
      some(nodes, hasSuperGetParameter)
        ? [makeSuperGetDeclarator(context)]
        : [],
      some(nodes, hasSuperSetParameter)
        ? [makeSuperSetDeclarator(context)]
        : [],
      some(nodes, hasSuperCallParameter)
        ? [makeSuperCallDeclarator(context)]
        : [],
    ]),
  );

///////////////
// Recompile //
///////////////

/** @type {(node: Program<unknown>, context: Context) => EstreeProgram} */
export const reconstructProgram = (node, context) => {
  if (node.type === "ScriptProgram") {
    return {
      type: "Program",
      sourceType: "script",
      body: flat([
        [
          /** @type {EstreeProgramStatement} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict",
            },
            directive: "use strict",
          }),
        ],
        makeImportPrelude(node.statements, context),
        makeSuperPrelude(node.statements, context),
        map(node.statements, (child) => reconstructStatement(child, context)),
      ]),
    };
  } else if (node.type === "EvalProgram") {
    return {
      type: "Program",
      sourceType: "script",
      body: flat([
        [
          /** @type {EstreeProgramStatement} */ ({
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: "use strict",
            },
            directive: "use strict",
          }),
        ],
        makeImportPrelude(node.body.statements, context),
        makeSuperPrelude(node.body.statements, context),
        [reconstructBlock(node.body, [], context)],
      ]),
    };
  } else if (node.type === "ModuleProgram") {
    return {
      type: "Program",
      sourceType: "module",
      body: flat([
        flatMap(node.links, (child) => reconstructLink(child, context)),
        makeImportPrelude(node.body.statements, context),
        makeSuperPrelude(node.body.statements, context),
        [reconstructBlock(node.body, [], context)],
      ]),
    };
  } else {
    throw new StaticError("invalid program node", node);
  }
};

/** @type {(node: Block<unknown>, prelude: EstreeStatement[], context: Context) => EstreeBlockStatement} */
const reconstructNakedBlock = (node, prelude, context) => ({
  type: "BlockStatement",
  body: flat([
    prelude,
    makeVariableDeclaration(
      "let",
      map(node.variables, (variable) => ({
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          name: encodeRegular(context.prefix, variable),
        },
        init: null,
      })),
    ),
    map(node.statements, (child) => reconstructStatement(child, context)),
  ]),
});

/** @type {(node: Block<unknown>, prelude: EstreeStatement[], context: Context) => EstreeStatement} */
const reconstructBlock = (node, prelude, context) =>
  reduceReverse(
    node.labels,
    accumulateLabel,
    reconstructNakedBlock(node, prelude, context),
  );

/** @type {(link: Link<unknown>, context: Context) => EstreeProgramStatement[]} */
const reconstructLink = (node, context) => {
  if (node.type === "ImportLink") {
    return [
      {
        type: "ImportDeclaration",
        specifiers: [
          node.import === null
            ? {
                type: "ImportNamespaceSpecifier",
                local: {
                  type: "Identifier",
                  name: encodeImport(context.prefix, node.source, node.import),
                },
              }
            : {
                type: "ImportSpecifier",
                local: {
                  type: "Identifier",
                  name: encodeImport(context.prefix, node.source, node.import),
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
  } else if (node.type === "ExportLink") {
    return [
      {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: encodeExport(context.prefix, node.export),
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
              name: encodeExport(context.prefix, node.export),
            },
            exported: {
              type: "Identifier",
              name: node.export,
            },
          },
        ],
      },
    ];
  } else if (node.type === "AggregateLink") {
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
      if (node.export === null) {
        throw new DynamicError("missing export on aggregate node", node);
      }
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
  } else {
    throw new StaticError("invalid link node", node);
  }
};

/** @type {(node: Statement<unknown>, context: Context) => EstreeStatement} */
const reconstructStatement = (node, context) => {
  if (node.type === "DeclareExternalStatement") {
    checkExternal(node.variable, context);
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
          init: reconstructExpression(node.value, context),
        },
      ],
    };
  } else if (node.type === "BreakStatement") {
    return {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: node.label,
      },
    };
  } else if (node.type === "DebuggerStatement") {
    return {
      type: "DebuggerStatement",
    };
  } else if (node.type === "ReturnStatement") {
    return {
      type: "ReturnStatement",
      argument: reconstructExpression(node.value, context),
    };
  } else if (node.type === "EffectStatement") {
    return {
      type: "ExpressionStatement",
      expression: reconstructEffect(node.effect, context),
    };
  } else if (node.type === "BlockStatement") {
    return reconstructBlock(node.body, [], context);
  } else if (node.type === "IfStatement") {
    return {
      type: "IfStatement",
      test: reconstructExpression(node.test, context),
      consequent: reconstructBlock(node.then, [], context),
      alternate: reconstructBlock(node.else, [], context),
    };
  } else if (node.type === "TryStatement") {
    return reduceReverse(
      removeDuplicate(
        flat([node.body.labels, node.catch.labels, node.finally.labels]),
      ),
      accumulateLabel,
      {
        type: "TryStatement",
        block: reconstructNakedBlock(node.body, [], context),
        handler: {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: encodeParameter(context.prefix, "error"),
          },
          body: reconstructNakedBlock(node.catch, [], context),
        },
        finalizer: reconstructNakedBlock(node.finally, [], context),
      },
    );
  } else if (node.type === "WhileStatement") {
    return {
      type: "WhileStatement",
      test: reconstructExpression(node.test, context),
      body: reconstructBlock(node.body, [], context),
    };
  } else {
    throw new StaticError("invalid statement node", node);
  }
};

/** @type {(nodes: Effect<unknown>[], context: Context) => EstreeExpression} */
const reconstructEffectArray = (nodes, context) => {
  if (nodes.length === 0) {
    return {
      type: "Literal",
      value: null,
    };
  } else if (nodes.length === 1) {
    return reconstructEffect(nodes[0], context);
  } else {
    return {
      type: "SequenceExpression",
      expressions: map(nodes, (node) => reconstructEffect(node, context)),
    };
  }
};

/** @type {(node: Effect<unknown>, context: Context) => EstreeExpression} */
const reconstructEffect = (node, context) => {
  if (node.type === "ExpressionEffect") {
    return reconstructExpression(node.discard, context);
  } else if (node.type === "WriteEffect") {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: encodeRegular(context.prefix, node.variable),
      },
      right: reconstructExpression(node.value, context),
    };
  } else if (node.type === "WriteExternalEffect") {
    checkExternal(node.variable, context);
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: node.variable,
      },
      right: reconstructExpression(node.value, context),
    };
  } else if (node.type === "ExportEffect") {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: encodeExport(context.prefix, node.export),
      },
      right: reconstructExpression(node.value, context),
    };
  } else if (node.type === "ConditionalEffect") {
    return {
      type: "ConditionalExpression",
      test: reconstructExpression(node.test, context),
      consequent: reconstructEffectArray(node.positive, context),
      alternate: reconstructEffectArray(node.negative, context),
    };
  } else {
    throw new StaticError("invalid effect node", node);
  }
};

/** @type {(node: Expression<unknown>, context: Context) => EstreeExpression} */
const reconstructExpression = (node, context) => {
  if (node.type === "ClosureExpression") {
    if (node.body.labels.length > 0) {
      throw new DynamicError("closure cannot have labels", node);
    }
    if (node.kind === "function") {
      return {
        type: "FunctionExpression",
        id: null,
        async: node.asynchronous,
        generator: node.generator,
        params: [
          {
            type: "RestElement",
            argument: {
              type: "Identifier",
              name: encodeParameter(context.prefix, "arguments"),
            },
          },
        ],
        body: reconstructNakedBlock(
          node.body,
          makeSuperPrelude(node.body.statements, context),
          context,
        ),
      };
    } else if (node.kind === "arrow") {
      if (node.generator) {
        throw new DynamicError("arrow cannot be generator", node);
      }
      return {
        type: "ArrowFunctionExpression",
        async: node.asynchronous,
        expression: false,
        params: [
          {
            type: "RestElement",
            argument: {
              type: "Identifier",
              name: encodeParameter(context.prefix, "arguments"),
            },
          },
        ],
        body: reconstructNakedBlock(node.body, [], context),
      };
    } else if (node.kind === "method") {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              kind: "init",
              method: true,
              shorthand: false,
              computed: false,
              key: {
                type: "Identifier",
                name: encodeTemporary(context.prefix, "mtd"),
              },
              value: {
                type: "FunctionExpression",
                id: null,
                async: node.asynchronous,
                generator: node.generator,
                params: [
                  {
                    type: "RestElement",
                    argument: {
                      type: "Identifier",
                      name: encodeParameter(context.prefix, "arguments"),
                    },
                  },
                ],
                body: reconstructNakedBlock(
                  node.body,
                  makeSuperPrelude(node.body.statements, context),
                  context,
                ),
              },
            },
          ],
        },
        property: {
          type: "Identifier",
          name: encodeTemporary(context.prefix, "mtd"),
        },
      };
    } else if (node.kind === "constructor") {
      if (node.asynchronous) {
        throw new DynamicError("constructor cannot be asynchronous", node);
      }
      if (node.generator) {
        throw new DynamicError("constructor cannot be generator", node);
      }
      return {
        type: "ClassExpression",
        id: null,
        superClass: null,
        body: {
          type: "ClassBody",
          body: [
            {
              type: "MethodDefinition",
              kind: "constructor",
              static: false,
              computed: false,
              key: {
                type: "Identifier",
                name: "constructor",
              },
              value: {
                type: "FunctionExpression",
                id: null,
                async: false,
                generator: false,
                params: [
                  {
                    type: "RestElement",
                    argument: {
                      type: "Identifier",
                      name: encodeParameter(context.prefix, "arguments"),
                    },
                  },
                ],
                body: reconstructNakedBlock(
                  node.body,
                  makeSuperPrelude(node.body.statements, context),
                  context,
                ),
              },
            },
          ],
        },
      };
    } else {
      throw new StaticError("invalid closure kind", node.kind);
    }
  } else if (node.type === "PrimitiveExpression") {
    if (typeof node.primitive === "object" && node.primitive !== null) {
      if (hasOwn(node.primitive, "undefined")) {
        return {
          type: "UnaryExpression",
          operator: "void",
          prefix: true,
          argument: {
            type: "Literal",
            value: 0,
          },
        };
      } else if (hasOwn(node.primitive, "bigint")) {
        return {
          type: "Literal",
          value: BigInt(node.primitive.bigint),
          bigint: node.primitive.bigint,
        };
      } else {
        throw new StaticError("invalid primitive object", node.primitive);
      }
    } else {
      return {
        type: "Literal",
        value: node.primitive,
      };
    }
  } else if (node.type === "IntrinsicExpression") {
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
  } else if (node.type === "ParameterExpression") {
    if (node.parameter === "this") {
      return {
        type: "ThisExpression",
      };
    } else if (node.parameter === "new.target") {
      return {
        type: "MetaProperty",
        meta: {
          type: "Identifier",
          name: "new",
        },
        property: {
          type: "Identifier",
          name: "target",
        },
      };
    } else if (node.parameter === "import.meta") {
      return {
        type: "MetaProperty",
        meta: {
          type: "Identifier",
          name: "import",
        },
        property: {
          type: "Identifier",
          name: "meta",
        },
      };
    } else {
      return {
        type: "Identifier",
        name: encodeParameter(context.prefix, node.parameter),
      };
    }
  } else if (node.type === "ReadExpression") {
    return {
      type: "Identifier",
      name: encodeRegular(context.prefix, node.variable),
    };
  } else if (node.type === "ImportExpression") {
    return {
      type: "Identifier",
      name: encodeImport(context.prefix, node.source, node.import),
    };
  } else if (node.type === "ReadExternalExpression") {
    checkExternal(node.variable, context);
    return {
      type: "Identifier",
      name: node.variable,
    };
  } else if (node.type === "TypeofExternalExpression") {
    checkExternal(node.variable, context);
    return {
      type: "UnaryExpression",
      operator: "typeof",
      prefix: true,
      argument: {
        type: "Identifier",
        name: node.variable,
      },
    };
  } else if (node.type === "AwaitExpression") {
    return {
      type: "AwaitExpression",
      argument: reconstructExpression(node.value, context),
    };
  } else if (node.type === "YieldExpression") {
    return {
      type: "YieldExpression",
      delegate: node.delegate,
      argument: reconstructExpression(node.value, context),
    };
  } else if (node.type === "ConditionalExpression") {
    return {
      type: "ConditionalExpression",
      test: reconstructExpression(node.test, context),
      consequent: reconstructExpression(node.consequent, context),
      alternate: reconstructExpression(node.alternate, context),
    };
  } else if (node.type === "SequenceExpression") {
    return {
      type: "SequenceExpression",
      expressions: [
        reconstructEffect(node.effect, context),
        reconstructExpression(node.value, context),
      ],
    };
  } else if (node.type === "EvalExpression") {
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [reconstructExpression(node.argument, context)],
    };
  } else if (node.type === "ConstructExpression") {
    return {
      type: "NewExpression",
      callee: reconstructExpression(node.callee, context),
      arguments: map(node.arguments, (child) =>
        reconstructExpression(child, context),
      ),
    };
  } else if (node.type === "ApplyExpression") {
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
        object: reconstructExpression(node.arguments[0], context),
        property: reconstructExpression(node.arguments[1], context),
      };
    }
    if (
      node.callee.type === "IntrinsicExpression" &&
      node.callee.intrinsic === "aran.setStrict" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 3
    ) {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: reconstructExpression(node.arguments[0], context),
          property: reconstructExpression(node.arguments[1], context),
        },
        right: reconstructExpression(node.arguments[2], context),
      };
    }
    if (
      node.callee.type === "IntrinsicExpression" &&
      node.callee.intrinsic === "aran.unary" &&
      node.arguments.length === 2 &&
      node.arguments[0].type === "PrimitiveExpression" &&
      isUnaryOperator(node.arguments[0].primitive)
    ) {
      if (node.arguments[0].primitive === "delete") {
        return {
          type: "SequenceExpression",
          expressions: [
            reconstructExpression(node.arguments[1], context),
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
          argument: reconstructExpression(node.arguments[1], context),
        };
      }
    }
    if (
      node.callee.type === "IntrinsicExpression" &&
      node.callee.intrinsic === "aran.binary" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 3 &&
      node.arguments[0].type === "PrimitiveExpression" &&
      isBinaryOperator(node.arguments[0].primitive)
    ) {
      return {
        type: "BinaryExpression",
        operator: node.arguments[0].primitive,
        left: reconstructExpression(node.arguments[1], context),
        right: reconstructExpression(node.arguments[2], context),
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
        properties: flat([
          node.arguments[0].type === "IntrinsicExpression" &&
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
                  value: reconstructExpression(node.arguments[0], context),
                },
              ],
          map(
            pairup(slice(node.arguments, 1, node.arguments.length)),
            (pair) => ({
              type: "Property",
              kind: "init",
              method: false,
              computed: false,
              shorthand: false,
              key: reconstructExpression(pair[0], context),
              value: reconstructExpression(pair[1], context),
            }),
          ),
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
          reconstructExpression(child, context),
        ),
      };
    }
    if (
      node.this.type === "PrimitiveExpression" &&
      typeof node.this.primitive === "object" &&
      node.this.primitive !== null &&
      hasOwn(node.this.primitive, "undefined")
    ) {
      return {
        type: "CallExpression",
        optional: false,
        callee: sanitizeMemberExpression(
          reconstructExpression(node.callee, context),
        ),
        arguments: map(node.arguments, (child) =>
          reconstructExpression(child, context),
        ),
      };
    }
    if (
      node.callee.type === "ParameterExpression" &&
      node.callee.parameter === "import" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 1
    ) {
      return {
        type: "ImportExpression",
        source: reconstructExpression(node.arguments[0], context),
      };
    }
    if (
      node.callee.type === "ParameterExpression" &&
      node.callee.parameter === "super.get" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 1
    ) {
      return {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Super",
        },
        property: reconstructExpression(node.arguments[0], context),
      };
    }
    if (
      node.callee.type === "ParameterExpression" &&
      node.callee.parameter === "super.set" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 2
    ) {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Super",
          },
          property: reconstructExpression(node.arguments[0], context),
        },
        right: reconstructExpression(node.arguments[1], context),
      };
    }
    if (
      node.callee.type === "ParameterExpression" &&
      node.callee.parameter === "super.call" &&
      node.this.type === "PrimitiveExpression" &&
      node.arguments.length === 1 &&
      node.arguments[0].type === "ApplyExpression" &&
      node.arguments[0].callee.type === "IntrinsicExpression" &&
      node.arguments[0].callee.intrinsic === "Array.of" &&
      node.arguments[0].this.type === "PrimitiveExpression"
    ) {
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "Super",
        },
        arguments: map(node.arguments[0].arguments, (child) =>
          reconstructExpression(child, context),
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
          object: reconstructExpression(node.callee.arguments[0], context),
          property: reconstructExpression(node.callee.arguments[1], context),
        },
        arguments: map(node.arguments, (child) =>
          reconstructExpression(child, context),
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
        reconstructExpression(node.callee, context),
        reconstructExpression(node.this, context),
        {
          type: "ArrayExpression",
          elements: map(node.arguments, (child) =>
            reconstructExpression(child, context),
          ),
        },
      ],
    };
  } else {
    throw new StaticError("invalid expression node", node);
  }
};
