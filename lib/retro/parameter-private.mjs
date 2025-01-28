import { getParameterFunctionName } from "../lang/index.mjs";
import { map, reduce } from "../util/index.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleParameter } from "./mangle.mjs";

/**
 * @type {[
 *   "private.check",
 *   "private.has",
 *   "private.get",
 *   "private.set",
 * ]}
 */
const PRIVATE_PARAMETER_ARRAY = [
  "private.check",
  "private.has",
  "private.get",
  "private.set",
];

/**
 * @type {(
 *   left: import("estree-sentry").Expression<{}>,
 *   right: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeConcatExpression = (left, right) => ({
  type: "BinaryExpression",
  operator: "+",
  left,
  right,
});

/**
 * @type {(
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const makePrivateParameterDeclaration = (config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "ObjectPattern",
        properties: map(PRIVATE_PARAMETER_ARRAY, (parameter) => ({
          type: "Property",
          kind: "init",
          method: false,
          shorthand: false,
          computed: false,
          key: {
            type: "Identifier",
            name: /** @type {import("estree-sentry").PublicKeyName} */ (
              /** @type {string} */ (getParameterFunctionName(parameter))
            ),
          },
          value: mangleParameter(parameter, config),
        })),
      },
      init: {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "ArrowFunctionExpression",
          id: null,
          async: false,
          generator: false,
          expression: true,
          params: [
            {
              type: "Identifier",
              name: /** @type {import("estree-sentry").VariableName} */ (
                "has_cache"
              ),
            },
            {
              type: "Identifier",
              name: /** @type {import("estree-sentry").VariableName} */ (
                "get_cache"
              ),
            },
            {
              type: "Identifier",
              name: /** @type {import("estree-sentry").VariableName} */ (
                "set_cache"
              ),
            },
          ],
          body: {
            type: "ObjectExpression",
            properties: [
              {
                type: "Property",
                kind: "init",
                method: false,
                computed: false,
                shorthand: false,
                key: {
                  type: "Identifier",
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    /** @type {string} */ (
                      getParameterFunctionName("private.check")
                    )
                  ),
                },
                value: {
                  type: "ArrowFunctionExpression",
                  id: null,
                  expression: false,
                  async: false,
                  generator: false,
                  params: [
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "keys"
                      ),
                    },
                  ],
                  body: {
                    type: "BlockStatement",
                    body: [
                      {
                        type: "VariableDeclaration",
                        kind: "let",
                        declarations: [
                          {
                            type: "VariableDeclarator",
                            id: {
                              type: "Identifier",
                              name: /** @type {import("estree-sentry").VariableName} */ (
                                "code"
                              ),
                            },
                            init: makeSimpleLiteral(""),
                          },
                        ],
                      },
                      {
                        type: "VariableDeclaration",
                        kind: "const",
                        declarations: [
                          {
                            type: "VariableDeclarator",
                            id: {
                              type: "Identifier",
                              name: /** @type {import("estree-sentry").VariableName} */ (
                                "length"
                              ),
                            },
                            init: {
                              type: "MemberExpression",
                              optional: false,
                              computed: false,
                              object: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").VariableName} */ (
                                  "keys"
                                ),
                              },
                              property: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").PublicKeyName} */ (
                                  "length"
                                ),
                              },
                            },
                          },
                        ],
                      },
                      {
                        type: "ForStatement",
                        init: {
                          type: "VariableDeclaration",
                          kind: "let",
                          declarations: [
                            {
                              type: "VariableDeclarator",
                              id: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").VariableName} */ (
                                  "index"
                                ),
                              },
                              init: makeSimpleLiteral(0),
                            },
                          ],
                        },
                        test: {
                          type: "BinaryExpression",
                          operator: "<",
                          left: {
                            type: "Identifier",
                            name: /** @type {import("estree-sentry").VariableName} */ (
                              "index"
                            ),
                          },
                          right: {
                            type: "Identifier",
                            name: /** @type {import("estree-sentry").VariableName} */ (
                              "length"
                            ),
                          },
                        },
                        update: {
                          type: "UpdateExpression",
                          operator: "++",
                          prefix: false,
                          argument: {
                            type: "Identifier",
                            name: /** @type {import("estree-sentry").VariableName} */ (
                              "index"
                            ),
                          },
                        },
                        body: {
                          type: "BlockStatement",
                          body: [
                            {
                              type: "VariableDeclaration",
                              kind: "const",
                              declarations: [
                                {
                                  type: "VariableDeclarator",
                                  id: {
                                    type: "Identifier",
                                    name: /** @type {import("estree-sentry").VariableName} */ (
                                      "key"
                                    ),
                                  },
                                  init: {
                                    type: "MemberExpression",
                                    optional: false,
                                    computed: true,
                                    object: {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "keys"
                                      ),
                                    },
                                    property: {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "index"
                                      ),
                                    },
                                  },
                                },
                              ],
                            },
                            {
                              type: "ExpressionStatement",
                              directive: null,
                              expression: {
                                type: "AssignmentExpression",
                                operator: "=",
                                left: {
                                  type: "Identifier",
                                  name: /** @type {import("estree-sentry").VariableName} */ (
                                    "code"
                                  ),
                                },
                                right: reduce(
                                  [
                                    // has //
                                    makeSimpleLiteral("has_cache["),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral("] = (obj) => (#"),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral(" in obj);\n"),
                                    // get //
                                    makeSimpleLiteral("get_cache["),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral("] = (obj) => (obj.#"),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral(");\n"),
                                    // set //
                                    makeSimpleLiteral("set_cache["),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral(
                                      "] = (obj, val) => (obj.#",
                                    ),
                                    {
                                      type: "Identifier",
                                      name: /** @type {import("estree-sentry").VariableName} */ (
                                        "key"
                                      ),
                                    },
                                    makeSimpleLiteral(" = val);\n"),
                                  ],
                                  makeConcatExpression,
                                  {
                                    type: "Identifier",
                                    name: /** @type {import("estree-sentry").VariableName} */ (
                                      "code"
                                    ),
                                  },
                                ),
                              },
                            },
                          ],
                        },
                      },
                      {
                        type: "ExpressionStatement",
                        directive: null,
                        expression: {
                          type: "CallExpression",
                          optional: false,
                          callee: {
                            type: "Identifier",
                            name: /** @type {import("estree-sentry").VariableName} */ (
                              "eval"
                            ),
                          },
                          arguments: [
                            {
                              type: "Identifier",
                              name: /** @type {import("estree-sentry").VariableName} */ (
                                "code"
                              ),
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              {
                type: "Property",
                kind: "init",
                computed: false,
                shorthand: false,
                method: false,
                key: {
                  type: "Identifier",
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    /** @type {string} */ (
                      getParameterFunctionName("private.has")
                    )
                  ),
                },
                value: {
                  type: "ArrowFunctionExpression",
                  id: null,
                  expression: true,
                  async: false,
                  generator: false,
                  params: [
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "obj"
                      ),
                    },
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "key"
                      ),
                    },
                  ],
                  body: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "LogicalExpression",
                      operator: "??",
                      left: {
                        type: "MemberExpression",
                        optional: false,
                        computed: true,
                        object: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "has_cache"
                          ),
                        },
                        property: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "key"
                          ),
                        },
                      },
                      right: {
                        type: "CallExpression",
                        optional: false,
                        callee: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "eval"
                          ),
                        },
                        arguments: [
                          {
                            type: "BinaryExpression",
                            operator: "+",
                            left: makeSimpleLiteral("((obj) => (#"),
                            right: {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").VariableName} */ (
                                  "key"
                                ),
                              },
                              right: makeSimpleLiteral(" in obj));"),
                            },
                          },
                        ],
                      },
                    },
                    arguments: [
                      {
                        type: "Identifier",
                        name: /** @type {import("estree-sentry").VariableName} */ (
                          "obj"
                        ),
                      },
                    ],
                  },
                },
              },
              {
                type: "Property",
                kind: "init",
                computed: false,
                shorthand: false,
                method: false,
                key: {
                  type: "Identifier",
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    /** @type {string} */ (
                      getParameterFunctionName("private.get")
                    )
                  ),
                },
                value: {
                  type: "ArrowFunctionExpression",
                  id: null,
                  expression: true,
                  async: false,
                  generator: false,
                  params: [
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "obj"
                      ),
                    },
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "key"
                      ),
                    },
                  ],
                  body: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "LogicalExpression",
                      operator: "??",
                      left: {
                        type: "MemberExpression",
                        optional: false,
                        computed: true,
                        object: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "get_cache"
                          ),
                        },
                        property: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "key"
                          ),
                        },
                      },
                      right: {
                        type: "CallExpression",
                        optional: false,
                        callee: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "eval"
                          ),
                        },
                        arguments: [
                          {
                            type: "BinaryExpression",
                            operator: "+",
                            left: makeSimpleLiteral("((obj, val) => (obj.#"),
                            right: {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").VariableName} */ (
                                  "key"
                                ),
                              },
                              right: makeSimpleLiteral("));"),
                            },
                          },
                        ],
                      },
                    },
                    arguments: [
                      {
                        type: "Identifier",
                        name: /** @type {import("estree-sentry").VariableName} */ (
                          "obj"
                        ),
                      },
                    ],
                  },
                },
              },
              {
                type: "Property",
                kind: "init",
                computed: false,
                shorthand: false,
                method: false,
                key: {
                  type: "Identifier",
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    /** @type {string} */ (
                      getParameterFunctionName("private.set")
                    )
                  ),
                },
                value: {
                  type: "ArrowFunctionExpression",
                  id: null,
                  async: false,
                  generator: false,
                  expression: true,
                  params: [
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "obj"
                      ),
                    },
                    {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "key"
                      ),
                    },
                  ],
                  body: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "LogicalExpression",
                      operator: "??",
                      left: {
                        type: "MemberExpression",
                        optional: false,
                        computed: true,
                        object: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "set_cache"
                          ),
                        },
                        property: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "key"
                          ),
                        },
                      },
                      right: {
                        type: "CallExpression",
                        optional: false,
                        callee: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "eval"
                          ),
                        },
                        arguments: [
                          {
                            type: "BinaryExpression",
                            operator: "+",
                            left: makeSimpleLiteral("((obj, val) => (obj.#"),
                            right: {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").VariableName} */ (
                                  "key"
                                ),
                              },
                              right: makeSimpleLiteral(" = val));"),
                            },
                          },
                        ],
                      },
                    },
                    arguments: [
                      {
                        type: "Identifier",
                        name: /** @type {import("estree-sentry").VariableName} */ (
                          "obj"
                        ),
                      },
                      {
                        type: "Identifier",
                        name: /** @type {import("estree-sentry").VariableName} */ (
                          "val"
                        ),
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
        arguments: [
          {
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
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    "__proto__"
                  ),
                },
                value: {
                  type: "Literal",
                  value: null,
                  raw: null,
                  bigint: null,
                  regex: null,
                },
              },
            ],
          },
          {
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
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    "__proto__"
                  ),
                },
                value: makeSimpleLiteral(null),
              },
            ],
          },
          {
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
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    "__proto__"
                  ),
                },
                value: makeSimpleLiteral(null),
              },
            ],
          },
        ],
      },
    },
  ],
});
