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
 *   test: estree.Expression,
 *   consequent: estree.Statement,
 *   alternate: estree.Statement | null,
 * ) => estree.IfStatement}
 */
const makeIfStatement = (test, consequent, alternate) => ({
  type: "IfStatement",
  test,
  consequent,
  alternate,
});

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

// /**
//  * @type {(
//  *   expressions: estree.Expression[],
//  * ) => estree.SequenceExpression}
//  */
// const makeSequenceExpression = (expressions) => ({
//   type: "SequenceExpression",
//   expressions,
// });

// /**
//  * @type {(
//  *   test: estree.Expression,
//  *   consequent: estree.Expression,
//  *   alternate: estree.Expression,
//  * ) => estree.ConditionalExpression}
//  */
// const makeConditionalExpression = (test, consequent, alternate) => ({
//   type: "ConditionalExpression",
//   test,
//   consequent,
//   alternate,
// });

// /**
//  * @type {(
//  *   elements: estree.Expression[],
//  * ) => estree.ArrayExpression}
//  */
// const makeArrayExpression = (elements) => ({
//   type: "ArrayExpression",
//   elements,
// });

// /**
//  * @type {(
//  *   variable: string,
//  * ) => estree.Expression}
//  */
// const makeIsNotPrimitiveExpression = (variable) =>
//   makeConditionalExpression(
//     makeBinaryExpression(
//       "===",
//       makeUnaryExpression("typeof", makeIdentifier(variable)),
//       makeSimpleLiteral("object"),
//     ),
//     makeBinaryExpression(
//       "!==",
//       makeIdentifier(variable),
//       makeSimpleLiteral(null),
//     ),
//     makeBinaryExpression(
//       "===",
//       makeUnaryExpression("typeof", makeIdentifier(variable)),
//       makeSimpleLiteral("function"),
//     ),
//   );

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
 *   global: estree.Variable,
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
 *   global: estree.Variable,
 *   namespace: estree.Variable,
 *   intrinsic: aran.Intrinsic,
 * ) => estree.Expression}
 */
const makeReadIntrinsicExpression = (global, namespace, intrinsic) =>
  makeMemberExpression(
    true,
    makeMemberExpression(
      false,
      makeIdentifier(global),
      makeIdentifier(namespace),
    ),
    makeSimpleLiteral(intrinsic),
  );

/**
 * @type {(
 *   intrinsic: aran.AranIntrinsic,
 *   namespace: estree.Variable,
 *   global: estree.Variable,
 * ) => estree.Expression}
 */
const makeAranIntrinsicExpression = (intrinsic, namespace, global) => {
  switch (intrinsic) {
    case "aran.global": {
      return makeIdentifier(global);
    }
    case "aran.cache": {
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.record.variables": {
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.record.values": {
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
    case "aran.hidden.weave": {
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.hidden.rebuild": {
      return makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
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
    case "aran.set.strict": {
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
    }
    case "aran.set.sloppy": {
      return makeArrowFunctionExpression(
        [
          makeIdentifier("object"),
          makeIdentifier("key"),
          makeIdentifier("value"),
        ],
        makeBlockStatement([
          makeIfStatement(
            makeBinaryExpression(
              "==",
              makeIdentifier("object"),
              makeSimpleLiteral(null),
            ),
            makeBlockStatement([
              makeThrowStatement(
                makeNewExpression(
                  makeReadIntrinsicExpression(global, namespace, "TypeError"),
                  [makeSimpleLiteral("Cannot set property of nulllish value")],
                ),
              ),
            ]),
            null,
          ),
          makeExpressionStatement(
            makeCallExpression(
              makeReadIntrinsicExpression(global, namespace, "Reflect.set"),
              [
                makeCallExpression(
                  makeReadIntrinsicExpression(global, namespace, "Object"),
                  [makeIdentifier("object")],
                ),
                makeIdentifier("key"),
                makeIdentifier("value"),
              ],
            ),
          ),
          makeReturnStatement(makeIdentifier("value")),
        ]),
      );
    }
    case "aran.delete.strict": {
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
    }
    case "aran.delete.sloppy": {
      return makeArrowFunctionExpression(
        [makeIdentifier("object"), makeIdentifier("key")],
        makeBlockStatement([
          makeIfStatement(
            makeBinaryExpression(
              "==",
              makeIdentifier("object"),
              makeSimpleLiteral(null),
            ),
            makeBlockStatement([
              makeThrowStatement(
                makeNewExpression(
                  makeReadIntrinsicExpression(global, namespace, "TypeError"),
                  [makeSimpleLiteral("Cannot set property of nulllish value")],
                ),
              ),
            ]),
            null,
          ),
          makeReturnStatement(
            makeCallExpression(
              makeReadIntrinsicExpression(
                global,
                namespace,
                "Reflect.deleteProperty",
              ),
              [
                makeCallExpression(
                  makeReadIntrinsicExpression(global, namespace, "Object"),
                  [makeIdentifier("object")],
                ),
                makeIdentifier("key"),
              ],
            ),
          ),
        ]),
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
    case "aran.createObject": {
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
    }
    case "aran.toPropertyKey": {
      return makeArrowFunctionExpression(
        [makeIdentifier("key")],
        makeMemberExpression(
          true,
          makeCallExpression(
            makeReadIntrinsicExpression(global, namespace, "Reflect.ownKeys"),
            [
              makeObjectExpression([
                makeProperty(
                  true,
                  makeIdentifier("key"),
                  makeSimpleLiteral(null),
                ),
              ]),
            ],
          ),
          makeSimpleLiteral(0),
        ),
      );
      // return makeArrowFunctionExpression(
      //   [makeIdentifier("key")],
      //   makeBlockStatement([
      //     makeIfStatement(
      //       makeIsNotPrimitiveExpression("key"),
      //       makeBlockStatement([
      //         reduceReverse(
      //           [
      //             {
      //               name: makeReadIntrinsicExpression(
      //                 global,
      //                 namespace,
      //                 "Symbol.toPrimitive",
      //               ),
      //               hint: [makeSimpleLiteral("string")],
      //             },
      //             { name: makeSimpleLiteral("toString"), hint: [] },
      //             { name: makeSimpleLiteral("valueOf"), hint: [] },
      //           ],
      //           (node, { name, hint }) =>
      //             makeBlockStatement([
      //               makeVariableDeclaration("const", [
      //                 makeVariableDeclarator(
      //                   makeIdentifier("method"),
      //                   makeMemberExpression(true, makeIdentifier("key"), name),
      //                 ),
      //               ]),
      //               makeIfStatement(
      //                 makeBinaryExpression(
      //                   "!=",
      //                   makeIdentifier("method"),
      //                   makeSimpleLiteral(null),
      //                 ),
      //                 makeBlockStatement([
      //                   makeExpressionStatement(
      //                     makeAssignmentExpression(
      //                       makeIdentifier("key"),
      //                       makeCallExpression(
      //                         makeReadIntrinsicExpression(
      //                           global,
      //                           namespace,
      //                           "Reflect.apply",
      //                         ),
      //                         [
      //                           makeIdentifier("method"),
      //                           makeIdentifier("key"),
      //                           makeArrayExpression(hint),
      //                         ],
      //                       ),
      //                     ),
      //                   ),
      //                 ]),
      //                 node,
      //               ),
      //             ]),
      //           makeBlockStatement([
      //             makeThrowStatement(
      //               makeNewExpression(
      //                 makeReadIntrinsicExpression(
      //                   global,
      //                   namespace,
      //                   "TypeError",
      //                 ),
      //                 [
      //                   makeSimpleLiteral(
      //                     "Cannot convert object to primitive value",
      //                   ),
      //                 ],
      //               ),
      //             ),
      //           ]),
      //         ),
      //         makeIfStatement(
      //           makeIsNotPrimitiveExpression("key"),
      //           makeBlockStatement([
      //             makeThrowStatement(
      //               makeNewExpression(
      //                 makeReadIntrinsicExpression(
      //                   global,
      //                   namespace,
      //                   "TypeError",
      //                 ),
      //                 [
      //                   makeSimpleLiteral(
      //                     "Cannot convert object to primitive value",
      //                   ),
      //                 ],
      //               ),
      //             ),
      //           ]),
      //           null,
      //         ),
      //       ]),
      //       null,
      //     ),
      //     makeReturnStatement(
      //       makeConditionalExpression(
      //         makeBinaryExpression(
      //           "===",
      //           makeUnaryExpression("typeof", makeIdentifier("key")),
      //           makeSimpleLiteral("symbol"),
      //         ),
      //         makeIdentifier("key"),
      //         makeCallExpression(
      //           makeMemberExpression(
      //             true,
      //             makeMemberExpression(
      //               false,
      //               makeIdentifier(global),
      //               makeIdentifier(namespace),
      //             ),
      //             makeSimpleLiteral(/** @type {aran.Intrinsic} */ ("String")),
      //           ),
      //           [makeIdentifier("key")],
      //         ),
      //       ),
      //     ),
      //   ]),
      // );
    }
    default: {
      throw new AranTypeError("invalid aran intrinsic", intrinsic);
    }
  }
};

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   namespace: estree.Variable,
 *   global: estree.Variable,
 * ) => estree.Expression}
 */
const makeIntrinsicExpression = (intrinsic, namespace, global) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, namespace, global)
    : makeStandardIntrinsicExpression(intrinsic, global);

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   namespace: estree.Variable,
 *   global: estree.Variable,
 * ) => estree.Property}
 */
const makeIntrinsicProperty = (intrinsic, namespace, global) =>
  makeProperty(
    false,
    makeSimpleLiteral(intrinsic),
    makeIntrinsicExpression(intrinsic, namespace, global),
  );

/**
 * @type {(
 *   namespace: estree.Variable,
 *   global: estree.Variable,
 * ) => estree.Expression}
 */
export const generateSetupExpression = (namespace, global) =>
  makeObjectExpression([
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
    ...map(
      /** @type {aran.Intrinsic[]} */ (listKey(INTRINSIC_ENUM)),
      (intrinsic) => makeIntrinsicProperty(intrinsic, namespace, global),
    ),
  ]);

/**
 * @type {(
 *   options: {
 *     intrinsic: estree.Variable,
 *     global: estree.Variable,
 *  },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const generateSetup = ({ intrinsic, global }) =>
  makeProgram("script", [
    makeDirective(makeSimpleLiteral("use strict")),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global),
          makeIdentifier(intrinsic),
        ),
        generateSetupExpression(intrinsic, global),
      ),
    ),
  ]);
