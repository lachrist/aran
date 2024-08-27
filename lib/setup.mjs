import { BINARY_OPERATOR_ENUM, UNARY_OPERATOR_ENUM } from "./estree.mjs";
import { INTRINSIC_RECORD, isAranIntrinsic } from "./lang.mjs";
import { map, reduce } from "./util/index.mjs";
import { AranTypeError } from "./error.mjs";

const {
  Reflect: { apply, ownKeys: listKey },
  String: {
    prototype: { split },
  },
} = globalThis;

const AT = ["@"];

const DOT = ["."];

/**
 * @type {(
 *   variable: string,
 * ) => import("./estree").VariableIdentifier}
 */
const makeVariableIdentifier = (variable) => ({
  type: "Identifier",
  name: /** @type {import("./estree").Variable} */ (variable),
});

/**
 * @type {(
 *   key: string,
 * ) => import("./estree").PublicKeyIdentifier}
 */
const makePublicKeyIdentifier = (key) => ({
  type: "Identifier",
  name: /** @type {import("./estree").PublicKey} */ (key),
});

/**
 * @type {(
 *   key: string,
 * ) => import("./estree").PublicKeyLiteral}
 */
const makePublicKeyLiteral = (key) => ({
  type: "Literal",
  value: /** @type {import("./estree").PublicKey} */ (key),
});

/**
 * @type {(
 *   argument: import("./estree").Pattern,
 * ) => import("./estree").RestElement}
 */
const makeRestElement = (argument) => ({
  type: "RestElement",
  argument,
});

/**
 * @type {<S extends "script" | "module">(
 *   sourceType: S,
 *   body: import("./estree").Statement[],
 * ) => import("./estree").Program & { sourceType: S }}
 */
const makeProgram = (sourceType, body) => ({
  type: "Program",
  sourceType,
  body,
});

/**
 * @type {(
 *   test: import("./estree").Expression,
 *   body: import("./estree").Statement,
 * ) => import("./estree").WhileStatement}
 */
const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});

/**
 * @type {(
 *   test: import("./estree").Expression,
 *   consequent: import("./estree").Statement,
 *   alternate: import("./estree").Statement | null,
 * ) => import("./estree").IfStatement}
 */
const makeIfStatement = (test, consequent, alternate) => ({
  type: "IfStatement",
  test,
  consequent,
  alternate,
});

/**
 * @type {(
 *   test: import("./estree").Expression,
 *   consequent: import("./estree").Expression,
 *   alternate: import("./estree").Expression,
 * ) => import("./estree").Expression}
 */
const makeConditionalExpression = (test, consequent, alternate) => ({
  type: "ConditionalExpression",
  test,
  consequent,
  alternate,
});

/**
 * @type {(
 *   expressions: import("./estree").Expression[],
 * ) => import("./estree").Expression}
 */
const makeSequenceExpression = (expressions) => ({
  type: "SequenceExpression",
  expressions,
});

/**
 * @type {(
 *  left: import("./estree").Pattern | import("./estree").VariableDeclaration,
 *   right: import("./estree").Expression,
 *   body: import("./estree").Statement,
 * ) => import("./estree").ForInStatement}
 */
const makeForInStatement = (left, right, body) => ({
  type: "ForInStatement",
  left,
  right,
  body,
});

/**
 * @type {(
 *   elements: import("./estree").Expression[],
 * ) => import("./estree").ArrayExpression}
 */
const makeArrayExpression = (elements) => ({
  type: "ArrayExpression",
  elements,
});

/**
 * @type {(
 *   expression: import("./estree").Expression,
 * ) => import("./estree").ExpressionStatement}
 */
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  expression,
});

/**
 * @type {(
 *   kind: import("./estree").VariableDeclaration["kind"],
 *   id: import("./estree").Pattern,
 *   init: null | import("./estree").Expression,
 * ) => import("./estree").VariableDeclaration}
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
 *   left: import("./estree").Pattern,
 *   right: import("./estree").Expression,
 * ) => import("./estree").AssignmentExpression}
 */
const makeAssignmentExpression = (left, right) => ({
  type: "AssignmentExpression",
  operator: "=",
  left,
  right,
});

/**
 * @type {(
 *   body: import("./estree").MethodDefinition[],
 * ) => import("./estree").ClassBody}
 */
const makeClassBody = (body) => ({
  type: "ClassBody",
  body,
});

/**
 * @type {(
 *   superClass: import("./estree").Expression | null,
 *   body: import("./estree").ClassBody,
 * ) => import("./estree").ClassExpression}
 */
const makeClassExpression = (superClass, body) => ({
  type: "ClassExpression",
  id: null,
  superClass,
  body,
});

/**
 * @type {(
 *   param: import("./estree").Pattern | null,
 *   body: import("./estree").BlockStatement,
 * ) => import("./estree").CatchClause}
 */
const makeCatchClause = (param, body) => ({
  type: "CatchClause",
  param,
  body,
});

/**
 * @type {(
 *   block: import("./estree").BlockStatement,
 *   handler: import("./estree").CatchClause | null,
 *   finalizer: import("./estree").BlockStatement | null,
 * ) => import("./estree").TryStatement}
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
 *   operator: import("./estree").UpdateOperator,
 *   argument: import("./estree").Expression,
 * ) => import("./estree").UpdateExpression}
 */
const makeUpdateExpression = (prefix, operator, argument) => ({
  type: "UpdateExpression",
  prefix,
  operator,
  argument,
});

/**
 * @type {(
 *   expression: import("./estree").SimpleLiteral & { value: string },
 * ) => import("./estree").Directive}
 */
const makeDirective = (expression) => ({
  type: "ExpressionStatement",
  expression,
  directive: expression.value,
});

/**
 * @type {(
 *   argument: import("./estree").Expression,
 * ) => import("./estree").SpreadElement}
 */
const makeSpreadElement = (argument) => ({
  type: "SpreadElement",
  argument,
});

/**
 * @type {(
 *  argument: import("./estree").Expression,
 * ) => import("./estree").ThrowStatement}
 */
const makeThrowStatement = (argument) => ({
  type: "ThrowStatement",
  argument,
});

/**
 * @type {(
 *   operator: import("./estree").UnaryOperator,
 *   argument: import("./estree").Expression,
 * ) => import("./estree").UnaryExpression}
 */
const makeUnaryExpression = (operator, argument) => ({
  type: "UnaryExpression",
  operator,
  prefix: true,
  argument,
});

/**
 * @type {(
 *   operator: import("./estree").BinaryOperator,
 *   left: import("./estree").Expression,
 *   right: import("./estree").Expression,
 * ) => import("./estree").BinaryExpression}
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
 *   operator: import("./estree").BinaryOperator,
 *   terms: [import("./estree").Expression, ... import("./estree").Expression[]],
 * ) => import("./estree").Expression}
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
 * @type {<X extends null | boolean | number | string>(
 *   value: X,
 * ) => import("./estree").SimpleLiteral & { value: X }}
 */
const makeSimpleLiteral = (value) => ({
  type: "Literal",
  value,
});

/**
 * @type {(
 *  body: import("./estree").Statement[],
 * ) => import("./estree").BlockStatement}
 */
const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
});

/**
 * @type {(
 *  argument: import("./estree").Expression,
 * ) => import("./estree").ReturnStatement}
 */
const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

/**
 * @type {(
 *   test: import("./estree").Expression,
 *   consequent: import("./estree").Statement[],
 * ) => import("./estree").SwitchCase}
 */
const makeSwitchCase = (test, consequent) => ({
  type: "SwitchCase",
  test,
  consequent,
});

/**
 * @type {(
 *   discriminant: import("./estree").Expression,
 *   cases: import("./estree").SwitchCase[],
 * ) => import("./estree").SwitchStatement}
 */
const makeSwitchStatement = (discriminant, cases) => ({
  type: "SwitchStatement",
  discriminant,
  cases,
});

/**
 * @type {(
 *   parameters: import("./estree").Pattern[],
 *   body: import("./estree").BlockStatement | import("./estree").Expression,
 * ) => import("./estree").ArrowFunctionExpression}
 */
const makeArrowFunctionExpression = (params, body) => {
  if (body.type === "BlockStatement") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      params,
      expression: false,
      body,
    };
  } else {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      params,
      expression: true,
      body,
    };
  }
};

/**
 * @type {(
 *   operator: import("./estree").LogicalExpression["operator"],
 *   left: import("./estree").Expression,
 *   right: import("./estree").Expression,
 * ) => import("./estree").Expression}
 */
const makeLogicalExpression = (operator, left, right) => ({
  type: "LogicalExpression",
  operator,
  left,
  right,
});

/**
 * @type {(
 *   properties: import("./estree").PatternProperty[],
 * ) => import("./estree").Pattern}
 */
const makeObjectPattern = (properties) => ({
  type: "ObjectPattern",
  properties,
});

/**
 * @type {(... [computed, key, value]: [
 *   true,
 *   import("./estree").Expression,
 *   import("./estree").Expression,
 * ] | [
 *   false,
 *   (
 *     | import("./estree").PublicKeyIdentifier
 *     | import("./estree").PublicKeyLiteral
 *   ),
 *   import("./estree").Expression,
 * ]) => import("./estree").ObjectProperty}
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
 * @type {(... [computed, key, value]: [
 *   true,
 *   import("./estree").Expression,
 *   import("./estree").Pattern,
 * ] | [
 *   false,
 *   (
 *     | import("./estree").PublicKeyIdentifier
 *     | import("./estree").PublicKeyLiteral
 *   ),
 *   import("./estree").Pattern,
 * ]) => import("./estree").PatternProperty}
 */
const makePatternProperty = (computed, key, value) => {
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
 *     | import("./estree").ObjectProperty
 *     | import("./estree").SpreadElement
 *   )[],
 * ) => import("./estree").ObjectExpression}
 */
const makeObjectExpression = (properties) => ({
  type: "ObjectExpression",
  properties,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   parameters: import("./estree").Pattern[],
 *   body: import("./estree").BlockStatement,
 * ) => import("./estree").FunctionExpression}
 */
const makeFunctionExpression = (asynchronous, generator, parameters, body) => ({
  type: "FunctionExpression",
  async: asynchronous,
  generator,
  params: parameters,
  id: null,
  body,
});

/**
 * @type {(... [computed, object, property]: ([
 *   true,
 *   import("./estree").Expression,
 *   import("./estree").Expression,
 *  ] | [
 *    false,
 *    import("./estree").Expression,
 *    import("./estree").PublicKeyIdentifier
 *  ])
 * ) => import("./estree").MemberExpression}
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
 *   callee: import("./estree").Expression,
 *   arguments_: import("./estree").Expression[],
 * ) => import("./estree").CallExpression}
 */
const makeCallExpression = (callee, arguments_) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   object: import("./estree").Expression,
 *   segments: string[],
 *   global: string,
 * ) => import("./estree").Expression}
 */
const digGlobal = (object, segments, global) =>
  segments.length === 1
    ? makeMemberExpression(false, object, makePublicKeyIdentifier(segments[0]))
    : makeMemberExpression(
        false,
        makeCallExpression(
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeVariableIdentifier(global),
              makePublicKeyIdentifier("Reflect"),
            ),
            makePublicKeyIdentifier("getOwnPropertyDescriptor"),
          ),
          [object, makeSimpleLiteral(segments[0])],
        ),
        makePublicKeyIdentifier(segments[1]),
      );

/**
 * @type {(
 *   instrinsic: Exclude<
 *     import("./lang").Intrinsic,
 *     import("./lang").AranIntrinsic
 *   >,
 *   config: {
 *     global_variable: import("./estree").Variable,
 *   },
 * ) => import("./estree").Expression}
 */
const makeStandardIntrinsicExpression = (intrinsic, { global_variable }) =>
  reduce(
    /** @type {string[]} */ (apply(split, intrinsic, DOT)),
    (object, key) => digGlobal(object, apply(split, key, AT), global_variable),
    /** @type {import("./estree").Expression} */ (
      makeVariableIdentifier(global_variable)
    ),
  );

const ACCESS_GLOBAL_PARAM_RECORD = {
  cache: "cache",
  global_eval: "global_eval",
  variable: "variable",
  additional: "additional",
  optimization: "optimization",
};

/**
 * @type {(
 *   params: {
 *     cache: string,
 *     global_eval: string,
 *     variable: string,
 *     additional: string,
 *     optimization: string,
 *   },
 *   code: import("./estree").Expression,
 * ) => import("./estree").Expression}
 */
const makeAccessGlobalExpression = (params, code) =>
  makeCallExpression(
    makeArrowFunctionExpression(
      [
        makeObjectPattern([
          makePatternProperty(
            false,
            makePublicKeyIdentifier("eval"),
            makeVariableIdentifier(params.global_eval),
          ),
        ]),
        makeVariableIdentifier(params.cache),
      ],
      makeArrowFunctionExpression(
        [
          makeVariableIdentifier(params.variable),
          makeVariableIdentifier(params.additional),
          makeVariableIdentifier(params.optimization),
        ],
        makeConditionalExpression(
          makeVariableIdentifier(params.optimization),
          makeAssignmentExpression(
            makeMemberExpression(
              true,
              makeVariableIdentifier(params.cache),
              makeVariableIdentifier(params.variable),
            ),
            makeVariableIdentifier(params.optimization),
          ),
          makeCallExpression(
            makeLogicalExpression(
              "??",
              makeMemberExpression(
                true,
                makeVariableIdentifier(params.cache),
                makeVariableIdentifier(params.variable),
              ),
              makeAssignmentExpression(
                makeMemberExpression(
                  true,
                  makeVariableIdentifier(params.cache),
                  makeVariableIdentifier(params.variable),
                ),
                makeCallExpression(makeVariableIdentifier(params.global_eval), [
                  code,
                ]),
              ),
            ),
            [makeVariableIdentifier(params.additional)],
          ),
        ),
      ),
    ),
    [
      makeVariableIdentifier("globalThis"),
      makeObjectExpression([
        makeProperty(
          false,
          makePublicKeyIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]),
    ],
  );

/**
 * @type {(
 *   intrinsic: import("./lang").AranIntrinsic,
 *   config: {
 *     global_variable: import("./estree").Variable,
 *   },
 * ) => import("./estree").Expression}
 */
const makeAranIntrinsicExpression = (intrinsic, { global_variable }) => {
  switch (intrinsic) {
    case "aran.global": {
      return makeVariableIdentifier(global_variable);
    }
    case "aran.record": {
      return makeObjectExpression([
        makeProperty(
          false,
          makePublicKeyIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.deadzone": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeVariableIdentifier(global_variable),
          makePublicKeyIdentifier("Symbol"),
        ),
        [makeSimpleLiteral("deadzone")],
      );
    }
    case "aran.throw": {
      return makeArrowFunctionExpression(
        [makeVariableIdentifier("error")],
        makeBlockStatement([
          makeThrowStatement(makeVariableIdentifier("error")),
        ]),
      );
    }
    case "aran.AsyncGeneratorFunction.prototype.prototype": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeMemberExpression(
            false,
            makeVariableIdentifier(global_variable),
            makePublicKeyIdentifier("Reflect"),
          ),
          makePublicKeyIdentifier("getPrototypeOf"),
        ),
        [
          makeMemberExpression(
            false,
            makeFunctionExpression(true, true, [], makeBlockStatement([])),
            makePublicKeyIdentifier("prototype"),
          ),
        ],
      );
    }
    case "aran.GeneratorFunction.prototype.prototype": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeMemberExpression(
            false,
            makeVariableIdentifier(global_variable),
            makePublicKeyIdentifier("Reflect"),
          ),
          makePublicKeyIdentifier("getPrototypeOf"),
        ),
        [
          makeMemberExpression(
            false,
            makeFunctionExpression(false, true, [], makeBlockStatement([])),
            makePublicKeyIdentifier("prototype"),
          ),
        ],
      );
    }
    case "aran.get": {
      return makeArrowFunctionExpression(
        [makeVariableIdentifier("object"), makeVariableIdentifier("key")],
        makeMemberExpression(
          true,
          makeVariableIdentifier("object"),
          makeVariableIdentifier("key"),
        ),
      );
    }
    case "aran.unary": {
      return makeArrowFunctionExpression(
        [
          makeVariableIdentifier("operator"),
          makeVariableIdentifier("argument"),
        ],
        makeBlockStatement([
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
      );
    }
    case "aran.binary": {
      return makeArrowFunctionExpression(
        [
          makeVariableIdentifier("operator"),
          makeVariableIdentifier("left"),
          makeVariableIdentifier("right"),
        ],
        makeBlockStatement([
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
      );
    }
    case "aran.isConstructor": {
      return makeArrowFunctionExpression(
        [makeVariableIdentifier("value")],
        makeBlockStatement([
          makeTryStatement(
            makeBlockStatement([
              makeExpressionStatement(
                makeClassExpression(
                  makeVariableIdentifier("value"),
                  makeClassBody([]),
                ),
              ),
              makeReturnStatement(
                makeBinaryExpression(
                  "!==",
                  makeVariableIdentifier("value"),
                  makeSimpleLiteral(null),
                ),
              ),
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
      );
    }
    case "aran.sliceObject": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Object"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("hasOwn"),
                    makeVariableIdentifier("hasOwn"),
                  ),
                ]),
              ),
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Reflect"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("getOwnPropertyDescriptor"),
                    makeVariableIdentifier("getOwnPropertyDescriptor"),
                  ),
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("defineProperty"),
                    makeVariableIdentifier("defineProperty"),
                  ),
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("ownKeys"),
                    makeVariableIdentifier("ownKeys"),
                  ),
                ]),
              ),
            ]),
            makeVariableIdentifier("descriptor"),
          ],
          makeArrowFunctionExpression(
            [
              makeVariableIdentifier("object"),
              makeVariableIdentifier("exclusion"),
            ],
            makeBlockStatement([
              makeVariableDeclaration(
                "const",
                makeVariableIdentifier("keys"),
                makeCallExpression(makeVariableIdentifier("ownKeys"), [
                  makeVariableIdentifier("object"),
                ]),
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
                        makeCallExpression(makeVariableIdentifier("hasOwn"), [
                          makeVariableIdentifier("exclusion"),
                          makeVariableIdentifier("key"),
                        ]),
                      ),
                      makeMemberExpression(
                        false,
                        makeLogicalExpression(
                          "??",
                          makeCallExpression(
                            makeVariableIdentifier("getOwnPropertyDescriptor"),
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
                          makeVariableIdentifier("defineProperty"),
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
              // Prevent memory leak
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeMemberExpression(
                    false,
                    makeVariableIdentifier("descriptor"),
                    makePublicKeyIdentifier("value"),
                  ),
                  makeSimpleLiteral(null),
                ),
              ),
              makeReturnStatement(makeVariableIdentifier("copy")),
            ]),
          ),
        ),
        [
          makeVariableIdentifier("globalThis"),
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
        ],
      );
    }
    case "aran.toArgumentList": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [
            makeVariableIdentifier("descriptor"),
            makeVariableIdentifier("default_callee_descriptor"),
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Reflect"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("defineProperty"),
                    makeVariableIdentifier("defineProperty"),
                  ),
                ]),
              ),
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Array"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("prototype"),
                    makeObjectPattern([
                      makePatternProperty(
                        false,
                        makePublicKeyIdentifier("values"),
                        makeVariableIdentifier("values"),
                      ),
                    ]),
                  ),
                ]),
              ),
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Symbol"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("iterator"),
                    makeVariableIdentifier("iterator"),
                  ),
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("toStringTag"),
                    makeVariableIdentifier("toStringTag"),
                  ),
                ]),
              ),
            ]),
          ],
          makeArrowFunctionExpression(
            [makeVariableIdentifier("array"), makeVariableIdentifier("callee")],
            makeBlockStatement([
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
                      makeVariableIdentifier("defineProperty"),
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
                makeCallExpression(makeVariableIdentifier("defineProperty"), [
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
                ]),
              ),
              makeExpressionStatement(
                makeCallExpression(makeVariableIdentifier("defineProperty"), [
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
                ]),
              ),
              makeExpressionStatement(
                makeCallExpression(makeVariableIdentifier("defineProperty"), [
                  makeVariableIdentifier("list"),
                  makeVariableIdentifier("iterator"),
                  makeSequenceExpression([
                    makeAssignmentExpression(
                      makeMemberExpression(
                        false,
                        makeVariableIdentifier("descriptor"),
                        makePublicKeyIdentifier("value"),
                      ),
                      makeVariableIdentifier("values"),
                    ),
                    makeVariableIdentifier("descriptor"),
                  ]),
                ]),
              ),
              makeExpressionStatement(
                makeCallExpression(makeVariableIdentifier("defineProperty"), [
                  makeVariableIdentifier("list"),
                  makeVariableIdentifier("toStringTag"),
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
                ]),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeMemberExpression(
                    false,
                    makeVariableIdentifier("descriptor"),
                    makePublicKeyIdentifier("enumerable"),
                  ),
                  makeSimpleLiteral(true),
                ),
              ),
              makeReturnStatement(makeVariableIdentifier("list")),
            ]),
          ),
        ),
        [
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
          makeObjectExpression([
            makeProperty(
              false,
              makePublicKeyIdentifier("__proto__"),
              makeSimpleLiteral(null),
            ),
            makeSpreadElement(
              makeCallExpression(
                makeMemberExpression(
                  false,
                  makeMemberExpression(
                    false,
                    makeVariableIdentifier(global_variable),
                    makePublicKeyIdentifier("Reflect"),
                  ),
                  makePublicKeyIdentifier("getOwnPropertyDescriptor"),
                ),
                [
                  makeMemberExpression(
                    false,
                    makeMemberExpression(
                      false,
                      makeVariableIdentifier(global_variable),
                      makePublicKeyIdentifier("Function"),
                    ),
                    makePublicKeyIdentifier("prototype"),
                  ),
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
          makeVariableIdentifier("globalThis"),
        ],
      );
    }
    case "aran.listForInKey": {
      return makeArrowFunctionExpression(
        [makeVariableIdentifier("target")],
        makeBlockStatement([
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
      );
    }
    case "aran.listRest": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeVariableIdentifier("apply")],
          makeArrowFunctionExpression(
            [
              makeVariableIdentifier("iterator"),
              makeVariableIdentifier("next"),
            ],
            makeBlockStatement([
              makeVariableDeclaration(
                "const",
                makeVariableIdentifier("rest"),
                makeArrayExpression([]),
              ),
              makeVariableDeclaration(
                "let",
                makeVariableIdentifier("step"),
                makeCallExpression(makeVariableIdentifier("apply"), [
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
                      makeCallExpression(makeVariableIdentifier("apply"), [
                        makeVariableIdentifier("next"),
                        makeVariableIdentifier("iterator"),
                        makeArrayExpression([]),
                      ]),
                    ),
                  ),
                ]),
              ),
              makeReturnStatement(makeVariableIdentifier("rest")),
            ]),
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeVariableIdentifier(global_variable),
              makePublicKeyIdentifier("Reflect"),
            ),
            makePublicKeyIdentifier("apply"),
          ),
        ],
      );
    }
    case "aran.toPropertyKey": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeVariableIdentifier("listKey")],
          makeArrowFunctionExpression(
            [makeVariableIdentifier("key")],
            makeMemberExpression(
              true,
              makeCallExpression(makeVariableIdentifier("listKey"), [
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
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeVariableIdentifier(global_variable),
              makePublicKeyIdentifier("Reflect"),
            ),
            makePublicKeyIdentifier("ownKeys"),
          ),
        ],
      );
    }
    case "aran.createObject": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeVariableIdentifier("defineProperty")],
          makeArrowFunctionExpression(
            [
              makeVariableIdentifier("prototype"),
              makeRestElement(makeVariableIdentifier("entries")),
            ],
            makeBlockStatement([
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
                      makeVariableIdentifier("defineProperty"),
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
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeVariableIdentifier(global_variable),
              makePublicKeyIdentifier("Reflect"),
            ),
            makePublicKeyIdentifier("defineProperty"),
          ),
        ],
      );
    }
    case "aran.declareGlobal": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("eval"),
                makeVariableIdentifier("global_eval"),
              ),
            ]),
          ],
          makeArrowFunctionExpression(
            [makeVariableIdentifier("variables")],
            makeCallExpression(makeVariableIdentifier("global_eval"), [
              makeConcatExpression("+", [
                makeSimpleLiteral("var "),
                makeVariableIdentifier("variables"),
                makeSimpleLiteral(";"),
              ]),
            ]),
          ),
        ),
        [makeVariableIdentifier("globalThis")],
      );
    }
    case "aran.readGlobal": {
      return makeAccessGlobalExpression(
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.typeofGlobal": {
      return makeAccessGlobalExpression(
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => typeof "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.discardGlobal": {
      return makeAccessGlobalExpression(
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => delete "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.writeGlobalSloppy": {
      return makeAccessGlobalExpression(
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(("),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE) => { "),
            makeSimpleLiteral("VALUE) => { "),
          ),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(" = "),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE; });"),
            makeSimpleLiteral("VALUE; });"),
          ),
        ]),
      );
    }
    case "aran.writeGlobalStrict": {
      return makeAccessGlobalExpression(
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("'use strict'; (("),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE) => { "),
            makeSimpleLiteral("VALUE) => { "),
          ),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(" = "),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
              makeSimpleLiteral("VALUE"),
            ),
            makeSimpleLiteral("$VALUE; });"),
            makeSimpleLiteral("VALUE; });"),
          ),
        ]),
      );
    }
    default: {
      throw new AranTypeError(intrinsic);
    }
  }
};

/**
 * @type {(
 *   intrinsic: import("./lang").Intrinsic,
 *   config: {
 *     global_variable: import("./estree").Variable,
 *   },
 * ) => import("./estree").Expression}
 */
const makeIntrinsicExpression = (intrinsic, config) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, config)
    : makeStandardIntrinsicExpression(intrinsic, config);

/**
 * @type {(
 *   intrinsic: import("./lang").Intrinsic,
 *   config: {
 *     global_variable: import("./estree").Variable,
 *   },
 * ) => import("./estree").ObjectProperty}
 */
const makeIntrinsicProperty = (intrinsic, config) =>
  makeProperty(
    false,
    makePublicKeyLiteral(intrinsic),
    makeIntrinsicExpression(intrinsic, config),
  );

/**
 * @type {(
 *   config: {
 *     global_variable: import("./estree").Variable,
 *  },
 * ) => import("./estree").Expression}
 */
export const generateIntrinsicRecord = (config) =>
  makeObjectExpression([
    makeProperty(
      false,
      makePublicKeyIdentifier("__proto__"),
      makeSimpleLiteral(null),
    ),
    ...map(
      /** @type {import("./lang").Intrinsic[]} */ (listKey(INTRINSIC_RECORD)),
      (intrinsic) => makeIntrinsicProperty(intrinsic, config),
    ),
  ]);

/**
 * @type {(
 *   config: {
 *     global_variable: import("./estree").Variable,
 *     intrinsic_variable: import("./estree").Variable,
 *  },
 * ) => import("./estree").Program & { sourceType: "script" }}
 */
export const generateSetup = ({ global_variable, intrinsic_variable }) =>
  makeProgram("script", [
    makeDirective(makeSimpleLiteral("use strict")),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeVariableIdentifier(global_variable),
          makePublicKeyIdentifier(intrinsic_variable),
        ),
        generateIntrinsicRecord({ global_variable }),
      ),
    ),
  ]);
