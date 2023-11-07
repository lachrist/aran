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
import { splitMeta, zipMeta } from "../mangle.mjs";
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
import {
  listInitCacheStatement,
  makeReadCacheExpression,
  makeSelfCacheExpression,
} from "../cache.mjs";

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
 *     self: import("../cache.mjs").Cache,
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
    "params",
    "initialize_callee",
    "initialize_arguments",
    "arguments_cache",
  ]);
  return [
    ...(callee === null
      ? []
      : listScopeInitializeStatement(
          context,
          callee,
          makeReadCacheExpression(self, path),
          path,
          metas.initialize_callee,
        )),
    ...(arguments_
      ? listInitCacheStatement(
          "constant",
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
          { path, meta: metas.arguments_cache },
          (arguments_) => [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadCacheExpression(arguments_, path),
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
                    makeReadCacheExpression(arguments_, path),
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
                            value: makeReadCacheExpression(self, path),
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
                    makeReadCacheExpression(arguments_, path),
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
                    makeReadCacheExpression(arguments_, path),
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
              makeReadCacheExpression(arguments_, path),
              path,
              metas.initialize_arguments,
            ),
          ],
        )
      : []),
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
 * @typedef {{
 *   type: "arrow" | "function",
 * } | {
 *   type: "method",
 *   proto: import("../cache.mjs").Cache,
 * } | {
 *   type: "constructor",
 *   super: import("../cache.mjs").Cache | null,
 *   field: import("../cache.mjs").Cache | null,
 * }} Parametrization
 */

/**
 * @type {(
 *   parametrization: Parametrization,
 *   self: import("../cache.mjs").Cache,
 * ) => import("../scope/index.mjs").ClosureParam}
 */
const makeClosureParam = (parametrization, self) => {
  switch (parametrization.type) {
    case "arrow": {
      return {
        type: "closure",
        kind: "arrow",
        self: null,
        proto: null,
        super: null,
        field: null,
      };
    }
    case "function": {
      return {
        type: "closure",
        kind: "function",
        self: null,
        proto: null,
        super: null,
        field: null,
      };
    }
    case "method": {
      return {
        type: "closure",
        kind: "method",
        self: null,
        proto: parametrization.proto,
        super: null,
        field: null,
      };
    }
    case "constructor": {
      return {
        type: "closure",
        kind: "constructor",
        self,
        proto: null,
        super: parametrization.super,
        field: parametrization.field,
      };
    }
    default: {
      throw new AranTypeError("invalid parametrization", parametrization);
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Function,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: Parametrization & {
 *     meta: unbuild.Meta,
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildFunction = (
  { node, path },
  context,
  { meta, name, ...parametrization },
) => {
  const metas = splitMeta(meta, ["head", "body", "result", "self_cache"]);
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
        parametrization.type !== "arrow" &&
        isPresent(
          /** @type {estree.Variable} */ ("arguments"),
          parameters,
          kinds,
          node.body.type === "BlockStatement" ? node.body.body : [node.body],
        );
      return makeSelfCacheExpression(
        "constant",
        (self) =>
          (parametrization.type === "arrow"
            ? makeArrowExpression
            : makeFunctionExpression)(
            hasOwn(node, "async")
              ? /** @type {{async: boolean}} */ (node).async
              : false,
            /** @type {any} */ (
              parametrization.type !== "arrow" && hasOwn(node, "generator")
                ? /** @type {{generator: boolean}} */ (node).generator
                : false
            ),
            makeScopeClosureBlock(
              {
                ...context,
                strict,
              },
              {
                ...makeClosureParam(parametrization, self),
                kinds: reduceEntry([
                  ...(callee === null ? [] : [[callee, "var"]]),
                  ...(arguments_ ? [["arguments", "var"]] : []),
                  ...map(parameters, simple ? makeVarEntry : makeLetEntry),
                ]),
              },
              (context) => [
                ...listHeadStatement(
                  drillAll(drillArray({ node, path }, "params")),
                  context,
                  {
                    meta: metas.head,
                    simple,
                    self,
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
        { path, meta: metas.self_cache },
        (self) =>
          makeLongSequenceExpression(
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadCacheExpression(self, path),
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
                    makeReadCacheExpression(self, path),
                    makePrimitiveExpression("name", path),
                    makeDataDescriptorExpression(
                      {
                        value: name,
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
                          makeReadCacheExpression(self, path),
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
                          makeReadCacheExpression(self, path),
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
            makeReadCacheExpression(self, path),
            path,
          ),
      );
    }
    default: {
      throw new AranTypeError("invalid outcome", outcome);
    }
  }
};
