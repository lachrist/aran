import { map, reduce } from "../util/index.mjs";
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
 *   left: import("../estree").Expression,
 *   right: import("../estree").Expression,
 * ) => import("../estree").Expression}
 */
const makeConcatExpression = (left, right) => ({
  type: "BinaryExpression",
  operator: "+",
  left,
  right,
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const listPrivateParameterDeclaration = (config) => [
  {
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
              type: "Literal",
              value: parameter,
            },
            value: mangleParameter(parameter, config),
          })),
        },
        init: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "ArrowFunctionExpression",
            async: false,
            generator: false,
            expression: true,
            params: [
              {
                type: "Identifier",
                name: "has_cache",
              },
              {
                type: "Identifier",
                name: "get_cache",
              },
              {
                type: "Identifier",
                name: "set_cache",
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
                    type: "Literal",
                    value: "private.check",
                  },
                  value: {
                    type: "ArrowFunctionExpression",
                    async: false,
                    generator: false,
                    expression: false,
                    params: [
                      {
                        type: "Identifier",
                        name: "keys",
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
                                name: "code",
                              },
                              init: {
                                type: "Literal",
                                value: "",
                              },
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
                                name: "length",
                              },
                              init: {
                                type: "MemberExpression",
                                optional: false,
                                computed: false,
                                object: {
                                  type: "Identifier",
                                  name: "keys",
                                },
                                property: {
                                  type: "Identifier",
                                  name: "length",
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
                                  name: "index",
                                },
                                init: {
                                  type: "Literal",
                                  value: 0,
                                },
                              },
                            ],
                          },
                          test: {
                            type: "BinaryExpression",
                            operator: "<",
                            left: {
                              type: "Identifier",
                              name: "index",
                            },
                            right: {
                              type: "Identifier",
                              name: "length",
                            },
                          },
                          update: {
                            type: "UpdateExpression",
                            operator: "++",
                            prefix: false,
                            argument: {
                              type: "Identifier",
                              name: "index",
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
                                      name: "key",
                                    },
                                    init: {
                                      type: "MemberExpression",
                                      optional: false,
                                      computed: true,
                                      object: {
                                        type: "Identifier",
                                        name: "keys",
                                      },
                                      property: {
                                        type: "Identifier",
                                        name: "index",
                                      },
                                    },
                                  },
                                ],
                              },
                              {
                                type: "ExpressionStatement",
                                expression: {
                                  type: "AssignmentExpression",
                                  operator: "=",
                                  left: {
                                    type: "Identifier",
                                    name: "code",
                                  },
                                  right: reduce(
                                    [
                                      // has //
                                      {
                                        type: "Literal",
                                        value: "has_cache[",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: "] = (obj) => (#",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: " in obj);\n",
                                      },
                                      // get //
                                      {
                                        type: "Literal",
                                        value: "get_cache[",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: "] = (obj) => (obj.#",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: ");\n",
                                      },
                                      // set //
                                      {
                                        type: "Literal",
                                        value: "set_cache[",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: "] = (obj, val) => (obj.#",
                                      },
                                      {
                                        type: "Identifier",
                                        name: "key",
                                      },
                                      {
                                        type: "Literal",
                                        value: " = val);\n",
                                      },
                                    ],
                                    makeConcatExpression,
                                    {
                                      type: "Identifier",
                                      name: "code",
                                    },
                                  ),
                                },
                              },
                            ],
                          },
                        },
                        {
                          type: "ExpressionStatement",
                          expression: {
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
                    type: "Literal",
                    value: "private.has",
                  },
                  value: {
                    type: "ArrowFunctionExpression",
                    async: false,
                    generator: false,
                    expression: true,
                    params: [
                      {
                        type: "Identifier",
                        name: "obj",
                      },
                      {
                        type: "Identifier",
                        name: "key",
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
                            name: "has_cache",
                          },
                          property: {
                            type: "Identifier",
                            name: "key",
                          },
                        },
                        right: {
                          type: "CallExpression",
                          optional: false,
                          callee: {
                            type: "Identifier",
                            name: "eval",
                          },
                          arguments: [
                            {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Literal",
                                value: "((obj) => (#",
                              },
                              right: {
                                type: "BinaryExpression",
                                operator: "+",
                                left: {
                                  type: "Identifier",
                                  name: "key",
                                },
                                right: {
                                  type: "Literal",
                                  value: " in obj));",
                                },
                              },
                            },
                          ],
                        },
                      },
                      arguments: [
                        {
                          type: "Identifier",
                          name: "obj",
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
                    type: "Literal",
                    value: "private.get",
                  },
                  value: {
                    type: "ArrowFunctionExpression",
                    async: false,
                    generator: false,
                    expression: true,
                    params: [
                      {
                        type: "Identifier",
                        name: "obj",
                      },
                      {
                        type: "Identifier",
                        name: "key",
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
                            name: "has_cache",
                          },
                          property: {
                            type: "Identifier",
                            name: "key",
                          },
                        },
                        right: {
                          type: "CallExpression",
                          optional: false,
                          callee: {
                            type: "Identifier",
                            name: "eval",
                          },
                          arguments: [
                            {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Literal",
                                value: "((obj) => (obj.#",
                              },
                              right: {
                                type: "BinaryExpression",
                                operator: "+",
                                left: {
                                  type: "Identifier",
                                  name: "key",
                                },
                                right: {
                                  type: "Literal",
                                  value: "));",
                                },
                              },
                            },
                          ],
                        },
                      },
                      arguments: [
                        {
                          type: "Identifier",
                          name: "obj",
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
                    type: "Literal",
                    value: "private.get",
                  },
                  value: {
                    type: "ArrowFunctionExpression",
                    async: false,
                    generator: false,
                    expression: true,
                    params: [
                      {
                        type: "Identifier",
                        name: "obj",
                      },
                      {
                        type: "Identifier",
                        name: "key",
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
                            name: "has_cache",
                          },
                          property: {
                            type: "Identifier",
                            name: "key",
                          },
                        },
                        right: {
                          type: "CallExpression",
                          optional: false,
                          callee: {
                            type: "Identifier",
                            name: "eval",
                          },
                          arguments: [
                            {
                              type: "BinaryExpression",
                              operator: "+",
                              left: {
                                type: "Literal",
                                value: "((obj, val) => (obj.#",
                              },
                              right: {
                                type: "BinaryExpression",
                                operator: "+",
                                left: {
                                  type: "Identifier",
                                  name: "key",
                                },
                                right: {
                                  type: "Literal",
                                  value: "= val));",
                                },
                              },
                            },
                          ],
                        },
                      },
                      arguments: [
                        {
                          type: "Identifier",
                          name: "obj",
                        },
                        {
                          type: "Identifier",
                          name: "val",
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
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
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
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
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
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  },
];
