import { BINARY_OPERATOR_ENUM, UNARY_OPERATOR_ENUM } from "./estree.mjs";
import { INTRINSIC_ENUM, isAranIntrinsic } from "./lang.mjs";
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
 * ) => estree.Identifier}
 */
const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
});

/**
 * @type {<S extends "script" | "module">(
 *   sourceType: S,
 *   body: estree.Statement[],
 * ) => estree.Program & { sourceType: S }}
 */
const makeProgram = (sourceType, body) => ({
  type: "Program",
  sourceType,
  body,
});

/**
 * @type {(
 *   id: estree.Pattern,
 *   init: estree.Expression | null,
 * ) => estree.VariableDeclarator}
 */
const makeVariableDeclarator = (id, init) => ({
  type: "VariableDeclarator",
  id,
  init,
});

/**
 * @type {(
 *   test: estree.Expression,
 *   body: estree.Statement,
 * ) => estree.WhileStatement}
 */
const makeWhileStatement = (test, body) => ({
  type: "WhileStatement",
  test,
  body,
});

/**
 * @type {(
 *  left: estree.Pattern | estree.VariableDeclaration,
 *   right: estree.Expression,
 *   body: estree.Statement,
 * ) => estree.ForInStatement}
 */
const makeForInStatement = (left, right, body) => ({
  type: "ForInStatement",
  left,
  right,
  body,
});

/**
 * @type {(
 *   elements: estree.Expression[],
 * ) => estree.ArrayExpression}
 */
const makeArrayExpression = (elements) => ({
  type: "ArrayExpression",
  elements,
});

/**
 * @type {(
 *   expression: estree.Expression,
 * ) => estree.ExpressionStatement}
 */
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  expression,
});

/**
 * @type {(
 *   kind: estree.VariableDeclaration["kind"],
 *   declarations: estree.VariableDeclarator[],
 * ) => estree.VariableDeclaration}
 */
const makeVariableDeclaration = (kind, declarations) => ({
  type: "VariableDeclaration",
  kind,
  declarations,
});

/**
 * @type {(
 *   left: estree.Pattern,
 *   right: estree.Expression,
 * ) => estree.AssignmentExpression}
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
 *   operator: estree.UpdateOperator,
 *   argument: estree.Expression,
 * ) => estree.UpdateExpression}
 */
const makeUpdateExpression = (prefix, operator, argument) => ({
  type: "UpdateExpression",
  prefix,
  operator,
  argument,
});

/**
 * @type {(
 *   expression: estree.SimpleLiteral & { value: string },
 * ) => estree.Directive}
 */
const makeDirective = (expression) => ({
  type: "ExpressionStatement",
  expression,
  directive: expression.value,
});

/**
 * @type {(
 *  argument: estree.Expression,
 * ) => estree.ThrowStatement}
 */
const makeThrowStatement = (argument) => ({
  type: "ThrowStatement",
  argument,
});

/**
 * @type {(
 *   operator: estree.UnaryOperator,
 *   argument: estree.Expression,
 * ) => estree.UnaryExpression}
 */
const makeUnaryExpression = (operator, argument) => ({
  type: "UnaryExpression",
  operator,
  prefix: true,
  argument,
});

/**
 * @type {(
 *   operator: estree.BinaryOperator,
 *   left: estree.Expression,
 *   right: estree.Expression,
 * ) => estree.BinaryExpression}
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
 * ) => estree.SimpleLiteral & { value: X }}
 */
const makeSimpleLiteral = (value) => ({
  type: "Literal",
  value,
});

/**
 * @type {(
 *  body: estree.Statement[],
 * ) => estree.BlockStatement}
 */
const makeBlockStatement = (body) => ({
  type: "BlockStatement",
  body,
});

/**
 * @type {(
 *  argument: estree.Expression,
 * ) => estree.ReturnStatement}
 */
const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

/**
 * @type {(
 *   test: estree.Expression,
 *   consequent: estree.Statement[],
 * ) => estree.SwitchCase}
 */
const makeSwitchCase = (test, consequent) => ({
  type: "SwitchCase",
  test,
  consequent,
});

/**
 * @type {(
 *   discriminant: estree.Expression,
 *   cases: estree.SwitchCase[],
 * ) => estree.SwitchStatement}
 */
const makeSwitchStatement = (discriminant, cases) => ({
  type: "SwitchStatement",
  discriminant,
  cases,
});

/**
 * @type {(
 *   parameters: estree.Pattern[],
 *   body: estree.BlockStatement | estree.Expression,
 * ) => estree.ArrowFunctionExpression}
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
 *   estree.Expression,
 *   estree.Expression,
 * ] | [
 *   false,
 *   estree.Identifier | estree.SimpleLiteral & { value: string },
 *   estree.Expression,
 * ]) => estree.Property}
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
 *   properties: (estree.Property | estree.SpreadElement)[],
 * ) => estree.ObjectExpression}
 */
const makeObjectExpression = (properties) => ({
  type: "ObjectExpression",
  properties,
});

/**
 * @type {(
 *   asynchronous: boolean,
 *   generator: boolean,
 *   parameters: estree.Pattern[],
 *   body: estree.BlockStatement,
 * ) => estree.FunctionExpression}
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
 *   estree.Expression,
 *   estree.Expression,
 *  ] | [
 *    false,
 *    estree.Expression,
 *    estree.Identifier,
 *  ])
 * ) => estree.MemberExpression}
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
 *   callee: estree.Expression,
 *   arguments_: estree.Expression[],
 * ) => estree.CallExpression}
 */
const makeCallExpression = (callee, arguments_) => ({
  type: "CallExpression",
  optional: false,
  callee,
  arguments: arguments_,
});

/**
 * @type {(
 *   object: estree.Expression,
 *   segments: string[],
 *   global: string,
 * ) => estree.Expression}
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
 *   instrinsic: Exclude<aran.Intrinsic, aran.AranIntrinsic>,
 *   config: {
 *     global: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
const makeStandardIntrinsicExpression = (intrinsic, { global }) =>
  reduce(
    /** @type {string[]} */ (apply(split, intrinsic, DOT)),
    (object, key) => digGlobal(object, apply(split, key, AT), global),
    /** @type {estree.Expression} */ (makeIdentifier(global)),
  );

/**
 * @type {(
 *   intrinsic: aran.AranIntrinsic,
 *   config: {
 *     global: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
const makeAranIntrinsicExpression = (intrinsic, { global }) => {
  switch (intrinsic) {
    case "aran.global": {
      return makeIdentifier(global);
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
    case "aran.templates": {
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
          makeIdentifier(global),
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
            makeIdentifier(global),
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
            makeIdentifier(global),
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
          makeVariableDeclaration("const", [
            makeVariableDeclarator(
              makeIdentifier("keys"),
              makeArrayExpression([]),
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
                makeVariableDeclarator(
                  makeIdentifier("step"),
                  makeCallExpression(makeIdentifier("apply"), [
                    makeIdentifier("next"),
                    makeIdentifier("iterator"),
                    makeArrayExpression([]),
                  ]),
                ),
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
                    makeIdentifier("iterator"),
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
            ]),
          ),
        ),
        [
          makeMemberExpression(
            false,
            makeMemberExpression(
              false,
              makeIdentifier(global),
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
              makeIdentifier(global),
              makeIdentifier("Reflect"),
            ),
            makeIdentifier("ownKeys"),
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
 *   intrinsic: aran.Intrinsic,
 *   config: {
 *     global: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
const makeIntrinsicExpression = (intrinsic, config) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, config)
    : makeStandardIntrinsicExpression(intrinsic, config);

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   config: {
 *     global: estree.Variable,
 *   },
 * ) => estree.Property}
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
 *     global: estree.Variable,
 *  },
 * ) => estree.Expression}
 */
export const generateIntrinsicRecord = (config) =>
  makeObjectExpression([
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
    ...map(
      /** @type {aran.Intrinsic[]} */ (listKey(INTRINSIC_ENUM)),
      (intrinsic) => makeIntrinsicProperty(intrinsic, config),
    ),
  ]);

/**
 * @type {(
 *   config: {
 *     global: estree.Variable,
 *     intrinsic: estree.Variable,
 *  },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const generateSetup = ({ global, intrinsic }) =>
  makeProgram("script", [
    makeDirective(makeSimpleLiteral("use strict")),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global),
          makeIdentifier(intrinsic),
        ),
        generateIntrinsicRecord({ global }),
      ),
    ),
  ]);
