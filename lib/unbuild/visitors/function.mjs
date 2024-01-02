// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasFreeVariable,
  hoistClosure,
  isClosureStrict,
  listPatternVariable,
} from "../query/index.mjs";
import {
  every,
  findFirstIndex,
  flatMap,
  flatMapIndex,
  guard,
  hasOwn,
  includes,
  map,
  reduceEntry,
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
import {
  makeApplyExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeFunctionExpression,
  makeArrowExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  tellLog,
  makeSequenceExpression,
} from "../node.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import {
  cacheConstant,
  cacheSelf,
  makeReadCacheExpression,
} from "../cache.mjs";
import {
  bindSequence,
  listenSequence,
  mapSequence,
  mapTwoSequence,
  sequenceClosureBlock,
  sequenceEffect,
  sequenceExpression,
  tellSequence,
  zeroSequence,
} from "../sequence.mjs";
import { makeNameExpression } from "../name.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite } from "../site.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupClosureFrame,
  setupRegularStaticFrame,
} from "../scope/index.mjs";

/**
 * @type {(
 *   node: estree.Function,
 * ) => node is estree.Function & {
 *   body: estree.BlockStatement,
 * }}
 */
const hasBlockBody = (node) => node.body.type === "BlockStatement";

/**
 * @type {(
 *   node: estree.Function,
 * ) => node is estree.Function & {
 *   body: estree.Expression,
 * }}
 */
const hasExpressionBody = (node) => node.body.type !== "BlockStatement";

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
 *   kind: import("./function").ClosureParam["type"],
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
 *   param: import("./function").ClosureParam,
 *   self: import("../cache").Cache,
 * ) => import("../scope/closure").ClosureFrame}
 */
const makeClosureFrame = (param, self) => {
  if (param.type === "arrow") {
    return { type: "closure-arrow" };
  } else if (param.type === "method") {
    return { type: "closure-method", proto: param.proto };
  } else if (param.type === "constructor") {
    return {
      type: "closure-constructor",
      derived: param.derived,
      field: param.field,
      self,
    };
  } else if (param.type === "function") {
    return { type: "closure-function" };
  } else {
    throw new AranTypeError(param);
  }
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
 *     konstructor: import("../cache").Cache,
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
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     index: number,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const unbuildParameter = ({ node, path, meta }, scope, { index }) => {
  if (node.type === "RestElement") {
    return sequenceEffect(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          index === 0
            ? makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { type: "read-input", mode: getMode(scope) },
              )
            : makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.slice", path),
                makeScopeLoadExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  { type: "read-input", mode: getMode(scope) },
                ),
                [makePrimitiveExpression(index, path)],
                path,
              ),
          path,
        ),
        (right) =>
          unbuildPattern(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            scope,
            { operation: "initialize", right },
          ),
      ),
      path,
    );
  } else {
    return sequenceEffect(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeGetExpression(
            makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { type: "read-input", mode: getMode(scope) },
            ),
            makePrimitiveExpression(index, path),
            path,
          ),
          path,
        ),
        (right) =>
          unbuildPattern(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { operation: "initialize", right },
          ),
      ),
      path,
    );
  }
};

/**
 * @type {(
 *   sites: import("../site").Site<estree.Pattern[]>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     simple: boolean,
 *     self: import("../cache").Cache,
 *     callee: estree.Variable | null,
 *     input: estree.Variable | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listHeadEffect = (
  { node, path, meta },
  scope,
  { simple, self, callee, input },
) => [
  ...(callee === null
    ? []
    : listScopeSaveEffect(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        {
          type: "initialize",
          mode: getMode(scope),
          variable: callee,
          right: self,
        },
      )),
  ...(input === null
    ? []
    : listenSequence(
        bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeApplyExpression(
              makeIntrinsicExpression("Object.fromEntries", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.entries", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { type: "read-input", mode: getMode(scope) },
                    ),
                  ],
                  path,
                ),
              ],
              path,
            ),
            path,
          ),
          (arguments_) =>
            tellSequence([
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
                          makeScopeLoadExpression(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            scope,
                            { type: "read-input", mode: getMode(scope) },
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
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadCacheExpression(arguments_, path),
                    makePrimitiveExpression("callee", path),
                    getMode(scope) === "strict" || !simple
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
              ...listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "initialize",
                  mode: getMode(scope),
                  variable: input,
                  right: arguments_,
                },
              ),
            ]),
        ),
      )),
  ...flatMapIndex(node.length, (index) =>
    unbuildParameter(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
      scope,
      { index },
    ),
  ),
];

/** @type {(node: estree.Pattern) => node is estree.Identifier} */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   node: estree.Function,
 *   mode: "strict" | "sloppy",
 * ) => {
 *   type: "success",
 *   value: estree.Variable[],
 * } | {
 *   type: "failure",
 *   error: string,
 * }}
 */
const listClosureParameter = (node, mode) => {
  const parameters = flatMap(node.params, listPatternVariable);
  if (
    node.type === "ArrowFunctionExpression" ||
    mode === "strict" ||
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
 * ) => estree.Variable | null}
 */
const getCallee = (mode, node) => {
  if (node.type !== "FunctionExpression") {
    return null;
  }
  if (node.id == null) {
    return null;
  }
  const callee = /** @type {estree.Variable} */ (node.id.name);
  if (includes(flatMap(node.params, listPatternVariable), callee)) {
    return null;
  }
  if (hasFreeVariable(node.params, callee)) {
    return callee;
  }
  // (function f () {
  //   console.assert(f === undefined);
  //   var f;
  // } ());
  if (hasOwn(hoistClosure(mode, [node.body]), callee)) {
    return null;
  }
  return hasFreeVariable([node.body], callee) ? callee : null;
};

const INPUT = /** @type {estree.Variable} */ ("arguments");

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   node: estree.Function,
 * ) => estree.Variable | null}
 */
const getInput = (_mode, node) => {
  if (
    node.type !== "FunctionExpression" &&
    node.type !== "FunctionDeclaration"
  ) {
    return null;
  }
  if (includes(flatMap(node.params, listPatternVariable), INPUT)) {
    return null;
  }
  // (function () {
  //   console.assert(typeof arguments === "object");
  //   var arguments;
  // } ());
  return hasFreeVariable([...node.params, node.body], INPUT) ? INPUT : null;
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Function>,
 *   scope: import("../scope").Scope,
 *   options: import("./function").ClosureParam & {
 *     name: import("../name").Name,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildFunction = (
  { node, path, meta },
  parent_scope,
  { name, ...param },
) => {
  const scope = isClosureStrict(node)
    ? extendScope(parent_scope, { type: "mode-use-strict" })
    : parent_scope;
  const simple = every(node.params, isIdentifier);
  const outcome = listClosureParameter(node, getMode(scope));
  switch (outcome.type) {
    case "failure": {
      return makeEarlyErrorExpression(outcome.error, path);
    }
    case "success": {
      const parameters = outcome.value;
      // Function declaration use the outside binding and do not declare a
      // self binding inside the function:
      // function f () { return f; }
      // const g = f;
      // f = 123;
      // console.log(g()); // 123
      const callee = getCallee(getMode(scope), node);
      const input = getInput(getMode(scope), node);
      return sequenceExpression(
        mapSequence(
          cacheSelf(
            forkMeta((meta = nextMeta(meta))),
            (self) =>
              guard(
                hasOwn(node, "generator") &&
                  /** @type {boolean} */ (node.generator) &&
                  some(node.params, isImpurePattern),
                (node) =>
                  tellLog(node, {
                    name: "GeneratorParameterPattern",
                    message:
                      "Generator arguments are destructured later, at the first 'next' call",
                    path,
                  }),
                (param.type === "arrow"
                  ? makeArrowExpression
                  : makeFunctionExpression)(
                  hasOwn(node, "async")
                    ? /** @type {{async: boolean}} */ (node).async
                    : false,
                  /** @type {any} */ (
                    node.type !== "ArrowFunctionExpression" &&
                    hasOwn(node, "generator")
                      ? /** @type {{generator: boolean}} */ (node).generator
                      : false
                  ),
                  sequenceClosureBlock(
                    mapSequence(
                      mapTwoSequence(
                        setupClosureFrame(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          makeClosureFrame(param, self),
                          {
                            mode: getMode(scope),
                          },
                        ),
                        setupRegularStaticFrame(
                          { path },
                          reduceEntry(
                            /** @type {[estree.Variable, "var" | "let" | "callee"][]} */ ([
                              ...(callee === null ? [] : [[callee, "callee"]]),
                              ...(input === null ? [] : [[input, "var"]]),
                              ...map(
                                parameters,
                                simple ? makeVarEntry : makeLetEntry,
                              ),
                            ]),
                          ),
                          { mode: getMode(scope), exports: {} },
                        ),
                        (frame1, frame2) =>
                          extendScope(extendScope(scope, frame1), frame2),
                      ),
                      (scope) => ({
                        body: [
                          ...map(
                            listHeadEffect(
                              drillSite(
                                node,
                                path,
                                forkMeta((meta = nextMeta(meta))),
                                "params",
                              ),
                              scope,
                              { simple, self, callee, input },
                            ),
                            (node) => makeEffectStatement(node, path),
                          ),
                          ...(hasBlockBody(node)
                            ? unbuildClosureBody(
                                drillSite(
                                  node,
                                  path,
                                  forkMeta((meta = nextMeta(meta))),
                                  "body",
                                ),
                                scope,
                                {
                                  parameters: [
                                    ...(input === null ? [] : [input]),
                                    // we do not pass the callee because
                                    // it is undefined in case of clash
                                    // (function f () {
                                    //   console.assert(f === undefined);
                                    //   var f;
                                    // } ());
                                    ...parameters,
                                  ],
                                },
                              )
                            : []),
                        ],
                        completion: sequenceExpression(
                          mapSequence(
                            hasExpressionBody(node)
                              ? cacheConstant(
                                  forkMeta((meta = nextMeta(meta))),
                                  unbuildExpression(
                                    drillSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "body",
                                    ),
                                    scope,
                                    null,
                                  ),
                                  path,
                                )
                              : zeroSequence(null),
                            (result) =>
                              makeScopeLoadExpression(
                                {
                                  path,
                                  meta: forkMeta((meta = nextMeta(meta))),
                                },
                                scope,
                                {
                                  type: "wrap-result",
                                  mode: getMode(scope),
                                  result,
                                },
                              ),
                          ),
                          path,
                        ),
                      }),
                    ),
                    path,
                  ),
                  path,
                ),
              ),
            path,
          ),
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
                              ? findFirstIndex(
                                  node.params,
                                  isLengthCutoffPattern,
                                )
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
                          value: makeNameExpression({ path }, name),
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
                ...(getMode(scope) === "sloppy" &&
                node.type !== "ArrowFunctionExpression" &&
                !(hasOwn(node, "generator") && node.generator) &&
                !(hasOwn(node, "async") && node.async)
                  ? [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.defineProperty",
                            path,
                          ),
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
                          makeIntrinsicExpression(
                            "Reflect.defineProperty",
                            path,
                          ),
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
                ...(hasPrototype(param.type, node)
                  ? [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.defineProperty",
                            path,
                          ),
                          makePrimitiveExpression({ undefined: null }, path),
                          [
                            makeReadCacheExpression(self, path),
                            makePrimitiveExpression("prototype", path),
                            makeDataDescriptorExpression(
                              {
                                value: makePrototypeExpression(
                                  { path },
                                  {
                                    kind: param.type,
                                    generator: hasOwn(node, "generator")
                                      ? !!node.generator
                                      : false,
                                    asynchronous: hasOwn(node, "async")
                                      ? !!node.async
                                      : false,
                                    konstructor: self,
                                  },
                                ),
                                writable: param.type === "method",
                                enumerable: false,
                                configurable: param.type !== "constructor",
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
        ),
        path,
      );
    }
    default: {
      throw new AranTypeError(outcome);
    }
  }
};
