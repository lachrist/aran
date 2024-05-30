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
 *   name: string,
 * ) => import("./estree").Identifier}
 */
const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
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
 *   id: import("./estree").Pattern,
 *   init: import("./estree").Expression | null,
 * ) => import("./estree").VariableDeclarator}
 */
const makeVariableDeclarator = (id, init) => ({
  type: "VariableDeclarator",
  id,
  init,
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
 *   declarations: import("./estree").VariableDeclarator[],
 * ) => import("./estree").VariableDeclaration}
 */
const makeVariableDeclaration = (kind, declarations) => ({
  type: "VariableDeclaration",
  kind,
  declarations,
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
const makeArrowFunctionExpression = (params, body) => ({
  type: "ArrowFunctionExpression",
  async: false,
  params,
  expression: body.type !== "BlockStatement",
  body,
});

/**
 * @type {(... [computed, key, value]: [
 *   true,
 *   import("./estree").Expression,
 *   import("./estree").Expression,
 * ] | [
 *   false,
 *   import("./estree").Identifier | import("./estree").SimpleLiteral & { value: string },
 *   import("./estree").Expression,
 * ]) => import("./estree").Property}
 */
const makeProperty = (computed, key, value) => ({
  type: "Property",
  kind: "init",
  method: false,
  computed,
  shorthand: false,
  key,
  value,
});

/**
 * @type {(
 *   properties: (import("./estree").Property | import("./estree").SpreadElement)[],
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
 *    import("./estree").Identifier,
 *  ])
 * ) => import("./estree").MemberExpression}
 */
const makeMemberExpression = (computed, object, property) => ({
  type: "MemberExpression",
  computed,
  optional: false,
  object,
  property,
});

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
    ? makeMemberExpression(false, object, makeIdentifier(segments[0]))
    : makeMemberExpression(
        false,
        makeCallExpression(
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeIdentifier(global),
              makeIdentifier("Reflect"),
            ),
            makeIdentifier("getOwnPropertyDescriptor"),
          ),
          [object, makeSimpleLiteral(segments[0])],
        ),
        makeIdentifier(segments[1]),
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
      makeIdentifier(global_variable)
    ),
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
      return makeIdentifier(global_variable);
    }
    case "aran.record": {
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.deadzone": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global_variable),
          makeIdentifier("Symbol"),
        ),
        [makeSimpleLiteral("deadzone")],
      );
    }
    case "aran.throw": {
      return makeArrowFunctionExpression(
        [makeIdentifier("error")],
        makeBlockStatement([makeThrowStatement(makeIdentifier("error"))]),
      );
    }
    case "aran.AsyncGeneratorFunction.prototype.prototype": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeMemberExpression(
            false,
            makeIdentifier(global_variable),
            makeIdentifier("Reflect"),
          ),
          makeIdentifier("getPrototypeOf"),
        ),
        [
          makeMemberExpression(
            false,
            makeFunctionExpression(true, true, [], makeBlockStatement([])),
            makeIdentifier("prototype"),
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
            makeIdentifier(global_variable),
            makeIdentifier("Reflect"),
          ),
          makeIdentifier("getPrototypeOf"),
        ),
        [
          makeMemberExpression(
            false,
            makeFunctionExpression(false, true, [], makeBlockStatement([])),
            makeIdentifier("prototype"),
          ),
        ],
      );
    }
    case "aran.get": {
      return makeArrowFunctionExpression(
        [makeIdentifier("object"), makeIdentifier("key")],
        makeMemberExpression(
          true,
          makeIdentifier("object"),
          makeIdentifier("key"),
        ),
      );
    }
    case "aran.unary": {
      return makeArrowFunctionExpression(
        [makeIdentifier("operator"), makeIdentifier("argument")],
        makeBlockStatement([
          makeSwitchStatement(
            makeIdentifier("operator"),
            map(UNARY_OPERATOR_ENUM, (operator) =>
              makeSwitchCase(makeSimpleLiteral(operator), [
                makeReturnStatement(
                  operator === "delete"
                    ? makeSimpleLiteral(true)
                    : makeUnaryExpression(operator, makeIdentifier("argument")),
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
          makeIdentifier("operator"),
          makeIdentifier("left"),
          makeIdentifier("right"),
        ],
        makeBlockStatement([
          makeSwitchStatement(
            makeIdentifier("operator"),
            map(BINARY_OPERATOR_ENUM, (operator) =>
              makeSwitchCase(makeSimpleLiteral(operator), [
                makeReturnStatement(
                  makeBinaryExpression(
                    operator,
                    makeIdentifier("left"),
                    makeIdentifier("right"),
                  ),
                ),
              ]),
            ),
          ),
        ]),
      );
    }
    case "aran.listForInKey": {
      return makeArrowFunctionExpression(
        [makeIdentifier("target")],
        makeBlockStatement([
          makeVariableDeclaration("let", [
            makeVariableDeclarator(
              makeIdentifier("length"),
              makeSimpleLiteral(0),
            ),
          ]),
          // Use {__proto__: null} instead of [] to avoid the prototype chain
          makeVariableDeclaration("const", [
            makeVariableDeclarator(
              makeIdentifier("keys"),
              makeObjectExpression([
                makeProperty(
                  false,
                  makeIdentifier("__proto__"),
                  makeSimpleLiteral(null),
                ),
              ]),
            ),
          ]),
          makeForInStatement(
            makeVariableDeclaration("const", [
              makeVariableDeclarator(makeIdentifier("key"), null),
            ]),
            makeIdentifier("target"),
            makeExpressionStatement(
              makeAssignmentExpression(
                makeMemberExpression(
                  true,
                  makeIdentifier("keys"),
                  makeUpdateExpression(false, "++", makeIdentifier("length")),
                ),
                makeIdentifier("key"),
              ),
            ),
          ),
          makeExpressionStatement(
            makeAssignmentExpression(
              makeMemberExpression(
                false,
                makeIdentifier("keys"),
                makeIdentifier("length"),
              ),
              makeIdentifier("length"),
            ),
          ),
          makeReturnStatement(makeIdentifier("keys")),
        ]),
      );
    }
    case "aran.listRest": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeIdentifier("apply")],
          makeArrowFunctionExpression(
            [makeIdentifier("iterator"), makeIdentifier("next")],
            makeBlockStatement([
              makeVariableDeclaration("const", [
                makeVariableDeclarator(
                  makeIdentifier("rest"),
                  makeArrayExpression([]),
                ),
              ]),
              makeVariableDeclaration("let", [
                makeVariableDeclarator(
                  makeIdentifier("step"),
                  makeCallExpression(makeIdentifier("apply"), [
                    makeIdentifier("next"),
                    makeIdentifier("iterator"),
                    makeArrayExpression([]),
                  ]),
                ),
              ]),
              makeVariableDeclaration("let", [
                makeVariableDeclarator(
                  makeIdentifier("index"),
                  makeSimpleLiteral(0),
                ),
              ]),
              makeWhileStatement(
                makeUnaryExpression(
                  "!",
                  makeMemberExpression(
                    false,
                    makeIdentifier("step"),
                    makeIdentifier("done"),
                  ),
                ),
                makeBlockStatement([
                  makeExpressionStatement(
                    makeAssignmentExpression(
                      makeMemberExpression(
                        true,
                        makeIdentifier("rest"),
                        makeIdentifier("index"),
                      ),
                      makeMemberExpression(
                        false,
                        makeIdentifier("step"),
                        makeIdentifier("value"),
                      ),
                    ),
                  ),
                  makeExpressionStatement(
                    makeAssignmentExpression(
                      makeIdentifier("index"),
                      makeBinaryExpression(
                        "+",
                        makeIdentifier("index"),
                        makeSimpleLiteral(1),
                      ),
                    ),
                  ),
                  makeExpressionStatement(
                    makeAssignmentExpression(
                      makeIdentifier("step"),
                      makeCallExpression(makeIdentifier("apply"), [
                        makeIdentifier("next"),
                        makeIdentifier("iterator"),
                        makeArrayExpression([]),
                      ]),
                    ),
                  ),
                ]),
              ),
              makeReturnStatement(makeIdentifier("rest")),
            ]),
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeIdentifier(global_variable),
              makeIdentifier("Reflect"),
            ),
            makeIdentifier("apply"),
          ),
        ],
      );
    }
    case "aran.toPropertyKey": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeIdentifier("listKey")],
          makeArrowFunctionExpression(
            [makeIdentifier("key")],
            makeMemberExpression(
              true,
              makeCallExpression(makeIdentifier("listKey"), [
                makeObjectExpression([
                  makeProperty(
                    false,
                    makeIdentifier("__proto__"),
                    makeSimpleLiteral(null),
                  ),
                  makeProperty(
                    true,
                    makeIdentifier("key"),
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
              makeIdentifier(global_variable),
              makeIdentifier("Reflect"),
            ),
            makeIdentifier("ownKeys"),
          ),
        ],
      );
    }
    case "aran.createObject": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          [makeIdentifier("defineProperty")],
          makeArrowFunctionExpression(
            [
              makeIdentifier("prototype"),
              makeRestElement(makeIdentifier("entries")),
            ],
            makeBlockStatement([
              makeVariableDeclaration("const", [
                makeVariableDeclarator(
                  makeIdentifier("descriptor"),
                  makeObjectExpression([
                    makeProperty(
                      false,
                      makeIdentifier("__proto__"),
                      makeSimpleLiteral(null),
                    ),
                    makeProperty(
                      false,
                      makeSimpleLiteral("value"),
                      makeSimpleLiteral(null),
                    ),
                    makeProperty(
                      false,
                      makeSimpleLiteral("writable"),
                      makeSimpleLiteral(true),
                    ),
                    makeProperty(
                      false,
                      makeSimpleLiteral("enumerable"),
                      makeSimpleLiteral(true),
                    ),
                    makeProperty(
                      false,
                      makeSimpleLiteral("configurable"),
                      makeSimpleLiteral(true),
                    ),
                  ]),
                ),
                makeVariableDeclarator(
                  makeIdentifier("object"),
                  makeObjectExpression([
                    makeProperty(
                      false,
                      makeIdentifier("__proto__"),
                      makeIdentifier("prototype"),
                    ),
                  ]),
                ),
                makeVariableDeclarator(
                  makeIdentifier("length"),
                  makeMemberExpression(
                    false,
                    makeIdentifier("entries"),
                    makeIdentifier("length"),
                  ),
                ),
              ]),
              makeVariableDeclaration("let", [
                makeVariableDeclarator(
                  makeIdentifier("index"),
                  makeSimpleLiteral(0),
                ),
              ]),
              makeWhileStatement(
                makeBinaryExpression(
                  "<",
                  makeIdentifier("index"),
                  makeIdentifier("length"),
                ),
                makeBlockStatement([
                  makeExpressionStatement(
                    makeAssignmentExpression(
                      makeMemberExpression(
                        false,
                        makeIdentifier("descriptor"),
                        makeIdentifier("value"),
                      ),
                      makeMemberExpression(
                        true,
                        makeIdentifier("entries"),
                        makeBinaryExpression(
                          "+",
                          makeIdentifier("index"),
                          makeSimpleLiteral(1),
                        ),
                      ),
                    ),
                  ),
                  makeExpressionStatement(
                    makeCallExpression(makeIdentifier("defineProperty"), [
                      makeIdentifier("object"),
                      makeMemberExpression(
                        true,
                        makeIdentifier("entries"),
                        makeIdentifier("index"),
                      ),
                      makeIdentifier("descriptor"),
                    ]),
                  ),
                  makeExpressionStatement(
                    makeAssignmentExpression(
                      makeIdentifier("index"),
                      makeBinaryExpression(
                        "+",
                        makeIdentifier("index"),
                        makeSimpleLiteral(2),
                      ),
                    ),
                  ),
                ]),
              ),
              makeReturnStatement(makeIdentifier("object")),
            ]),
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeIdentifier(global_variable),
              makeIdentifier("Reflect"),
            ),
            makeIdentifier("defineProperty"),
          ),
        ],
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
 * ) => import("./estree").Property}
 */
const makeIntrinsicProperty = (intrinsic, config) =>
  makeProperty(
    false,
    makeSimpleLiteral(intrinsic),
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
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
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
          makeIdentifier(global_variable),
          makeIdentifier(intrinsic_variable),
        ),
        generateIntrinsicRecord({ global_variable }),
      ),
    ),
  ]);
