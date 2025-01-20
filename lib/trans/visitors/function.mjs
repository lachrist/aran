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
  findFirstIndex,
  map,
  mapIndex,
  some,
  tuple2,
  NULL_SEQUENCE,
  bindSequence,
  callSequence___X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X__,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_XXX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  mapSequence,
  zeroSequence,
  every,
  filterOut,
  callSequence____X,
  liftSequenceXX,
  findNarrow,
  get0,
  filter,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
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
import { extendEvalScope, transClosureBody } from "./body.mjs";
import { transExpression } from "./expression.mjs";
import { transPattern } from "./pattern.mjs";
import { incorporateRoutineBlock } from "../prelude/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import { makeNameExpression } from "../name.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendClosureRoutine,
  extendClosureVariable,
  extendNormalRegularVariable,
  extendProxyVariable,
  extendResultRoutine,
  extendStrict,
  listWriteVariableEffect,
  makeFinalizeResultExpression,
  makeFinalizeResultOperation,
  makeInitVariableOperation,
  makeReadInputExpression,
} from "../scope/index.mjs";
import { hoist } from "../annotation/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 * ) => boolean}
 */
const isLengthCutoffPattern = ({ type }) =>
  type === "RestElement" || type === "AssignmentPattern";

/**
 * @type {(
 *   kind: import("../closure").Closure["type"],
 *   node: import("estree-sentry").Function<import("../hash").HashProp>,
 * ) => "none" | "plain" | "generator" | "async-generator" }
 */
const getPrototypeKind = (kind, node) => {
  if (node.type === "ArrowFunctionExpression") {
    return "none";
  } else {
    if (node.generator) {
      return node.async ? "async-generator" : "generator";
    } else {
      if (kind === "constructor") {
        return "plain";
      } else if (kind === "plain") {
        return node.async ? "none" : "plain";
      } else if (kind === "method") {
        return "none";
      } else {
        throw new AranTypeError(kind);
      }
    }
  }
};

/**
 * @type {(
 *   options: {
 *     closure: import("../closure").Closure,
 *     self: import("../cache").Cache,
 *     node: import("estree-sentry").Function<unknown>,
 *   },
 * ) => import("../scope/routine").Closure}
 */
const makeScopeClosure = ({ closure, self, node }) => {
  if (node.type === "ArrowFunctionExpression") {
    return { type: "arrow", asynchronous: node.async, generator: false };
  } else {
    switch (closure.type) {
      case "constructor": {
        return {
          ...closure,
          asynchronous: false,
          generator: false,
          self,
        };
      }
      case "method": {
        return {
          ...closure,
          asynchronous: node.async,
          generator: node.generator,
        };
      }
      case "plain": {
        return {
          type: "function",
          asynchronous: node.async,
          generator: node.generator,
        };
      }
      default: {
        throw new AranTypeError(closure);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../hash").Hash,
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
 *   binding: import("../annotation/hoisting").FrameEntry,
 * ) => binding is [
 *   import("estree-sentry").VariableName,
 *   ["function-self-sloppy" | "function-self-strict"],
 * ]}
 */
const isCalleeBinding = (binding) => {
  const { 1: kinds } = binding;
  if (kinds.length === 1) {
    const kind = kinds[0];
    return kind === "function-self-sloppy" || kind === "function-self-strict";
  } else {
    return false;
  }
};

/**
 * @type {(
 *   bindings: import("../annotation/hoisting").FrameEntry[],
 * ) => {
 *   selection: null | [
 *     import("estree-sentry").VariableName,
 *     ["function-self-sloppy" | "function-self-strict"],
 *   ],
 *   remainder: import("../annotation/hoisting").FrameEntry[],
 * }}
 */
const extractCalleeFrame = (bindings) => ({
  selection: findNarrow(bindings, isCalleeBinding),
  remainder: filterOut(bindings, isCalleeBinding),
});

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("../meta").Meta,
 *   options: {
 *     callee: null | [
 *       import("estree-sentry").VariableName,
 *       ["function-self-sloppy" | "function-self-strict"],
 *     ],
 *     self: import("../cache").WritableCache,
 *   },
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   never,
 *   import("../scope").Scope,
 * >}
 */
const extendCalleeScope = (hash, meta, { callee, self }, scope) => {
  if (callee === null) {
    return zeroSequence(scope);
  } else {
    const {
      0: variable,
      1: { 0: kind },
    } = callee;
    return extendProxyVariable(
      hash,
      meta,
      { bindings: [[variable, { proxy: self, kind }]] },
      scope,
    );
  }
};

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   kind: (
 *     | "plain"
 *     | "generator"
 *     | "async-generator"
 *   ),
 *   self: import("../cache").Cache,
 * ) => import("../atom").Expression}
 */
const makePrototypeExpression = (hash, kind, self) => {
  switch (kind) {
    case "plain": {
      return makeApplyExpression(
        makeIntrinsicExpression("Object.defineProperty", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object.create", hash),
            makeIntrinsicExpression("undefined", hash),
            [makeIntrinsicExpression("Object.prototype", hash)],
            hash,
          ),
          makePrimitiveExpression("constructor", hash),
          makeDataDescriptorExpression(
            {
              value: makeReadCacheExpression(self, hash),
              writable: true,
              enumerable: false,
              configurable: true,
            },
            hash,
          ),
        ],
        hash,
      );
    }
    case "generator": {
      return makeApplyExpression(
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression(
            "aran.GeneratorFunction.prototype.prototype",
            hash,
          ),
        ],
        hash,
      );
    }
    case "async-generator": {
      return makeApplyExpression(
        makeIntrinsicExpression("Object.create", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeIntrinsicExpression(
            "aran.AsyncGeneratorFunction.prototype.prototype",
            hash,
          ),
        ],
        hash,
      );
    }
    default: {
      throw new AranTypeError(kind);
    }
  }
};

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
 *   node: import("estree-sentry").RestablePattern<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 *   index: number,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const transParameter = (node, meta, scope, kind, index) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return callSequence____X(
      transPattern,
      node.argument,
      forkMeta((meta = nextMeta(meta))),
      scope,
      kind,
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
    return callSequence____X(
      transPattern,
      node,
      forkMeta((meta = nextMeta(meta))),
      scope,
      kind,
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
 *   binding: import("../annotation/hoisting").FrameEntry,
 * ) => boolean}
 */
const isArgumentListBinding = ({ 1: kinds }) =>
  kinds.length === 1 && kinds[0] === "arguments";

/**
 * @type {(
 *   nodes: import("estree-sentry").RestablePattern<import("../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   kind: "write" | "initialize",
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   [
 *     import("../../util/tree").Tree<import("../atom").Effect>,
 *     import("../scope").Scope,
 *   ],
 * >}
 */
const listParameterEffect = (nodes, meta, scope, kind) => {
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
          transParameter(
            nodes[index],
            forkMeta((meta = nextMeta(meta))),
            scope,
            kind,
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
 * @type {<X>(
 *   node: import("estree-sentry").RestablePattern<X>,
 * ) => node is import("estree-sentry").VariableIdentifier<X>}
 */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   simple: boolean,
 *   callee: import("../cache").Cache,
 *   hash: import("../hash").Hash,
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
 *   hash: import("../hash").Hash,
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
 *   node: import("estree-sentry").Function<import("../hash").HashProp>,
 *   closure: import("../closure").Closure,
 * ) => import("../../lang/syntax").ClosureKind}
 */
const getClosureKind = (node, closure) => {
  if (node.type === "ArrowFunctionExpression") {
    return "arrow";
  } else {
    if (node.generator) {
      return "generator";
    } else {
      switch (closure.type) {
        case "constructor": {
          return "function";
        }
        case "method": {
          return "method";
        }
        case "plain": {
          return "function";
        }
        default: {
          throw new AranTypeError(closure);
        }
      }
    }
  }
};

// arguments must be in eval frame:
//
// (function () {
//   eval("var arguments;");
//   return arguments;
// })(); // [Arguments] {}
//
// parameter must be in eval frame:
//
// (function (x) {
//   eval("var x;");
//   return x;
// })(123); // 123
//
// callee must be out of eval frame:
//
// (function f() {
//   eval("var f;");
//   return f;
// })(); // undefined

/**
 * @type {(
 *   binding: import("../annotation/hoisting").Kind,
 * ) => boolean}
 */
const isSimpleHeadEvalKind = (kind) =>
  kind === "arguments" || kind === "param-simple";

/**
 * @type {(
 *   binding: import("../annotation/hoisting").FrameEntry,
 * ) => boolean}
 */
const isSimpleHeadEvalBinding = ({ 1: kinds }) =>
  every(kinds, isSimpleHeadEvalKind);

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   closure: import("../closure").Closure,
 *   name: import("../name").Name,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const transFunction = (node, meta, parent_scope, closure, name) => {
  const { _hash: hash } = node;
  const scope =
    node.body.type === "BlockStatement" && hasUseStrictDirective(node.body.body)
      ? extendStrict(parent_scope)
      : parent_scope;
  const { selection: callee, remainder: bindings } = extractCalleeFrame(
    hoist(hash, scope.annotation),
  );
  const has_argument_list = some(bindings, isArgumentListBinding);
  const simple = every(node.params, isIdentifier);
  const prototype_kind = getPrototypeKind(closure.type, node);
  const has_return_statement =
    node.body.type === "BlockStatement" && hasReturnStatement(node.body);
  const has_body_direct_eval_call = hasDirectEvalCall(node.body);
  const has_head_direct_eval_call = some(node.params, hasDirectEvalCall);
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
              getClosureKind(node, closure),
              node.async,
              incorporateRoutineBlock(
                bindSequence(
                  callSequence___X(
                    extendNormalRegularVariable,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    {
                      bindings:
                        simple && has_body_direct_eval_call
                          ? filterOut(bindings, isSimpleHeadEvalBinding)
                          : bindings,
                    },
                    callSequence___X(
                      extendEvalScope,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      {
                        variables: simple
                          ? has_body_direct_eval_call
                            ? map(
                                filter(bindings, isSimpleHeadEvalBinding),
                                get0,
                              )
                            : null
                          : has_head_direct_eval_call
                            ? EMPTY
                            : null,
                      },
                      callSequence___X(
                        extendCalleeScope,
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        { callee, self },
                        callSequence___X(
                          extendResultScope,
                          hash,
                          forkMeta((meta = nextMeta(meta))),
                          { has_return_statement },
                          extendClosureRoutine(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            makeScopeClosure({ closure, self, node }),
                            extendClosureVariable(scope),
                          ),
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
                      liftSequenceXX(
                        concat__,
                        has_argument_list
                          ? callSequence___X(
                              listWriteVariableEffect,
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              callSequence___X(
                                // init operation to prevent reporting this
                                // as a early syntax error in strict mode.
                                makeInitVariableOperation,
                                hash,
                                scope.mode,
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
                            )
                          : NULL_SEQUENCE,
                        mapSequence(
                          listParameterEffect(
                            node.params,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            simple ? "write" : "initialize",
                          ),
                          updateScope,
                        ),
                      ),
                      node.body.type === "BlockStatement"
                        ? liftSequenceX_(
                            makeBlockStatement,
                            transClosureBody(
                              node.body,
                              forkMeta((meta = nextMeta(meta))),
                              scope,
                              // With simple parameter,
                              // the binding should
                              // not be initialized
                              // with undefined.
                              // Instead, it should
                              // keep its value.
                              //
                              // (((f) => {
                              //   eval(`
                              //     // { f: 123 }
                              //     console.log({ f });
                              //     { function f () {} }
                              //   `);
                              // }) (123))
                              {
                                has_direct_eval_call: simple
                                  ? false
                                  : hasDirectEvalCall(node.body),
                                has_return_statement,
                              },
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
                          node.body.type === "BlockStatement"
                            ? zeroSequence(null)
                            : transExpression(
                                node.body,
                                forkMeta((meta = nextMeta(meta))),
                                scope,
                              ),
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
            closure.type === "plain"
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
          prototype_kind !== "none"
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
                          value: makePrototypeExpression(
                            hash,
                            prototype_kind,
                            self,
                          ),
                          writable: closure.type !== "constructor",
                          enumerable: false,
                          configurable: false,
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
