// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasDirectEvalCall,
  hasUseStrictDirective,
  hoist,
  listBinding,
} from "../query/index.mjs";
import {
  EMPTY,
  compileGet,
  concatXX,
  concatXXX,
  concat__,
  concat___,
  concat___XX,
  every,
  findFirstIndex,
  flat,
  guard,
  hasNarrowObject,
  includes,
  map,
  mapIndex,
  reduce,
  some,
} from "../../util/index.mjs";
import { AranError, AranTypeError } from "../../error.mjs";
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
} from "../node.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { toStaticDuplicateEarlyError } from "../early-error.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../cache.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
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
  prependSequence,
  zeroSequence,
} from "../../sequence.mjs";
import { makeNameExpression } from "../name.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite } from "../site.mjs";
import {
  ARROW_CLOSURE_FRAME,
  FUNCTION_CLOSURE_FRAME,
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeInitializeOperation,
  makeScopeLoadExpression,
  setupClosureFrame,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  incorporatePrefixEffect,
  incorporatePrefixRoutineBlock,
} from "../prefix.mjs";
import { incorporateDeclarationRoutineBlock } from "../declaration.mjs";
import { makeEarlyErrorPrelude } from "../prelude.mjs";

/**
 * @type {(
 *   node: import("../../estree").Function,
 * ) => node is import("../../estree").Function & {
 *   body: import("../../estree").BlockStatement,
 * }}
 */
const hasBlockBody = (node) => node.body.type === "BlockStatement";

/**
 * @type {(
 *   node: import("../../estree").Function,
 * ) => node is import("../../estree").Function & {
 *   body: import("../../estree").Expression,
 * }}
 */
const hasExpressionBody = (node) => node.body.type !== "BlockStatement";

/**
 * @type {(node: import("../../estree").Pattern) => boolean}
 */
const isLengthCutoffPattern = ({ type }) =>
  type === "RestElement" || type === "AssignmentPattern";

/**
 * @type {(
 *   kind: import("../function").ClosureParam["type"],
 *   node: import("../../estree").Function,
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
 *   param: import("../function").ClosureParam,
 *   self: import("../cache").Cache,
 * ) => import("../scope/closure").ClosureFrame}
 */
const makeClosureFrame = (param, self) => {
  if (param.type === "arrow") {
    return ARROW_CLOSURE_FRAME;
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
    return FUNCTION_CLOSURE_FRAME;
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
 *   site: {
 *     path: import("../../path").Path,
 *   },
 *   options: {
 *     kind: "arrow" | "function" | "constructor" | "method",
 *     generator: boolean,
 *     asynchronous: boolean,
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => import("../atom").Expression}
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
        makeIntrinsicExpression("undefined", path),
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
    makeApplyExpression(
      makeIntrinsicExpression("Object.create", path),
      makeIntrinsicExpression("undefined", path),
      [
        makeIntrinsicExpression(
          getPrototypePrototype(generator, asynchronous),
          path,
        ),
      ],
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

const ARGUMENTS = /** @type {import("../../estree").Variable} */ ("arguments");

/** @type {import("../query/hoist-public").RegularBinding} */
const ARGUMENTS_BINDING = {
  variable: ARGUMENTS,
  baseline: "undefined",
  write: "perform",
  import: null,
};

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => import("../query/hoist-public").RegularBinding}
 */
const makeCalleeBinding = (variable) => ({
  variable,
  baseline: "undefined",
  write: "perform",
  import: null,
});

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     index: number,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const unbuildParameter = ({ node, path, meta }, scope, { index }) => {
  if (node.type === "RestElement") {
    return incorporatePrefixEffect(
      bindSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          index === 0
            ? makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { type: "read-input", mode: getMode(scope) },
              )
            : liftSequence_X__(
                makeApplyExpression,
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
            { kind: "let", right },
          ),
      ),
      path,
    );
  } else {
    return incorporatePrefixEffect(
      bindSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          liftSequenceXX__(
            makeConditionalExpression,
            // Object.hasOwn guard to avoid accessing the prototype chain
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("Object.hasOwn", path),
              makeIntrinsicExpression("undefined", path),
              liftSequenceX_(
                concat__,
                makeScopeLoadExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  { type: "read-input", mode: getMode(scope) },
                ),
                makePrimitiveExpression(index, path),
              ),
              path,
            ),
            liftSequenceX__(
              makeGetExpression,
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { type: "read-input", mode: getMode(scope) },
              ),
              makePrimitiveExpression(index, path),
              path,
            ),
            makeIntrinsicExpression("undefined", path),
            path,
          ),
          path,
        ),
        (right) =>
          unbuildPattern(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            { kind: "let", right },
          ),
      ),
      path,
    );
  }
};

/**
 * @type {(
 *   sites: import("../site").Site<import("../../estree").Pattern[]>,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
const listParameterEffect = ({ node, path, meta }, scope) =>
  liftSequenceX(
    flat,
    flatSequence(
      mapIndex(node.length, (index) =>
        unbuildParameter(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
          scope,
          { index },
        ),
      ),
    ),
  );

/** @type {(node: import("../../estree").Pattern) => node is import("../../estree").Identifier} */
const isIdentifier = (node) => node.type === "Identifier";

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   simple: boolean,
 *   callee: import("../cache").Cache,
 *   path: import("../../path").Path,
 * ) => import("../atom").Expression}
 */
const makeCalleeExpression = (mode, simple, callee, path) => {
  if (mode === "sloppy") {
    return simple
      ? makeReadCacheExpression(callee, path)
      : makePrimitiveExpression(null, path);
  } else if (mode === "strict") {
    return makePrimitiveExpression(null, path);
  } else {
    throw new AranTypeError(mode);
  }
};

/**
 * @type {(
 *   kind: import("../../lang").ClosureKind,
 *   asynchronous: boolean,
 *   body: import("../atom").RoutineBlock,
 *   path: import("../../path").Path,
 * ) => import("../atom").Expression}
 */
const makeClosureExpression = (kind, asynchronous, body, path) => {
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
              map(body.head, (node) => makeEffectStatement(node, path)),
              body.body,
            ),
        body.tail,
        path,
      ),
      path,
    );
  } else if (kind === "generator") {
    return makeClosureExpressionInner(kind, asynchronous, body, path);
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   node: import("../../estree").Function,
 *   param: import("../function").ClosureParam,
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

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   result: null | import("../atom").Expression,
 * ) => import("../scope/operation").LoadOperation}
 */
const wrapResult = (mode, result) => ({
  type: "wrap-result",
  mode,
  result,
});

const getVariable = compileGet("variable");

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Function>,
 *   scope: import("../scope").Scope,
 *   options: import("../function").ClosureParam & {
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildFunction = (
  { node, path, meta },
  parent_scope,
  { name, ...param },
) => {
  const scope =
    node.body.type === "BlockStatement" && hasUseStrictDirective(node.body.body)
      ? extendScope(parent_scope, { type: "mode-use-strict" })
      : parent_scope;
  const mode = getMode(scope);
  const { report, unbound, hoisting } = hoist(node, path, mode);
  if (unbound.length > 0) {
    throw new AranError("unbound binding in closure", { unbound });
  }
  const asynchronous = hasNarrowObject(node, "async") ? !!node.async : false;
  const generator = hasNarrowObject(node, "generator")
    ? !!node.generator
    : false;
  const bindings = listBinding(hoisting, path);
  const parameters = map(bindings, getVariable);
  const has_arguments =
    node.type !== "ArrowFunctionExpression" && !includes(parameters, ARGUMENTS);
  // Function declaration use the outside binding and do not declare a
  // self binding inside the function:
  // function f () { return f; }
  // const g = f;
  // f = 123;
  // console.log(g()); // 123
  const callee =
    (node.type === "FunctionExpression" ||
      node.type === "FunctionDeclaration") &&
    node.id != null &&
    node.id.name !== "arguments" &&
    !includes(parameters, node.id.name)
      ? /** @type {import("../../estree").Variable} */ (node.id.name)
      : null;
  return prependSequence(
    map(map(report, toStaticDuplicateEarlyError), makeEarlyErrorPrelude),
    bindSequence(
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
                incorporateDeclarationRoutineBlock(
                  incorporatePrefixRoutineBlock(
                    bindSequence(
                      liftSequenceX__(
                        reduce,
                        flatSequence(
                          /**
                           * @type {import("../../sequence").Sequence<
                           *   (
                           *     | import("../prelude").BodyPrelude
                           *     | import("../prelude").PrefixPrelude
                           *   ),
                           *   import("../scope").NodeFrame,
                           * >[]}
                           */ ([
                            setupClosureFrame(
                              {
                                path,
                                meta: forkMeta((meta = nextMeta(meta))),
                              },
                              makeClosureFrame(param, self),
                              { mode: getMode(scope) },
                            ),
                            ...(getMode(scope) === "sloppy" &&
                            some(node.params, hasDirectEvalCall)
                              ? [
                                  setupEvalFrame({
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  }),
                                ]
                              : EMPTY),
                            setupRegularFrame({ path }, [
                              ...(has_arguments ? [ARGUMENTS_BINDING] : EMPTY),
                              ...(callee === null
                                ? EMPTY
                                : [makeCalleeBinding(callee)]),
                              ...bindings,
                            ]),
                          ]),
                        ),
                        extendScope,
                        scope,
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
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  {
                                    type: "initialize",
                                    mode: getMode(scope),
                                    variable: callee,
                                    right: makeReadCacheExpression(self, path),
                                  },
                                ),
                            has_arguments
                              ? callSequence__X(
                                  listScopeSaveEffect,
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  liftSequence__X(
                                    makeInitializeOperation,
                                    getMode(scope),
                                    ARGUMENTS,
                                    liftSequence__X_(
                                      makeApplyExpression,
                                      makeIntrinsicExpression(
                                        "aran.toArgumentList",
                                        path,
                                      ),
                                      makeIntrinsicExpression(
                                        "undefined",
                                        path,
                                      ),
                                      liftSequenceX_(
                                        concat__,
                                        makeScopeLoadExpression(
                                          {
                                            path,
                                            meta: forkMeta(
                                              (meta = nextMeta(meta)),
                                            ),
                                          },
                                          scope,
                                          {
                                            type: "read-input",
                                            mode: getMode(scope),
                                          },
                                        ),
                                        makeCalleeExpression(
                                          getMode(scope),
                                          every(node.params, isIdentifier),
                                          self,
                                          path,
                                        ),
                                      ),
                                      path,
                                    ),
                                  ),
                                )
                              : EMPTY_SEQUENCE,
                            listParameterEffect(
                              drillSite(
                                node,
                                path,
                                forkMeta((meta = nextMeta(meta))),
                                "params",
                              ),
                              scope,
                            ),
                          ),
                          hasBlockBody(node)
                            ? unbuildClosureBody(
                                drillSite(
                                  node,
                                  path,
                                  forkMeta((meta = nextMeta(meta))),
                                  "body",
                                ),
                                scope,
                                {
                                  hoisting,
                                  parameters: [
                                    ...(has_arguments ? [ARGUMENTS] : EMPTY),
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
                            : EMPTY_SEQUENCE,
                          callSequence__X(
                            makeScopeLoadExpression,
                            {
                              path,
                              meta: forkMeta((meta = nextMeta(meta))),
                            },
                            scope,
                            liftSequence_X(
                              wrapResult,
                              getMode(scope),
                              hasExpressionBody(node)
                                ? unbuildExpression(
                                    drillSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "body",
                                    ),
                                    scope,
                                    null,
                                  )
                                : zeroSequence(null),
                            ),
                          ),
                          path,
                        ),
                    ),
                    path,
                  ),
                ),
                path,
              ),
              path,
            ),
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makeIntrinsicExpression("undefined", path),
                [
                  makeReadCacheExpression(self, path),
                  makePrimitiveExpression("length", path),
                  makeDataDescriptorExpression(
                    {
                      value: makePrimitiveExpression(
                        some(node.params, isLengthCutoffPattern)
                          ? findFirstIndex(node.params, isLengthCutoffPattern)
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
            liftSequenceX_(
              makeExpressionEffect,
              liftSequence__X_(
                makeApplyExpression,
                makeIntrinsicExpression("Reflect.defineProperty", path),
                makeIntrinsicExpression("undefined", path),
                liftSequence__X(
                  concat___,
                  makeReadCacheExpression(self, path),
                  makePrimitiveExpression("name", path),
                  liftSequenceX_(
                    makeDataDescriptorExpression,
                    liftSequenceX___(
                      makeDataDescriptor,
                      makeNameExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        name,
                      ),
                      false,
                      false,
                      true,
                    ),
                    path,
                  ),
                ),
                path,
              ),
              path,
            ),
            getMode(scope) === "sloppy" &&
              node.type !== "ArrowFunctionExpression" &&
              !generator &&
              !asynchronous &&
              param.type === "function"
              ? [
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.defineProperty", path),
                      makeIntrinsicExpression("undefined", path),
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
                      makeIntrinsicExpression("undefined", path),
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
              : EMPTY,
            hasPrototype(param.type, node)
              ? [
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.defineProperty", path),
                      makeIntrinsicExpression("undefined", path),
                      [
                        makeReadCacheExpression(self, path),
                        makePrimitiveExpression("prototype", path),
                        makeDataDescriptorExpression(
                          {
                            value: makePrototypeExpression(
                              { path },
                              {
                                kind: param.type,
                                generator,
                                asynchronous,
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
              : EMPTY,
          ),
          makeReadCacheExpression(self, path),
          path,
        ),
    ),
  );
};
