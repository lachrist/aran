import { mangleArgument } from "./internal.mjs";

/**
 * @type {Record<
 *   aran.Parameter,
 *   (options: { escape: estree.Variable }) => estree.Expression
 * >}
 */
export const PRELUDE = {
  // direct //
  "this": (_context) => ({
    type: "ThisExpression",
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
  // dummy //
  "function.arguments": (_context) => ({
    type: "Identifier",
    name: "dummy",
  }),
  "catch.error": (_context) => ({
    type: "Identifier",
    name: "dummy",
  }),
  // import //
  // (src) => import(src)
  "import": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("src", context),
      },
    ],
    body: {
      type: "ImportExpression",
      source: {
        type: "Identifier",
        name: mangleArgument("src", context),
      },
    },
  }),
  // super //
  // (key) => super[key]
  "super.get": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("key", context),
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
        name: mangleArgument("key", context),
      },
    },
  }),
  // (key, val) => super[key] = val
  "super.set": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("key", context),
      },
      {
        type: "Identifier",
        name: mangleArgument("val", context),
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
          name: mangleArgument("key", context),
        },
      },
      right: {
        type: "Identifier",
        name: mangleArgument("val", context),
      },
    },
  }),
  // (arg) => super(...arg)
  "super.call": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("arg", context),
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
            name: mangleArgument("arg", context),
          },
        },
      ],
    },
  }),
  // scope //
  // (var) => eval(`(${var});`)
  "scope.read": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", context),
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
              name: mangleArgument("var", context),
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
  "scope.typeof": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", context),
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
              name: mangleArgument("var", context),
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
  "scope.write": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("var", context),
      },
      {
        type: "Identifier",
        name: mangleArgument("val", context),
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
              name: mangleArgument("var", context),
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
                cooked: ` = ${mangleArgument("val", context)}`,
                raw: ` = ${mangleArgument("val", context)}`,
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
  // (obj, key) => eval(`(obj.#${key});`)
  "private.get": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("obj", context),
      },
      {
        type: "Identifier",
        name: mangleArgument("key", context),
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
              name: mangleArgument("key", context),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: `(${mangleArgument("obj", context)}.#`,
                raw: `(${mangleArgument("obj", context)}.#`,
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
  "private.set": (context) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: mangleArgument("obj", context),
      },
      {
        type: "Identifier",
        name: mangleArgument("key", context),
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
              name: mangleArgument("key", context),
            },
          ],
          quasis: [
            {
              type: "TemplateElement",
              value: {
                cooked: `(${mangleArgument("obj", context)}.#`,
                raw: `(${mangleArgument("obj", context)}.#`,
              },
              tail: false,
            },
            {
              type: "TemplateElement",
              value: {
                cooked: `${mangleArgument("val", context)});`,
                raw: `${mangleArgument("val", context)});`,
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
