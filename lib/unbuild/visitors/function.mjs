// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasDirectEvalCall,
  hasReturnStatement,
  hasUseStrictDirective,
} from "../query/index.mjs";
import {
  EMPTY,
  concatXX,
  concat__,
  concat___,
  concat___XX,
  everyNarrow,
  findFirstIndex,
  guard,
  hasNarrowObject,
  map,
  mapIndex,
  some,
  tuple2,
  NULL_SEQUENCE,
  bindSequence,
  callSequence___X,
  flatSequence,
  liftSequenceX,
  liftSequenceXXX,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X__,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_XXX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
} from "../../util/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  makeDataDescriptor,
  makeDataDescriptorExpression,
  makeGetExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeRoutineBlock,
  makeConditionalExpression,
  makeEffectStatement,
  makeClosureExpression as makeClosureExpressionInner,
  makeBlockStatement,
  makeTreeRoutineBlock,
} from "../node.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildInitializePattern } from "./pattern.mjs";
import { incorporateRoutineBlock } from "../prelude/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import { makeNameExpression } from "../name.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendArrowRoutine,
  extendConstructorRoutine,
  extendEvalVariable,
  extendFunctionRoutine,
  extendMethodRoutine,
  extendNormalRegularVariable,
  extendResultRoutine,
  extendStrict,
  listInitializeVariableEffect,
  makeAssignVariableOperation,
  makeFinalizeResultExpression,
  makeFinalizeResultOperation,
  makeReadInputExpression,
} from "../scope/index.mjs";
import { hoist } from "../annotation/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").Function<import("../../hash").HashProp> & {
 *   body: import("estree-sentry").BlockStatement<import("../../hash").HashProp>,
 * }}
 */
const hasBlockBody = (node) => node.body.type === "BlockStatement";

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").Function<import("../../hash").HashProp> & {
 *   body: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const hasExpressionBody = (node) => node.body.type !== "BlockStatement";

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 * ) => boolean}
 */
const isLengthCutoffPattern = ({ type }) =>
  type === "RestElement" || type === "AssignmentPattern";

/**
 * @type {(
 *   kind: import("../param").Param["type"],
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 * ) => boolean}
 */
const hasPrototype = (kind, node) => {
  if (kind === "arrow") {
    return false;
  }
  if (hasNarrowObject(node, "generator") && node.generator) {
    return true;
  }
  if (hasNarrowObject(node, "async") && node.async) {
    return false;
  }
  return kind !== "method";
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *     param: import("../param").Param,
 *     self: import("../cache").Cache,
 *   },
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope
 * >}
 */
const extendClosureScope = (hash, meta, { param, self }, scope) => {
  switch (param.type) {
    case "arrow": {
      return extendArrowRoutine(hash, meta, {}, scope);
    }
    case "constructor": {
      return extendConstructorRoutine(
        hash,
        meta,
        { derived: param.derived, self, field: param.field },
        scope,
      );
    }
    case "function": {
      return extendFunctionRoutine(hash, meta, { mode: scope.mode }, scope);
    }
    case "method": {
      return extendMethodRoutine(hash, meta, { proto: param.proto }, scope);
    }
    default: {
      throw new AranTypeError(param);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *     has_return_statement: boolean,
 *   },
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").MetaDeclarationPrelude,
 *   import("../scope").Scope,
 * >}
 */
const extendResultScope = (hash, meta, { has_return_statement }, scope) => {
  if (has_return_statement) {
    return extendResultRoutine(hash, meta, {}, scope);
  } else {
    return zeroSequence(scope);
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *     has_direct_eval_call: boolean,
 *   },
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   (
 *     | import("../prelude").MetaDeclarationPrelude
 *     | import("../prelude").PrefixPrelude
 *   ),
 *   import("../scope").Scope,
 * >}
 */
const extendEvalScope = (hash, meta, { has_direct_eval_call }, scope) => {
  if (has_direct_eval_call) {
    return extendEvalVariable(hash, meta, {}, scope);
  } else {
    return zeroSequence(scope);
  }
};

/**
 * @type {(
 *   generator: boolean,
 *   asynchronous: boolean,
 * ) => import("../../lang/syntax").Intrinsic}
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
 *   hash: import("../../hash").Hash,
 *   options: {
 *     kind: "arrow" | "function" | "constructor" | "method",
 *     generator: boolean,
 *     asynchronous: boolean,
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../atom").Expression}
 */
const makePrototypeExpression = (
  hash,
  { kind, generator, asynchronous, konstructor },
) =>
  guard(
    kind !== "method" && !asynchronous && !generator,
    (node) =>
      makeApplyExpression(
        makeIntrinsicExpression("Object.defineProperty", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          node,
          makePrimitiveExpression("constructor", hash),
          makeDataDescriptorExpression(
            {
              value: makeReadCacheExpression(konstructor, hash),
              writable: true,
              enumerable: false,
              configurable: true,
            },
            hash,
          ),
        ],
        hash,
      ),
    makeApplyExpression(
      makeIntrinsicExpression("Object.create", hash),
      makeIntrinsicExpression("undefined", hash),
      [
        makeIntrinsicExpression(
          getPrototypePrototype(generator, asynchronous),
          hash,
        ),
      ],
      hash,
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
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   index: number,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const unbuildParameter = (node, meta, scope, index) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return callSequence___X(
      unbuildInitializePattern,
      node.argument,
      forkMeta((meta = nextMeta(meta))),
      scope,
      index === 0
        ? makeReadInputExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            {},
          )
        : liftSequence_X__(
            makeApplyExpression,
            makeIntrinsicExpression("Array.prototype.slice", hash),
            makeReadInputExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              {},
            ),
            [makePrimitiveExpression(index, hash)],
            hash,
          ),
    );
  } else {
    return callSequence___X(
      unbuildInitializePattern,
      node,
      forkMeta((meta = nextMeta(meta))),
      scope,
      liftSequenceXX__(
        makeConditionalExpression,
        // Object.hasOwn guard to avoid accessing the prototype chain
        liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Object.hasOwn", hash),
          makeIntrinsicExpression("undefined", hash),
          liftSequenceX_(
            concat__,
            makeReadInputExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              {},
            ),
            makePrimitiveExpression(index, hash),
          ),
          hash,
        ),
        liftSequenceX__(
          makeGetExpression,
          makeReadInputExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            {},
          ),
          makePrimitiveExpression(index, hash),
          hash,
        ),
        makeIntrinsicExpression("undefined", hash),
        hash,
      ),
    );
  }
};

/**
 * @type {(
 *   binding: import("../annotation/hoisting").Binding,
 * ) => boolean}
 */
const isArgumentListBinding = (binding) => binding.initial === "arguments";

/**
 * @type {(
 *   nodes: import("estree-sentry").RestablePattern<import("../../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const listParameterEffect = (nodes, meta, scope) => {
  /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
  const updateScope = (pair) => {
    // eslint-disable-next-line local/no-impure
    scope = pair[1];
    return pair[0];
  };
  return liftSequenceX_(
    tuple2,
    flatSequence(
      mapIndex(nodes.length, (index) =>
        mapSequence(
          unbuildParameter(
            nodes[index],
            forkMeta((meta = nextMeta(meta))),
            scope,
            index,
          ),
          updateScope,
        ),
      ),
    ),
    scope,
  );
};

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").VariableIdentifier<import("../../hash").HashProp>}
 */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   simple: boolean,
 *   callee: import("../cache").Cache,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
const makeCalleeExpression = (mode, simple, callee, hash) => {
  if (mode === "sloppy") {
    return simple
      ? makeReadCacheExpression(callee, hash)
      : makePrimitiveExpression(null, hash);
  } else if (mode === "strict") {
    return makePrimitiveExpression(null, hash);
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   kind: import("../../lang/syntax").ClosureKind,
 *   asynchronous: boolean,
 *   body: import("../atom").RoutineBlock,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
const makeClosureExpression = (kind, asynchronous, body, hash) => {
  if (kind === "arrow" || kind === "function" || kind === "method") {
    return makeClosureExpressionInner(
      kind,
      asynchronous,
      makeRoutineBlock(
        body.bindings,
        null,
        body.head === null
          ? body.body
          : concatXX(
              map(body.head, (node) => makeEffectStatement(node, hash)),
              body.body,
            ),
        body.tail,
        hash,
      ),
      hash,
    );
  } else if (kind === "generator") {
    return makeClosureExpressionInner(kind, asynchronous, body, hash);
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 *   param: import("../param").Param,
 * ) => import("../../lang/syntax").ClosureKind}
 */
const getClosureKind = (node, param) => {
  if (hasNarrowObject(node, "generator") && node.generator) {
    return "generator";
  } else if (param.type === "constructor") {
    return "function";
  } else if (
    param.type === "method" ||
    param.type === "arrow" ||
    param.type === "function"
  ) {
    return param.type;
  } else {
    throw new AranTypeError(param);
  }
};

/**
 * @type {(
 *   binding: import("../annotation/hoisting").Binding,
 * ) => boolean}
 */
const isCalleeBinding = (binding) => binding.initial === "self-function";

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   param: import("../param").Param,
 *   name: import("../name").Name,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildFunction = (node, meta, scope, param, name) => {
  const { _hash: hash } = node;
  const bindings = hoist(hash, scope.annotation);
  // Function declaration use the outside binding and do not declare a
  // self binding inside the function:
  // function f () { return f; }
  // const g = f;
  // f = 123;
  // console.log(g()); // 123
  const callee =
    node.id != null && some(bindings, isCalleeBinding) ? node.id.name : null;
  const has_argument_list = some(bindings, isArgumentListBinding);
  const simple = everyNarrow(node.params, isIdentifier);
  return bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
    (self) =>
      liftSequenceX__(
        makeSequenceExpression,
        liftSequenceX_X__(
          concat___XX,
          liftSequence_X_(
            makeWriteCacheEffect,
            self,
            liftSequence__X_(
              makeClosureExpression,
              getClosureKind(node, param),
              node.async,
              incorporateRoutineBlock(
                bindSequence(
                  callSequence___X(
                    extendNormalRegularVariable,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    { bindings },
                    callSequence___X(
                      extendEvalScope,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      {
                        has_direct_eval_call: some(
                          simple ? [node.body] : node.params,
                          hasDirectEvalCall,
                        ),
                      },
                      callSequence___X(
                        extendResultScope,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        {
                          has_return_statement:
                            node.body.type === "BlockStatement" &&
                            hasReturnStatement(node.body),
                        },
                        extendClosureScope(
                          hash,
                          forkMeta((meta = nextMeta(meta))),
                          { param, self },
                          node.body.type === "BlockStatement" &&
                            hasUseStrictDirective(node.body.body)
                            ? extendStrict(scope)
                            : scope,
                        ),
                      ),
                    ),
                  ),
                  (scope) => {
                    /** @type {<X>(pair: [X, import("../scope").Scope]) => X} */
                    const updateScope = (pair) => {
                      // eslint-disable-next-line local/no-impure
                      scope = pair[1];
                      return pair[0];
                    };
                    return liftSequence_XXX_(
                      makeTreeRoutineBlock,
                      [],
                      liftSequenceXXX(
                        concat___,
                        callee === null
                          ? NULL_SEQUENCE
                          : mapSequence(
                              listInitializeVariableEffect(
                                hash,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                                {
                                  variable: callee,
                                  right: makeReadCacheExpression(self, hash),
                                },
                              ),
                              updateScope,
                            ),
                        has_argument_list
                          ? mapSequence(
                              callSequence___X(
                                listInitializeVariableEffect,
                                hash,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                                liftSequence_X(
                                  makeAssignVariableOperation,
                                  /** @type {import("estree-sentry").VariableName} */ (
                                    "arguments"
                                  ),
                                  liftSequence__X_(
                                    makeApplyExpression,
                                    makeIntrinsicExpression(
                                      "aran.toArgumentList",
                                      hash,
                                    ),
                                    makeIntrinsicExpression("undefined", hash),
                                    liftSequenceX_(
                                      concat__,
                                      makeReadInputExpression(
                                        hash,
                                        forkMeta((meta = nextMeta(meta))),
                                        scope,
                                        {},
                                      ),
                                      makeCalleeExpression(
                                        scope.mode,
                                        simple,
                                        self,
                                        hash,
                                      ),
                                    ),
                                    hash,
                                  ),
                                ),
                              ),
                              updateScope,
                            )
                          : NULL_SEQUENCE,
                        mapSequence(
                          listParameterEffect(
                            node.params,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                          ),
                          updateScope,
                        ),
                      ),
                      hasBlockBody(node)
                        ? liftSequenceX_(
                            makeBlockStatement,
                            unbuildClosureBody(
                              node.body,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              simple,
                            ),
                            hash,
                          )
                        : NULL_SEQUENCE,
                      callSequence___X(
                        makeFinalizeResultExpression,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        liftSequenceX(
                          makeFinalizeResultOperation,
                          hasExpressionBody(node)
                            ? unbuildExpression(
                                node.body,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                              )
                            : zeroSequence(null),
                        ),
                      ),
                      hash,
                    );
                  },
                ),
                hash,
              ),
              hash,
            ),
            hash,
          ),
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              [
                makeReadCacheExpression(self, hash),
                makePrimitiveExpression("length", hash),
                makeDataDescriptorExpression(
                  {
                    value: makePrimitiveExpression(
                      some(node.params, isLengthCutoffPattern)
                        ? findFirstIndex(node.params, isLengthCutoffPattern)
                        : node.params.length,
                      hash,
                    ),
                    writable: false,
                    enumerable: false,
                    configurable: true,
                  },
                  hash,
                ),
              ],
              hash,
            ),
            hash,
          ),
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Reflect.defineProperty", hash),
              makeIntrinsicExpression("undefined", hash),
              liftSequence__X(
                concat___,
                makeReadCacheExpression(self, hash),
                makePrimitiveExpression("name", hash),
                liftSequenceX_(
                  makeDataDescriptorExpression,
                  liftSequenceX___(
                    makeDataDescriptor,
                    makeNameExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      name,
                    ),
                    false,
                    false,
                    true,
                  ),
                  hash,
                ),
              ),
              hash,
            ),
            hash,
          ),
          scope.mode === "sloppy" &&
            node.type !== "ArrowFunctionExpression" &&
            !node.generator &&
            !node.async &&
            param.type === "function"
            ? [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeReadCacheExpression(self, hash),
                      makePrimitiveExpression("arguments", hash),
                      makeDataDescriptorExpression(
                        {
                          value: makePrimitiveExpression(null, hash),
                          writable: false,
                          enumerable: false,
                          configurable: true,
                        },
                        hash,
                      ),
                    ],
                    hash,
                  ),
                  hash,
                ),
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeReadCacheExpression(self, hash),
                      makePrimitiveExpression("caller", hash),
                      makeDataDescriptorExpression(
                        {
                          value: makePrimitiveExpression(null, hash),
                          writable: false,
                          enumerable: false,
                          configurable: true,
                        },
                        hash,
                      ),
                    ],
                    hash,
                  ),
                  hash,
                ),
              ]
            : EMPTY,
          hasPrototype(param.type, node)
            ? [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.defineProperty", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeReadCacheExpression(self, hash),
                      makePrimitiveExpression("prototype", hash),
                      makeDataDescriptorExpression(
                        {
                          value: makePrototypeExpression(hash, {
                            kind: param.type,
                            generator: node.generator,
                            asynchronous: node.async,
                            konstructor: self,
                          }),
                          writable: param.type === "method",
                          enumerable: false,
                          configurable: param.type !== "constructor",
                        },
                        hash,
                      ),
                    ],
                    hash,
                  ),
                  hash,
                ),
              ]
            : EMPTY,
        ),
        makeReadCacheExpression(self, hash),
        hash,
      ),
  );
};
