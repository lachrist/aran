// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasDirectEvalCall,
  hasReturnStatement,
  hasUseStrictDirective,
} from "../query/index.mjs";
import {
  EMPTY,
  compileGet,
  concatXX,
  concatXXX,
  concat_,
  concat__,
  concat___,
  concat___XX,
  everyNarrow,
  findFirstIndex,
  flat,
  guard,
  hasNarrowObject,
  includes,
  map,
  mapIndex,
  some,
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
} from "../node.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { incorporateRoutineBlock } from "../prelude/index.mjs";
import {
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence___X,
  callSequence____X,
  flatSequence,
  liftSequenceX,
  liftSequenceXX,
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
  zeroSequence,
} from "../../sequence.mjs";
import { makeNameExpression } from "../name.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  listScopeSaveEffect,
  makeInitializeOperation,
  makeScopeLoadExpression,
  setupRoutineFrame,
  setupEvalFrame,
  makeFinalizeResultOperation,
  setupRegularFrame,
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
 *   param: import("../param").Param,
 *   self: import("../cache").Cache,
 *   delay_return_error: null | import("../cache").WritableCache,
 * ) => import("../scope/routine").RoutineFrame}
 */
const makeRoutineFrame = (param, self, result) => {
  if (param.type === "arrow") {
    return {
      type: "routine",
      kind: "arrow",
      result,
    };
  } else if (param.type === "method") {
    return {
      type: "routine",
      kind: "method",
      proto: param.proto,
      result,
    };
  } else if (param.type === "constructor") {
    return {
      type: "routine",
      kind: "constructor",
      derived: param.derived,
      field: param.field,
      self,
      result,
    };
  } else if (param.type === "function") {
    return {
      type: "routine",
      kind: "function",
      result,
    };
  } else {
    throw new AranTypeError(param);
  }
};

/**
 * @type {(
 *   generator: boolean,
 *   asynchronous: boolean,
 * ) => import("../../lang").Intrinsic}
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

const ARGUMENTS = /** @type {import("estree-sentry").VariableName} */ (
  "arguments"
);

/** @type {import("../annotation/hoisting-public").Binding} */
const ARGUMENTS_BINDING = {
  variable: ARGUMENTS,
  baseline: "live",
  write: "perform",
  sloppy_function: "nope",
};

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => import("../annotation/hoisting-public").Binding}
 */
const makeCalleeBinding = (variable) => ({
  variable,
  baseline: "live",
  write: "ignore",
  sloppy_function: "nope",
});

/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   index: number,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildParameter = (node, meta, context, index) => {
  const { _hash: hash } = node;
  if (node.type === "RestElement") {
    return callSequence____X(
      unbuildPattern,
      node.argument,
      forkMeta((meta = nextMeta(meta))),
      context,
      "let",
      index === 0
        ? makeScopeLoadExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            context.scope,
            { type: "read-input", mode: context.mode },
          )
        : liftSequence_X__(
            makeApplyExpression,
            makeIntrinsicExpression("Array.prototype.slice", hash),
            makeScopeLoadExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              context.scope,
              { type: "read-input", mode: context.mode },
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
      context,
      "let",
      liftSequenceXX__(
        makeConditionalExpression,
        // Object.hasOwn guard to avoid accessing the prototype chain
        liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Object.hasOwn", hash),
          makeIntrinsicExpression("undefined", hash),
          liftSequenceX_(
            concat__,
            makeScopeLoadExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              context.scope,
              { type: "read-input", mode: context.mode },
            ),
            makePrimitiveExpression(index, hash),
          ),
          hash,
        ),
        liftSequenceX__(
          makeGetExpression,
          makeScopeLoadExpression(
            hash,
            forkMeta((meta = nextMeta(meta))),
            context.scope,
            { type: "read-input", mode: context.mode },
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
 *   nodes: import("estree-sentry").RestablePattern<import("../../hash").HashProp>[],
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const listParameterEffect = (nodes, meta, context) =>
  liftSequenceX(
    flat,
    flatSequence(
      mapIndex(nodes.length, (index) =>
        unbuildParameter(
          nodes[index],
          forkMeta((meta = nextMeta(meta))),
          context,
          index,
        ),
      ),
    ),
  );

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
 *   kind: import("../../lang").ClosureKind,
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
 * ) => import("../../lang").ClosureKind}
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

const getVariable = compileGet("variable");

/**
 * @type {(
 *   node: import("estree-sentry").Function<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 *   param: import("../param").Param,
 *   name: import("../name").Name,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildFunction = (node, meta, parent_context, param, name) => {
  const { _hash: hash } = node;
  /** @type {import("../context").Context} */
  const context = {
    ...parent_context,
    mode:
      parent_context.mode === "strict" ||
      (node.body.type === "BlockStatement" &&
        hasUseStrictDirective(node.body.body))
        ? "strict"
        : "sloppy",
    parent: param.type,
  };
  const asynchronous = hasNarrowObject(node, "async") ? !!node.async : false;
  const generator = hasNarrowObject(node, "generator")
    ? !!node.generator
    : false;
  const bindings = hoist(hash, context.annotation);
  const parameters = map(bindings, getVariable);
  // Function declaration use the outside binding and do not declare a
  // self binding inside the function:
  // function f () { return f; }
  // const g = f;
  // f = 123;
  // console.log(g()); // 123
  const callee =
    node.type === "FunctionExpression" &&
    node.id != null &&
    node.id.name !== "arguments" &&
    !includes(parameters, node.id.name)
      ? node.id.name
      : null;
  const extended_binding_array = concatXXX(
    bindings,
    callee === null ? EMPTY : [makeCalleeBinding(callee)],
    node.type === "ArrowFunctionExpression" || includes(parameters, ARGUMENTS)
      ? EMPTY
      : [ARGUMENTS_BINDING],
  );
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
              asynchronous,
              incorporateRoutineBlock(
                bindSequence(
                  node.body.type === "BlockStatement" &&
                    hasReturnStatement(node.body)
                    ? cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        "undefined",
                      )
                    : zeroSequence(null),
                  (result) =>
                    bindSequence(
                      liftSequenceXX(
                        extendScope,
                        liftSequence_X(
                          extendScope,
                          context.scope,
                          setupRoutineFrame(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            makeRoutineFrame(param, self, result),
                            context.mode,
                          ),
                        ),
                        context.mode === "sloppy" &&
                          some(
                            simple ? [node.body] : node.params,
                            hasDirectEvalCall,
                          )
                          ? setupEvalFrame(
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              extended_binding_array,
                            )
                          : setupRegularFrame(
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              extended_binding_array,
                            ),
                      ),
                      (scope) =>
                        liftSequence_XXX_(
                          makeRoutineBlock,
                          [],
                          liftSequenceXXX(
                            concatXXX,
                            callee === null
                              ? EMPTY_SEQUENCE
                              : listScopeSaveEffect(
                                  hash,
                                  forkMeta((meta = nextMeta(meta))),
                                  scope,
                                  {
                                    type: "initialize",
                                    mode: context.mode,
                                    variable: callee,
                                    right: makeReadCacheExpression(self, hash),
                                  },
                                ),
                            node.type === "ArrowFunctionExpression"
                              ? EMPTY_SEQUENCE
                              : callSequence___X(
                                  listScopeSaveEffect,
                                  hash,
                                  forkMeta((meta = nextMeta(meta))),
                                  scope,
                                  liftSequence__X(
                                    makeInitializeOperation,
                                    context.mode,
                                    ARGUMENTS,
                                    liftSequence__X_(
                                      makeApplyExpression,
                                      makeIntrinsicExpression(
                                        "aran.toArgumentList",
                                        hash,
                                      ),
                                      makeIntrinsicExpression(
                                        "undefined",
                                        hash,
                                      ),
                                      liftSequenceX_(
                                        concat__,
                                        makeScopeLoadExpression(
                                          hash,
                                          forkMeta((meta = nextMeta(meta))),
                                          scope,
                                          {
                                            type: "read-input",
                                            mode: context.mode,
                                          },
                                        ),
                                        makeCalleeExpression(
                                          context.mode,
                                          simple,
                                          self,
                                          hash,
                                        ),
                                      ),
                                      hash,
                                    ),
                                  ),
                                ),
                            listParameterEffect(
                              node.params,
                              forkMeta((meta = nextMeta(meta))),
                              context,
                            ),
                          ),
                          hasBlockBody(node)
                            ? liftSequenceX(
                                concat_,
                                liftSequenceX_(
                                  makeBlockStatement,
                                  unbuildClosureBody(
                                    node.body,
                                    forkMeta((meta = nextMeta(meta))),
                                    context,
                                    simple,
                                  ),
                                  hash,
                                ),
                              )
                            : EMPTY_SEQUENCE,
                          callSequence___X(
                            makeScopeLoadExpression,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            liftSequence_X(
                              makeFinalizeResultOperation,
                              context.mode,
                              hasExpressionBody(node)
                                ? unbuildExpression(
                                    node.body,
                                    forkMeta((meta = nextMeta(meta))),
                                    context,
                                  )
                                : zeroSequence(null),
                            ),
                          ),
                          hash,
                        ),
                    ),
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
          context.mode === "sloppy" &&
            node.type !== "ArrowFunctionExpression" &&
            !generator &&
            !asynchronous &&
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
                            generator,
                            asynchronous,
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
