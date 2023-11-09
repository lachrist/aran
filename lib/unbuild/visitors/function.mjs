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
import { splitMeta } from "../mangle.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeArrowExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../node.mjs";
import { makeScopeClosureBlock } from "../scope/block.mjs";
import { listScopeInitializeStatement } from "../scope/index.mjs";
import {
  makeParamExpression,
  makeParamResultExpression,
} from "../param-index.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isBlockStatementSite,
  isNotBlockStatementSite,
} from "../predicate.mjs";
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
 *   site: import("../site.mjs").Site<estree.Pattern>,
 *   context: import("../context.js").Context,
 *   options: {
 *     index: number,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
const unbuildParameter = ({ node, path, meta }, context, { index }) =>
  unbuildPatternStatement({ meta, node, path }, context, {
    right:
      node.type === "RestElement"
        ? makeApplyExpression(
            makeIntrinsicExpression("Array.prototype.slice", path),
            makeReadParameterExpression("function.arguments", path),
            [makePrimitiveExpression(index, path)],
            path,
          )
        : makeGetExpression(
            makeReadParameterExpression("function.arguments", path),
            makePrimitiveExpression(index, path),
            path,
          ),
  });

/**
 * @type {(
 *   sites: import("../site.mjs").Site<estree.Pattern>[],
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
  sites,
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
                [makeReadParameterExpression("function.arguments", path)],
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
                          makeReadParameterExpression(
                            "function.arguments",
                            path,
                          ),
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
    ...(sites.length === 1 && sites[0].node.type === "RestElement"
      ? unbuildPatternStatement(
          drill(
            /** @type {import("../site.mjs").Site<estree.RestElement>} */ (
              sites[0]
            ),
            ["argument"],
          ).argument,
          context,
          {
            right: makeParamExpression(context, "function.arguments", path),
          },
        )
      : flatMap(enumerate(sites.length), (index) =>
          unbuildParameter(sites[index], context, { index }),
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
 *   site: {
 *     node: estree.Function,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: Parametrization & {
 *     name: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildFunction = (
  { node, path, meta },
  context,
  { name, ...parametrization },
) => {
  const metas = splitMeta(meta, ["drill", "result", "self", "head"]);
  const sites = drill({ node, path, meta: metas.drill }, ["body", "params"]);
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
                ...listHeadStatement(drillArray(sites.params), context, {
                  meta: metas.head,
                  simple,
                  self,
                  callee,
                  arguments: arguments_,
                  path,
                }),
                ...(isBlockStatementSite(sites.body)
                  ? [
                      makeBlockStatement(
                        unbuildClosureBody(sites.body, context, {}),
                        path,
                      ),
                    ]
                  : []),
              ],
              (context) =>
                makeParamResultExpression(
                  context,
                  isNotBlockStatementSite(sites.body)
                    ? unbuildExpression(sites.body, context, {})
                    : null,
                  path,
                  metas.result,
                ),
              path,
            ),
            path,
          ),
        { path, meta: metas.self },
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
