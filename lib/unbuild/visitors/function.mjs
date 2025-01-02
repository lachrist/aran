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
  find,
  filterOut,
  callSequence____X,
  liftSequenceXX,
  filterMap,
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
import {
  extendEvalScope,
  getDuplicableVariable,
  isBindingDuplicable,
  unbuildClosureBody,
} from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
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
  extendClosureVariable,
  extendConstructorRoutine,
  extendFunctionRoutine,
  extendMethodRoutine,
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
 *     callee: null | import("../annotation/hoisting").Binding,
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
    return extendProxyVariable(
      hash,
      meta,
      { bindings: [{ proxy: self, binding: callee }] },
      scope,
    );
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
const unbuildParameter = (node, meta, scope, kind, index) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return callSequence____X(
      unbuildPattern,
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
      unbuildPattern,
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
 *   binding: import("../annotation/hoisting").Binding,
 * ) => boolean}
 */
const isArgumentListBinding = (binding) => binding.initial === "arguments";

/**
 * @type {(
 *   nodes: import("estree-sentry").RestablePattern<import("../../hash").HashProp>[],
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
          unbuildParameter(
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
 * @type {<X>(
 *   bindings: import("../annotation/hoisting").Binding[],
 *   options: {
 *     node: import("estree-sentry").Function<X>,
 *     mode: import("../mode").Mode,
 *     simple: boolean,
 *   },
 * ) => {
 *   selection: null | import("estree-sentry").VariableName[],
 *   remainder: import("../annotation/hoisting").Binding[],
 * }}
 */
const extractEvalFrame = (bindings, { node, mode, simple }) => {
  if (
    simple ? hasDirectEvalCall(node.body) : some(node.params, hasDirectEvalCall)
  ) {
    switch (mode) {
      case "strict": {
        return {
          selection: EMPTY,
          remainder: bindings,
        };
      }
      case "sloppy": {
        return {
          selection: filterMap(bindings, getDuplicableVariable),
          remainder: filterOut(bindings, isBindingDuplicable),
        };
      }
      default: {
        throw new AranTypeError(mode);
      }
    }
  } else {
    return {
      selection: null,
      remainder: bindings,
    };
  }
};

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
export const unbuildFunction = (node, meta, parent_scope, param, name) => {
  const { _hash: hash } = node;
  const scope =
    node.body.type === "BlockStatement" && hasUseStrictDirective(node.body.body)
      ? extendStrict(parent_scope)
      : parent_scope;
  const callee_binding_array = hoist(hash, scope.annotation);
  const callee = find(callee_binding_array, isCalleeBinding);
  const bindings = filterOut(callee_binding_array, isCalleeBinding);
  const has_argument_list = some(bindings, isArgumentListBinding);
  const simple = every(node.params, isIdentifier);
  const { selection, remainder } = extractEvalFrame(bindings, {
    node,
    simple,
    mode: scope.mode,
  });
  const has_return_statement =
    node.body.type === "BlockStatement" && hasReturnStatement(node.body);
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
                    { bindings: remainder },
                    callSequence___X(
                      extendEvalScope,
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      { variables: selection },
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
                          extendClosureScope(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            { param, self },
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
                            unbuildClosureBody(
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
                            : unbuildExpression(
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
                          writable: param.type !== "constructor",
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
