import { AranTypeError } from "../error.mjs";
import {
  isDeclarationHeader,
  isLookupHeader,
  isPrivateHeader,
  isStrictHeader,
  isSloppyHeader,
  isModuleHeader,
} from "../header.mjs";
import { compileGet, filter, filterNarrow, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { mangleArgument, mangleParameter } from "./mangle.mjs";
import { rebuildModuleHead } from "./module.mjs";

/**
 * @type {<X, Y>(
 *   array: X[],
 *   transform: (array: X[]) => Y,
 * ) => Y[]}
 */
const applyNonEmpty = (array, transform) =>
  array.length === 0 ? [] : [transform(array)];

/////////////
// Declare //
/////////////

/**
 * @type {(
 *   header: import("../header.js").DeclarationHeader,
 * ) => estree.Statement}
 */
const declare = ({ kind, variable }) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: variable,
      },
      init: null,
    },
  ],
});

////////////
// Lookup //
////////////

/** @type {["read", "write", "typeof", "discard"]} */
const LOOKUP = ["read", "write", "typeof", "discard"];

const getVariable = compileGet("variable");

/**
 * @type {(
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variable: estree.Variable,
 *   value: string,
 * ) => estree.Expression}
 */
const makeLookupResult = (operation, variable, value) => {
  switch (operation) {
    case "read": {
      return {
        type: "Identifier",
        name: variable,
      };
    }
    case "write": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: variable,
        },
        right: {
          type: "Identifier",
          name: value,
        },
      };
    }
    case "typeof": {
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      };
    }
    case "discard": {
      return {
        type: "UnaryExpression",
        operator: "delete",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      };
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variables: estree.Variable[],
 *   context: import("./context.js").Context,
 * ) => estree.Expression}
 */
const makeLookupArrow = (operation, variables, context) => {
  const var_arg = mangleArgument("var", context.escape);
  const val_arg = mangleArgument("val", context.escape);
  return {
    type: "ArrowFunctionExpression",
    async: false,
    expression: false,
    params:
      operation === "write"
        ? [
            {
              type: "Identifier",
              name: var_arg,
            },
            {
              type: "Identifier",
              name: val_arg,
            },
          ]
        : [
            {
              type: "Identifier",
              name: var_arg,
            },
          ],
    body: {
      type: "BlockStatement",
      body: [
        .../** @type {estree.Statement[]} */ (
          variables.length === 0
            ? []
            : [
                {
                  type: "SwitchStatement",
                  discriminant: {
                    type: "Identifier",
                    name: var_arg,
                  },
                  cases: map(variables, (variable) => ({
                    type: "SwitchCase",
                    test: {
                      type: "Literal",
                      value: variable,
                    },
                    consequent: [
                      {
                        type: "ReturnStatement",
                        argument: makeLookupResult(
                          operation,
                          variable,
                          val_arg,
                        ),
                      },
                    ],
                  })),
                },
              ]
        ),
        {
          type: "ThrowStatement",
          argument: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "MemberExpression",
              computed: false,
              optional: false,
              object: {
                type: "Identifier",
                name: context.intrinsic,
              },
              property: {
                type: "Identifier",
                name: "ReferenceError",
              },
            },
            arguments: [
              {
                type: "BinaryExpression",
                operator: "+",
                left: {
                  type: "Literal",
                  value: `missing variable: `,
                },
                right: {
                  type: "Identifier",
                  name: var_arg,
                },
              },
            ],
          },
        },
      ],
    },
  };
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   variables: estree.Variable[],
 *   context: import("./context.js").Context,
 * ) => estree.Statement}
 */
export const makeLookupDeclaration = (mode, variables, context) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: map(LOOKUP, (operation) => ({
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: mangleParameter(`${operation}.${mode}`, context.escape),
    },
    init: makeLookupArrow(operation, variables, context),
  })),
});

/////////////
// Private //
/////////////

/** @type {["has", "get", "set"]} */
const PRIVATE = ["has", "get", "set"];

const getKey = compileGet("key");

/**
 * @type {(
 *   parameter: "has" | "get" | "set",
 *   object_arg: string,
 *   key: estree.PrivateKey,
 *   value_arg: string,
 * ) => estree.Expression}
 */
const makePrivateBody = (operation, object_arg, key, value_arg) => {
  switch (operation) {
    case "has": {
      return {
        type: "BinaryExpression",
        operator: "in",
        left: /** @type {any} */ ({
          type: "PrivateIdentifier",
          name: key,
        }),
        right: {
          type: "Identifier",
          name: object_arg,
        },
      };
    }
    case "get": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "Identifier",
          name: object_arg,
        },
        property: {
          type: "PrivateIdentifier",
          name: key,
        },
      };
    }
    case "set": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: false,
          object: {
            type: "Identifier",
            name: object_arg,
          },
          property: {
            type: "PrivateIdentifier",
            name: key,
          },
        },
        right: {
          type: "Identifier",
          name: value_arg,
        },
      };
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   operation: "has" | "get" | "set",
 *   keys: estree.PrivateKey[],
 *   context: import("./context.js").Context,
 * ) => estree.VariableDeclarator}
 */
const makePrivateDeclarator = (operation, keys, context) => {
  const obj_arg = mangleArgument("obj", context.escape);
  const key_arg = mangleArgument("key", context.escape);
  const val_arg = mangleArgument("val", context.escape);
  return {
    type: "VariableDeclarator",
    id: {
      type: "Identifier",
      name: mangleParameter(`private.${operation}`, context.escape),
    },
    init: {
      type: "ArrowFunctionExpression",
      async: false,
      expression: false,
      params: [
        {
          type: "Identifier",
          name: obj_arg,
        },
        {
          type: "Identifier",
          name: key_arg,
        },
        .../** @type {estree.Pattern[]} */ (
          operation === "set"
            ? [
                {
                  type: "Identifier",
                  name: val_arg,
                },
              ]
            : []
        ),
      ],
      body: {
        type: "BlockStatement",
        body: [
          .../** @type {estree.Statement[]} */ (
            keys.length === 0
              ? []
              : [
                  {
                    type: "SwitchStatement",
                    discriminant: {
                      type: "Identifier",
                      name: key_arg,
                    },
                    cases: map(keys, (key) => ({
                      type: "SwitchCase",
                      test: {
                        type: "Literal",
                        value: key,
                      },
                      consequent: [
                        {
                          type: "ReturnStatement",
                          argument: makePrivateBody(
                            operation,
                            obj_arg,
                            key,
                            val_arg,
                          ),
                        },
                      ],
                    })),
                  },
                ]
          ),
          {
            type: "ThrowStatement",
            argument: {
              type: "CallExpression",
              optional: false,
              callee: {
                type: "MemberExpression",
                computed: false,
                optional: false,
                object: {
                  type: "Identifier",
                  name: context.intrinsic,
                },
                property: {
                  type: "Identifier",
                  name: "TypeError",
                },
              },
              arguments: [
                {
                  type: "BinaryExpression",
                  operator: "+",
                  left: {
                    type: "Literal",
                    value: `missing private key: #`,
                  },
                  right: {
                    type: "Identifier",
                    name: key_arg,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };
};

/**
 * @type {(
 *   keys: estree.PrivateKey[],
 *   context: import("./context.js").Context,
 * ) => estree.Statement}
 *
 */
export const makePrivateDeclaration = (keys, context) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: map(PRIVATE, (operation) =>
    makePrivateDeclarator(operation, keys, context),
  ),
});

///////////////
// Parameter //
///////////////

/**
 * @type {[
 *   "this",
 *   "import",
 *   "import.meta",
 *   "new.target",
 *   "super.get",
 *   "super.set",
 *   "super.call",
 * ]}
 */
const REGULAR_PARAMETER = [
  "this",
  "import",
  "import.meta",
  "new.target",
  "super.get",
  "super.set",
  "super.call",
];

/**
 * @type {Record<
 *   (
 *     | "this"
 *     | "import"
 *     | "import.meta"
 *     | "new.target"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 *   (
 *     context: import("./context.js").Context,
 *   ) => estree.Expression
 * >}
 */
const initializers = {
  "this": (_context) => ({
    type: "ThisExpression",
  }),
  "import": (context) => {
    const src_arg = mangleArgument("src", context.escape);
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: src_arg,
        },
      ],
      body: {
        type: "ImportExpression",
        source: {
          type: "Identifier",
          name: src_arg,
        },
      },
    };
  },
  "import.meta": (_context) => ({
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "import",
    },
    property: {
      type: "Identifier",
      name: "meta",
    },
  }),
  "new.target": (_context) => ({
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "new",
    },
    property: {
      type: "Identifier",
      name: "target",
    },
  }),
  "super.get": (context) => {
    const key_arg = mangleArgument("key", context.escape);
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: key_arg,
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
          name: key_arg,
        },
      },
    };
  },
  "super.set": (context) => {
    const key_arg = mangleArgument("key", context.escape);
    const val_arg = mangleArgument("val", context.escape);
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: key_arg,
        },
        {
          type: "Identifier",
          name: val_arg,
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
            name: key_arg,
          },
        },
        right: {
          type: "Identifier",
          name: val_arg,
        },
      },
    };
  },
  "super.call": (context) => {
    const inp_arg = mangleArgument("inp", context.escape);
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: inp_arg,
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
              name: inp_arg,
            },
          },
        ],
      },
    };
  },
};

/**
 * @type {(
 *   parameter: (
 *     | "this"
 *     | "import"
 *     | "import.meta"
 *     | "new.target"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 *   context: import("./context.js").Context,
 * ) => estree.Statement}
 */
const makeParameterDeclaration = (parameter, context) => {
  const initialize = initializers[parameter];
  return {
    type: "VariableDeclaration",
    kind: "let",
    declarations: [
      {
        type: "VariableDeclarator",
        id: {
          type: "Identifier",
          name: mangleParameter(parameter, context.escape),
        },
        init: initialize(context),
      },
    ],
  };
};

/////////////
// Rebuild //
/////////////

/**
 * @type {(
 *   head: (import("../header").StrictHeader)[],
 *   context: import("./context.js").Context,
 * ) => (estree.Statement | estree.Directive)[]}
 */
const rebuildStrictProgramHead = (head, context) => [
  {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: "use strict",
    },
    directive: "use strict",
  },
  ...map(filterNarrow(head, isDeclarationHeader), declare),
  ...map(
    filter(REGULAR_PARAMETER, (parameter) =>
      some(
        head,
        (header) =>
          header.type === "parameter" && header.parameter === parameter,
      ),
    ),
    (parameter) => makeParameterDeclaration(parameter, context),
  ),
  ...applyNonEmpty(
    map(filterNarrow(head, isLookupHeader), getVariable),
    (variables) => makeLookupDeclaration("strict", variables, context),
  ),
  ...applyNonEmpty(map(filterNarrow(head, isPrivateHeader), getKey), (keys) =>
    makePrivateDeclaration(keys, context),
  ),
];

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   context: import("./context.js").Context,
 *   options: {
 *     kind: "module" | "script" | "eval",
 *   },
 * ) => estree.Program}
 */
export const rebuildProgram = (node, context, { kind }) => {
  const strict = filterNarrow(node.head, isStrictHeader);
  const sloppy = filterNarrow(node.head, isSloppyHeader);
  const source = kind === "eval" ? "script" : kind;
  if (sloppy.length === 0) {
    return {
      type: "Program",
      sourceType: source,
      body: [
        ...rebuildStrictProgramHead(strict, context),
        ...rebuildModuleHead(filterNarrow(strict, isModuleHeader), context),
        ...rebuildClosureBlock(node.body, context, { completion: "program" }),
      ],
    };
  } else {
    const variables = map(filterNarrow(sloppy, isLookupHeader), getVariable);
    return {
      type: "Program",
      sourceType: source,
      body: [
        ...map(filterNarrow(sloppy, isDeclarationHeader), declare),
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              params:
                variables.length === 0
                  ? []
                  : map(LOOKUP, (operation) => ({
                      type: "Identifier",
                      name: mangleParameter(
                        `${operation}.sloppy`,
                        context.escape,
                      ),
                    })),
              async: false,
              expression: false,
              body: {
                type: "BlockStatement",
                body: [
                  ...rebuildStrictProgramHead(strict, context),
                  ...rebuildClosureBlock(node.body, context, {
                    completion: "closure",
                  }),
                ],
              },
            },
            arguments:
              variables.length === 0
                ? []
                : map(LOOKUP, (operation) =>
                    makeLookupArrow(operation, variables, context),
                  ),
          },
        },
      ],
    };
  }
};
