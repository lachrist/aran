// https://tc39.github.io/ecma262/#sec-function-instances

import {
  hasDirectEvalCall,
  hasUseStrictDirective,
  listPatternVariable,
  makeLetHoist,
  makeValHoist,
} from "../query/index.mjs";
import {
  EMPTY,
  concatXXXX,
  concat_,
  concat__,
  concat___,
  concat___XX,
  every,
  findFirstIndex,
  flat,
  flatMap,
  guard,
  hasNarrowObject,
  includes,
  map,
  mapIndex,
  reduce,
  removeDuplicate,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeAccessorDescriptorExpression,
  makeBinaryExpression,
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
  makeClosureBlock,
  listEffectStatement,
  makeConditionalExpression,
  makeWhileStatement,
  makeControlBlock,
  makeEffectStatement,
  makeClosureExpression,
} from "../node.mjs";
import { unbuildClosureBody } from "./body.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../early-error.mjs";
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
  liftSequenceXXXX,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X__,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_XX_,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  liftSequence___X_,
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
  makeScopeLoadExpression,
  setupClosureFrame,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { warnGuard } from "../warning.mjs";
import {
  incorporatePrefixClosureBlock,
  incorporatePrefixEffect,
  incorporatePrefixStatement,
} from "../prefix.mjs";
import { incorporateDeclarationClosureBlock } from "../declaration.mjs";

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
 *   kind: import("../function").ClosureParam["type"],
 *   node: estree.Function,
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
 *     path: import("../../path").Path,
 *   },
 *   options: {
 *     kind: "arrow" | "function" | "constructor" | "method",
 *     generator: boolean,
 *     asynchronous: boolean,
 *     konstructor: import("../cache").Cache,
 *   },
 * ) => aran.Expression<import("../atom").Atom>}
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

const ARGUMENTS = /** @type {estree.Variable} */ ("arguments");

/** @type {import("../query/hoist").DeclareHoist} */
const ARGUMENTS_HOIST = {
  type: "declare",
  kind: "var",
  variable: ARGUMENTS,
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     index: number,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<import("../atom").Atom>[],
 * >}
 */
const unbuildParameterInner = ({ node, path, meta }, scope, { index }) => {
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
 *   site: import("../site").Site<estree.Pattern>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     index: number,
 *     generator: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<import("../atom").Atom>[],
 * >}
 */
const unbuildParameter = ({ node, path, meta }, scope, { index, generator }) =>
  warnGuard(
    generator && isImpurePattern(node),
    {
      name: "GeneratorParameterPattern",
      message:
        "Generator arguments are destructured later, at the first 'next' call",
      path,
    },
    unbuildParameterInner({ node, path, meta }, scope, { index }),
  );

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     self: import("../cache").Cache,
 *     simple: boolean
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Statement<import("../atom").Atom>[],
 * >}
 */
const listArgumentsStatement = ({ path, meta }, scope, { self, simple }) =>
  incorporatePrefixStatement(
    bindSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeApplyExpression(
          makeIntrinsicExpression("Object.create", path),
          makeIntrinsicExpression("undefined", path),
          [makeIntrinsicExpression("Object.prototype", path)],
          path,
        ),
        path,
      ),
      (arguments_) =>
        bindSequence(
          callSequence_X_(
            cacheConstant,
            forkMeta((meta = nextMeta(meta))),
            liftSequenceX__(
              makeGetExpression,
              makeScopeLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { type: "read-input", mode: getMode(scope) },
              ),
              makePrimitiveExpression("length", path),
              path,
            ),
            path,
          ),
          (length) =>
            bindSequence(
              cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
              (index) =>
                // Rather than this while loop to initialize the index
                // properties of the arguments object, we used to have:
                // Object.fromEntries(Object.entries(aran_input))
                // But it caused problems because it accesses the
                // prototype chain.
                liftSequenceX(
                  flat,
                  flatSequence([
                    zeroSequence([
                      makeEffectStatement(
                        makeWriteCacheEffect(
                          index,
                          makePrimitiveExpression(0, path),
                          path,
                        ),
                        path,
                      ),
                    ]),
                    liftSequenceX(
                      concat_,
                      liftSequence_X_(
                        makeWhileStatement,
                        makeBinaryExpression(
                          "<",
                          makeReadCacheExpression(index, path),
                          makeReadCacheExpression(length, path),
                          path,
                        ),
                        liftSequence__X_(
                          makeControlBlock,
                          EMPTY,
                          EMPTY,
                          liftSequenceX_(
                            concat__,
                            liftSequenceX_(
                              makeEffectStatement,
                              liftSequenceX_(
                                makeExpressionEffect,
                                liftSequence__X_(
                                  makeApplyExpression,
                                  makeIntrinsicExpression(
                                    "Reflect.defineProperty",
                                    path,
                                  ),
                                  makeIntrinsicExpression("undefined", path),
                                  liftSequence__X(
                                    concat___,
                                    makeReadCacheExpression(arguments_, path),
                                    makeReadCacheExpression(index, path),
                                    liftSequenceX_(
                                      makeDataDescriptorExpression,
                                      liftSequenceX___(
                                        makeDataDescriptor,
                                        liftSequenceX__(
                                          makeGetExpression,
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
                                          makeReadCacheExpression(index, path),
                                          path,
                                        ),
                                        true,
                                        true,
                                        true,
                                      ),
                                      path,
                                    ),
                                  ),
                                  path,
                                ),
                                path,
                              ),
                              path,
                            ),
                            makeEffectStatement(
                              makeWriteCacheEffect(
                                index,
                                makeBinaryExpression(
                                  "+",
                                  makeReadCacheExpression(index, path),
                                  makePrimitiveExpression(1, path),
                                  path,
                                ),
                                path,
                              ),
                              path,
                            ),
                          ),
                          path,
                        ),
                        path,
                      ),
                    ),
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeEffectStatement,
                        liftSequenceX_(
                          makeExpressionEffect,
                          liftSequence__X_(
                            makeApplyExpression,
                            makeIntrinsicExpression(
                              "Reflect.defineProperty",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
                            liftSequence__X(
                              concat___,
                              makeReadCacheExpression(arguments_, path),
                              makePrimitiveExpression("length", path),
                              liftSequenceX_(
                                makeDataDescriptorExpression,
                                liftSequenceX___(
                                  makeDataDescriptor,
                                  liftSequenceX__(
                                    makeGetExpression,
                                    makeScopeLoadExpression(
                                      {
                                        path,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      scope,
                                      {
                                        type: "read-input",
                                        mode: getMode(scope),
                                      },
                                    ),
                                    makePrimitiveExpression("length", path),
                                    path,
                                  ),
                                  true,
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
                        path,
                      ),
                    ),
                    zeroSequence([
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression(
                              "Reflect.defineProperty",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
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
                                      value: makeReadCacheExpression(
                                        self,
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
                            makeIntrinsicExpression(
                              "Reflect.defineProperty",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
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
                            makeIntrinsicExpression(
                              "Reflect.defineProperty",
                              path,
                            ),
                            makeIntrinsicExpression("undefined", path),
                            [
                              makeReadCacheExpression(arguments_, path),
                              makeIntrinsicExpression(
                                "Symbol.toStringTag",
                                path,
                              ),
                              makeDataDescriptorExpression(
                                {
                                  value: makePrimitiveExpression(
                                    "Arguments",
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
                    ]),
                    liftSequenceX_(
                      listEffectStatement,
                      listScopeSaveEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          type: "initialize",
                          kind: "var",
                          mode: getMode(scope),
                          variable: ARGUMENTS,
                          right: makeReadCacheExpression(arguments_, path),
                          manufactured: true,
                        },
                      ),
                      path,
                    ),
                  ]),
                ),
            ),
        ),
    ),
    path,
  );

/**
 * @type {(
 *   sites: import("../site").Site<estree.Pattern[]>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     generator: boolean,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<import("../atom").Atom>[],
 * >}
 */
const listParameterEffect = ({ node, path, meta }, scope, { generator }) =>
  liftSequenceX(
    flat,
    flatSequence(
      mapIndex(node.length, (index) =>
        unbuildParameter(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
          scope,
          { index, generator },
        ),
      ),
    ),
  );

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
 *   result: null | aran.Expression<import("../atom").Atom>,
 * ) => import("../scope/operation").LoadOperation}
 */
const wrapResult = (mode, result) => ({
  type: "wrap-result",
  mode,
  result,
});

/**
 * @type {(
 *   site: import("../site").Site<estree.Function>,
 *   scope: import("../scope").Scope,
 *   options: import("../function").ClosureParam & {
 *     name: import("../name").Name,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<import("../atom").Atom>,
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
  const simple = every(node.params, isIdentifier);
  const outcome = listClosureParameter(node, getMode(scope));
  const asynchronous = hasNarrowObject(node, "async") ? !!node.async : false;
  const generator = hasNarrowObject(node, "generator")
    ? !!node.generator
    : false;
  switch (outcome.type) {
    case "failure": {
      return makeEarlyErrorExpression(
        makeRegularEarlyError(outcome.error, path),
      );
    }
    case "success": {
      const parameters = outcome.value;
      const has_arguments =
        node.type !== "ArrowFunctionExpression" &&
        !includes(parameters, /** @type {estree.Variable} */ ("arguments"));
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
          ? /** @type {estree.Variable} */ (node.id.name)
          : null;
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
                liftSequence___X_(
                  makeClosureExpression,
                  param.type === "arrow" ? "arrow" : "function",
                  asynchronous,
                  generator,
                  incorporateDeclarationClosureBlock(
                    incorporatePrefixClosureBlock(
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
                                : []),
                              setupRegularFrame({ path }, [
                                ...(has_arguments ? [ARGUMENTS_HOIST] : []),
                                ...(callee === null
                                  ? []
                                  : [makeValHoist(callee)]),
                                ...map(
                                  simple &&
                                    getMode(scope) === "sloppy" &&
                                    node.type !== "ArrowFunctionExpression"
                                    ? removeDuplicate(parameters)
                                    : parameters,
                                  makeLetHoist,
                                ),
                              ]),
                            ]),
                          ),
                          extendScope,
                          scope,
                        ),
                        (scope) =>
                          liftSequence_XX_(
                            makeClosureBlock,
                            [],
                            liftSequenceXXXX(
                              concatXXXX,
                              callee === null
                                ? EMPTY_SEQUENCE
                                : liftSequenceX_(
                                    listEffectStatement,
                                    listScopeSaveEffect(
                                      {
                                        path,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      scope,
                                      {
                                        type: "initialize",
                                        kind: "val",
                                        mode: getMode(scope),
                                        variable: callee,
                                        right: makeReadCacheExpression(
                                          self,
                                          path,
                                        ),
                                        manufactured: true,
                                      },
                                    ),
                                    path,
                                  ),
                              has_arguments
                                ? listArgumentsStatement(
                                    {
                                      path,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    scope,
                                    { simple, self },
                                  )
                                : EMPTY_SEQUENCE,
                              liftSequenceX_(
                                listEffectStatement,
                                listParameterEffect(
                                  drillSite(
                                    node,
                                    path,
                                    forkMeta((meta = nextMeta(meta))),
                                    "params",
                                  ),
                                  scope,
                                  { generator },
                                ),
                                path,
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
                                      parameters: [
                                        ...(has_arguments
                                          ? [ARGUMENTS]
                                          : EMPTY),
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
                            ),
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
      );
    }
    default: {
      throw new AranTypeError(outcome);
    }
  }
};
