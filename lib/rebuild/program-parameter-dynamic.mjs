import { AranTypeError } from "../error.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import {
  concatXXX,
  concatXX_,
  concat_X,
  filterNarrow,
  join,
  map,
  some,
} from "../util/index.mjs";
import { mangleEval, mangleParameter, mangleRecord } from "./mangle.mjs";
import {
  isImportMetaParameterHeader,
  isNewTargetParameterHeader,
  isPrivateParameterHeader,
  isScopeParameterHeader,
  isSuperParameterHeader,
} from "../header.mjs";

const {
  JSON: { stringify },
} = globalThis;

/**
 * @type {(
 *   name: string,
 * ) => import("../estree").Identifier}
 */
const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
});

/**
 * @type {(
 *   variable: import("../estree").Variable,
 * ) => string}
 */
const escapeValueIdentifier = (variable) =>
  variable === "value" ? "$value" : "value";

//////////
// eval //
//////////

/**
 * @type {(
 *   situ: "global" | "local.root",
 *   config: import("./config").Config,
 * ) => import("../estree").Expression}
 */
const makeEvalValue = (situ, config) => {
  switch (situ) {
    case "global": {
      return makeIntrinsicExpression("eval", config);
    }
    case "local.root": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: false,
        params: [
          {
            type: "Identifier",
            name: "code",
          },
        ],
        body: {
          type: "BlockStatement",
          body: [
            {
              type: "IfStatement",
              test: {
                type: "BinaryExpression",
                operator: "===",
                left: {
                  type: "Identifier",
                  name: "eval",
                },
                right: makeIntrinsicExpression("eval", config),
              },
              consequent: {
                type: "ReturnStatement",
                argument: {
                  type: "CallExpression",
                  optional: false,
                  callee: {
                    type: "Identifier",
                    name: "eval",
                  },
                  arguments: [
                    {
                      type: "Identifier",
                      name: "code",
                    },
                  ],
                },
              },
              alternate: {
                type: "ThrowStatement",
                argument: {
                  type: "NewExpression",
                  callee: {
                    type: "Identifier",
                    name: "Error",
                  },
                  arguments: [
                    {
                      type: "Literal",
                      value: "eval is not the eval function",
                    },
                  ],
                },
              },
            },
          ],
        },
      };
    }
    default: {
      throw new AranTypeError(situ);
    }
  }
};

/**
 * @type {(
 *   situ: "global" | "local.root",
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
export const makeEvalDeclaration = (situ, config) => ({
  type: "VariableDeclaration",
  kind: "const",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleEval(config),
      init: makeEvalValue(situ, config),
    },
  ],
});

///////////
// front //
///////////

/**
 * @type {(
 *   parameter: Exclude<
 *     import("../header").HeaderParameter,
 *     "this" | "new.target" | "import.meta" | "import.dynamic"
 *   >,
 * ) => string[]}
 */
const listFrontArgument = (parameter) => {
  if (
    parameter === "scope.read" ||
    parameter === "scope.typeof" ||
    parameter === "scope.discard"
  ) {
    return ["mode", "variable"];
  } else if (parameter === "scope.write") {
    return ["mode", "variable", "value"];
  } else if (parameter === "private.get" || parameter === "private.has") {
    return ["object", "key"];
  } else if (parameter === "private.set") {
    return ["object", "key", "value"];
  } else if (parameter === "super.get") {
    return ["key"];
  } else if (parameter === "super.set") {
    return ["key", "value"];
  } else if (parameter === "super.call") {
    return ["input"];
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   parameter: Exclude<
 *     import("../header").ParameterHeader["parameter"],
 *     "this" | "new.target" | "import.meta" | "import.dynamic"
 *   >,
 * ) => string[]}
 */
const listBackArgument = (parameter) => {
  if (
    parameter === "scope.read" ||
    parameter === "scope.typeof" ||
    parameter === "scope.discard"
  ) {
    return [];
  } else if (parameter === "scope.write") {
    return ["value"];
  } else if (parameter === "private.get" || parameter === "private.has") {
    return ["object"];
  } else if (parameter === "private.set") {
    return ["object", "value"];
  } else if (parameter === "super.get") {
    return ["key"];
  } else if (parameter === "super.set") {
    return ["key", "value"];
  } else if (parameter === "super.call") {
    return ["input"];
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   header: import("../header").ParameterHeader,
 * ) => string}
 */
const makeBuildtimeRecordKey = (header) => {
  if (
    header.parameter === "scope.read" ||
    header.parameter === "scope.typeof" ||
    header.parameter === "scope.discard" ||
    header.parameter === "scope.write"
  ) {
    return `${header.parameter}.${header.mode}.${header.payload}`;
  } else if (
    header.parameter === "private.get" ||
    header.parameter === "private.has" ||
    header.parameter === "private.set"
  ) {
    return `${header.parameter}.${header.payload}`;
  } else if (
    header.parameter === "super.call" ||
    header.parameter === "super.get" ||
    header.parameter === "super.set" ||
    header.parameter === "import.meta" ||
    header.parameter === "new.target" ||
    header.parameter === "import.dynamic" ||
    header.parameter === "this"
  ) {
    return header.parameter;
  } else {
    throw new AranTypeError(header.parameter);
  }
};

/**
 * @type {(
 *   parameter: import("../header").HeaderParameter,
 * ) => import("../estree").Expression}
 */
const makeRuntimeRecordKey = (parameter) => {
  if (
    parameter === "scope.read" ||
    parameter === "scope.typeof" ||
    parameter === "scope.discard" ||
    parameter === "scope.write"
  ) {
    return {
      type: "BinaryExpression",
      operator: "+",
      left: {
        type: "Literal",
        value: `${parameter}.`,
      },
      right: {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Identifier",
          name: "mode",
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Literal",
            value: ".",
          },
          right: {
            type: "Identifier",
            name: "variable",
          },
        },
      },
    };
  } else if (
    parameter === "private.get" ||
    parameter === "private.has" ||
    parameter === "private.set"
  ) {
    return {
      type: "BinaryExpression",
      operator: "+",
      left: {
        type: "Literal",
        value: `${parameter}.`,
      },
      right: {
        type: "Identifier",
        name: "key",
      },
    };
  } else if (
    parameter === "super.get" ||
    parameter === "super.set" ||
    parameter === "super.call" ||
    parameter === "import.meta" ||
    parameter === "new.target" ||
    parameter === "import.dynamic" ||
    parameter === "this"
  ) {
    return {
      type: "Literal",
      value: parameter,
    };
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   parameter: import("../header").HeaderParameter,
 *   config: import("./config").Config,
 * ) => import("../estree").Expression}
 */
const makeParameterValue = (parameter, config) => {
  if (parameter === "this") {
    return {
      type: "ThisExpression",
    };
  } else if (parameter === "import.dynamic") {
    return {
      type: "ArrowFunctionExpression",
      generator: false,
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: "source",
        },
      ],
      body: {
        type: "ImportExpression",
        source: {
          type: "Identifier",
          name: "source",
        },
      },
    };
  } else if (parameter === "import.meta" || parameter === "new.target") {
    return {
      type: "ArrowFunctionExpression",
      generator: false,
      expression: false,
      params: [],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "TryStatement",
            block: {
              type: "BlockStatement",
              body: [
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    optional: false,
                    callee: mangleEval(config),
                    arguments: [
                      {
                        type: "Literal",
                        value: `(${parameter});`,
                      },
                    ],
                  },
                },
              ],
            },
            handler: {
              type: "CatchClause",
              param: null,
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "ReturnStatement",
                    argument: {
                      type: "Literal",
                      value: null,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    };
  } else if (
    parameter === "scope.read" ||
    parameter === "scope.write" ||
    parameter === "scope.typeof" ||
    parameter === "scope.discard" ||
    parameter === "private.get" ||
    parameter === "private.set" ||
    parameter === "private.has" ||
    parameter === "super.get" ||
    parameter === "super.set" ||
    parameter === "super.call"
  ) {
    return {
      type: "ArrowFunctionExpression",
      generator: false,
      async: false,
      expression: true,
      params: map(listFrontArgument(parameter), makeIdentifier),
      body: {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: mangleRecord(config),
          property: makeRuntimeRecordKey(parameter),
        },
        arguments: map(listBackArgument(parameter), makeIdentifier),
      },
    };
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   parameter: import("../header").HeaderParameter,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
export const makeDynamicParameterDeclaration = (parameter, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: makeParameterValue(parameter, config),
    },
  ],
});

/**
 * @type {(
 *   header: (
 *     | import("../header").ScopeParameterHeader
 *     | import("../header").PrivateParameterHeader
 *     | import("../header").SuperParameterHeader
 *   ),
 * ) => import("../estree").Expression}
 */
const makeRecordValue = (header) => {
  switch (header.parameter) {
    case "scope.read": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [],
        body: {
          type: "Identifier",
          name: header.payload,
        },
      };
    }
    case "scope.typeof": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [],
        body: {
          type: "UnaryExpression",
          operator: "typeof",
          prefix: true,
          argument: {
            type: "Identifier",
            name: header.payload,
          },
        },
      };
    }
    case "scope.discard": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [],
        body: {
          type: "UnaryExpression",
          prefix: true,
          operator: "delete",
          argument: {
            type: "Identifier",
            name: header.payload,
          },
        },
      };
    }
    case "scope.write": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: escapeValueIdentifier(header.payload),
          },
        ],
        body: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "Identifier",
            name: header.payload,
          },
          right: {
            type: "Identifier",
            name: escapeValueIdentifier(header.payload),
          },
        },
      };
    }
    case "private.get": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "object",
          },
        ],
        body: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: "object",
          },
          property: {
            type: "PrivateIdentifier",
            name: header.payload,
          },
        },
      };
    }
    case "private.has": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "object",
          },
        ],
        body: {
          type: "BinaryExpression",
          operator: "in",
          left: /** @type {any} */ ({
            type: "PrivateIdentifier",
            value: header.payload,
          }),
          right: {
            type: "Identifier",
            name: "object",
          },
        },
      };
    }
    case "private.set": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "object",
          },
          {
            type: "Identifier",
            name: "value",
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
              type: "Identifier",
              name: "object",
            },
            property: {
              type: "PrivateIdentifier",
              name: header.payload,
            },
          },
          right: {
            type: "Identifier",
            name: "value",
          },
        },
      };
    }
    case "super.get": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "key",
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
            name: "key",
          },
        },
      };
    }
    case "super.set": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "key",
          },
          {
            type: "Identifier",
            name: "value",
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
              name: "key",
            },
          },
          right: {
            type: "Identifier",
            name: "value",
          },
        },
      };
    }
    case "super.call": {
      return {
        type: "ArrowFunctionExpression",
        generator: false,
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "input",
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
                name: "input",
              },
            },
          ],
        },
      };
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   header: (
 *     | import("../header").ScopeParameterHeader
 *     | import("../header").PrivateParameterHeader
 *     | import("../header").SuperParameterHeader
 *   ),
 * ) => import("../estree").Property}
 */
const makeRecordProperty = (header) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: "Literal",
    value: makeBuildtimeRecordKey(header),
  },
  value: makeRecordValue(header),
});

/**
 * @type {(
 *   header: import("../header").ParameterHeader[],
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const makeRecordDeclaration = (headers, config) =>
  concatXX_(
    some(headers, isNewTargetParameterHeader)
      ? [
          {
            type: "ExpressionStatement",
            expression: {
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
      : [],
    some(headers, isImportMetaParameterHeader)
      ? [
          {
            type: "ExpressionStatement",
            expression: {
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
          },
        ]
      : [],
    {
      type: "VariableDeclaration",
      kind: "let",
      declarations: [
        {
          type: "VariableDeclarator",
          id: mangleRecord(config),
          init: {
            type: "ObjectExpression",
            properties: concat_X(
              {
                type: "Property",
                kind: "init",
                method: false,
                shorthand: false,
                computed: false,
                key: {
                  type: "Identifier",
                  name: "__proto__",
                },
                value: {
                  type: "Literal",
                  value: null,
                },
              },
              map(
                concatXXX(
                  filterNarrow(headers, isSuperParameterHeader),
                  filterNarrow(headers, isScopeParameterHeader),
                  filterNarrow(headers, isPrivateParameterHeader),
                ),
                makeRecordProperty,
              ),
            ),
          },
        },
      ],
    },
  );

/**
 * @type {(
 *   header: (
 *     | import("../header").ScopeParameterHeader
 *     | import("../header").PrivateParameterHeader
 *     | import("../header").SuperParameterHeader
 *   ),
 * ) => string}
 */
const compileRecordValue = (header) => {
  switch (header.parameter) {
    case "scope.read": {
      switch (header.mode) {
        case "sloppy": {
          return `(() => ${header.payload})`;
        }
        case "strict": {
          return `(() => { "use strict"; return ${header.payload}; })`;
        }
        default: {
          throw new AranTypeError(header);
        }
      }
    }
    case "scope.typeof": {
      switch (header.mode) {
        case "sloppy": {
          return `(() => typeof ${header.payload})`;
        }
        case "strict": {
          return `(() => { "use strict"; return typeof ${header.payload}; })`;
        }
        default: {
          throw new AranTypeError(header);
        }
      }
    }
    case "scope.discard": {
      return `(() => delete ${header.payload})`;
    }
    case "scope.write": {
      switch (header.mode) {
        case "sloppy": {
          return `((value) => ${header.payload} = value)`;
        }
        case "strict": {
          return `((value) => { "use strict"; return ${header.payload} = value; })`;
        }
        default: {
          throw new AranTypeError(header);
        }
      }
    }
    case "private.get": {
      return `(object) => object[${header.payload}]`;
    }
    case "private.has": {
      return `(object) => ${header.payload} in object`;
    }
    case "private.set": {
      return `(object, value) => object[${header.payload}] = value`;
    }
    case "super.get": {
      return `(key) => super[key]`;
    }
    case "super.set": {
      return `(key, value) => super[key] = value`;
    }
    case "super.call": {
      return `(input) => super(...input)`;
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   header: (
 *     | import("../header").ScopeParameterHeader
 *     | import("../header").PrivateParameterHeader
 *     | import("../header").SuperParameterHeader
 *   ),
 * ) => string}
 */
const compilePropertyUpdate = (header) =>
  `  ${stringify(makeBuildtimeRecordKey(header))}: ${compileRecordValue(
    header,
  )},\n`;

/**
 * @type {(
 *   header: import("../header").ParameterHeader[],
 * ) => string}
 */
const compileRecordUpdate = (headers) =>
  `${some(headers, isImportMetaParameterHeader) ? "(import.meta);" : ""}${
    some(headers, isNewTargetParameterHeader) ? "(new.target);" : ""
  }({\n${join(
    map(
      concatXXX(
        filterNarrow(headers, isSuperParameterHeader),
        filterNarrow(headers, isScopeParameterHeader),
        filterNarrow(headers, isPrivateParameterHeader),
      ),
      compilePropertyUpdate,
    ),
    "",
  )}});`;

/**
 * @type {(
 *   headers: import("../header").ParameterHeader[],
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const makeRecordUpdate = (headers, config) =>
  headers.length === 0
    ? []
    : [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: mangleRecord(config),
            right: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: "Identifier",
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
                  },
                },
                {
                  type: "SpreadElement",
                  argument: mangleRecord(config),
                },
                {
                  type: "SpreadElement",
                  argument: {
                    type: "CallExpression",
                    optional: false,
                    callee: mangleEval(config),
                    arguments: [
                      {
                        type: "Literal",
                        value: compileRecordUpdate(headers),
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ];
