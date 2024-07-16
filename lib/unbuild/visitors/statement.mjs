import {
  EMPTY,
  concatXX,
  concatXXX,
  concatX_,
  concatX_X_X,
  concatX__,
  concat_,
  concat_X,
  concat_XXX,
  concat__,
  concat___,
  findFirstIndex,
  flat,
  flatMap,
  guardX_,
  includes,
  map,
  mapIndex,
  pairup,
  slice,
  some,
  unzip,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeScopeLoadExpression,
  listScopeSaveEffect,
  getMode,
  extendScope,
  setupRegularFrame,
  makeInitializeOperation,
  CATCH_FRAME,
  makeUpdateResultOperation,
  willScopeUpdateCompletion,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
  RETURN_BREAK_LABEL,
} from "../mangle.mjs";
import {
  listEffectStatement,
  makeApplyExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildCatch } from "./catch.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  DEFAULT_SPECIFIER,
  hasEmptyBreak,
  hasEmptyContinue,
  listBinding,
} from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildCase } from "./case.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildClass } from "./class.mjs";
import {
  drillDeepSite,
  drillSite,
  drillSiteArray,
  duplicateSite,
} from "../site.mjs";
import { unbuildDefault } from "./default.mjs";
import { unbuildInit, unbuildLeftHead, unbuildLeftBody } from "./left.mjs";
import { unbuildHoistedStatement } from "./hoisted.mjs";
import {
  makeReadCacheExpression,
  makeWriteCacheEffect,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import {
  EMPTY_SEQUENCE,
  bindSequence,
  callSequence_X_,
  callSequence__X,
  flatSequence,
  initSequence,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceXXXXX,
  liftSequenceXXX_,
  liftSequenceXX_,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence_X,
  liftSequence_XXX,
  liftSequence_X_,
  liftSequence_X__,
  liftSequence__X,
  liftSequence__X_,
  listenSequence,
  mapSequence,
  zeroSequence,
} from "../../sequence.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
} from "../helper.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateControlBlock,
  incorporateStatement,
  initErrorExpression,
  isBaseDeclarationPrelude,
  makeErrorPrelude,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   labels: import("../atom").Label[],
 *   body: import("../../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../atom").Statement[]
 *   >,
 *   path: import("../../path").Path,
 * ) => import("../../sequence").Sequence<
 *     import("../prelude").BodyPrelude,
 *     import("../atom").Statement[]
 *   >}
 */
export const listControlStatement = (labels, body, path) => {
  if (
    labels.length > 0 ||
    some(listenSequence(body), isBaseDeclarationPrelude)
  ) {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeBlockStatement,
        incorporateControlBlock(
          liftSequence__X_(makeControlBlock, labels, EMPTY, body, path),
          path,
        ),
        path,
      ),
    );
  } else {
    // This may seem unsafe because it moves meta variables in parent scope.
    // But control flow only occurs in proper block.
    // So this can only be used in naked block and hence it is safe.
    return body;
  }
};

/**
 * @type {(
 *   node: import("../../estree").ReturnStatement,
 * ) => node is import("../../estree").ReturnStatement & {
 *   argument: import("../../estree").Expression,
 * }}
 */
const hasReturnArgument = (node) => node.argument != null;

/**
 * @type {(
 *   node: import("../../estree").ExportNamedDeclaration,
 * ) => node is import("../../estree").ExportNamedDeclaration & {
 *   declaration: import("../../estree").Declaration,
 * }}
 */
const hasExportDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   node: import("../../estree").IfStatement,
 * ) => node is import("../../estree").IfStatement & {
 *   alternate: import("../../estree").Statement,
 * }}
 */
const hasIfAlternate = (node) => node.alternate != null;

/**
 * @type {(
 *   node: import("../../estree").TryStatement,
 * ) => node is import("../../estree").TryStatement & {
 *   handler: import("../../estree").CatchClause,
 * }}
 */
const hasTryHandler = (node) => node.handler != null;

/**
 * @type {(
 *   node: import("../../estree").TryStatement,
 * ) => node is import("../../estree").TryStatement & {
 *   finalizer: import("../../estree").BlockStatement,
 * }}
 */
const hasTryFinalizer = (node) => node.finalizer != null;

/**
 * @type {(
 *   node: import("../../estree").ForStatement,
 * ) => node is import("../../estree").ForStatement & {
 *   init: import("../../estree").VariableDeclaration & {
 *     kind: "let" | "const"
 *   },
 * }}
 */
const isForLexical = (node) =>
  node.init != null &&
  node.init.type === "VariableDeclaration" &&
  (node.init.kind === "let" || node.init.kind === "const");

/**
 * @type {(
 *   node: import("../../estree").ForStatement,
 * ) => node is import("../../estree").ForStatement & {
 *   test: import("../../estree").Expression,
 * }}
 */
const hasForTest = (node) => node.test != null;

/**
 * @type {(
 *   node: import("../../estree").ForStatement,
 * ) => node is import("../../estree").ForStatement & {
 *   init: import("../../estree").VariableDeclaration | import("../../estree").Expression,
 * }}
 */
const hasForInit = (node) => node.init != null;

/**
 * @type {(
 *   node: import("../../estree").ForStatement,
 * ) => node is import("../../estree").ForStatement & {
 *   update: import("../../estree").Expression,
 * }}
 */
const hasForUpdate = (node) => node.update != null;

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").SwitchStatement>,
 * ) => import("../site").Site<import("../../estree").Statement>[]}
 */
export const listSwitchRemainder = ({ node, path, meta }) => {
  const index = findFirstIndex(node.cases, (node) => node.test === null);
  if (index === -1 || index === node.cases.length - 1) {
    return EMPTY;
  } else {
    return flatMap(
      slice(
        drillSiteArray(drillSite(node, path, meta, "cases")),
        index,
        node.cases.length,
      ),
      ({ node, path, meta }) =>
        drillSiteArray(drillSite(node, path, meta, "consequent")),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     origin: "closure" | "program",
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     labels: import("../../estree").Label[],
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildStatement = (
  { node, path, meta },
  scope,
  { origin, hoisting, labels, loop },
) => {
  switch (node.type) {
    case "EmptyStatement": {
      return EMPTY_SEQUENCE;
    }
    case "DebuggerStatement": {
      return zeroSequence([makeDebuggerStatement(path)]);
    }
    case "ReturnStatement": {
      switch (origin) {
        case "program": {
          return initSequence(
            [
              makeErrorPrelude({
                message: "Illegal 'return' statement",
                origin: path,
              }),
            ],
            EMPTY,
          );
        }
        case "closure": {
          return liftSequenceX_(
            concatX_,
            liftSequenceX_(
              listEffectStatement,
              callSequence__X(
                listScopeSaveEffect,
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                liftSequence_X(
                  makeUpdateResultOperation,
                  getMode(scope),
                  hasReturnArgument(node)
                    ? unbuildExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "argument",
                        ),
                        scope,
                        null,
                      )
                    : zeroSequence(makeIntrinsicExpression("undefined", path)),
                ),
              ),
              path,
            ),
            makeBreakStatement(RETURN_BREAK_LABEL, path),
          );
        }
        default: {
          throw new AranTypeError(origin);
        }
      }
    }
    case "ExpressionStatement": {
      if (willScopeUpdateCompletion(scope, path)) {
        return liftSequenceX_(
          listEffectStatement,
          callSequence__X(
            listScopeSaveEffect,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequence_X(
              makeUpdateResultOperation,
              getMode(scope),
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "expression",
                ),
                scope,
                null,
              ),
            ),
          ),
          path,
        );
      } else {
        return liftSequenceX_(
          listEffectStatement,
          unbuildEffect(drillSite(node, path, meta, "expression"), scope, null),
          path,
        );
      }
    }
    case "ThrowStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            liftSequence__X_(
              makeApplyExpression,
              makeIntrinsicExpression("aran.throw", path),
              makeIntrinsicExpression("undefined", path),
              liftSequenceX(
                concat_,
                unbuildExpression(
                  drillSite(node, path, meta, "argument"),
                  scope,
                  null,
                ),
              ),
              path,
            ),
            path,
          ),
          path,
        ),
      );
    }
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break === null) {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeEffectStatement,
              liftSequenceX_(
                makeExpressionEffect,
                initErrorExpression("Illegal break statement", path),
                path,
              ),
              path,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.break, path)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleBreakLabel(
              /** @type {import("../../estree").Label} */ (node.label.name),
            ),
            path,
          ),
        ]);
      }
    }
    case "ContinueStatement": {
      if (node.label == null) {
        if (loop.continue === null) {
          return liftSequenceX(
            concat_,
            liftSequenceX_(
              makeEffectStatement,
              liftSequenceX_(
                makeExpressionEffect,
                initErrorExpression("Illegal continue statement", path),
                path,
              ),
              path,
            ),
          );
        } else {
          return zeroSequence([makeBreakStatement(loop.continue, path)]);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_SEQUENCE;
      } else {
        return zeroSequence([
          makeBreakStatement(
            mangleContinueLabel(
              /** @type {import("../../estree").Label} */ (node.label.name),
            ),
            path,
          ),
        ]);
      }
    }
    case "VariableDeclaration": {
      return liftSequenceX_(
        listEffectStatement,
        liftSequenceX(
          flat,
          flatSequence(
            mapIndex(node.declarations.length, (index) =>
              unbuildDeclarator(
                drillDeepSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "declarations",
                  index,
                ),
                scope,
                { kind: node.kind },
              ),
            ),
          ),
        ),
        path,
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequence_X_(
              makeExportEffect,
              DEFAULT_SPECIFIER,
              unbuildFunction({ node, path, meta }, scope, {
                type: "function",
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        );
      } else {
        const mode = getMode(scope);
        switch (mode) {
          case "strict": {
            return EMPTY_SEQUENCE;
          }
          case "sloppy": {
            return liftSequenceX_(
              listEffectStatement,
              listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "write-sloppy-function",
                  mode,
                  variable: /** @type {import("../../estree").Variable} */ (
                    node.id.name
                  ),
                  right: null,
                },
              ),
              path,
            );
          }
          default: {
            throw new AranTypeError(mode);
          }
        }
      }
    }
    case "ClassDeclaration": {
      if (node.id === null) {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequence_X_(
              makeExportEffect,
              DEFAULT_SPECIFIER,
              unbuildClass({ node, path, meta }, scope, {
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        );
      } else {
        const variable = /** @type {import("../../estree").Variable} */ (
          node.id.name
        );
        return liftSequenceX_(
          listEffectStatement,
          callSequence__X(
            listScopeSaveEffect,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            liftSequence__X(
              makeInitializeOperation,
              getMode(scope),
              variable,
              unbuildClass(
                { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { name: { type: "assignment", variable } },
              ),
            ),
          ),
          path,
        );
      }
    }
    case "ImportDeclaration": {
      return zeroSequence(EMPTY);
    }
    case "ExportNamedDeclaration": {
      if (hasExportDeclaration(node)) {
        return unbuildStatement(
          drillSite(node, path, meta, "declaration"),
          scope,
          {
            origin,
            hoisting,
            labels: EMPTY,
            loop,
          },
        );
      } else {
        return zeroSequence(EMPTY);
      }
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(drillSite(node, path, meta, "declaration"), scope, {
        origin,
        hoisting,
      });
    }
    case "ExportAllDeclaration": {
      return zeroSequence(EMPTY);
    }
    case "LabeledStatement": {
      return unbuildStatement(drillSite(node, path, meta, "body"), scope, {
        hoisting,
        labels: [
          ...labels,
          /** @type {import("../../estree").Label} */ (node.label.name),
        ],
        origin,
        loop,
      });
    }
    case "BlockStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeBlockStatement,
          unbuildControlBody({ node, path, meta }, scope, {
            origin,
            labels: map(labels, mangleBreakLabel),
            hoisting,
            loop,
          }),
          path,
        ),
      );
    }
    case "StaticBlock": {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeEffectStatement,
          liftSequenceX_(
            makeExpressionEffect,
            initErrorExpression("Illegal static block", path),
            path,
          ),
          path,
        ),
      );
    }
    case "WithStatement": {
      const mode = getMode(scope);
      if (mode === "strict") {
        return liftSequenceX(
          concat_,
          liftSequenceX_(
            makeEffectStatement,
            liftSequenceX_(
              makeExpressionEffect,
              initErrorExpression("'with' is illegal in strict mode", path),
              path,
            ),
            path,
          ),
        );
      } else if (mode === "sloppy") {
        return liftSequenceXX(
          concatXX,
          liftSequenceX_(
            listEffectStatement,
            listScopeSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "update-result",
                mode: getMode(scope),
                result: null,
              },
            ),
            path,
          ),
          incorporateStatement(
            bindSequence(
              callSequence_X_(
                cacheConstant,
                forkMeta((meta = nextMeta(meta))),
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "object",
                  ),
                  scope,
                  null,
                ),
                path,
              ),
              (raw_frame) =>
                bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "==",
                        makeReadCacheExpression(raw_frame, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makeThrowErrorExpression(
                        "TypeError",
                        "Cannot convert undefined or null to object",
                        path,
                      ),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object", path),
                        makeIntrinsicExpression("undefined", path),
                        [makeReadCacheExpression(raw_frame, path)],
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                  (frame) =>
                    liftSequenceX(
                      concat_,
                      liftSequenceX_(
                        makeBlockStatement,
                        unbuildControlBody(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "body",
                          ),
                          extendScope(scope, {
                            type: "with",
                            record: frame,
                          }),
                          {
                            labels: map(labels, mangleBreakLabel),
                            hoisting,
                            origin,
                            loop,
                          },
                        ),
                        path,
                      ),
                    ),
                ),
            ),
            path,
          ),
        );
      } else {
        throw new AranTypeError(mode);
      }
    }
    case "IfStatement": {
      return liftSequenceXX(
        concatX_,
        liftSequenceX_(
          listEffectStatement,
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "update-result",
              mode: getMode(scope),
              result: null,
            },
          ),
          path,
        ),
        liftSequenceXXX_(
          makeIfStatement,
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
            scope,
            null,
          ),
          unbuildControlBody(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "consequent",
            ),
            scope,
            {
              labels: map(labels, mangleBreakLabel),
              hoisting,
              origin,
              loop,
            },
          ),
          hasIfAlternate(node)
            ? unbuildControlBody(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "alternate",
                ),
                scope,
                {
                  labels: map(labels, mangleBreakLabel),
                  hoisting,
                  origin,
                  loop,
                },
              )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, path)),
          path,
        ),
      );
    }
    case "TryStatement": {
      return liftSequenceX(
        concat_,
        liftSequenceXXX_(
          makeTryStatement,
          unbuildControlBody(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "block"),
            scope,
            {
              labels: map(labels, mangleBreakLabel),
              hoisting,
              loop,
              origin,
            },
          ),
          hasTryHandler(node)
            ? unbuildCatch(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "handler",
                ),
                scope,
                {
                  hoisting,
                  labels: map(labels, mangleBreakLabel),
                  origin,
                  loop,
                },
              )
            : incorporateControlBlock(
                bindSequence(
                  mapSequence(
                    setupRegularFrame(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      EMPTY,
                    ),
                    (frame) =>
                      extendScope(extendScope(scope, CATCH_FRAME), frame),
                  ),
                  (scope) =>
                    liftSequence__X_(
                      makeControlBlock,
                      EMPTY,
                      EMPTY,
                      liftSequenceX(
                        concat_,
                        liftSequenceX_(
                          makeEffectStatement,
                          liftSequenceX_(
                            makeExpressionEffect,
                            liftSequence__X_(
                              makeApplyExpression,
                              makeIntrinsicExpression("aran.throw", path),
                              makeIntrinsicExpression("undefined", path),
                              liftSequenceX(
                                concat_,
                                makeScopeLoadExpression(
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  {
                                    type: "read-error",
                                    mode: getMode(scope),
                                  },
                                ),
                              ),
                              path,
                            ),
                            path,
                          ),
                          path,
                        ),
                      ),
                      path,
                    ),
                ),
                path,
              ),
          //
          // Finally completion used only in case of break:
          //
          // a: try { throw "boum" }
          //    catch { 123; }
          //    finally { 456; }
          // > 123
          //
          // a: try { throw "boum"; }
          //    catch { 123; }
          //    finally { 456; break a }
          // > 456
          //
          // a: try { throw "boum"; }
          //    catch { 123; }
          //    finally { break a }
          // > undefined
          //
          hasTryFinalizer(node)
            ? willScopeUpdateCompletion(scope, path)
              ? incorporateControlBlock(
                  bindSequence(
                    callSequence_X_(
                      cacheConstant,
                      forkMeta((meta = nextMeta(meta))),
                      makeScopeLoadExpression(
                        {
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        },
                        scope,
                        {
                          type: "backup-result",
                          mode: getMode(scope),
                        },
                      ),
                      path,
                    ),
                    (backup) =>
                      bindSequence(
                        unbuildControlBody(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "finalizer",
                          ),
                          scope,
                          {
                            labels: map(labels, mangleBreakLabel),
                            hoisting,
                            loop,
                            origin,
                          },
                        ),
                        ({ labels, bindings, body, tag }) =>
                          liftSequence__X_(
                            makeControlBlock,
                            labels,
                            bindings,
                            liftSequenceX_X(
                              concatXXX,
                              liftSequenceX_(
                                listEffectStatement,
                                listScopeSaveEffect(
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  {
                                    type: "update-result",
                                    mode: getMode(scope),
                                    result: makeIntrinsicExpression(
                                      "undefined",
                                      path,
                                    ),
                                  },
                                ),
                                path,
                              ),
                              body,
                              liftSequenceX_(
                                listEffectStatement,
                                listScopeSaveEffect(
                                  {
                                    path,
                                    meta: forkMeta((meta = nextMeta(meta))),
                                  },
                                  scope,
                                  {
                                    type: "update-result",
                                    mode: getMode(scope),
                                    result: makeReadCacheExpression(
                                      backup,
                                      path,
                                    ),
                                  },
                                ),
                                path,
                              ),
                            ),
                            tag,
                          ),
                      ),
                  ),
                  path,
                )
              : unbuildControlBody(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "finalizer",
                  ),
                  scope,
                  {
                    labels: map(labels, mangleBreakLabel),
                    hoisting,
                    loop,
                    origin,
                  },
                )
            : zeroSequence(makeControlBlock(EMPTY, EMPTY, EMPTY, path)),
          path,
        ),
      );
    }
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concatXX,
        liftSequenceX_(
          listEffectStatement,
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "update-result",
              mode: getMode(scope),
              result: null,
            },
          ),
          path,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  EMPTY,
                ),
              ),
              (scope) =>
                liftSequenceX(
                  concat_,
                  liftSequenceXX_(
                    makeWhileStatement,
                    unbuildExpression(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "test",
                      ),
                      scope,
                      null,
                    ),
                    unbuildControlBody(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "body",
                      ),
                      scope,
                      {
                        labels: inner_label_array,
                        hoisting,
                        loop,
                        origin,
                      },
                    ),
                    path,
                  ),
                ),
            ),
            path,
          ),
          path,
        ),
      );
    }
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return listControlStatement(
        outer_label_array,
        incorporateStatement(
          bindSequence(
            liftSequence_X(
              extendScope,
              scope,
              setupRegularFrame(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                EMPTY,
              ),
            ),
            (scope) =>
              bindSequence(
                cacheWritable(
                  forkMeta((meta = nextMeta(meta))),
                  "aran.deadzone",
                ),
                (initial) =>
                  liftSequence_X(
                    concat__,
                    makeEffectStatement(
                      makeWriteCacheEffect(
                        initial,
                        makePrimitiveExpression(true, path),
                        path,
                      ),
                      path,
                    ),
                    liftSequenceXX_(
                      makeWhileStatement,
                      liftSequence__X_(
                        makeConditionalExpression,
                        makeReadCacheExpression(initial, path),
                        makeSequenceExpression(
                          [
                            makeWriteCacheEffect(
                              initial,
                              makePrimitiveExpression(false, path),
                              path,
                            ),
                          ],
                          makePrimitiveExpression(true, path),
                          path,
                        ),
                        unbuildExpression(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "test",
                          ),
                          scope,
                          null,
                        ),
                        path,
                      ),
                      unbuildControlBody(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "body",
                        ),
                        scope,
                        {
                          labels: inner_label_array,
                          hoisting,
                          loop,
                          origin,
                        },
                      ),
                      path,
                    ),
                  ),
              ),
          ),
          path,
        ),
        path,
      );
    }
    case "ForStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(path)] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      const inner_label_array = [
        ...(hasEmptyContinue(node.body)
          ? [mangleEmptyContinueLabel(path)]
          : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      if (isForLexical(node)) {
        const bindings = listBinding(hoisting, path);
        return liftSequenceXX(
          concatX_,
          liftSequenceX_(
            listEffectStatement,
            listScopeSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "update-result",
                mode: getMode(scope),
                result: null,
              },
            ),
            path,
          ),
          liftSequenceX_(
            makeBlockStatement,
            incorporateControlBlock(
              liftSequence__X_(
                makeControlBlock,
                outer_label_array,
                EMPTY,
                bindSequence(
                  liftSequence_X(
                    extendScope,
                    scope,
                    setupRegularFrame(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      bindings,
                    ),
                  ),
                  (scope) =>
                    liftSequenceXX(
                      concatXX,
                      unbuildStatement(
                        drillSite(node, path, meta, "init"),
                        scope,
                        {
                          hoisting,
                          labels: EMPTY,
                          origin,
                          loop: { break: null, continue: null },
                        },
                      ),
                      bindSequence(
                        flatSequence(
                          map(bindings, ({ variable }) =>
                            mapSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (cache) =>
                                pairup(
                                  cache,
                                  /**
                                   * @type {(import("../scope/operation").InitializeOperation)}
                                   */ ({
                                    type: "initialize",
                                    mode,
                                    variable,
                                    right: makeReadCacheExpression(cache, path),
                                  }),
                                ),
                            ),
                          ),
                        ),
                        (pairs) =>
                          liftSequenceXX(
                            concatXX,
                            liftSequenceX_(
                              listEffectStatement,
                              flatSequence(
                                map(pairs, ([cache, { variable }]) =>
                                  liftSequence_X_(
                                    makeWriteCacheEffect,
                                    cache,
                                    makeScopeLoadExpression(
                                      {
                                        path,
                                        meta: forkMeta((meta = nextMeta(meta))),
                                      },
                                      scope,
                                      { type: "read", mode, variable },
                                    ),
                                    path,
                                  ),
                                ),
                              ),
                              path,
                            ),
                            bindSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (first) =>
                                bindSequence(
                                  cacheWritable(
                                    forkMeta((meta = nextMeta(meta))),
                                    "aran.deadzone",
                                  ),
                                  (test) =>
                                    liftSequence__X(
                                      concat___,
                                      makeEffectStatement(
                                        makeWriteCacheEffect(
                                          first,
                                          makePrimitiveExpression(true, path),
                                          path,
                                        ),
                                        path,
                                      ),
                                      makeEffectStatement(
                                        makeWriteCacheEffect(
                                          test,
                                          makePrimitiveExpression(true, path),
                                          path,
                                        ),
                                        path,
                                      ),
                                      liftSequence_X_(
                                        makeWhileStatement,
                                        makeConditionalExpression(
                                          makeReadCacheExpression(first, path),
                                          makePrimitiveExpression(true, path),
                                          makeReadCacheExpression(test, path),
                                          path,
                                        ),
                                        incorporateControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              mapSequence(
                                                setupRegularFrame(
                                                  {
                                                    path,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  bindings,
                                                ),
                                                (frame) =>
                                                  extendScope(scope, frame),
                                              ),
                                              (scope) =>
                                                liftSequenceXXXXX(
                                                  concatX_X_X,
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    liftSequenceX(
                                                      flat,
                                                      flatSequence(
                                                        map(
                                                          pairs,
                                                          ([
                                                            _cache,
                                                            operation,
                                                          ]) =>
                                                            listScopeSaveEffect(
                                                              {
                                                                path,
                                                                meta: forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                              },
                                                              scope,
                                                              operation,
                                                            ),
                                                        ),
                                                      ),
                                                    ),
                                                    path,
                                                  ),
                                                  liftSequenceX_(
                                                    makeEffectStatement,
                                                    liftSequence__X_(
                                                      makeConditionalEffect,
                                                      makeReadCacheExpression(
                                                        first,
                                                        path,
                                                      ),
                                                      [
                                                        makeWriteCacheEffect(
                                                          first,
                                                          makePrimitiveExpression(
                                                            false,
                                                            path,
                                                          ),
                                                          path,
                                                        ),
                                                      ],
                                                      hasForUpdate(node)
                                                        ? liftSequenceX(
                                                            concat_,
                                                            liftSequenceX_(
                                                              makeExpressionEffect,
                                                              unbuildExpression(
                                                                drillSite(
                                                                  node,
                                                                  path,
                                                                  forkMeta(
                                                                    (meta =
                                                                      nextMeta(
                                                                        meta,
                                                                      )),
                                                                  ),
                                                                  "update",
                                                                ),
                                                                scope,
                                                                null,
                                                              ),
                                                              path,
                                                            ),
                                                          )
                                                        : EMPTY_SEQUENCE,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  hasForTest(node)
                                                    ? liftSequenceX(
                                                        concat_,
                                                        liftSequenceX_(
                                                          makeEffectStatement,
                                                          liftSequence_X_(
                                                            makeWriteCacheEffect,
                                                            test,
                                                            unbuildExpression(
                                                              drillSite(
                                                                node,
                                                                path,
                                                                forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                                "test",
                                                              ),
                                                              scope,
                                                              null,
                                                            ),
                                                            path,
                                                          ),
                                                          path,
                                                        ),
                                                      )
                                                    : EMPTY_SEQUENCE,
                                                  liftSequence_X__(
                                                    makeIfStatement,
                                                    makeReadCacheExpression(
                                                      test,
                                                      path,
                                                    ),
                                                    unbuildControlBody(
                                                      drillSite(
                                                        node,
                                                        path,
                                                        forkMeta(
                                                          (meta =
                                                            nextMeta(meta)),
                                                        ),
                                                        "body",
                                                      ),
                                                      scope,
                                                      {
                                                        labels:
                                                          inner_label_array,
                                                        hoisting,
                                                        origin,
                                                        loop,
                                                      },
                                                    ),
                                                    makeControlBlock(
                                                      EMPTY,
                                                      EMPTY,
                                                      EMPTY,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  liftSequenceX_(
                                                    listEffectStatement,
                                                    flatSequence(
                                                      map(
                                                        pairs,
                                                        ([
                                                          cache,
                                                          { variable },
                                                        ]) =>
                                                          liftSequence_X_(
                                                            makeWriteCacheEffect,
                                                            cache,
                                                            makeScopeLoadExpression(
                                                              {
                                                                path,
                                                                meta: forkMeta(
                                                                  (meta =
                                                                    nextMeta(
                                                                      meta,
                                                                    )),
                                                                ),
                                                              },
                                                              scope,
                                                              {
                                                                type: "read",
                                                                mode,
                                                                variable,
                                                              },
                                                            ),
                                                            path,
                                                          ),
                                                      ),
                                                    ),
                                                    path,
                                                  ),
                                                ),
                                            ),
                                            path,
                                          ),
                                          path,
                                        ),
                                        path,
                                      ),
                                    ),
                                ),
                            ),
                          ),
                      ),
                    ),
                ),
                path,
              ),
              path,
            ),
            path,
          ),
        );
      } else {
        return liftSequenceXX(
          concatXX,
          liftSequenceX_(
            listEffectStatement,
            listScopeSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "update-result",
                mode: getMode(scope),
                result: null,
              },
            ),
            path,
          ),
          listControlStatement(
            outer_label_array,
            incorporateStatement(
              bindSequence(
                mapSequence(
                  setupRegularFrame(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    EMPTY,
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  liftSequenceXX(
                    concatX_,
                    hasForInit(node)
                      ? unbuildInit(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "init",
                          ),
                          scope,
                          { origin, hoisting },
                        )
                      : EMPTY_SEQUENCE,
                    liftSequenceXX_(
                      makeWhileStatement,
                      hasForTest(node)
                        ? unbuildExpression(
                            drillSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "test",
                            ),
                            scope,
                            null,
                          )
                        : zeroSequence(makePrimitiveExpression(true, path)),
                      hasForUpdate(node)
                        ? incorporateControlBlock(
                            liftSequence__X_(
                              makeControlBlock,
                              EMPTY,
                              EMPTY,
                              bindSequence(
                                liftSequence_X(
                                  extendScope,
                                  scope,
                                  setupRegularFrame(
                                    {
                                      path,
                                      meta: forkMeta((meta = nextMeta(meta))),
                                    },
                                    EMPTY,
                                  ),
                                ),
                                (scope) =>
                                  liftSequenceXX(
                                    concat_X,
                                    liftSequenceX_(
                                      makeBlockStatement,
                                      unbuildControlBody(
                                        drillSite(
                                          node,
                                          path,
                                          forkMeta((meta = nextMeta(meta))),
                                          "body",
                                        ),
                                        scope,
                                        {
                                          labels: inner_label_array,
                                          hoisting,
                                          origin,
                                          loop,
                                        },
                                      ),
                                      path,
                                    ),
                                    liftSequenceX_(
                                      listEffectStatement,
                                      unbuildEffect(
                                        drillSite(
                                          node,
                                          path,
                                          forkMeta((meta = nextMeta(meta))),
                                          "update",
                                        ),
                                        scope,
                                        null,
                                      ),
                                      path,
                                    ),
                                  ),
                              ),
                              path,
                            ),
                            path,
                          )
                        : unbuildControlBody(
                            drillSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "body",
                            ),
                            scope,
                            {
                              labels: inner_label_array,
                              hoisting,
                              origin,
                              loop,
                            },
                          ),
                      path,
                    ),
                  ),
              ),
              path,
            ),
            path,
          ),
        );
      }
    }
    case "ForInStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      // for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}
      //
      // Variables in the left hand side belongs to the body of the while but still
      // they must be shadowed to the right-hand side.
      //
      // > for (const x in {a:x, b:2}) { console.log(x) }
      // Thrown:
      // ReferenceError: Cannot access 'x' before initialization
      return liftSequenceXX(
        concatXX,
        liftSequenceX_(
          listEffectStatement,
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "update-result",
              mode: getMode(scope),
              result: null,
            },
          ),
          path,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, path),
                ),
              ),
              (scope) =>
                liftSequenceXX(
                  concatXX,
                  unbuildLeftHead(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    null,
                  ),
                  incorporateStatement(
                    bindSequence(
                      callSequence_X_(
                        cacheConstant,
                        forkMeta((meta = nextMeta(meta))),
                        unbuildExpression(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "right",
                          ),
                          scope,
                          null,
                        ),
                        path,
                      ),
                      (right) =>
                        bindSequence(
                          cacheConstant(
                            forkMeta((meta = nextMeta(meta))),
                            makeApplyExpression(
                              makeIntrinsicExpression(
                                "aran.listForInKey",
                                path,
                              ),
                              makeIntrinsicExpression("undefined", path),
                              [makeReadCacheExpression(right, path)],
                              path,
                            ),
                            path,
                          ),
                          (keys) =>
                            bindSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
                                "aran.deadzone",
                              ),
                              (index) =>
                                liftSequence_X(
                                  concat__,
                                  makeEffectStatement(
                                    makeWriteCacheEffect(
                                      index,
                                      makePrimitiveExpression(0, path),
                                      path,
                                    ),
                                    path,
                                  ),
                                  liftSequence_X_(
                                    makeWhileStatement,
                                    makeBinaryExpression(
                                      "<",
                                      makeReadCacheExpression(index, path),
                                      makeGetExpression(
                                        makeReadCacheExpression(keys, path),
                                        makePrimitiveExpression("length", path),
                                        path,
                                      ),
                                      path,
                                    ),
                                    incorporateControlBlock(
                                      liftSequence__X_(
                                        makeControlBlock,
                                        EMPTY,
                                        EMPTY,
                                        bindSequence(
                                          liftSequence_X(
                                            extendScope,
                                            scope,
                                            setupRegularFrame(
                                              {
                                                path,
                                                meta: forkMeta(
                                                  (meta = nextMeta(meta)),
                                                ),
                                              },
                                              listBinding(hoisting, path),
                                            ),
                                          ),
                                          (scope) =>
                                            liftSequenceXX_(
                                              concatX__,
                                              incorporateStatement(
                                                bindSequence(
                                                  cacheConstant(
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    makeGetExpression(
                                                      makeReadCacheExpression(
                                                        keys,
                                                        path,
                                                      ),
                                                      makeReadCacheExpression(
                                                        index,
                                                        path,
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  (right) =>
                                                    liftSequenceX_(
                                                      listEffectStatement,
                                                      unbuildLeftBody(
                                                        drillSite(
                                                          node,
                                                          path,
                                                          forkMeta(
                                                            (meta =
                                                              nextMeta(meta)),
                                                          ),
                                                          "left",
                                                        ),
                                                        scope,
                                                        { right },
                                                      ),
                                                      path,
                                                    ),
                                                ),
                                                path,
                                              ),
                                              liftSequence_X__(
                                                makeIfStatement,
                                                makeBinaryExpression(
                                                  "in",
                                                  makeGetExpression(
                                                    makeReadCacheExpression(
                                                      keys,
                                                      path,
                                                    ),
                                                    makeReadCacheExpression(
                                                      index,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  makeReadCacheExpression(
                                                    right,
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                unbuildControlBody(
                                                  drillSite(
                                                    node,
                                                    path,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "body",
                                                  ),
                                                  scope,
                                                  {
                                                    labels: inner_label_array,
                                                    hoisting,
                                                    origin,
                                                    loop,
                                                  },
                                                ),
                                                makeControlBlock(
                                                  EMPTY,
                                                  EMPTY,
                                                  EMPTY,
                                                  path,
                                                ),
                                                path,
                                              ),
                                              makeEffectStatement(
                                                makeWriteCacheEffect(
                                                  index,
                                                  makeBinaryExpression(
                                                    "+",
                                                    makeReadCacheExpression(
                                                      index,
                                                      path,
                                                    ),
                                                    makePrimitiveExpression(
                                                      1,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                path,
                                              ),
                                            ),
                                        ),
                                        path,
                                      ),
                                      path,
                                    ),
                                    path,
                                  ),
                                ),
                            ),
                        ),
                    ),
                    path,
                  ),
                ),
            ),
            path,
          ),
          path,
        ),
      );
    }
    case "ForOfStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : EMPTY),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concatXX,
        liftSequenceX_(
          listEffectStatement,
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "update-result",
              mode: getMode(scope),
              result: null,
            },
          ),
          path,
        ),
        listControlStatement(
          outer_label_array,
          incorporateStatement(
            bindSequence(
              liftSequence_X(
                extendScope,
                scope,
                setupRegularFrame(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  listBinding(hoisting, path),
                ),
              ),
              (scope) =>
                liftSequenceXX(
                  concatXX,
                  unbuildLeftHead(
                    drillSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "left",
                    ),
                    scope,
                    null,
                  ),
                  incorporateStatement(
                    liftSequenceX(
                      concat_,
                      bindSequence(
                        callSequence_X_(
                          cacheConstant,
                          forkMeta((meta = nextMeta(meta))),
                          unbuildExpression(
                            drillSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "right",
                            ),
                            scope,
                            null,
                          ),
                          path,
                        ),
                        (iterable) =>
                          bindSequence(
                            cacheConstant(
                              forkMeta((meta = nextMeta(meta))),
                              makeApplyExpression(
                                makeGetExpression(
                                  makeReadCacheExpression(iterable, path),
                                  makeIntrinsicExpression(
                                    "Symbol.iterator",
                                    path,
                                  ),
                                  path,
                                ),
                                makeReadCacheExpression(iterable, path),
                                EMPTY,
                                path,
                              ),
                              path,
                            ),
                            (iterator) =>
                              bindSequence(
                                cacheConstant(
                                  forkMeta((meta = nextMeta(meta))),
                                  makeGetExpression(
                                    makeReadCacheExpression(iterator, path),
                                    makePrimitiveExpression("next", path),
                                    path,
                                  ),
                                  path,
                                ),
                                (next) =>
                                  bindSequence(
                                    cacheWritable(
                                      forkMeta((meta = nextMeta(meta))),
                                      "undefined",
                                    ),
                                    (step) =>
                                      liftSequenceXXX_(
                                        makeTryStatement,
                                        incorporateControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              liftSequence_X(
                                                extendScope,
                                                scope,
                                                setupRegularFrame(
                                                  {
                                                    path,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  listBinding(hoisting, path),
                                                ),
                                              ),
                                              (scope) =>
                                                liftSequenceX(
                                                  concat_,
                                                  liftSequenceXX_(
                                                    makeWhileStatement,
                                                    liftSequenceX__(
                                                      makeSequenceExpression,
                                                      listNextIteratorEffect(
                                                        {
                                                          path,
                                                          meta: forkMeta(
                                                            nextMeta(meta),
                                                          ),
                                                        },
                                                        {
                                                          asynchronous:
                                                            node.await,
                                                          iterator,
                                                          next,
                                                          step,
                                                        },
                                                      ),
                                                      makeUnaryExpression(
                                                        "!",
                                                        makeGetExpression(
                                                          makeReadCacheExpression(
                                                            step,
                                                            path,
                                                          ),
                                                          makePrimitiveExpression(
                                                            "done",
                                                            path,
                                                          ),
                                                          path,
                                                        ),
                                                        path,
                                                      ),
                                                      path,
                                                    ),
                                                    incorporateControlBlock(
                                                      liftSequence__X_(
                                                        makeControlBlock,
                                                        EMPTY,
                                                        EMPTY,
                                                        bindSequence(
                                                          liftSequence_X(
                                                            extendScope,
                                                            scope,
                                                            setupRegularFrame(
                                                              {
                                                                path,
                                                                meta: forkMeta(
                                                                  nextMeta(
                                                                    meta,
                                                                  ),
                                                                ),
                                                              },
                                                              listBinding(
                                                                hoisting,
                                                                path,
                                                              ),
                                                            ),
                                                          ),
                                                          (scope) =>
                                                            incorporateStatement(
                                                              liftSequenceX(
                                                                concat_,
                                                                bindSequence(
                                                                  cacheConstant(
                                                                    forkMeta(
                                                                      (meta =
                                                                        nextMeta(
                                                                          meta,
                                                                        )),
                                                                    ),
                                                                    guardX_(
                                                                      node.await,
                                                                      makeAwaitExpression,
                                                                      makeGetExpression(
                                                                        makeReadCacheExpression(
                                                                          step,
                                                                          path,
                                                                        ),
                                                                        makePrimitiveExpression(
                                                                          "value",
                                                                          path,
                                                                        ),
                                                                        path,
                                                                      ),
                                                                      path,
                                                                    ),
                                                                    path,
                                                                  ),
                                                                  (value) =>
                                                                    liftSequenceXX__(
                                                                      makeTryStatement,
                                                                      incorporateControlBlock(
                                                                        liftSequence__X_(
                                                                          makeControlBlock,
                                                                          EMPTY,
                                                                          EMPTY,
                                                                          bindSequence(
                                                                            liftSequence_X(
                                                                              extendScope,
                                                                              scope,
                                                                              setupRegularFrame(
                                                                                {
                                                                                  path,
                                                                                  meta: forkMeta(
                                                                                    (meta =
                                                                                      nextMeta(
                                                                                        meta,
                                                                                      )),
                                                                                  ),
                                                                                },
                                                                                listBinding(
                                                                                  hoisting,
                                                                                  path,
                                                                                ),
                                                                              ),
                                                                            ),
                                                                            (
                                                                              scope,
                                                                            ) =>
                                                                              liftSequenceXX(
                                                                                concatX_,
                                                                                liftSequenceX_(
                                                                                  listEffectStatement,
                                                                                  unbuildLeftBody(
                                                                                    drillSite(
                                                                                      node,
                                                                                      path,
                                                                                      forkMeta(
                                                                                        (meta =
                                                                                          nextMeta(
                                                                                            meta,
                                                                                          )),
                                                                                      ),
                                                                                      "left",
                                                                                    ),
                                                                                    scope,
                                                                                    {
                                                                                      right:
                                                                                        value,
                                                                                    },
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                                liftSequenceX_(
                                                                                  makeBlockStatement,
                                                                                  unbuildControlBody(
                                                                                    drillSite(
                                                                                      node,
                                                                                      path,
                                                                                      forkMeta(
                                                                                        (meta =
                                                                                          nextMeta(
                                                                                            meta,
                                                                                          )),
                                                                                      ),
                                                                                      "body",
                                                                                    ),
                                                                                    scope,
                                                                                    {
                                                                                      labels:
                                                                                        inner_label_array,
                                                                                      hoisting,
                                                                                      origin,
                                                                                      loop,
                                                                                    },
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                              ),
                                                                          ),
                                                                          path,
                                                                        ),
                                                                        path,
                                                                      ),
                                                                      incorporateControlBlock(
                                                                        liftSequence__X_(
                                                                          makeControlBlock,
                                                                          EMPTY,
                                                                          EMPTY,
                                                                          bindSequence(
                                                                            liftSequence_X(
                                                                              extendScope,
                                                                              extendScope(
                                                                                scope,
                                                                                CATCH_FRAME,
                                                                              ),
                                                                              setupRegularFrame(
                                                                                {
                                                                                  path,
                                                                                  meta: forkMeta(
                                                                                    (meta =
                                                                                      nextMeta(
                                                                                        meta,
                                                                                      )),
                                                                                  ),
                                                                                },
                                                                                EMPTY,
                                                                              ),
                                                                            ),
                                                                            (
                                                                              scope,
                                                                            ) =>
                                                                              liftSequenceXX(
                                                                                concat__,
                                                                                liftSequenceX___(
                                                                                  makeTryStatement,
                                                                                  incorporateControlBlock(
                                                                                    liftSequence__X_(
                                                                                      makeControlBlock,
                                                                                      EMPTY,
                                                                                      EMPTY,
                                                                                      mapSequence(
                                                                                        liftSequence_X(
                                                                                          extendScope,
                                                                                          scope,
                                                                                          setupRegularFrame(
                                                                                            {
                                                                                              path,
                                                                                              meta: forkMeta(
                                                                                                (meta =
                                                                                                  nextMeta(
                                                                                                    meta,
                                                                                                  )),
                                                                                              ),
                                                                                            },
                                                                                            EMPTY,
                                                                                          ),
                                                                                        ),
                                                                                        (
                                                                                          _scope,
                                                                                        ) => [
                                                                                          makeEffectStatement(
                                                                                            makeExpressionEffect(
                                                                                              makeApplyExpression(
                                                                                                makeGetExpression(
                                                                                                  makeReadCacheExpression(
                                                                                                    iterator,
                                                                                                    path,
                                                                                                  ),
                                                                                                  makePrimitiveExpression(
                                                                                                    "return",
                                                                                                    path,
                                                                                                  ),
                                                                                                  path,
                                                                                                ),
                                                                                                makeReadCacheExpression(
                                                                                                  iterator,
                                                                                                  path,
                                                                                                ),
                                                                                                EMPTY,
                                                                                                path,
                                                                                              ),
                                                                                              path,
                                                                                            ),
                                                                                            path,
                                                                                          ),
                                                                                        ],
                                                                                      ),
                                                                                      path,
                                                                                    ),
                                                                                    path,
                                                                                  ),
                                                                                  makeControlBlock(
                                                                                    EMPTY,
                                                                                    EMPTY,
                                                                                    EMPTY,
                                                                                    path,
                                                                                  ),
                                                                                  makeControlBlock(
                                                                                    EMPTY,
                                                                                    EMPTY,
                                                                                    EMPTY,
                                                                                    path,
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                                liftSequenceX_(
                                                                                  makeEffectStatement,
                                                                                  liftSequenceX_(
                                                                                    makeExpressionEffect,
                                                                                    liftSequence__X_(
                                                                                      makeApplyExpression,
                                                                                      makeIntrinsicExpression(
                                                                                        "aran.throw",
                                                                                        path,
                                                                                      ),
                                                                                      makeIntrinsicExpression(
                                                                                        "undefined",
                                                                                        path,
                                                                                      ),
                                                                                      liftSequenceX(
                                                                                        concat_,
                                                                                        makeScopeLoadExpression(
                                                                                          {
                                                                                            path,
                                                                                            meta: forkMeta(
                                                                                              (meta =
                                                                                                nextMeta(
                                                                                                  meta,
                                                                                                )),
                                                                                            ),
                                                                                          },
                                                                                          scope,
                                                                                          {
                                                                                            type: "read-error",
                                                                                            mode,
                                                                                          },
                                                                                        ),
                                                                                      ),
                                                                                      path,
                                                                                    ),
                                                                                    path,
                                                                                  ),
                                                                                  path,
                                                                                ),
                                                                              ),
                                                                          ),
                                                                          path,
                                                                        ),
                                                                        path,
                                                                      ),
                                                                      makeControlBlock(
                                                                        EMPTY,
                                                                        EMPTY,
                                                                        EMPTY,
                                                                        path,
                                                                      ),
                                                                      path,
                                                                    ),
                                                                ),
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
                                            ),
                                            path,
                                          ),
                                          path,
                                        ),
                                        incorporateControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              liftSequence_X(
                                                extendScope,
                                                extendScope(scope, CATCH_FRAME),
                                                setupRegularFrame(
                                                  {
                                                    path,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  EMPTY,
                                                ),
                                              ),
                                              (scope) =>
                                                liftSequence_X(
                                                  concat__,
                                                  makeEffectStatement(
                                                    makeWriteCacheEffect(
                                                      step,
                                                      makeApplyExpression(
                                                        makeIntrinsicExpression(
                                                          "aran.createObject",
                                                          path,
                                                        ),
                                                        makeIntrinsicExpression(
                                                          "undefined",
                                                          path,
                                                        ),
                                                        [
                                                          makePrimitiveExpression(
                                                            "Object.prototype",
                                                            path,
                                                          ),
                                                          makePrimitiveExpression(
                                                            "done",
                                                            path,
                                                          ),
                                                          makePrimitiveExpression(
                                                            true,
                                                            path,
                                                          ),
                                                          makePrimitiveExpression(
                                                            "value",
                                                            path,
                                                          ),
                                                          makeIntrinsicExpression(
                                                            "undefined",
                                                            path,
                                                          ),
                                                        ],
                                                        path,
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  liftSequenceX_(
                                                    makeEffectStatement,
                                                    liftSequenceX_(
                                                      makeExpressionEffect,
                                                      liftSequence__X_(
                                                        makeApplyExpression,
                                                        makeIntrinsicExpression(
                                                          "aran.throw",
                                                          path,
                                                        ),
                                                        makeIntrinsicExpression(
                                                          "undefined",
                                                          path,
                                                        ),
                                                        liftSequenceX(
                                                          concat_,
                                                          makeScopeLoadExpression(
                                                            {
                                                              path,
                                                              meta: forkMeta(
                                                                (meta =
                                                                  nextMeta(
                                                                    meta,
                                                                  )),
                                                              ),
                                                            },
                                                            scope,
                                                            {
                                                              type: "read-error",
                                                              mode,
                                                            },
                                                          ),
                                                        ),
                                                        path,
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                ),
                                            ),
                                            path,
                                          ),
                                          path,
                                        ),
                                        incorporateControlBlock(
                                          liftSequence__X_(
                                            makeControlBlock,
                                            EMPTY,
                                            EMPTY,
                                            bindSequence(
                                              liftSequence_X(
                                                extendScope,
                                                scope,
                                                setupRegularFrame(
                                                  {
                                                    path,
                                                    meta: forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                  },
                                                  EMPTY,
                                                ),
                                              ),
                                              (_scope) =>
                                                liftSequenceX_(
                                                  listEffectStatement,
                                                  listReturnIteratorEffect(
                                                    {
                                                      path,
                                                      meta: forkMeta(
                                                        (meta = nextMeta(meta)),
                                                      ),
                                                    },
                                                    {
                                                      iterator,
                                                      step,
                                                    },
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
                              ),
                          ),
                      ),
                    ),
                    path,
                  ),
                ),
            ),
            path,
          ),
          path,
        ),
      );
    }
    case "SwitchStatement": {
      const remainder = listSwitchRemainder({
        node,
        path,
        meta: forkMeta((meta = nextMeta(meta))),
      });
      const child_loop = {
        break: mangleEmptyBreakLabel(path),
        continue: loop.continue,
      };
      const outer_label_array = [
        ...(remainder.length > 0 || some(node.cases, hasEmptyBreak)
          ? [mangleEmptyBreakLabel(path)]
          : EMPTY),
        ...map(labels, mangleBreakLabel),
      ];
      return liftSequenceXX(
        concatXX,
        liftSequenceX_(
          listEffectStatement,
          listScopeSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              type: "update-result",
              mode: getMode(scope),
              result: null,
            },
          ),
          path,
        ),
        incorporateStatement(
          bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "discriminant",
                ),
                scope,
                null,
              ),
              path,
            ),
            (discriminant) =>
              listControlStatement(
                outer_label_array,
                incorporateStatement(
                  bindSequence(
                    liftSequence_X(
                      extendScope,
                      scope,
                      setupRegularFrame(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        listBinding(hoisting, path),
                      ),
                    ),
                    (scope) =>
                      bindSequence(
                        cacheWritable(
                          forkMeta((meta = nextMeta(meta))),
                          "aran.deadzone",
                        ),
                        (matched) =>
                          liftSequence_XXX(
                            concat_XXX,
                            makeEffectStatement(
                              makeWriteCacheEffect(
                                matched,
                                makePrimitiveExpression(false, path),
                                path,
                              ),
                              path,
                            ),
                            liftSequenceX(
                              flat,
                              flatSequence(
                                mapIndex(node.cases.length, (index) =>
                                  unbuildHoistedStatement(
                                    drillDeepSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "cases",
                                      index,
                                    ),
                                    scope,
                                    { hoisting },
                                  ),
                                ),
                              ),
                            ),
                            liftSequenceX(
                              flat,
                              flatSequence(
                                mapIndex(node.cases.length, (index) =>
                                  unbuildCase(
                                    drillDeepSite(
                                      node,
                                      path,
                                      forkMeta((meta = nextMeta(meta))),
                                      "cases",
                                      index,
                                    ),
                                    scope,
                                    {
                                      origin,
                                      hoisting,
                                      last: index === node.cases.length - 1,
                                      discriminant,
                                      loop: child_loop,
                                      matched,
                                    },
                                  ),
                                ),
                              ),
                            ),
                            remainder.length === 0
                              ? EMPTY_SEQUENCE
                              : liftSequenceX(
                                  concat_,
                                  liftSequence__X_(
                                    makeIfStatement,
                                    makeReadCacheExpression(matched, path),
                                    makeControlBlock(EMPTY, EMPTY, EMPTY, path),
                                    incorporateControlBlock(
                                      liftSequence__X_(
                                        makeControlBlock,
                                        EMPTY,
                                        EMPTY,
                                        bindSequence(
                                          // TODO: verify this is correct
                                          zeroSequence(scope),
                                          // mapSequence(
                                          //   setupRegularFrame(
                                          //     { path },
                                          //     flatMap(remainder, ({ node }) =>
                                          //       hoistBlock(mode, node),
                                          //     ),
                                          //   ),
                                          //   (frame) => extendScope(scope, frame),
                                          // ),
                                          (scope) =>
                                            liftSequenceX(
                                              flat,
                                              flatSequence(
                                                map(remainder, (site) =>
                                                  unbuildStatement(
                                                    site,
                                                    scope,
                                                    {
                                                      origin,
                                                      hoisting,
                                                      labels: EMPTY,
                                                      loop: child_loop,
                                                    },
                                                  ),
                                                ),
                                              ),
                                            ),
                                        ),
                                        path,
                                      ),
                                      path,
                                    ),
                                    path,
                                  ),
                                ),
                          ),
                      ),
                  ),
                  path,
                ),
                path,
              ),
          ),
          path,
        ),
      );
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | import("../../estree").Directive
 *     | import("../../estree").Statement
 *     | import("../../estree").ModuleDeclaration
 *   )>[],
 *   scope: import("../scope").Scope,
 *   options: {
 *     origin: "program" | "closure",
 *     hoisting: import("../query/hoist-public").Hoisting,
 *     labels: [],
 *     loop: {
 *       break: null | import("../atom").Label,
 *       continue: null | import("../atom").Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Statement[],
 * >}
 */
export const unbuildBody = (sites, scope, options) => {
  const [sites1, sites2] = unzip(map(sites, duplicateSite));
  return liftSequenceXX(
    concatXX,
    liftSequenceX(
      flat,
      flatSequence(
        map(sites1, (site) => unbuildHoistedStatement(site, scope, options)),
      ),
    ),
    liftSequenceX(
      flat,
      flatSequence(
        map(sites2, (site) => unbuildStatement(site, scope, options)),
      ),
    ),
  );
};
