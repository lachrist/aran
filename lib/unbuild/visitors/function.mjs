// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasFreeVariable,
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../query/index.mjs";
import {
  enumerate,
  every,
  findIndex,
  flatMap,
  guard,
  hasOwn,
  includes,
  map,
  removeDuplicate,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeDataDescriptorExpression,
  makeGetExpression,
  makeObjectExpression,
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
  makeClosureBlock,
  report,
  makeSequenceExpression,
} from "../node.mjs";
import {
  makeScopeClosureBlock,
  listScopeInitializeEffect,
} from "../scope/index.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildInitializePatternEffect } from "./pattern.mjs";
import { drill, drillArray } from "../site.mjs";
import {
  isBlockStatementSite,
  isNotBlockStatementSite,
} from "../predicate.mjs";
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
import {
  listInitCacheEffect,
  makeReadCacheExpression,
  makeSelfCacheExpression,
} from "../cache.mjs";
import {
  extendClosure,
  makeReadFunctionArgumentsExpression,
  makeReturnArgumentExpression,
} from "../param/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @typedef {{
 *   type: "arrow" | "function",
 * } | {
 *   type: "method",
 *   proto: import("../cache.mjs").Cache,
 * } | {
 *   type: "constructor",
 *   derived: boolean,
 *   field: import("../cache.mjs").Cache,
 * }} Parametrization
 */

/**
 * @type {(node: estree.Pattern) => boolean}
 */
const isLengthCutoffPattern = ({ type }) =>
  type === "RestElement" || type === "AssignmentPattern";

/**
 * @type {(node: estree.Pattern) => boolean}
 */
const isImpurePattern = (node) => {
  switch (node.type) {
    case "Identifier": {
      return false;
    }
    case "RestElement": {
      return node.argument.type !== "Identifier";
    }
    default: {
      return true;
    }
  }
};

/**
 * @type {(
 *   kind: "arrow" | "method" | "constructor" | "function",
 *   node: estree.Function,
 * ) => boolean}
 */
const hasPrototype = (kind, node) => {
  if (kind === "arrow") {
    return false;
  }
  if (hasOwn(node, "generator") && node.generator) {
    return true;
  }
  if (hasOwn(node, "async") && node.async) {
    return false;
  }
  return kind !== "method";
};

/**
 * @type {(
 *   generator: boolean,
 *   asynchronous: boolean,
 * ) => aran.Intrinsic}
 */
const getPrototypePrototype = (generator, asynchronous) => {
  if (generator) {
    return asynchronous
      ? "aran.AsyncGeneratorFunction.prototype.prototype"
      : "aran.GeneratorFunction.prototype.prototype";
  } else {
    return "Object.prototype";
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     kind: "arrow" | "function" | "constructor" | "method",
 *     generator: boolean,
 *     asynchronous: boolean,
 *     konstructor: import("../cache.mjs").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePrototypeExpression = (
  { path },
  { kind, generator, asynchronous, konstructor },
) =>
  guard(
    kind !== "method" && !asynchronous && !generator,
    (node) =>
      makeApplyExpression(
        makeIntrinsicExpression("Object.defineProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          node,
          makePrimitiveExpression("constructor", path),
          makeDataDescriptorExpression(
            {
              value: makeReadCacheExpression(konstructor, path),
              writable: true,
              enumerable: false,
              configurable: true,
            },
            path,
          ),
        ],
        path,
      ),
    makeObjectExpression(
      makeIntrinsicExpression(
        getPrototypePrototype(generator, asynchronous),
        path,
      ),
      [],
      path,
    ),
  );

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
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildParameter = ({ node, path, meta }, context, { index }) =>
  node.type === "RestElement"
    ? unbuildInitializePatternEffect(
        drill({ node, path, meta }, ["argument"]).argument,
        context,
        {
          right:
            index === 0
              ? makeReadFunctionArgumentsExpression(context, { path })
              : makeApplyExpression(
                  makeIntrinsicExpression("Array.prototype.slice", path),
                  makeReadFunctionArgumentsExpression(context, { path }),
                  [makePrimitiveExpression(index, path)],
                  path,
                ),
        },
      )
    : unbuildInitializePatternEffect({ meta, node, path }, context, {
        right: makeGetExpression(
          makeReadFunctionArgumentsExpression(context, { path }),
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
 *     input: estree.Variable | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listHeadEffect = (
  sites,
  context,
  { meta, simple, path, self, callee, input },
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
      : listScopeInitializeEffect(
          context,
          callee,
          makeReadCacheExpression(self, path),
          { path, meta: metas.initialize_callee },
        )),
    ...(input === null
      ? []
      : listInitCacheEffect(
          "constant",
          makeApplyExpression(
            makeIntrinsicExpression("Object.fromEntries", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("Object.entries", path),
                makePrimitiveExpression({ undefined: null }, path),
                [makeReadFunctionArgumentsExpression(context, { path })],
                path,
              ),
            ],
            path,
          ),
          { path, meta: metas.arguments_cache },
          (arguments_) => [
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
                        makeReadFunctionArgumentsExpression(context, {
                          path,
                        }),
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
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(arguments_, path),
                  makePrimitiveExpression("callee", path),
                  context.mode === "strict" || !simple
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
            ...listScopeInitializeEffect(
              context,
              input,
              makeReadCacheExpression(arguments_, path),
              { path, meta: metas.initialize_arguments },
            ),
          ],
        )),
    ...flatMap(enumerate(sites.length), (index) =>
      unbuildParameter(sites[index], context, { index }),
    ),
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
 *   mode: "strict" | "sloppy",
 *   node: estree.Function,
 *   variable: estree.Variable | null,
 * ) => estree.Variable | null}
 */
const isPresent = (mode, node, variable) => {
  if (variable === null) {
    return null;
  }
  if (includes(flatMap(node.params, listPatternVariable), variable)) {
    return null;
  }
  if (hasFreeVariable(node.params, variable)) {
    return variable;
  }
  if (hasOwn(hoistClosure(mode, [node.body]), variable)) {
    return null;
  }
  if (hasFreeVariable([node.body], variable)) {
    return variable;
  }
  return null;
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
  parent_context,
  { name, ...parametrization },
) => {
  const context = {
    ...parent_context,
    mode: /** @type {"strict" | "sloppy"} */ (
      parent_context.mode === "strict" || isClosureStrict(node)
        ? "strict"
        : "sloppy"
    ),
  };
  const metas = splitMeta(meta, ["drill", "result", "self", "head", "block"]);
  const sites = drill({ node, path, meta: metas.drill }, ["body", "params"]);
  const simple = every(node.params, isIdentifier);
  const outcome = listClosureParameter(node, context.mode === "strict");
  switch (outcome.type) {
    case "failure": {
      return makeSyntaxErrorExpression(outcome.error, path);
    }
    case "success": {
      const parameters = outcome.value;
      // Function declaration use the outside binding and do not declare a
      // self binding inside the function:
      // function f () { return f; }
      // const g = f;
      // f = 123;
      // console.log(g()); // 123
      const callee = isPresent(
        context.mode,
        node,
        node.type === "FunctionExpression" && node.id != null
          ? /** @type {estree.Variable} */ (node.id.name)
          : null,
      );
      const input = isPresent(
        context.mode,
        node,
        node.type === "ArrowFunctionExpression"
          ? null
          : /** @type {estree.Variable} */ ("arguments"),
      );
      return makeSelfCacheExpression(
        "constant",
        (self) =>
          guard(
            hasOwn(node, "generator") &&
              /** @type {boolean} */ (node.generator) &&
              some(node.params, isImpurePattern),
            (node) =>
              report(node, {
                name: "GeneratorParameterPattern",
                message:
                  "Generator arguments are destructured later, at the first 'next' call",
              }),
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
                { path, meta: metas.block },
                {
                  ...context,
                  closure: extendClosure(
                    context.closure,
                    parametrization.type === "constructor"
                      ? { ...parametrization, self }
                      : parametrization,
                  ),
                },
                {
                  frame: {
                    link: null,
                    kinds: reduceEntry([
                      ...(callee === null ? [] : [[callee, "callee"]]),
                      ...(input === null ? [] : [[input, "var"]]),
                      ...map(parameters, simple ? makeVarEntry : makeLetEntry),
                    ]),
                  },
                  makeBody: (context) =>
                    makeClosureBlock(
                      [],
                      [
                        ...map(
                          listHeadEffect(drillArray(sites.params), context, {
                            meta: metas.head,
                            simple,
                            self,
                            callee,
                            input,
                            path,
                          }),
                          (node) => makeEffectStatement(node, path),
                        ),
                        ...(isBlockStatementSite(sites.body)
                          ? [
                              makeBlockStatement(
                                unbuildClosureBody(sites.body, context, {
                                  parameters,
                                }),
                                path,
                              ),
                            ]
                          : []),
                      ],
                      makeReturnArgumentExpression(
                        { path, meta: metas.result },
                        context,
                        {
                          argument: isNotBlockStatementSite(sites.body)
                            ? unbuildExpression(sites.body, context, {})
                            : null,
                        },
                      ),
                      path,
                    ),
                },
              ),
              path,
            ),
          ),
        { path, meta: metas.self },
        (self) =>
          makeSequenceExpression(
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
                          some(node.params, isLengthCutoffPattern)
                            ? findIndex(node.params, isLengthCutoffPattern)
                            : node.params.length,
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
              ...(context.mode === "sloppy" &&
              parametrization.type === "function" &&
              !(hasOwn(node, "generator") && node.generator) &&
              !(hasOwn(node, "async") && node.async)
                ? [
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
                  ]
                : []),
              ...(hasPrototype(parametrization.type, node)
                ? [
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Reflect.defineProperty", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [
                          makeReadCacheExpression(self, path),
                          makePrimitiveExpression("prototype", path),
                          makeDataDescriptorExpression(
                            {
                              value: makePrototypeExpression(
                                { path },
                                {
                                  kind: parametrization.type,
                                  generator: hasOwn(node, "generator")
                                    ? !!node.generator
                                    : false,
                                  asynchronous: hasOwn(node, "async")
                                    ? !!node.async
                                    : false,
                                  konstructor: self,
                                },
                              ),
                              writable: parametrization.type === "method",
                              enumerable: false,
                              configurable:
                                parametrization.type !== "constructor",
                            },
                            path,
                          ),
                        ],
                        path,
                      ),
                      path,
                    ),
                  ]
                : []),
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
