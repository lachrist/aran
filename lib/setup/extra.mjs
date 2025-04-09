import { BINARY_OPERATOR_RECORD, UNARY_OPERATOR_RECORD } from "estree-sentry";
import { getIntrinsicFunctionName } from "../lang/index.mjs";
import { listKey, map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";
import { makeReadDependencyExpression } from "./dependency.mjs";
import { global_object_parameter } from "./global.mjs";

const BINARY_OPERATOR_ENUM = listKey(BINARY_OPERATOR_RECORD);

const UNARY_OPERATOR_ENUM = listKey(UNARY_OPERATOR_RECORD);

/**
 * @type {(
 *   layout: {
 *     name: keyof import("../lang/naming").IntrinsicFunctionNaming,
 *     dependencies: import("../util/tree").Tree<import("./layout").Dependency>,
 *     setup: import("../util/tree").Tree<import("estree-sentry").Statement<{}>>,
 *     head: import("estree-sentry").RestablePattern<{}>[],
 *     body: (
 *       | import("estree-sentry").Expression<{}>
 *       | import("estree-sentry").BlockStatement<{}>
 *     ),
 *   },
 * ) => import("./layout").Layout}
 */
export const toArrowLayout = ({ name, dependencies, setup, head, body }) => ({
  name,
  dependencies,
  setup: [
    setup,
    {
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: getIntrinsicFunctionName(name),
          },
          init:
            body.type === "BlockStatement"
              ? {
                  type: "ArrowFunctionExpression",
                  id: null,
                  generator: false,
                  expression: false,
                  async: false,
                  params: head,
                  body,
                }
              : {
                  type: "ArrowFunctionExpression",
                  id: null,
                  generator: false,
                  expression: true,
                  async: false,
                  params: head,
                  body,
                },
        },
      ],
    },
  ],
  value: {
    type: "Identifier",
    name: getIntrinsicFunctionName(name),
  },
});

/**
 * @type {(
 *   name: string,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
const makeVariableIdentifier = (name) => ({
  type: "Identifier",
  // eslint-disable-next-line object-shorthand
  name: /** @type {import("estree-sentry").VariableName} */ (name),
});

/**
 * @type {(
 *   name: string,
 * ) => import("estree-sentry").PublicKeyIdentifier<{}>}
 */
const makePublicKeyIdentifier = (name) => ({
  type: "Identifier",
  // eslint-disable-next-line object-shorthand
  name: /** @type {import("estree-sentry").PublicKeyName} */ (name),
});

/**
 * @type {(
 *   value: null | boolean | number | string,
 * ) => import("estree-sentry").Literal<{}>}
 */
const makeSimpleLiteral = (value) => {
  if (value === null) {
    return {
      type: "Literal",
      value,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "boolean") {
    return {
      type: "Literal",
      value,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "number") {
    return {
      type: "Literal",
      value,
      raw: null,
      bigint: null,
      regex: null,
    };
  } else if (typeof value === "string") {
    return {
      type: "Literal",
      // eslint-disable-next-line object-shorthand
      value: /** @type {import("estree-sentry").StringValue} */ (value),
      raw: null,
      bigint: null,
      regex: null,
    };
  } else {
    throw new AranTypeError(value);
  }
};

/**
 * @type {(
 *   argument: import("estree-sentry").Pattern<{}>,
 * ) => import("estree-sentry").RestElement<{}>}
 */
const makeRestElement = (argument) => ({
  type: "RestElement",
  argument,
});

/**
 * @type {(
 *   test: import("estree-sentry").Expression<{}>,
 *   body: import("estree-sentry").Statement<{}>,
 * ) => import("estree-sentry").WhileStatement<{}>}
 */
const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});

/**
 * @type {(
 *   test: import("estree-sentry").Expression<{}>,
 *   consequent: import("estree-sentry").Statement<{}>,
 *   alternate: import("estree-sentry").Statement<{}> | null,
 * ) => import("estree-sentry").IfStatement<{}>}
 */
const makeIfStatement = (test, consequent, alternate) => ({
  type: "IfStatement",
  test,
  consequent,
  alternate,
});

/**
 * @type {(
 *   test: import("estree-sentry").Expression<{}>,
 *   consequent: import("estree-sentry").Expression<{}>,
 *   alternate: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").ConditionalExpression<{}>}
 */
const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});

/**
 * @type {(
 *   expressions: import("estree-sentry").Expression<{}>[],
 * ) => import("estree-sentry").SequenceExpression<{}>}
 */
const makeSequenceExpression = (expressions) => ({
  type: "SequenceExpression",
  expressions,
});

/**
 * @type {(
 *   left: (
 *     | import("estree-sentry").Pattern<{}>
 *     | import("estree-sentry").VariableDeclaration<{}>
 *   ),
 *   right: import("estree-sentry").Expression<{}>,
 *   body: import("estree-sentry").Statement<{}>,
 * ) => import("estree-sentry").ForInStatement<{}>}
 */
const makeForInStatement = (left, right, body) => ({
  type: "ForInStatement",
  left,
  right,
  body,
});

/**
 * @type {(
 *   elements: import("estree-sentry").Expression<{}>[],
 * ) => import("estree-sentry").ArrayExpression<{}>}
 */
const makeArrayExpression = (elements) => ({
  type: "ArrayExpression",
  elements,
});

/**
 * @type {(
 *   expression: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").ExpressionStatement<{}>}
 */
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  directive: null,
  expression,
});

/**
 * @type {(
 *   kind: import("estree-sentry").VariableKind,
 *   id: import("estree-sentry").Pattern<{}>,
 *   init: null | import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").VariableDeclaration<{}>}
 */
const makeVariableDeclaration = (kind, id, init) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id,
      init,
    },
  ],
});

/**
 * @type {(
 *   left: import("estree-sentry").Pattern<{}>,
 *   right: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").AssignmentExpression<{}>}
 */
const makeAssignmentExpression = (left, right) => ({
  type: "AssignmentExpression",
  operator: "=",
  left,
  right,
});

/**
 * @type {(
 *   param: null | import("estree-sentry").Pattern<{}>,
 *   body: import("estree-sentry").BlockStatement<{}>,
 * ) => import("estree-sentry").CatchClause<{}>}
 */
const makeCatchClause = (param, body) => ({
  type: "CatchClause",
  param,
  body,
});

/**
 * @type {(
 *   block: import("estree-sentry").BlockStatement<{}>,
 *   handler: null | import("estree-sentry").CatchClause<{}>,
 *   finalizer: null | import("estree-sentry").BlockStatement<{}>,
 * ) => import("estree-sentry").TryStatement<{}>}
 */
const makeTryStatement = (block, handler, finalizer) => ({
  type: "TryStatement",
  block,
  handler,
  finalizer,
});

/**
 * @type {(
 *   prefix: boolean,
 *   operator: import("estree-sentry").UpdateOperator,
 *   argument: import("estree-sentry").UpdatePattern<{}>,
 * ) => import("estree-sentry").UpdateExpression<{}>}
 */
const makeUpdateExpression = (prefix, operator, argument) => ({
  type: "UpdateExpression",
  prefix,
  operator,
  argument,
});

/**
 * @type {(
 *   argument: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").SpreadElement<{}>}
 */
const makeSpreadElement = (argument) => ({
  type: "SpreadElement",
  argument,
});

/**
 * @type {(
 *  argument: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").ThrowStatement<{}>}
 */
const makeThrowStatement = (argument) => ({
  type: "ThrowStatement",
  argument,
});

/**
 * @type {(
 *   operator: import("estree-sentry").UnaryOperator,
 *   argument: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").UnaryExpression<{}>}
 */
const makeUnaryExpression = (operator, argument) => ({
  type: "UnaryExpression",
  operator,
  prefix: true,
  argument,
});

/**
 * @type {(
 *   operator: import("estree-sentry").BinaryOperator,
 *   left: import("estree-sentry").Expression<{}>,
 *   right: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").BinaryExpression<{}>}
 */
const makeBinaryExpression = (operator, left, right) => ({
  type: "BinaryExpression",
  operator,
  left,
  right,
});

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   operator: import("estree-sentry").BinaryOperator,
 *   terms: [
 *     import("estree-sentry").Expression<{}>,
 *     ... import("estree-sentry").Expression<{}>[]
 *   ],
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeConcatExpression = (operation, terms) => {
  let result = terms[0];
  for (let index = 0; index < terms.length - 1; index += 1) {
    result = makeBinaryExpression(operation, result, terms[index + 1]);
  }
  return result;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *  body: import("estree-sentry").Statement<{}>[],
 * ) => import("estree-sentry").BlockStatement<{}>}
 */
const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
});

/**
 * @type {(
 *  argument: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").ReturnStatement<{}>}
 */
const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

/**
 * @type {(
 *   test: import("estree-sentry").Expression<{}>,
 *   consequent: import("estree-sentry").Statement<{}>[],
 * ) => import("estree-sentry").SwitchCase<{}>}
 */
const makeSwitchCase = (test, consequent) => ({
  type: "SwitchCase",
  test,
  consequent,
});

/**
 * @type {(
 *   discriminant: import("estree-sentry").Expression<{}>,
 *   cases: import("estree-sentry").SwitchCase<{}>[],
 * ) => import("estree-sentry").SwitchStatement<{}>}
 */
const makeSwitchStatement = (discriminant, cases) => ({
  type: "SwitchStatement",
  discriminant,
  cases,
});

/**
 * @type {(
 *   operator: import("estree-sentry").LogicalOperator,
 *   left: import("estree-sentry").Expression<{}>,
 *   right: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeLogicalExpression = (operator, left, right) => ({
  type: "LogicalExpression",
  operator,
  left,
  right,
});

/**
 * @type {(... [computed, key, value]: [
 *   true,
 *   import("estree-sentry").Expression<{}>,
 *   import("estree-sentry").Expression<{}>,
 * ] | [
 *   false,
 *   (
 *     | import("estree-sentry").PublicKeyIdentifier<{}>
 *     | import("estree-sentry").PublicKeyLiteral<{}>
 *   ),
 *   import("estree-sentry").Expression<{}>,
 * ]) => import("estree-sentry").ObjectProperty<{}>}
 */
const makeProperty = (computed, key, value) => {
  if (computed) {
    return {
      type: "Property",
      kind: "init",
      method: false,
      computed,
      shorthand: false,
      key,
      value,
    };
  } else {
    return {
      type: "Property",
      kind: "init",
      method: false,
      computed,
      shorthand: false,
      key,
      value,
    };
  }
};

/**
 * @type {(
 *   properties: (
 *     | import("estree-sentry").ObjectProperty<{}>
 *     | import("estree-sentry").SpreadElement<{}>
 *   )[],
 * ) => import("estree-sentry").ObjectExpression<{}>}
 */
const makeObjectExpression = (properties) => ({
  type: "ObjectExpression",
  properties,
});

/**
 * @type {(
 *   name: null | string,
 *   kind: {
 *     asynchronous: boolean,
 *     generator: boolean,
 *   },
 *   parameters: import("estree-sentry").Pattern<{}>[],
 *   body: import("estree-sentry").BlockStatement<{}>,
 * ) => import("estree-sentry").FunctionExpression<{}>}
 */
const makeFunctionExpression = (
  name,
  { asynchronous, generator },
  parameters,
  body,
) => ({
  type: "FunctionExpression",
  async: asynchronous,
  generator,
  params: parameters,
  id: name === null ? null : makeVariableIdentifier(name),
  body,
});

/**
 * @type {(... [computed, object, property]: ([
 *   true,
 *   import("estree-sentry").Expression<{}>,
 *   import("estree-sentry").Expression<{}>,
 *  ] | [
 *    false,
 *    import("estree-sentry").Expression<{}>,
 *    import("estree-sentry").PublicKeyIdentifier<{}>,
 *  ])
 * ) => import("estree-sentry").MemberExpression<{}>}
 */
const makeMemberExpression = (computed, object, property) => {
  if (computed) {
    return {
      type: "MemberExpression",
      computed,
      optional: false,
      object,
      property,
    };
  } else {
    return {
      type: "MemberExpression",
      computed,
      optional: false,
      object,
      property,
    };
  }
};

/**
 * @type {(
 *   callee: import("estree-sentry").Expression<{}>,
 *   arguments_: import("estree-sentry").Expression<{}>[],
 * ) => import("estree-sentry").CallExpression<{}>}
 */
const makeCallExpression = (callee, arguments_) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   callee: import("estree-sentry").Expression<{}>,
 *   arguments_: import("estree-sentry").Expression<{}>[],
 * ) => import("estree-sentry").NewExpression<{}>}
 */
const makeNewExpression = (callee, arguments_) => ({
  type: "NewExpression",
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   name: keyof import("../lang/naming").IntrinsicFunctionNaming,
 *   makeCodeExpression: (
 *     variable: string,
 *   ) => import("estree-sentry").Expression<{}>
 * ) => import("./layout").Layout}
 */
const makeAccessLayout = (name, makeCodeExpression) =>
  toArrowLayout({
    name,
    dependencies: ["eval"],
    setup: [
      makeVariableDeclaration(
        "const",
        makeVariableIdentifier(`${getIntrinsicFunctionName(name)}_cache`),
        makeObjectExpression([
          makeProperty(
            false,
            makePublicKeyIdentifier("__proto__"),
            makeSimpleLiteral(null),
          ),
        ]),
      ),
    ],
    head: [
      makeVariableIdentifier("variable"),
      makeVariableIdentifier("additional"),
      makeVariableIdentifier("optimization"),
    ],
    body: makeConditionalExpression(
      makeVariableIdentifier("optimization"),
      makeAssignmentExpression(
        makeMemberExpression(
          true,
          makeVariableIdentifier(`${getIntrinsicFunctionName(name)}_cache`),
          makeVariableIdentifier("variable"),
        ),
        makeVariableIdentifier("optimization"),
      ),
      makeCallExpression(
        makeLogicalExpression(
          "??",
          makeMemberExpression(
            true,
            makeVariableIdentifier(`${getIntrinsicFunctionName(name)}_cache`),
            makeVariableIdentifier("variable"),
          ),
          makeAssignmentExpression(
            makeMemberExpression(
              true,
              makeVariableIdentifier(`${getIntrinsicFunctionName(name)}_cache`),
              makeVariableIdentifier("variable"),
            ),
            makeCallExpression(makeReadDependencyExpression("eval"), [
              makeCodeExpression("variable"),
            ]),
          ),
        ),
        [makeVariableIdentifier("additional")],
      ),
    ),
  });

/**
 * @type {(
 *   name: import("../lang/syntax").AranIntrinsic,
 * ) => import("./layout").Layout}
 */
export const makeExtraLayout = (name) => {
  switch (name) {
    case "aran.global_object": {
      return {
        name,
        dependencies: [],
        setup: [],
        value: makeVariableIdentifier(global_object_parameter),
      };
    }
    case "aran.global_declarative_record": {
      return {
        name,
        dependencies: [],
        setup: [],
        value: makeObjectExpression([
          makeProperty(
            false,
            makePublicKeyIdentifier("__proto__"),
            makeSimpleLiteral(null),
          ),
        ]),
      };
    }
    case "aran.deadzone_symbol": {
      return {
        name,
        dependencies: ["Symbol"],
        setup: [],
        value: makeCallExpression(makeReadDependencyExpression("Symbol"), [
          makeSimpleLiteral("deadzone"),
        ]),
      };
    }
    case "aran.throwException": {
      return toArrowLayout({
        name,
        dependencies: [],
        setup: [],
        head: [makeVariableIdentifier("error")],
        body: makeBlockStatement([
          makeThrowStatement(makeVariableIdentifier("error")),
        ]),
      });
    }
    case "aran.AsyncGeneratorFunction.prototype.prototype": {
      return {
        name,
        dependencies: ["Reflect_getPrototypeOf"],
        setup: [],
        value: makeCallExpression(
          makeReadDependencyExpression("Reflect_getPrototypeOf"),
          [
            makeMemberExpression(
              false,
              makeFunctionExpression(
                null,
                { asynchronous: true, generator: true },
                [],
                makeBlockStatement([]),
              ),
              makePublicKeyIdentifier("prototype"),
            ),
          ],
        ),
      };
    }
    case "aran.GeneratorFunction.prototype.prototype": {
      return {
        name,
        dependencies: ["Reflect_getPrototypeOf"],
        setup: [],
        value: makeCallExpression(
          makeReadDependencyExpression("Reflect_getPrototypeOf"),
          [
            makeMemberExpression(
              false,
              makeFunctionExpression(
                null,
                { asynchronous: false, generator: true },
                [],
                makeBlockStatement([]),
              ),
              makePublicKeyIdentifier("prototype"),
            ),
          ],
        ),
      };
    }
    case "aran.getValueProperty": {
      return toArrowLayout({
        name,
        dependencies: [],
        setup: [],
        head: [makeVariableIdentifier("object"), makeVariableIdentifier("key")],
        body: makeMemberExpression(
          true,
          makeVariableIdentifier("object"),
          makeVariableIdentifier("key"),
        ),
      });
    }
    case "aran.performUnaryOperation": {
      return toArrowLayout({
        name,
        dependencies: [],
        setup: [],
        head: [
          makeVariableIdentifier("operator"),
          makeVariableIdentifier("argument"),
        ],
        body: makeBlockStatement([
          makeSwitchStatement(
            makeVariableIdentifier("operator"),
            map(UNARY_OPERATOR_ENUM, (operator) =>
              makeSwitchCase(makeSimpleLiteral(operator), [
                makeReturnStatement(
                  operator === "delete"
                    ? makeSimpleLiteral(true)
                    : makeUnaryExpression(
                        operator,
                        makeVariableIdentifier("argument"),
                      ),
                ),
              ]),
            ),
          ),
        ]),
      });
    }
    case "aran.performBinaryOperation": {
      return toArrowLayout({
        name,
        dependencies: [],
        setup: [],
        head: [
          makeVariableIdentifier("operator"),
          makeVariableIdentifier("left"),
          makeVariableIdentifier("right"),
        ],
        body: makeBlockStatement([
          makeSwitchStatement(
            makeVariableIdentifier("operator"),
            map(BINARY_OPERATOR_ENUM, (operator) =>
              makeSwitchCase(makeSimpleLiteral(operator), [
                makeReturnStatement(
                  makeBinaryExpression(
                    operator,
                    makeVariableIdentifier("left"),
                    makeVariableIdentifier("right"),
                  ),
                ),
              ]),
            ),
          ),
        ]),
      });
    }
    case "aran.isConstructor": {
      return toArrowLayout({
        name,
        dependencies: ["Boolean", "Reflect_construct"],
        setup: [],
        head: [makeVariableIdentifier("value")],
        body: makeBlockStatement([
          makeTryStatement(
            makeBlockStatement([
              makeExpressionStatement(
                makeCallExpression(
                  makeReadDependencyExpression("Reflect_construct"),
                  [
                    makeReadDependencyExpression("Boolean"),
                    makeObjectExpression([]),
                    makeVariableIdentifier("value"),
                  ],
                ),
              ),
              makeReturnStatement(makeSimpleLiteral(true)),
            ]),
            makeCatchClause(
              null,
              makeBlockStatement([
                makeReturnStatement(makeSimpleLiteral(false)),
              ]),
            ),
            null,
          ),
        ]),
      });
    }
    case "aran.sliceObject": {
      return toArrowLayout({
        name,
        dependencies: [
          "Object_hasOwn",
          "Reflect_getOwnPropertyDescriptor",
          "Reflect_defineProperty",
          "Reflect_ownKeys",
        ],
        setup: [],
        head: [
          makeVariableIdentifier("object"),
          makeVariableIdentifier("exclusion"),
        ],
        body: makeBlockStatement([
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("descriptor"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("value"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("writable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("enumerable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("configurable"),
                makeSimpleLiteral(true),
              ),
            ]),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("keys"),
            makeCallExpression(
              makeReadDependencyExpression("Reflect_ownKeys"),
              [makeVariableIdentifier("object")],
            ),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("length"),
            makeMemberExpression(
              false,
              makeVariableIdentifier("keys"),
              makePublicKeyIdentifier("length"),
            ),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("copy"),
            makeObjectExpression([]),
          ),
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("index"),
            makeSimpleLiteral(0),
          ),
          makeWhileStatement(
            makeBinaryExpression(
              "<",
              makeVariableIdentifier("index"),
              makeVariableIdentifier("length"),
            ),
            makeBlockStatement([
              makeVariableDeclaration(
                "const",
                makeVariableIdentifier("key"),
                makeMemberExpression(
                  true,
                  makeVariableIdentifier("keys"),
                  makeVariableIdentifier("index"),
                ),
              ),
              makeIfStatement(
                makeLogicalExpression(
                  "&&",
                  makeUnaryExpression(
                    "!",
                    makeCallExpression(
                      makeReadDependencyExpression("Object_hasOwn"),
                      [
                        makeVariableIdentifier("exclusion"),
                        makeVariableIdentifier("key"),
                      ],
                    ),
                  ),
                  makeMemberExpression(
                    false,
                    makeLogicalExpression(
                      "??",
                      makeCallExpression(
                        makeReadDependencyExpression(
                          "Reflect_getOwnPropertyDescriptor",
                        ),
                        [
                          makeVariableIdentifier("object"),
                          makeVariableIdentifier("key"),
                        ],
                      ),
                      makeObjectExpression([
                        makeProperty(
                          false,
                          makePublicKeyIdentifier("enumerable"),
                          makeSimpleLiteral(false),
                        ),
                      ]),
                    ),
                    makePublicKeyIdentifier("enumerable"),
                  ),
                ),
                makeBlockStatement([
                  makeExpressionStatement(
                    makeCallExpression(
                      makeReadDependencyExpression("Reflect_defineProperty"),
                      [
                        makeVariableIdentifier("copy"),
                        makeVariableIdentifier("key"),
                        makeSequenceExpression([
                          makeAssignmentExpression(
                            makeMemberExpression(
                              false,
                              makeVariableIdentifier("descriptor"),
                              makePublicKeyIdentifier("value"),
                            ),
                            makeMemberExpression(
                              true,
                              makeVariableIdentifier("object"),
                              makeVariableIdentifier("key"),
                            ),
                          ),
                          makeVariableIdentifier("descriptor"),
                        ]),
                      ],
                    ),
                  ),
                ]),
                null,
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeVariableIdentifier("index"),
                  makeBinaryExpression(
                    "+",
                    makeVariableIdentifier("index"),
                    makeSimpleLiteral(1),
                  ),
                ),
              ),
            ]),
          ),
          makeReturnStatement(makeVariableIdentifier("copy")),
        ]),
      });
    }
    case "aran.toArgumentList": {
      return toArrowLayout({
        name,
        dependencies: [
          "Reflect_defineProperty",
          "Array_prototype_values",
          "Function_prototype",
          "Symbol_iterator",
          "Symbol_toStringTag",
        ],
        setup: [
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("default_callee_descriptor"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
              makeSpreadElement(
                makeCallExpression(
                  makeReadDependencyExpression(
                    "Reflect_getOwnPropertyDescriptor",
                  ),
                  [
                    makeReadDependencyExpression("Function_prototype"),
                    makeSimpleLiteral("arguments"),
                  ],
                ),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("configurable"),
                makeSimpleLiteral(false),
              ),
            ]),
          ),
        ],
        head: [
          makeVariableIdentifier("array"),
          makeVariableIdentifier("callee"),
        ],
        body: makeBlockStatement([
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("descriptor"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("value"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("writable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("enumerable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("configurable"),
                makeSimpleLiteral(true),
              ),
            ]),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("list"),
            makeObjectExpression([]),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("length"),
            makeMemberExpression(
              false,
              makeVariableIdentifier("array"),
              makePublicKeyIdentifier("length"),
            ),
          ),
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("index"),
            makeSimpleLiteral(0),
          ),
          makeWhileStatement(
            makeBinaryExpression(
              "<",
              makeVariableIdentifier("index"),
              makeVariableIdentifier("length"),
            ),
            makeBlockStatement([
              makeExpressionStatement(
                makeCallExpression(
                  makeReadDependencyExpression("Reflect_defineProperty"),
                  [
                    makeVariableIdentifier("list"),
                    makeVariableIdentifier("index"),
                    makeSequenceExpression([
                      makeAssignmentExpression(
                        makeMemberExpression(
                          false,
                          makeVariableIdentifier("descriptor"),
                          makePublicKeyIdentifier("value"),
                        ),
                        makeMemberExpression(
                          true,
                          makeVariableIdentifier("array"),
                          makeVariableIdentifier("index"),
                        ),
                      ),
                      makeVariableIdentifier("descriptor"),
                    ]),
                  ],
                ),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeVariableIdentifier("index"),
                  makeBinaryExpression(
                    "+",
                    makeVariableIdentifier("index"),
                    makeSimpleLiteral(1),
                  ),
                ),
              ),
            ]),
          ),
          makeExpressionStatement(
            makeAssignmentExpression(
              makeMemberExpression(
                false,
                makeVariableIdentifier("descriptor"),
                makePublicKeyIdentifier("enumerable"),
              ),
              makeSimpleLiteral(false),
            ),
          ),
          makeExpressionStatement(
            makeCallExpression(
              makeReadDependencyExpression("Reflect_defineProperty"),
              [
                makeVariableIdentifier("list"),
                makeSimpleLiteral("length"),
                makeSequenceExpression([
                  makeAssignmentExpression(
                    makeMemberExpression(
                      false,
                      makeVariableIdentifier("descriptor"),
                      makePublicKeyIdentifier("value"),
                    ),
                    makeVariableIdentifier("length"),
                  ),
                  makeVariableIdentifier("descriptor"),
                ]),
              ],
            ),
          ),
          makeExpressionStatement(
            makeCallExpression(
              makeReadDependencyExpression("Reflect_defineProperty"),
              [
                makeVariableIdentifier("list"),
                makeSimpleLiteral("callee"),
                makeConditionalExpression(
                  makeVariableIdentifier("callee"),
                  makeSequenceExpression([
                    makeAssignmentExpression(
                      makeMemberExpression(
                        false,
                        makeVariableIdentifier("descriptor"),
                        makePublicKeyIdentifier("value"),
                      ),
                      makeVariableIdentifier("callee"),
                    ),
                    makeVariableIdentifier("descriptor"),
                  ]),
                  makeVariableIdentifier("default_callee_descriptor"),
                ),
              ],
            ),
          ),
          makeExpressionStatement(
            makeCallExpression(
              makeReadDependencyExpression("Reflect_defineProperty"),
              [
                makeVariableIdentifier("list"),
                makeReadDependencyExpression("Symbol_iterator"),
                makeSequenceExpression([
                  makeAssignmentExpression(
                    makeMemberExpression(
                      false,
                      makeVariableIdentifier("descriptor"),
                      makePublicKeyIdentifier("value"),
                    ),
                    makeReadDependencyExpression("Array_prototype_values"),
                  ),
                  makeVariableIdentifier("descriptor"),
                ]),
              ],
            ),
          ),
          makeExpressionStatement(
            makeCallExpression(
              makeReadDependencyExpression("Reflect_defineProperty"),
              [
                makeVariableIdentifier("list"),
                makeReadDependencyExpression("Symbol_toStringTag"),
                makeSequenceExpression([
                  makeAssignmentExpression(
                    makeMemberExpression(
                      false,
                      makeVariableIdentifier("descriptor"),
                      makePublicKeyIdentifier("value"),
                    ),
                    makeSimpleLiteral("Arguments"),
                  ),
                  makeVariableIdentifier("descriptor"),
                ]),
              ],
            ),
          ),
          makeReturnStatement(makeVariableIdentifier("list")),
        ]),
      });
    }
    case "aran.listForInKey": {
      return toArrowLayout({
        name,
        dependencies: [],
        setup: [],
        head: [makeVariableIdentifier("target")],
        body: makeBlockStatement([
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("length"),
            makeSimpleLiteral(0),
          ),
          // Use {__proto__: null} instead of [] to avoid the prototype chain
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("keys"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
            ]),
          ),
          makeForInStatement(
            makeVariableDeclaration(
              "const",
              makeVariableIdentifier("key"),
              null,
            ),
            makeVariableIdentifier("target"),
            makeExpressionStatement(
              makeAssignmentExpression(
                makeMemberExpression(
                  true,
                  makeVariableIdentifier("keys"),
                  makeUpdateExpression(
                    false,
                    "++",
                    makeVariableIdentifier("length"),
                  ),
                ),
                makeVariableIdentifier("key"),
              ),
            ),
          ),
          makeExpressionStatement(
            makeAssignmentExpression(
              makeMemberExpression(
                false,
                makeVariableIdentifier("keys"),
                makePublicKeyIdentifier("length"),
              ),
              makeVariableIdentifier("length"),
            ),
          ),
          makeReturnStatement(makeVariableIdentifier("keys")),
        ]),
      });
    }
    case "aran.listIteratorRest": {
      return toArrowLayout({
        name,
        dependencies: ["Reflect_apply"],
        setup: [],
        head: [
          makeVariableIdentifier("iterator"),
          makeVariableIdentifier("next"),
        ],
        body: makeBlockStatement([
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("rest"),
            makeArrayExpression([]),
          ),
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("step"),
            makeCallExpression(makeReadDependencyExpression("Reflect_apply"), [
              makeVariableIdentifier("next"),
              makeVariableIdentifier("iterator"),
              makeArrayExpression([]),
            ]),
          ),
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("index"),
            makeSimpleLiteral(0),
          ),
          makeWhileStatement(
            makeUnaryExpression(
              "!",
              makeMemberExpression(
                false,
                makeVariableIdentifier("step"),
                makePublicKeyIdentifier("done"),
              ),
            ),
            makeBlockStatement([
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeMemberExpression(
                    true,
                    makeVariableIdentifier("rest"),
                    makeVariableIdentifier("index"),
                  ),
                  makeMemberExpression(
                    false,
                    makeVariableIdentifier("step"),
                    makePublicKeyIdentifier("value"),
                  ),
                ),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeVariableIdentifier("index"),
                  makeBinaryExpression(
                    "+",
                    makeVariableIdentifier("index"),
                    makeSimpleLiteral(1),
                  ),
                ),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeVariableIdentifier("step"),
                  makeCallExpression(
                    makeReadDependencyExpression("Reflect_apply"),
                    [
                      makeVariableIdentifier("next"),
                      makeVariableIdentifier("iterator"),
                      makeArrayExpression([]),
                    ],
                  ),
                ),
              ),
            ]),
          ),
          makeReturnStatement(makeVariableIdentifier("rest")),
        ]),
      });
    }
    case "aran.toPropertyKey": {
      return toArrowLayout({
        name,
        dependencies: ["Reflect_ownKeys"],
        setup: [],
        head: [makeVariableIdentifier("key")],
        body: makeMemberExpression(
          true,
          makeCallExpression(makeReadDependencyExpression("Reflect_ownKeys"), [
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                true,
                makeVariableIdentifier("key"),
                makeSimpleLiteral(null),
              ),
            ]),
          ]),
          makeSimpleLiteral(0),
        ),
      });
    }
    case "aran.createObject": {
      return toArrowLayout({
        name,
        dependencies: ["Reflect_defineProperty"],
        setup: [],
        head: [
          makeVariableIdentifier("prototype"),
          makeRestElement(makeVariableIdentifier("entries")),
        ],
        body: makeBlockStatement([
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("descriptor"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("value"),
                makeSimpleLiteral(null),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("writable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("enumerable"),
                makeSimpleLiteral(true),
              ),
              makeProperty(
                false,
                makePublicKeyIdentifier("configurable"),
                makeSimpleLiteral(true),
              ),
            ]),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("object"),
            makeObjectExpression([
              makeProperty(
                false,
                makePublicKeyIdentifier("__proto__"),
                makeVariableIdentifier("prototype"),
              ),
            ]),
          ),
          makeVariableDeclaration(
            "const",
            makeVariableIdentifier("length"),
            makeMemberExpression(
              false,
              makeVariableIdentifier("entries"),
              makePublicKeyIdentifier("length"),
            ),
          ),
          makeVariableDeclaration(
            "let",
            makeVariableIdentifier("index"),
            makeSimpleLiteral(0),
          ),
          makeWhileStatement(
            makeBinaryExpression(
              "<",
              makeVariableIdentifier("index"),
              makeVariableIdentifier("length"),
            ),
            makeBlockStatement([
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeMemberExpression(
                    false,
                    makeVariableIdentifier("descriptor"),
                    makePublicKeyIdentifier("value"),
                  ),
                  makeMemberExpression(
                    true,
                    makeVariableIdentifier("entries"),
                    makeBinaryExpression(
                      "+",
                      makeVariableIdentifier("index"),
                      makeSimpleLiteral(1),
                    ),
                  ),
                ),
              ),
              makeExpressionStatement(
                makeCallExpression(
                  makeReadDependencyExpression("Reflect_defineProperty"),
                  [
                    makeVariableIdentifier("object"),
                    makeMemberExpression(
                      true,
                      makeVariableIdentifier("entries"),
                      makeVariableIdentifier("index"),
                    ),
                    makeVariableIdentifier("descriptor"),
                  ],
                ),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeVariableIdentifier("index"),
                  makeBinaryExpression(
                    "+",
                    makeVariableIdentifier("index"),
                    makeSimpleLiteral(2),
                  ),
                ),
              ),
            ]),
          ),
          makeReturnStatement(makeVariableIdentifier("object")),
        ]),
      });
    }
    case "aran.declareGlobalVariable": {
      return toArrowLayout({
        name,
        dependencies: ["eval"],
        setup: [],
        head: [makeVariableIdentifier("variables")],
        body: makeCallExpression(makeReadDependencyExpression("eval"), [
          makeConcatExpression("+", [
            makeSimpleLiteral("var "),
            makeVariableIdentifier("variables"),
            makeSimpleLiteral(";"),
          ]),
        ]),
      });
    }
    case "aran.readGlobalVariable": {
      return makeAccessLayout(name, (variable) =>
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => "),
          makeVariableIdentifier(variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.typeofGlobalVariable": {
      return makeAccessLayout(name, (variable) =>
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => typeof "),
          makeVariableIdentifier(variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.discardGlobalVariable": {
      return makeAccessLayout(name, (variable) =>
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => delete "),
          makeVariableIdentifier(variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.writeGlobalVariableSloppy": {
      return makeAccessLayout(name, (variable) =>
        makeConcatExpression("+", [
          makeSimpleLiteral("(("),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE) => { "),
            makeSimpleLiteral("VALUE) => { "),
          ),
          makeVariableIdentifier(variable),
          makeSimpleLiteral(" = "),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE; });"),
            makeSimpleLiteral("VALUE; });"),
          ),
        ]),
      );
    }
    case "aran.writeGlobalVariableStrict": {
      return makeAccessLayout(name, (variable) =>
        makeConcatExpression("+", [
          makeSimpleLiteral("'use strict'; (("),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE) => { "),
            makeSimpleLiteral("VALUE) => { "),
          ),
          makeVariableIdentifier(variable),
          makeSimpleLiteral(" = "),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE; });"),
            makeSimpleLiteral("VALUE; });"),
          ),
        ]),
      );
    }
    case "aran.transpileEvalCode": {
      return toArrowLayout({
        name,
        dependencies: ["SyntaxError"],
        setup: [],
        head: [
          makeVariableIdentifier("_code"),
          makeVariableIdentifier("_situ"),
        ],
        body: makeBlockStatement([
          makeThrowStatement(
            makeNewExpression(makeReadDependencyExpression("SyntaxError"), [
              makeSimpleLiteral(
                "aran.transpileEvalCode must be overriden to support direct eval calls",
              ),
            ]),
          ),
        ]),
      });
    }
    case "aran.retropileEvalCode": {
      return toArrowLayout({
        name,
        dependencies: ["SyntaxError"],
        setup: [],
        head: [makeVariableIdentifier("_aran")],
        body: makeBlockStatement([
          makeThrowStatement(
            makeNewExpression(makeReadDependencyExpression("SyntaxError"), [
              makeSimpleLiteral(
                "aran.retropileEvalCode must be overriden to support direct eval calls",
              ),
            ]),
          ),
        ]),
      });
    }
    default: {
      throw new AranTypeError(name);
    }
  }
};
