/* eslint-disable no-use-before-define */

import {
  reduceReverse,
  map,
  flatMap,
  StaticError,
  DynamicError,
  some,
  enumerate,
  hasOwn,
} from "./util/index.mjs";

import {
  isBigIntPrimitive,
  isParameter,
  isUndefinedPrimitive,
  unpackPrimitive,
  hasImportParameter,
  hasSuperGetParameter,
  hasSuperSetParameter,
  hasSuperCallParameter,
} from "./lang.mjs";

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
 * @typedef {{
 *   prefix: estree.Variable,
 *   intrinsic: estree.Variable,
 * }} Context
 */

/** @type {Record<estree.UnaryOperator, null>} */
const UNARY_OPERATOR_ARRAY = {
  "+": null,
  "-": null,
  "~": null,
  "!": null,
  "typeof": null,
  "void": null,
  "delete": null,
};

/** @type {Record<estree.BinaryOperator, null>} */
const BINARY_OPERATOR_ARRAY = {
  "==": null,
  "!=": null,
  "===": null,
  "!==": null,
  "<": null,
  "<=": null,
  ">": null,
  ">=": null,
  "<<": null,
  ">>": null,
  ">>>": null,
  "+": null,
  "-": null,
  "*": null,
  "/": null,
  "%": null,
  "|": null,
  "^": null,
  "&": null,
  "in": null,
  "instanceof": null,
  "**": null,
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
const isUnaryOperator = (operator) => hasOwn(UNARY_OPERATOR_ARRAY, operator);

/** @type {(operator: string) => operator is estree.BinaryOperator}  */
const isBinaryOperator = (operator) => hasOwn(BINARY_OPERATOR_ARRAY, operator);

//////////////
// Variable //
//////////////

/** @type {(head: estree.Variable, body: estree.Variable) => estree.Variable} */
const append = (head, body) =>
  /** @type {estree.Variable} */ (`${head}_${body}`);

/**
 * @type {(
 *   prefix: estree.Variable,
 *   kind: "reg" | "imp" | "exp" | "prm" | "arg",
 *   variable: estree.Variable,
 * ) => estree.Variable}
 */
const encodeInternal = (prefix, kind, variable) =>
  append(append(prefix, /** @type {estree.Variable} */ (kind)), variable);

/** @type {(variable: estree.Variable, context: Context) => void} */
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

/** @type {(input: string) => string} */
const escape = (input) => apply(replace, input, ESCAPE);

const escapeVariable = /** @type {(input: string) => estree.Variable} */ (
  escape
);

const escapeLabel = /** @type {(input: rebuild.Label) => estree.Label} */ (
  /** @type {unknown} */ (escape)
);

/**
 * @type {(
 *   prefix: estree.Variable,
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 * ) => estree.Variable}
 */
const encodeImport = (prefix, source, specifier) =>
  encodeInternal(
    prefix,
    "imp",
    specifier === null
      ? escapeVariable(source)
      : append(escapeVariable(source), escapeVariable(specifier)),
  );

/** @type {(prefix: estree.Variable, specifier: estree.Specifier) => string} */
const encodeExport = (prefix, specifier) =>
  encodeInternal(prefix, "exp", escapeVariable(specifier));

/**
 * @type {(
 *   prefix: estree.Variable,
 *   variable: rebuild.Variable,
 * ) => string}
 */
const encodeRegular = (prefix, variable) =>
  encodeInternal(prefix, "reg", escapeVariable(variable));

/** @type {{ [key in aran.Parameter]: estree.Variable }} */
const parameters = {
  "this": /** @type {estree.Variable} */ ("this_"),
  "import": /** @type {estree.Variable} */ ("import_"),
  "new.target": /** @type {estree.Variable} */ ("new_target"),
  "function.arguments": /** @type {estree.Variable} */ ("function_arguments"),
  "import.meta": /** @type {estree.Variable} */ ("import_meta"),
  "super.get": /** @type {estree.Variable} */ ("super_get"),
  "super.set": /** @type {estree.Variable} */ ("super_set"),
  "super.call": /** @type {estree.Variable} */ ("super_call"),
  "catch.error": /** @type {estree.Variable} */ ("catch_error"),
  "private.get": /** @type {estree.Variable} */ ("private_get"),
  "private.set": /** @type {estree.Variable} */ ("private_set"),
  "scope.read": /** @type {estree.Variable} */ ("scope_read"),
  "scope.write": /** @type {estree.Variable} */ ("scope_write"),
  "scope.typeof": /** @type {estree.Variable} */ ("scpoe_typeof"),
};

/** @type {(prefix: estree.Variable, parameter: aran.Parameter) => estree.Variable} */
const encodeParameter = (prefix, parameter) =>
  encodeInternal(prefix, "prm", parameters[parameter]);

/**
 * @type {(
 *   prefix: estree.Variable,
 *   argument: "src" | "key" | "val" | "arg" | "mtd",
 * ) => estree.Variable}
 */
const encodeArgument = (prefix, argument) =>
  encodeInternal(prefix, "arg", /** @type {estree.Variable} */ (argument));

/////////////
// Builder //
/////////////

/** @type {(node: estree.Statement, label: rebuild.Label) => estree.Statement} */
const accumulateLabel = (node, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: escapeLabel(label),
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

//////////////////////////
// Parameter Declarator //
//////////////////////////

/** @type {(context: Context) => estree.VariableDeclarator} */
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
        name: encodeArgument(context.prefix, "key"),
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
        name: encodeArgument(context.prefix, "key"),
      },
    },
  },
});

/** @type {(context: Context) => estree.VariableDeclarator} */
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
        name: encodeArgument(context.prefix, "key"),
      },
      {
        type: "Identifier",
        name: encodeArgument(context.prefix, "val"),
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
          name: encodeArgument(context.prefix, "key"),
        },
      },
      right: {
        type: "Identifier",
        name: encodeArgument(context.prefix, "val"),
      },
    },
  },
});

/** @type {(context: Context) => estree.VariableDeclarator} */
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
        name: encodeArgument(context.prefix, "arg"),
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
            name: encodeArgument(context.prefix, "arg"),
          },
        },
      ],
    },
  },
});

/** @type {(context: Context) => estree.VariableDeclarator} */
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
        name: encodeArgument(context.prefix, "src"),
      },
    ],
    body: {
      type: "ImportExpression",
      source: {
        type: "Identifier",
        name: encodeArgument(context.prefix, "src"),
      },
    },
  },
});

/** @type {(nodes: aran.Node<rebuild.Atom>[], context: Context) => estree.Statement[]} */
const makeImportPrelude = (nodes, context) =>
  cleanVariableDeclaration({
    type: "VariableDeclaration",
    kind: "const",
    declarations: some(nodes, hasImportParameter)
      ? [makeImportDeclarator(context)]
      : [],
  });

// It is important to declare super-related parameters only when they are used.
// That is because they throw an early syntax error outside of functions.
/** @type {(nodes: aran.Node<rebuild.Atom>[], context: Context) => estree.Statement[]} */
const makeSuperPrelude = (nodes, context) =>
  cleanVariableDeclaration({
    type: "VariableDeclaration",
    kind: "const",
    declarations: [
      ...(some(nodes, hasSuperGetParameter)
        ? [makeSuperGetDeclarator(context)]
        : []),
      ...(some(nodes, hasSuperSetParameter)
        ? [makeSuperSetDeclarator(context)]
        : []),
      ...(some(nodes, hasSuperCallParameter)
        ? [makeSuperCallDeclarator(context)]
        : []),
    ],
  });

///////////////
// Recompile //
///////////////

/** @type {(node: aran.Program<rebuild.Atom>, context: Context) => estree.Program} */
export const rebuildProgram = (node, context) => {
  switch (node.type) {
    case "ScriptProgram":
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
          // TODO: This only works if context.prefix is unique
          // The original idea of prefix was to avoid clash with
          // enclave variables. It could originally be shared
          // acrros multiple script programs.
          ...makeImportPrelude([node], context),
          ...rebuildPseudoBlock(node.body, context),
        ],
      };
    case "EvalProgram":
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
          ...makeImportPrelude([node], context),
          ...makeSuperPrelude([node], context),
          rebuildClosureBlock(node.body, context, "program"),
        ],
      };
    case "ModuleProgram":
      return {
        type: "Program",
        sourceType: "module",
        body: [
          ...flatMap(node.links, (child) => rebuildLink(child, context)),
          ...makeImportPrelude([node], context),
          rebuildClosureBlock(node.body, context, "program"),
        ],
      };
    default:
      throw new StaticError("invalid program node", node);
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
            name: encodeRegular(context.prefix, variable),
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
 *   kind: "program" | "arrow" | "method" | "function" | "constructor",
 * ) => estree.BlockStatement}
 */
const rebuildClosureBlock = (node, context, kind) => ({
  type: "BlockStatement",
  body: [
    ...cleanVariableDeclaration({
      type: "VariableDeclaration",
      kind: "let",
      declarations: /** @type {estree.VariableDeclarator[]} */ ([
        ...(kind === "function" || kind === "method" || kind === "constructor"
          ? [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: encodeParameter(context.prefix, "this"),
                },
                init: {
                  type: "ThisExpression",
                },
              },
            ]
          : []),
        ...(kind === "constructor" || kind === "function"
          ? [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: encodeParameter(context.prefix, "new.target"),
                },
                init: {
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
              },
            ]
          : []),
        ...map(node.variables, (variable) => ({
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: encodeRegular(context.prefix, variable),
          },
          init: null,
        })),
      ]),
    }),
    ...map(node.statements, (child) => rebuildStatement(child, context)),
    kind === "program"
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

/** @type {(node: aran.PseudoBlock<rebuild.Atom>, context: Context) => estree.Statement[]} */
const rebuildPseudoBlock = (node, context) => [
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
    case "ImportLink":
      return [
        {
          type: "ImportDeclaration",
          specifiers: [
            node.import === null
              ? {
                  type: "ImportNamespaceSpecifier",
                  local: {
                    type: "Identifier",
                    name: encodeImport(
                      context.prefix,
                      node.source,
                      node.import,
                    ),
                  },
                }
              : {
                  type: "ImportSpecifier",
                  local: {
                    type: "Identifier",
                    name: encodeImport(
                      context.prefix,
                      node.source,
                      node.import,
                    ),
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
    case "ExportLink":
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
    case "AggregateLink":
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
    default:
      throw new StaticError("invalid link node", node);
  }
};

/** @type {(node: aran.Statement<rebuild.Atom>, context: Context) => estree.Statement} */
const rebuildStatement = (node, context) => {
  switch (node.type) {
    case "DeclareEnclaveStatement":
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
            init: rebuildExpression(node.right, context),
          },
        ],
      };
    case "BreakStatement":
      return {
        type: "BreakStatement",
        label: {
          type: "Identifier",
          name: node.label,
        },
      };
    case "DebuggerStatement":
      return {
        type: "DebuggerStatement",
      };
    case "ReturnStatement":
      return {
        type: "ReturnStatement",
        argument: rebuildExpression(node.result, context),
      };
    case "EffectStatement":
      return {
        type: "ExpressionStatement",
        expression: rebuildEffect(node.inner, context),
      };
    case "BlockStatement":
      return rebuildControlBlock(node.do, context);
    case "IfStatement":
      return {
        type: "IfStatement",
        test: rebuildExpression(node.if, context),
        consequent: rebuildControlBlock(node.then, context),
        alternate: rebuildControlBlock(node.else, context),
      };
    case "TryStatement":
      return {
        type: "TryStatement",
        block: wrapBlock(rebuildControlBlock(node.try, context)),
        handler: {
          type: "CatchClause",
          param: {
            type: "Identifier",
            name: encodeParameter(context.prefix, "catch.error"),
          },
          body: wrapBlock(rebuildControlBlock(node.catch, context)),
        },
        finalizer: wrapBlock(rebuildControlBlock(node.finally, context)),
      };
    case "WhileStatement":
      return {
        type: "WhileStatement",
        test: rebuildExpression(node.while, context),
        body: rebuildControlBlock(node.do, context),
      };
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/** @type {(node: aran.Effect<rebuild.Atom>, context: Context) => estree.Expression} */
const rebuildEffect = (node, context) => {
  switch (node.type) {
    case "ExpressionEffect":
      return rebuildExpression(node.discard, context);
    case "ConditionalEffect":
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
    case "WriteEffect":
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: isParameter(node.variable)
            ? encodeParameter(context.prefix, node.variable)
            : encodeRegular(context.prefix, node.variable),
        },
        right: rebuildExpression(node.right, context),
      };
    case "WriteEnclaveEffect":
      checkExternal(node.variable, context);
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: node.variable,
        },
        right: rebuildExpression(node.right, context),
      };
    case "ExportEffect":
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: encodeExport(context.prefix, node.export),
        },
        right: rebuildExpression(node.right, context),
      };
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/** @type {(node: aran.Expression<rebuild.Atom>, context: Context) => estree.Expression} */
const rebuildExpression = (node, context) => {
  switch (node.type) {
    case "FunctionExpression":
      switch (node.kind) {
        case "function":
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
                  name: encodeParameter(context.prefix, "function.arguments"),
                },
              },
            ],
            body: rebuildClosureBlock(node.body, context, node.kind),
          };
        case "arrow":
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
                  name: encodeParameter(context.prefix, "function.arguments"),
                },
              },
            ],
            body: rebuildClosureBlock(node.body, context, node.kind),
          };
        case "method":
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
                    name: "method",
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
                          name: encodeParameter(
                            context.prefix,
                            "function.arguments",
                          ),
                        },
                      },
                    ],
                    body: rebuildClosureBlock(node.body, context, node.kind),
                  },
                },
              ],
            },
            property: {
              type: "Identifier",
              name: "method",
            },
          };
        case "constructor":
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
                          name: encodeParameter(
                            context.prefix,
                            "function.arguments",
                          ),
                        },
                      },
                    ],
                    body: rebuildClosureBlock(node.body, context, node.kind),
                  },
                },
              ],
            },
          };
        default:
          throw new StaticError("invalid closure kind", node.kind);
      }
    case "PrimitiveExpression":
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
    case "IntrinsicExpression":
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
    case "ReadExpression":
      return {
        type: "Identifier",
        name: isParameter(node.variable)
          ? encodeParameter(context.prefix, node.variable)
          : encodeRegular(context.prefix, node.variable),
      };
    case "ImportExpression":
      return {
        type: "Identifier",
        name: encodeImport(context.prefix, node.source, node.import),
      };
    case "ReadEnclaveExpression":
      checkExternal(node.variable, context);
      return {
        type: "Identifier",
        name: node.variable,
      };
    case "TypeofEnclaveExpression":
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
    case "AwaitExpression":
      return {
        type: "AwaitExpression",
        argument: rebuildExpression(node.promise, context),
      };
    case "YieldExpression":
      return {
        type: "YieldExpression",
        delegate: node.delegate,
        argument: rebuildExpression(node.item, context),
      };
    case "ConditionalExpression":
      return {
        type: "ConditionalExpression",
        test: rebuildExpression(node.condition, context),
        consequent: rebuildExpression(node.consequent, context),
        alternate: rebuildExpression(node.alternate, context),
      };
    case "SequenceExpression": {
      return {
        type: "SequenceExpression",
        expressions: [
          ...extractSequence(rebuildEffect(node.head, context)),
          ...extractSequence(rebuildExpression(node.tail, context)),
        ],
      };
    }
    case "EvalExpression":
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "Identifier",
          name: "eval",
        },
        arguments: [rebuildExpression(node.code, context)],
      };
    case "ConstructExpression":
      return {
        type: "NewExpression",
        callee: rebuildExpression(node.callee, context),
        arguments: map(node.arguments, (child) =>
          rebuildExpression(child, context),
        ),
      };
    case "ApplyExpression":
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
        node.callee.intrinsic === "aran.set" &&
        node.this.type === "PrimitiveExpression" &&
        node.arguments.length === 4 &&
        node.arguments[0].type === "PrimitiveExpression" &&
        node.arguments[0].primitive === true
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
              computed: false,
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
    default:
      throw new StaticError("invalid expression node", node);
  }
};

export const rebuild = rebuildProgram;
