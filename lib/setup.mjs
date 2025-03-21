import { BINARY_OPERATOR_RECORD, UNARY_OPERATOR_RECORD } from "estree-sentry";
import {
  getIntrinsicFunctionName,
  INTRINSIC_RECORD,
  isAranIntrinsic,
} from "./lang/index.mjs";
import { concat_X, listKey, map, reduce } from "./util/index.mjs";
import { AranTypeError } from "./error.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const AT = ["@"];

const DOT = ["."];

const BINARY_OPERATOR_ENUM = listKey(BINARY_OPERATOR_RECORD);

const UNARY_OPERATOR_ENUM = listKey(UNARY_OPERATOR_RECORD);

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
 *   body: import("estree-sentry").Statement<{}>[],
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
const makeScriptProgram = (body) => ({
  type: "Program",
  sourceType: "script",
  body,
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
 *   directive: string,
 * ) => import("estree-sentry").ExpressionStatement<{}>}
 */
const makeDirective = (directive) => ({
  type: "ExpressionStatement",
  expression: {
    type: "Literal",
    value: /** @type {import("estree-sentry").StringValue} */ (directive),
    raw: null,
    bigint: null,
    regex: null,
  },
  // eslint-disable-next-line object-shorthand
  directive: /** @type {import("estree-sentry").Directive} */ (directive),
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
 *   name: null | import("estree-sentry").VariableName,
 *   kind: {
 *     asynchronous: boolean,
 *   },
 *   parameters: import("estree-sentry").RestablePattern<{}>[],
 *   body: (
 *     | import("estree-sentry").BlockStatement<{}>
 *     | import("estree-sentry").Expression<{}>
 *   ),
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeArrowFunctionExpression = (name, { asynchronous }, params, body) => {
  /** @type {import("estree-sentry").Expression<{}>} */
  const arrow =
    body.type === "BlockStatement"
      ? {
          type: "ArrowFunctionExpression",
          id: null,
          async: asynchronous,
          generator: false,
          params,
          expression: false,
          body,
        }
      : {
          type: "ArrowFunctionExpression",
          id: null,
          async: asynchronous,
          generator: false,
          params,
          expression: true,
          body,
        };
  return name === null
    ? arrow
    : {
        type: "MemberExpression",
        computed: false,
        optional: false,
        object: {
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
                // eslint-disable-next-line object-shorthand
                name: /** @type {import("estree-sentry").PublicKeyName} */ (
                  /** @type {string} */ (name)
                ),
              },
              value: arrow,
            },
          ],
        },
        property: {
          type: "Identifier",
          // eslint-disable-next-line object-shorthand
          name: /** @type {import("estree-sentry").PublicKeyName} */ (
            /** @type {string} */ (name)
          ),
        },
      };
};

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
 * @type {(
 *   properties: import("estree-sentry").PatternProperty<{}>[],
 * ) => import("estree-sentry").Pattern<{}>}
 */
const makeObjectPattern = (properties) => ({
  type: "ObjectPattern",
  properties,
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
 * @type {(... [computed, key, value]: [
 *   true,
 *   import("estree-sentry").Expression<{}>,
 *   import("estree-sentry").Pattern<{}>,
 * ] | [
 *   false,
 *   (
 *     | import("estree-sentry").PublicKeyIdentifier<{}>
 *     | import("estree-sentry").PublicKeyLiteral<{}>
 *   ),
 *   import("estree-sentry").Pattern<{}>,
 * ]) => import("estree-sentry").PatternProperty<{}>}
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
 *   object: import("estree-sentry").Expression<{}>,
 *   segments: string[],
 *   global: string,
 * ) => import("estree-sentry").Expression<{}>}
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
 *     import("./lang/syntax").Intrinsic,
 *     import("./lang/syntax").AranIntrinsic
 *   >,
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeStandardIntrinsicExpression = (
  intrinsic,
  { global_object_variable },
) =>
  reduce(
    /** @type {string[]} */ (apply(split, intrinsic, DOT)),
    (object, key) =>
      digGlobal(object, apply(split, key, AT), global_object_variable),
    /** @type {import("estree-sentry").Expression<{}>} */ (
      makeVariableIdentifier(global_object_variable)
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
 *   name: import("estree-sentry").VariableName,
 *   params: {
 *     cache: string,
 *     global_eval: string,
 *     variable: string,
 *     additional: string,
 *     optimization: string,
 *   },
 *   code: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeAccessGlobalExpression = (name, params, code) =>
  makeCallExpression(
    makeArrowFunctionExpression(
      null,
      { asynchronous: false },
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
        name,
        { asynchronous: false },
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
 *   intrinsic: import("./lang/syntax").AranIntrinsic,
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeAranIntrinsicExpression = (intrinsic, { global_object_variable }) => {
  switch (intrinsic) {
    case "aran.global_object": {
      return makeVariableIdentifier(global_object_variable);
    }
    case "aran.global_declarative_record": {
      return makeObjectExpression([
        makeProperty(
          false,
          makePublicKeyIdentifier("__proto__"),
          makeSimpleLiteral(null),
        ),
      ]);
    }
    case "aran.deadzone_symbol": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeVariableIdentifier(global_object_variable),
          makePublicKeyIdentifier("Symbol"),
        ),
        [makeSimpleLiteral("deadzone")],
      );
    }
    case "aran.throwException": {
      return makeArrowFunctionExpression(
        getIntrinsicFunctionName("aran.throwException"),
        { asynchronous: false },
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
            makeVariableIdentifier(global_object_variable),
            makePublicKeyIdentifier("Reflect"),
          ),
          makePublicKeyIdentifier("getPrototypeOf"),
        ),
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
      );
    }
    case "aran.GeneratorFunction.prototype.prototype": {
      return makeCallExpression(
        makeMemberExpression(
          false,
          makeMemberExpression(
            false,
            makeVariableIdentifier(global_object_variable),
            makePublicKeyIdentifier("Reflect"),
          ),
          makePublicKeyIdentifier("getPrototypeOf"),
        ),
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
      );
    }
    case "aran.getValueProperty": {
      return makeArrowFunctionExpression(
        getIntrinsicFunctionName("aran.getValueProperty"),
        { asynchronous: false },
        [makeVariableIdentifier("object"), makeVariableIdentifier("key")],
        makeMemberExpression(
          true,
          makeVariableIdentifier("object"),
          makeVariableIdentifier("key"),
        ),
      );
    }
    case "aran.performUnaryOperation": {
      return makeArrowFunctionExpression(
        getIntrinsicFunctionName("aran.performUnaryOperation"),
        { asynchronous: false },
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
    case "aran.performBinaryOperation": {
      return makeArrowFunctionExpression(
        getIntrinsicFunctionName("aran.performBinaryOperation"),
        { asynchronous: false },
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
      return makeCallExpression(
        makeArrowFunctionExpression(
          getIntrinsicFunctionName("aran.isConstructor"),
          { asynchronous: false },
          [
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Reflect"),
                makeObjectPattern([
                  makePatternProperty(
                    false,
                    makePublicKeyIdentifier("construct"),
                    makeVariableIdentifier("construct"),
                  ),
                ]),
              ),
              makePatternProperty(
                false,
                makePublicKeyIdentifier("Boolean"),
                makeVariableIdentifier("Boolean"),
              ),
            ]),
            makeVariableIdentifier("empty"),
          ],
          makeArrowFunctionExpression(
            null,
            { asynchronous: false },
            [makeVariableIdentifier("value")],
            makeBlockStatement([
              makeTryStatement(
                makeBlockStatement([
                  makeExpressionStatement(
                    makeCallExpression(makeVariableIdentifier("construct"), [
                      makeVariableIdentifier("Boolean"),
                      makeVariableIdentifier("empty"),
                      makeVariableIdentifier("value"),
                    ]),
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
          ),
        ),
        [makeVariableIdentifier("globalThis"), makeArrayExpression([])],
      );
    }
    case "aran.sliceObject": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          null,
          { asynchronous: false },
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
            getIntrinsicFunctionName("aran.sliceObject"),
            { asynchronous: false },
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
          null,
          { asynchronous: false },
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
            getIntrinsicFunctionName("aran.toArgumentList"),
            { asynchronous: false },
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
                    makeVariableIdentifier(global_object_variable),
                    makePublicKeyIdentifier("Reflect"),
                  ),
                  makePublicKeyIdentifier("getOwnPropertyDescriptor"),
                ),
                [
                  makeMemberExpression(
                    false,
                    makeMemberExpression(
                      false,
                      makeVariableIdentifier(global_object_variable),
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
        getIntrinsicFunctionName("aran.listForInKey"),
        { asynchronous: false },
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
    case "aran.listIteratorRest": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          null,
          { asynchronous: false },
          [makeVariableIdentifier("apply")],
          makeArrowFunctionExpression(
            getIntrinsicFunctionName("aran.listIteratorRest"),
            { asynchronous: false },
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
              makeVariableIdentifier(global_object_variable),
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
          null,
          { asynchronous: false },
          [makeVariableIdentifier("listKey")],
          makeArrowFunctionExpression(
            getIntrinsicFunctionName("aran.toPropertyKey"),
            { asynchronous: false },
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
              makeVariableIdentifier(global_object_variable),
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
          null,
          { asynchronous: false },
          [makeVariableIdentifier("defineProperty")],
          makeArrowFunctionExpression(
            getIntrinsicFunctionName("aran.createObject"),
            { asynchronous: false },
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
              makeVariableIdentifier(global_object_variable),
              makePublicKeyIdentifier("Reflect"),
            ),
            makePublicKeyIdentifier("defineProperty"),
          ),
        ],
      );
    }
    case "aran.declareGlobalVariable": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          null,
          { asynchronous: false },
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
            getIntrinsicFunctionName("aran.declareGlobalVariable"),
            { asynchronous: false },
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
    case "aran.readGlobalVariable": {
      return makeAccessGlobalExpression(
        getIntrinsicFunctionName("aran.readGlobalVariable"),
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.typeofGlobalVariable": {
      return makeAccessGlobalExpression(
        getIntrinsicFunctionName("aran.typeofGlobalVariable"),
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => typeof "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.discardGlobalVariable": {
      return makeAccessGlobalExpression(
        getIntrinsicFunctionName("aran.discardGlobalVariable"),
        ACCESS_GLOBAL_PARAM_RECORD,
        makeConcatExpression("+", [
          makeSimpleLiteral("(() => delete "),
          makeVariableIdentifier(ACCESS_GLOBAL_PARAM_RECORD.variable),
          makeSimpleLiteral(");"),
        ]),
      );
    }
    case "aran.writeGlobalVariableSloppy": {
      return makeAccessGlobalExpression(
        getIntrinsicFunctionName("aran.writeGlobalVariableSloppy"),
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
    case "aran.writeGlobalVariableStrict": {
      return makeAccessGlobalExpression(
        getIntrinsicFunctionName("aran.writeGlobalVariableStrict"),
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
    case "aran.transpileEvalCode": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          null,
          { asynchronous: false },
          [
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("SyntaxError"),
                makeVariableIdentifier("SyntaxError"),
              ),
            ]),
          ],
          makeArrowFunctionExpression(
            getIntrinsicFunctionName("aran.transpileEvalCode"),
            { asynchronous: false },
            [makeVariableIdentifier("code"), makeVariableIdentifier("situ")],
            makeBlockStatement([
              makeThrowStatement(
                makeNewExpression(makeVariableIdentifier("SyntaxError"), [
                  makeSimpleLiteral(
                    "aran.transpileEvalCode must be overriden to support direct eval calls",
                  ),
                ]),
              ),
            ]),
          ),
        ),
        [makeVariableIdentifier("globalThis")],
      );
    }
    case "aran.retropileEvalCode": {
      return makeCallExpression(
        makeArrowFunctionExpression(
          null,
          { asynchronous: false },

          [
            makeObjectPattern([
              makePatternProperty(
                false,
                makePublicKeyIdentifier("SyntaxError"),
                makeVariableIdentifier("SyntaxError"),
              ),
            ]),
          ],
          makeArrowFunctionExpression(
            getIntrinsicFunctionName("aran.retropileEvalCode"),
            { asynchronous: false },
            [makeVariableIdentifier("aran")],
            makeBlockStatement([
              makeThrowStatement(
                makeNewExpression(makeVariableIdentifier("SyntaxError"), [
                  makeSimpleLiteral(
                    "aran.retropileEvalCode must be overriden to support direct eval calls",
                  ),
                ]),
              ),
            ]),
          ),
        ),
        [makeVariableIdentifier("globalThis")],
      );
    }
    default: {
      throw new AranTypeError(intrinsic);
    }
  }
};

/**
 * @type {(
 *   intrinsic: import("./lang/syntax").Intrinsic,
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeIntrinsicExpression = (intrinsic, config) =>
  isAranIntrinsic(intrinsic)
    ? makeAranIntrinsicExpression(intrinsic, config)
    : makeStandardIntrinsicExpression(intrinsic, config);

/**
 * @type {(
 *   intrinsic: import("./lang/syntax").Intrinsic,
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").ObjectProperty<{}>}
 */
const makeIntrinsicProperty = (intrinsic, config) =>
  makeProperty(
    true,
    makeSimpleLiteral(intrinsic),
    makeIntrinsicExpression(intrinsic, config),
  );

/**
 * @type {(
 *   config: {
 *     global_object_variable: import("estree-sentry").VariableName,
 *   },
 * ) => import("estree-sentry").Expression<{}>}
 */
export const generateIntrinsicRecord = (config) =>
  makeObjectExpression(
    concat_X(
      makeProperty(
        false,
        makePublicKeyIdentifier("__proto__"),
        makeSimpleLiteral(null),
      ),
      map(
        /** @type {import("./lang/syntax").Intrinsic[]} */ (
          listKey(INTRINSIC_RECORD)
        ),
        (intrinsic) => makeIntrinsicProperty(intrinsic, config),
      ),
    ),
  );

/**
 * @type {(
 *   config: import("./setup-internal").InternalConfig,
 * ) => import("estree-sentry").ScriptProgram<{}>}
 */
export const setupile = ({
  global_object_variable,
  intrinsic_global_variable,
}) =>
  makeScriptProgram([
    makeDirective("use strict"),
    makeExpressionStatement(
      makeAssignmentExpression(
        makeMemberExpression(
          false,
          makeVariableIdentifier(global_object_variable),
          makePublicKeyIdentifier(intrinsic_global_variable),
        ),
        generateIntrinsicRecord({ global_object_variable }),
      ),
    ),
  ]);
