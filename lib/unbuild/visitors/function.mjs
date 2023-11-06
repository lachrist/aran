// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasFreeVariable,
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../query/index.mjs";
import {
  AranTypeError,
  enumerate,
  every,
  filterOut,
  flatMap,
  hasOwn,
  includes,
  map,
  removeDuplicate,
} from "../../util/index.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import { mangleMetaVariable, splitMeta, zipMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeArrowExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import {
  listScopeInitializeStatement,
  makeScopeParameterExpression,
  makeScopeResultExpression,
} from "../scope/index.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { isBlockFunction, isExpressionFunction } from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @typedef {(
 *   | "arrow"
 *   | "function"
 *   | "method"
 *   | "constructor"
 *   | "constructor*"
 * )} FunctionKind
 */

// Two different scope frame:
// ==========================
// > function f (x = y) { var y; return x; }
// undefined
// > y
// Thrown:
// ReferenceError: y is not defined
// > f()
// Thrown:
// ReferenceError: y is not defined
//     at f (repl:1:17)

/** @type {(node: estree.Pattern) => boolean} */
const isRestElement = ({ type }) => type === "RestElement";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => [estree.Variable, estree.VariableKind]}
 */
const makeVarEntry = (variable) => [variable, "var"];

/**
 * @type {(
 *   pair: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     index: number,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
const unbuildParameter = ({ node, path }, context, { meta, index }) =>
  unbuildPatternStatement({ node, path }, context, {
    meta,
    right:
      node.type === "RestElement"
        ? makeApplyExpression(
            makeIntrinsicExpression("Array.prototype.slice", path),
            makeReadExpression("function.arguments", path),
            [makePrimitiveExpression(index, path)],
            path,
          )
        : makeGetExpression(
            makeReadExpression("function.arguments", path),
            makePrimitiveExpression(index, path),
            path,
          ),
  });

/**
 * @type {(
 *   pairs: {
 *     node: estree.Pattern,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     simple: boolean,
 *     path: unbuild.Path,
 *     self: unbuild.Variable,
 *     callee: estree.Variable | null,
 *     arguments: boolean,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listHeadStatement = (
  pairs,
  context,
  { meta, simple, path, self, callee, arguments: arguments_ },
) => {
  const metas = splitMeta(meta, [
    "initialize_callee",
    "initialize_arguments",
    "arguments",
    "params",
  ]);
  return [
    ...(callee === null
      ? []
      : listScopeInitializeStatement(
          context,
          callee,
          makeReadExpression(self, path),
          path,
          metas.initialize_callee,
        )),
    ...(!arguments_
      ? []
      : [
          makeEffectStatement(
            makeWriteEffect(
              mangleMetaVariable(metas.arguments),
              makeApplyExpression(
                makeIntrinsicExpression("Object.fromEntries", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeApplyExpression(
                    makeIntrinsicExpression("Object.entries", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [makeReadExpression("function.arguments", path)],
                    path,
                  ),
                ],
                path,
              ),
              true,
              path,
            ),
            path,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(mangleMetaVariable(metas.arguments), path),
                  makePrimitiveExpression("length", path),
                  makeDataDescriptorExpression(
                    {
                      value: makeGetExpression(
                        makeReadExpression("function.arguments", path),
                        makePrimitiveExpression("length", path),
                        path,
                      ),
                      writable: true,
                      enumerable: false,
                      configurable: true,
                    },
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
            path,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(mangleMetaVariable(metas.arguments), path),
                  makePrimitiveExpression("callee", path),
                  context.strict || !simple
                    ? makeAccessorDescriptorExpression(
                        {
                          get: makeIntrinsicExpression(
                            "Function.prototype.arguments@get",
                            path,
                          ),
                          set: makeIntrinsicExpression(
                            "Function.prototype.arguments@set",
                            path,
                          ),
                          enumerable: false,
                          configurable: false,
                        },
                        path,
                      )
                    : makeDataDescriptorExpression(
                        {
                          value: makeReadExpression(self, path),
                          writable: true,
                          enumerable: false,
                          configurable: true,
                        },
                        path,
                      ),
                ],
                path,
              ),
              path,
            ),
            path,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(mangleMetaVariable(metas.arguments), path),
                  makeIntrinsicExpression("Symbol.iterator", path),
                  makeDataDescriptorExpression(
                    {
                      value: makeIntrinsicExpression(
                        "Array.prototype.values",
                        path,
                      ),
                      writable: true,
                      enumerable: false,
                      configurable: true,
                    },
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
            path,
          ),
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(mangleMetaVariable(metas.arguments), path),
                  makeIntrinsicExpression("Symbol.toStringTag", path),
                  makeDataDescriptorExpression(
                    {
                      value: makePrimitiveExpression("Arguments", path),
                      writable: true,
                      enumerable: false,
                      configurable: true,
                    },
                    path,
                  ),
                ],
                path,
              ),
              path,
            ),
            path,
          ),
          ...listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ ("arguments"),
            makeReadExpression(mangleMetaVariable(metas.arguments), path),
            path,
            metas.initialize_arguments,
          ),
        ]),
    ...(pairs.length === 1 && pairs[0].node.type === "RestElement"
      ? unbuildPatternStatement(
          drill(
            /** @type {{node: estree.RestElement, path: unbuild.Path}} */ (
              pairs[0]
            ),
            "argument",
          ),
          context,
          {
            meta: metas.params,
            right: makeScopeParameterExpression(
              context,
              "function.arguments",
              path,
            ),
          },
        )
      : flatMap(
          zipMeta(metas.params, enumerate(pairs.length)),
          ([meta, index]) =>
            unbuildParameter(pairs[index], context, { meta, index }),
        )),
  ];
};

/** @type {(node: estree.Pattern) => node is estree.Identifier} */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   node: estree.Function,
 *   strict: boolean,
 * ) => {
 *   type: "success",
 *   value: estree.Variable[],
 * } | {
 *   type: "failure",
 *   error: string,
 * }}
 */
const listClosureParameter = (node, strict) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (
    node.type === "ArrowFunctionExpression" ||
    strict ||
    !every(node.params, isIdentifier)
  ) {
    const { length } = parameters;
    /* eslint-disable local/no-impure */
    for (let index1 = 0; index1 < length; index1 += 1) {
      for (let index2 = index1 + 1; index2 < length; index2 += 1) {
        if (parameters[index1] === parameters[index2]) {
          return {
            type: "failure",
            error: `Duplicate parameter: ${parameters[index1]}`,
          };
        }
      }
    }
    /* eslint-enable local/no-impure */
    return {
      type: "success",
      value: parameters,
    };
  } else {
    return {
      type: "success",
      value: removeDuplicate(parameters),
    };
  }
};

/**
 * @type {(
 *   target: estree.Variable,
 *   parameters: estree.Variable[],
 *   record: Record<estree.Variable, unknown>,
 *   body: estree.Node[],
 * ) => boolean}
 */
const isPresent = (target, parameters, record, body) => {
  if (includes(parameters, target)) {
    return true;
  }
  if (hasOwn(record, target)) {
    return false;
  }
  return hasFreeVariable(body, target);
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Function,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     type: "arrow" | "function",
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *   } | {
 *     type: "method",
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *     self: unbuild.Variable,
 *   } | {
 *     type: "constructor",
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *     self: unbuild.Variable,
 *     super: unbuild.Variable | null,
 *     field: unbuild.Variable | null,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildFunction = ({ node, path }, context, options) => {
  const metas = splitMeta(options.meta, ["self", "head", "body", "result"]);
  const strict = context.strict || isClosureStrict(node);
  const simple = every(node.params, isIdentifier);
  const outcome = listClosureParameter(node, strict);
  switch (outcome.type) {
    case "failure": {
      return makeSyntaxErrorExpression(outcome.error, path);
    }
    case "success": {
      const parameters = outcome.value;
      const kinds =
        node.body.type === "BlockStatement" ? hoistClosure(node.body.body) : {};
      const callee =
        node.type !== "ArrowFunctionExpression" &&
        node.id != null &&
        isPresent(
          /** @type {estree.Variable} */ (node.id.name),
          parameters,
          kinds,
          node.body.type === "BlockStatement" ? node.body.body : [node.body],
        )
          ? /** @type {estree.Variable} */ (node.id.name)
          : null;
      const arguments_ =
        options.type !== "arrow" &&
        isPresent(
          /** @type {estree.Variable} */ ("arguments"),
          parameters,
          kinds,
          node.body.type === "BlockStatement" ? node.body.body : [node.body],
        );
      return makeLongSequenceExpression(
        [
          makeWriteEffect(
            mangleMetaVariable(metas.self),
            (options.type === "arrow"
              ? makeArrowExpression
              : makeFunctionExpression)(
              hasOwn(node, "async")
                ? /** @type {{async: boolean}} */ (node).async
                : false,
              /** @type {any} */ (
                options.type !== "arrow" && hasOwn(node, "generator")
                  ? /** @type {{generator: boolean}} */ (node).generator
                  : false
              ),
              makeScopeClosureBlock(
                {
                  ...context,
                  strict,
                },
                /** @type {import("../scope/index.mjs").Frame} */ ({
                  type: "closure",
                  kind: options.type,
                  self:
                    options.type === "constructor" || options.type === "method"
                      ? options.self
                      : null,
                  super: options.type === "constructor" ? options.super : null,
                  field: options.type === "constructor" ? options.field : null,
                  kinds: reduceEntry([
                    ...(callee === null ? [] : [[callee, "var"]]),
                    ...(arguments_ ? [["arguments", "var"]] : []),
                    ...map(parameters, simple ? makeVarEntry : makeLetEntry),
                  ]),
                }),
                (context) => [
                  ...listHeadStatement(
                    drillAll(drillArray({ node, path }, "params")),
                    context,
                    {
                      meta: metas.head,
                      simple,
                      self: mangleMetaVariable(metas.self),
                      callee,
                      arguments: arguments_,
                      path,
                    },
                  ),
                  ...(isBlockFunction(node)
                    ? [
                        makeBlockStatement(
                          unbuildClosureBody(
                            drill({ node, path }, "body"),
                            context,
                            { meta: metas.body },
                          ),
                          path,
                        ),
                      ]
                    : []),
                ],
                (context) =>
                  makeScopeResultExpression(
                    context,
                    isExpressionFunction(node)
                      ? unbuildExpression(
                          drill({ node, path }, "body"),
                          context,
                          {
                            meta: metas.body,
                            name: ANONYMOUS,
                          },
                        )
                      : null,
                    path,
                    metas.result,
                  ),
                path,
              ),
              path,
            ),
            true,
            path,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(mangleMetaVariable(metas.self), path),
                makePrimitiveExpression("length", path),
                makeDataDescriptorExpression(
                  {
                    value: makePrimitiveExpression(
                      filterOut(node.params, isRestElement).length,
                      path,
                    ),
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadExpression(mangleMetaVariable(metas.self), path),
                makePrimitiveExpression("name", path),
                makeDataDescriptorExpression(
                  {
                    value: options.name,
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          ...(strict
            ? []
            : [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeReadExpression(mangleMetaVariable(metas.self), path),
                      makePrimitiveExpression("arguments", path),
                      makeDataDescriptorExpression(
                        {
                          value: makePrimitiveExpression(null, path),
                          writable: false,
                          enumerable: false,
                          configurable: true,
                        },
                        path,
                      ),
                    ],
                    path,
                  ),
                  path,
                ),
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeReadExpression(mangleMetaVariable(metas.self), path),
                      makePrimitiveExpression("caller", path),
                      makeDataDescriptorExpression(
                        {
                          value: makePrimitiveExpression(null, path),
                          writable: false,
                          enumerable: false,
                          configurable: true,
                        },
                        path,
                      ),
                    ],
                    path,
                  ),
                  path,
                ),
              ]),
        ],
        makeReadExpression(mangleMetaVariable(metas.self), path),
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid outcome", outcome);
    }
  }
};
