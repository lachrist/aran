import { BINARY_OPERATOR_ENUM, UNARY_OPERATOR_ENUM } from "./estree.mjs";
import { INTRINSIC_ENUM, isAranIntrinsic } from "./lang.mjs";
import { map, reduce, slice } from "./util/index.mjs";
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
 *   terms: estree.Expression[],
 * ) => estree.Expression}
 */
const makeConcatExpression = (terms) => {
  if (terms.length === 0) {
    return makeSimpleLiteral("");
  } else {
    return reduce(
      slice(terms, 1, terms.length),
      (left, right) => makeBinaryExpression("+", left, right),
      terms[0],
    );
  }
};

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
 *   options: {
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

const makeGlobalRecordExpression = () =>
  makeObjectExpression([
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
    makeProperty(
      false,
      makeIdentifier("strict"),
      makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]),
    ),
    makeProperty(
      false,
      makeIdentifier("sloppy"),
      makeObjectExpression([
        makeProperty(
          false,
          makeIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]),
    ),
  ]);

/**
 * @type {(
 *   operation: "*write*" | "" | "typeof " | "delete ",
 *   options: {
 *     global: estree.Variable,
 *     namespace: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => estree.Expression}
 */
// We cache lookup functions because eval performance is horrendous.
// Hoopefully this does not lead to excessive memory usage
const compileGlobalLookup = (operation, { global, namespace, escape }) =>
  makeCallExpression(
    makeArrowFunctionExpression(
      [makeIdentifier("record")],
      makeArrowFunctionExpression(
        [
          makeIdentifier("mode"),
          makeIdentifier("variable"),
          ...(operation === "*write*" ? [makeIdentifier("value")] : []),
        ],
        makeBlockStatement([
          makeVariableDeclaration("let", [
            makeVariableDeclarator(
              makeIdentifier("lookup"),
              makeMemberExpression(
                true,
                makeMemberExpression(
                  true,
                  makeIdentifier("record"),
                  makeIdentifier("mode"),
                ),
                makeIdentifier("variable"),
              ),
            ),
          ]),
          makeIfStatement(
            makeUnaryExpression("!", makeIdentifier("lookup")),
            makeBlockStatement([
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeIdentifier("lookup"),
                  makeCallExpression(
                    makeReadIntrinsicExpression(global, namespace, "eval"),
                    operation === "*write*"
                      ? [
                          makeConcatExpression([
                            makeSimpleLiteral("'use "),
                            makeIdentifier("mode"),
                            makeSimpleLiteral(`';\n ((${escape}) => { `),
                            makeIdentifier("variable"),
                            makeSimpleLiteral(` = ${escape}; });`),
                          ]),
                        ]
                      : [
                          makeConcatExpression([
                            makeSimpleLiteral("'use "),
                            makeIdentifier("mode"),
                            makeSimpleLiteral(`';\n (() => ${operation}`),
                            makeIdentifier("variable"),
                            makeSimpleLiteral(");"),
                          ]),
                        ],
                  ),
                ),
              ),
              makeExpressionStatement(
                makeAssignmentExpression(
                  makeMemberExpression(
                    true,
                    makeMemberExpression(
                      true,
                      makeIdentifier("record"),
                      makeIdentifier("mode"),
                    ),
                    makeIdentifier("variable"),
                  ),
                  makeIdentifier("lookup"),
                ),
              ),
            ]),
            null,
          ),
          makeReturnStatement(
            makeCallExpression(
              makeIdentifier("lookup"),
              operation === "*write*" ? [makeIdentifier("value")] : [],
            ),
          ),
        ]),
      ),
    ),
    [makeGlobalRecordExpression()],
  );

/**
 * @type {(
 *   intrinsic: aran.AranIntrinsic,
 *   options: {
 *     global: estree.Variable,
 *     namespace: estree.Variable,
 *     escape: estree.Variable,
 *     exec: estree.Variable | null,
 *   },
 * ) => estree.Expression}
 */
const makeAranIntrinsicExpression = (
  intrinsic,
  { global, namespace, escape, exec },
) => {
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
    case "aran.declareGlobal": {
      return makeArrowFunctionExpression(
        [
          makeIdentifier("mode"),
          makeIdentifier("kind"),
          makeIdentifier("variable"),
        ],
        exec === null
          ? makeCallExpression(
              makeReadIntrinsicExpression(global, namespace, "eval"),
              [
                makeConcatExpression([
                  makeSimpleLiteral("var "),
                  makeIdentifier("variable"),
                  makeSimpleLiteral(";"),
                ]),
              ],
            )
          : makeCallExpression(
              makeMemberExpression(
                false,
                makeIdentifier(global),
                makeIdentifier(exec),
              ),
              [
                makeConcatExpression([
                  makeSimpleLiteral("'use "),
                  makeIdentifier("mode"),
                  makeSimpleLiteral("';\n"),
                  makeIdentifier("kind"),
                  makeSimpleLiteral(" "),
                  makeIdentifier("variable"),
                  makeSimpleLiteral(";"),
                ]),
              ],
            ),
      );
    }
    case "aran.readGlobal": {
      return compileGlobalLookup("", { global, namespace, escape });
    }
    case "aran.typeofGlobal": {
      return compileGlobalLookup("typeof ", { global, namespace, escape });
    }
    case "aran.discardGlobal": {
      return compileGlobalLookup("delete ", { global, namespace, escape });
    }
    case "aran.writeGlobal": {
      return compileGlobalLookup("*write*", { global, namespace, escape });
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
            ],
          ),
          makeSimpleLiteral(0),
        ),
      );
    }
    default: {
      throw new AranTypeError("invalid aran intrinsic", intrinsic);
    }
  }
};

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   options: {
 *     global: estree.Variable,
 *     namespace: estree.Variable,
 *     escape: estree.Variable,
 *     exec: estree.Variable | null,
 *   },
 * ) => estree.Expression}
 */
const makeIntrinsicExpression = (intrinsic, options) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, options)
    : makeStandardIntrinsicExpression(intrinsic, options);

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   options: {
 *     global: estree.Variable,
 *     namespace: estree.Variable,
 *     escape: estree.Variable,
 *     exec: estree.Variable | null,
 *   },
 * ) => estree.Property}
 */
const makeIntrinsicProperty = (intrinsic, options) =>
  makeProperty(
    false,
    makeSimpleLiteral(intrinsic),
    makeIntrinsicExpression(intrinsic, options),
  );

/**
 * @type {(
 *   options: {
 *     global: estree.Variable,
 *     namespace: estree.Variable,
 *     escape: estree.Variable,
 *     exec: estree.Variable | null,
 *  },
 * ) => estree.Expression}
 */
export const generateSetupExpression = (options) =>
  makeObjectExpression([
    makeProperty(false, makeIdentifier("__proto__"), makeSimpleLiteral(null)),
    ...map(
      /** @type {aran.Intrinsic[]} */ (listKey(INTRINSIC_ENUM)),
      (intrinsic) => makeIntrinsicProperty(intrinsic, options),
    ),
  ]);

/**
 * @type {(
 *   options: {
 *     global: estree.Variable,
 *     intrinsic: estree.Variable,
 *     escape: estree.Variable,
 *     exec: estree.Variable | null,
 *  },
 * ) => estree.Program & { sourceType: "script" }}
 */
export const generateSetup = ({ global, intrinsic, exec, escape }) =>
  makeProgram("script", [
    makeDirective(makeSimpleLiteral("use strict")),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeIdentifier(global),
          makeIdentifier(intrinsic),
        ),
        generateSetupExpression({
          global,
          namespace: intrinsic,
          escape,
          exec,
        }),
      ),
    ),
  ]);
