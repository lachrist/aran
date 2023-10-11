import { BINARY_OPERATOR_ENUM, UNARY_OPERATOR_ENUM } from "./estree.mjs";
import { INTRINSIC_ENUM, isAranIntrinsic } from "./lang.mjs";
import { StaticError, map, reduce } from "./util/index.mjs";

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
 *   init: estree.Expression,
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
 *   argument: estree.Pattern,
 * ) => estree.RestElement}
 */
const makeRestElement = (argument) => ({
  type: "RestElement",
  argument,
});

/**
 * @type {(
 *   argument: estree.Expression,
 * ) => estree.SpreadElement}
 */
const makeSpreadElement = (argument) => ({
  type: "SpreadElement",
  argument,
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
 *   callee: estree.Expression,
 *   arguments_: estree.Expression[],
 * ) => estree.NewExpression}
 */
const makeNewExpression = (callee, arguments_) => ({
  type: "NewExpression",
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
 *   global: string,
 * ) => estree.Expression}
 */
const makeStandardIntrinsicExpression = (intrinsic, global) =>
  reduce(
    /** @type {string[]} */ (apply(split, intrinsic, DOT)),
    (object, key) => digGlobal(object, apply(split, key, AT), global),
    /** @type {estree.Expression} */ (makeIdentifier(global)),
  );

/**
 * @type {(
 *   intrinsic: aran.AranIntrinsic,
 *   global: string,
 * ) => estree.Expression}
 */
const makeAranIntrinsicExpression = (intrinsic, global) => {
  switch (intrinsic) {
    case "aran.cache":
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    case "aran.record.variables":
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    case "aran.record.values":
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    case "aran.deadzone":
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global),
          makeIdentifier("Symbol"),
        ),
        [makeSimpleLiteral("deadzone")],
      );
    case "aran.private":
      return makeNewExpression(
        makeMemberExpression(
          false,
          makeIdentifier("globalThis"),
          makeIdentifier("WeakMap"),
        ),
        [],
      );
    case "aran.hidden.weave":
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    case "aran.hidden.rebuild":
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    case "aran.throw":
      return makeArrowFunctionExpression(
        [makeIdentifier("error")],
        makeBlockStatement([makeThrowStatement(makeIdentifier("error"))]),
      );
    case "aran.get":
      return makeArrowFunctionExpression(
        [makeIdentifier("object"), makeIdentifier("key")],
        makeMemberExpression(
          true,
          makeIdentifier("object"),
          makeIdentifier("key"),
        ),
      );
    case "aran.set":
      return makeArrowFunctionExpression(
        [
          makeIdentifier("object"),
          makeIdentifier("key"),
          makeIdentifier("value"),
        ],
        makeAssignmentExpression(
          makeMemberExpression(
            true,
            makeIdentifier("object"),
            makeIdentifier("key"),
          ),
          makeIdentifier("value"),
        ),
      );
    case "aran.delete":
      return makeArrowFunctionExpression(
        [makeIdentifier("object"), makeIdentifier("key")],
        makeUnaryExpression(
          "delete",
          makeMemberExpression(
            true,
            makeIdentifier("object"),
            makeIdentifier("key"),
          ),
        ),
      );
    case "aran.unary":
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
    case "aran.binary":
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
    case "aran.createObject":
      return makeArrowFunctionExpression(
        [
          makeIdentifier("prototype"),
          makeRestElement(makeIdentifier("properties")),
        ],
        makeBlockStatement([
          makeVariableDeclaration("const", [
            makeVariableDeclarator(
              makeIdentifier("object"),
              makeObjectExpression([
                makeProperty(
                  false,
                  makeIdentifier("__proto__"),
                  makeSimpleLiteral(null),
                ),
              ]),
            ),
          ]),
          makeVariableDeclaration("const", [
            makeVariableDeclarator(
              makeIdentifier("length"),
              makeMemberExpression(
                false,
                makeIdentifier("properties"),
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
            makeExpressionStatement(
              makeAssignmentExpression(
                makeMemberExpression(
                  true,
                  makeIdentifier("object"),
                  makeMemberExpression(
                    true,
                    makeIdentifier("properties"),
                    makeIdentifier("index"),
                  ),
                ),
                makeMemberExpression(
                  true,
                  makeIdentifier("properties"),
                  makeBinaryExpression(
                    "+",
                    makeIdentifier("index"),
                    makeSimpleLiteral(1),
                  ),
                ),
              ),
            ),
          ),
          makeReturnStatement(
            makeObjectExpression([
              makeSpreadElement(makeIdentifier("object")),
              makeProperty(
                false,
                makeIdentifier("__proto__"),
                makeIdentifier("prototype"),
              ),
            ]),
          ),
        ]),
      );
    default:
      throw new StaticError("invalid aran intrinsic", intrinsic);
  }
};

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   global: string,
 * ) => estree.Expression}
 */
const makeIntrinsicExpression = (intrinsic, global) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, global)
    : makeStandardIntrinsicExpression(intrinsic, global);

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   global: string,
 * ) => estree.Property}
 */
const makeIntrinsicProperty = (intrinsic, global) =>
  makeProperty(
    false,
    makeSimpleLiteral(intrinsic),
    makeIntrinsicExpression(intrinsic, global),
  );

/**
 * @type {(global: string) => estree.Expression}
 */
export const generateSetupExpression = (global) =>
  makeObjectExpression([
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
    ...map(
      /** @type {aran.Intrinsic[]} */ (listKey(INTRINSIC_ENUM)),
      (intrinsic) => makeIntrinsicProperty(intrinsic, global),
    ),
  ]);

/**
 * @type {(
 *   intrinsic: estree.Variable,
 *   global: estree.Variable,
 * ) => estree.Program & { sourceType: "script" }}
 */
export const generateSetup = (intrinsic, global) =>
  makeProgram("script", [
    makeDirective(makeSimpleLiteral("use strict")),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global),
          makeIdentifier(intrinsic),
        ),
        generateSetupExpression(global),
      ),
    ),
  ]);
