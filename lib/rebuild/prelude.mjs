import { mangleArgument } from "./internal.mjs";

/**
 * @type {Record<
 *   aran.Parameter,
 *   (options: { escape: estree.Variable }) => estree.Expression
 * >}
 */
const PRELUDE = {
  // direct //
  "this": (_options) => ({
    type: "ThisExpression",
  }),
  "new.target": (_options) => ({
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
  "import.meta": (_options) => ({
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
  // dummy //
  "function.arguments": (_options) => ({
    type: "Identifier",
    name: "dummy",
  }),
  "catch.error": (_options) => ({
    type: "Identifier",
    name: "dummy",
  }),
  // import //
  // (src) => import(src)
  "import": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("src", options),
      },
    ],
    body: {
      type: "ImportExpression",
      source: {
        type: "Identifier",
        name: mangleArgument("src", options),
      },
    },
  }),
  // super //
  // (key) => super[key]
  "super.get": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("key", options),
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
        name: mangleArgument("key", options),
      },
    },
  }),
  // (key, val) => super[key] = val
  "super.set": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("key", options),
      },
      {
        type: "Identifier",
        name: mangleArgument("val", options),
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
          name: mangleArgument("key", options),
        },
      },
      right: {
        type: "Identifier",
        name: mangleArgument("val", options),
      },
    },
  }),
  // (arg) => super(...arg)
  "super.call": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("arg", options),
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
            name: mangleArgument("arg", options),
          },
        },
      ],
    },
  }),
  // scope //
  // (var) => eval(`(${var});`)
  "scope.read": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("var", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: "(",
                raw: "(",
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ");",
                raw: ");",
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
  // (var) => eval(`(typeof ${var});`)
  "scope.typeof": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("var", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: "(typeof ",
                raw: "(",
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ");",
                raw: ");",
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
  // (var, val) => eval(`(${var} = val);`)
  "scope.write": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", options),
      },
      {
        type: "Identifier",
        name: mangleArgument("val", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("var", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: "(",
                raw: "(",
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ` = ${mangleArgument("val", options)}`,
                raw: ` = ${mangleArgument("val", options)}`,
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ");",
                raw: ");",
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
  // private //
  // (obj, key) => eval(`(#${key} in obj);`)
  "private.has": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("obj", options),
      },
      {
        type: "Identifier",
        name: mangleArgument("key", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("key", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: "(#",
                raw: "(#",
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ` in ${mangleArgument("obj", options)});`,
                raw: `in ${mangleArgument("obj", options)});`,
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
  // (obj, key) => eval(`(obj.#${key});`)
  "private.get": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("obj", options),
      },
      {
        type: "Identifier",
        name: mangleArgument("key", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("key", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: `(${mangleArgument("obj", options)}.#`,
                raw: `(${mangleArgument("obj", options)}.#`,
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: ");",
                raw: ");",
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
  // (obj, key, val) => eval(`(obj.#${key} = val);`)
  "private.set": (options) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("obj", options),
      },
      {
        type: "Identifier",
        name: mangleArgument("key", options),
      },
    ],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Identifier",
        name: "eval",
      },
      arguments: [
        {
          type: "TemplateLiteral",
          expressions: [
            {
              type: "Identifier",
              name: mangleArgument("key", options),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: `(${mangleArgument("obj", options)}.#`,
                raw: `(${mangleArgument("obj", options)}.#`,
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: `${mangleArgument("val", options)});`,
                raw: `${mangleArgument("val", options)});`,
              },
              tail: true,
            },
          ],
        },
      ],
    },
  }),
};

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: { escape: estree.Variable },
 * ) => estree.Expression}
 */
export const makePreludeExpression = (parameter, options) => {
  const initializer = PRELUDE[parameter];
  return initializer(options);
};
