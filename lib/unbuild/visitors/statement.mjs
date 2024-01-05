import {
  compileGet,
  flatMap,
  includes,
  map,
  mapIndex,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeScopeLoadExpression,
  listScopeSaveEffect,
  getMode,
  extendScope,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
} from "../mangle.mjs";
import {
  EMPTY_CONTROL_BODY,
  EMPTY_EFFECT,
  EMPTY_STATEMENT,
  concatEffect,
  concatStatement,
  makeApplyExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeControlBody,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReturnStatement,
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
  hoistBlock,
  listSwitchRemainder,
} from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildCase } from "./case.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildClass } from "./class.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { unbuildDefault } from "./default.mjs";
import { unbuildInit, unbuildLeftHead, unbuildLeftBody } from "./left.mjs";
import { isLastValue } from "../completion.mjs";
import {
  listEarlyErrorStatement,
  makeEarlyErrorExpression,
} from "../early-error.mjs";
import { unbuildHoistedStatement } from "./hoisted.mjs";
import {
  makeReadCacheExpression,
  listWriteCacheEffect,
  cacheConstant,
  cacheWritable,
} from "../cache.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  zeroSequence,
} from "../sequence.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
  makeControlStatement,
} from "../helper.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   node: estree.ReturnStatement,
 * ) => node is estree.ReturnStatement & {
 *   argument: estree.Expression,
 * }}
 */
const hasReturnArgument = (node) => node.argument != null;

/**
 * @type {(
 *   node: estree.ExportNamedDeclaration,
 * ) => node is estree.ExportNamedDeclaration & {
 *   declaration: estree.Declaration,
 * }}
 */
const hasExportDeclaration = (node) => node.declaration != null;

/**
 * @type {(
 *   node: estree.IfStatement,
 * ) => node is estree.IfStatement & {
 *   alternate: estree.Statement,
 * }}
 */
const hasIfAlternate = (node) => node.alternate != null;

/**
 * @type {(
 *   node: estree.TryStatement,
 * ) => node is estree.TryStatement & {
 *   handler: estree.CatchClause,
 * }}
 */
const hasTryHandler = (node) => node.handler != null;

/**
 * @type {(
 *   node: estree.TryStatement,
 * ) => node is estree.TryStatement & {
 *   finalizer: estree.BlockStatement,
 * }}
 */
const hasTryFinalizer = (node) => node.finalizer != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   init: estree.VariableDeclaration & {
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
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   test: estree.Expression,
 * }}
 */
const hasForTest = (node) => node.update != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   init: estree.VariableDeclaration | estree.Expression,
 * }}
 */
const hasForInit = (node) => node.init != null;

/**
 * @type {(
 *   node: estree.ForStatement,
 * ) => node is estree.ForStatement & {
 *   update: estree.Expression,
 * }}
 */
const hasForUpdate = (node) => node.update != null;

/**
 * @type {(
 *   path: unbuild.Path,
 *   completion: import("./statement").Completion,
 * ) => import("../sequence").StatementSequence}
 */
const listUndefinedCompletion = (path, completion) =>
  completion !== null && isLastValue(path, completion.root)
    ? makeEffectStatement(
        listWriteCacheEffect(
          completion.cache,
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        path,
      )
    : EMPTY_STATEMENT;

const getConsequent = compileGet("consequent");

/**
 * @type {(
 *   site: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: estree.Label[],
 *     completion: import("./statement").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildStatement = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  switch (node.type) {
    case "EmptyStatement": {
      return EMPTY_STATEMENT;
    }
    case "DebuggerStatement": {
      return makeDebuggerStatement(path);
    }
    case "ReturnStatement": {
      return makeReturnStatement(
        bindSequence(
          hasReturnArgument(node)
            ? cacheConstant(
                (meta = nextMeta(meta)),
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "argument",
                  ),
                  scope,
                  null,
                ),
                path,
              )
            : zeroSequence(null),
          (result) =>
            makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { type: "wrap-result", mode: getMode(scope), result },
            ),
        ),
        path,
      );
    }
    case "ExpressionStatement": {
      if (completion !== null && isLastValue(path, completion.root)) {
        return makeEffectStatement(
          listWriteCacheEffect(
            completion.cache,
            unbuildExpression(
              drillSite(node, path, meta, "expression"),
              scope,
              null,
            ),
            path,
          ),
          path,
        );
      } else {
        return makeEffectStatement(
          unbuildEffect(drillSite(node, path, meta, "expression"), scope, null),
          path,
        );
      }
    }
    case "ThrowStatement": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("aran.throw", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              unbuildExpression(
                drillSite(node, path, meta, "argument"),
                scope,
                null,
              ),
            ],
            path,
          ),
          path,
        ),
        path,
      );
    }
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break === null) {
          return listEarlyErrorStatement("Illegal break statement", path);
        } else {
          return makeBreakStatement(loop.break, path);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_STATEMENT;
      } else {
        return makeBreakStatement(
          mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
          path,
        );
      }
    }
    case "ContinueStatement": {
      if (node.label == null) {
        if (loop.continue === null) {
          return listEarlyErrorStatement("Illegal continue statement", path);
        } else {
          return makeBreakStatement(loop.continue, path);
        }
      } else if (includes(labels, node.label.name)) {
        return EMPTY_STATEMENT;
      } else {
        return makeBreakStatement(
          mangleContinueLabel(/** @type {estree.Label} */ (node.label.name)),
          path,
        );
      }
    }
    case "VariableDeclaration": {
      return makeEffectStatement(
        concatEffect(
          mapIndex(node.declarations.length, (index) =>
            unbuildDeclarator(
              drillDeepSite(node, path, meta, "declarations", index),
              scope,
              { kind: node.kind },
            ),
          ),
        ),
        path,
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return makeEffectStatement(
          makeExportEffect(
            DEFAULT_SPECIFIER,
            unbuildFunction({ node, path, meta }, scope, {
              type: "function",
              name: { type: "default" },
            }),
            path,
          ),
          path,
        );
      } else {
        return EMPTY_STATEMENT;
      }
    }
    case "ClassDeclaration": {
      if (node.id === null) {
        return makeEffectStatement(
          makeExportEffect(
            DEFAULT_SPECIFIER,
            unbuildClass({ node, path, meta }, scope, {
              name: { type: "default" },
            }),
            path,
          ),
          path,
        );
      } else {
        const variable = /** @type {estree.Variable} */ (node.id.name);
        return makeEffectStatement(
          bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              unbuildClass(
                { node, path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { name: { type: "assignment", variable } },
              ),
              path,
            ),
            (right) =>
              listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "initialize",
                  kind: "let",
                  variable,
                  mode: getMode(scope),
                  right,
                },
              ),
          ),
          path,
        );
      }
    }
    case "ImportDeclaration": {
      return EMPTY_STATEMENT;
    }
    case "ExportNamedDeclaration": {
      if (hasExportDeclaration(node)) {
        return unbuildStatement(
          drillSite(node, path, meta, "declaration"),
          scope,
          {
            labels: [],
            completion,
            loop,
          },
        );
      } else {
        return EMPTY_STATEMENT;
      }
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(
        drillSite(node, path, meta, "declaration"),
        scope,
        null,
      );
    }
    case "ExportAllDeclaration": {
      return EMPTY_STATEMENT;
    }
    case "LabeledStatement": {
      return unbuildStatement(drillSite(node, path, meta, "body"), scope, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return makeBlockStatement(
        unbuildControlBody({ node, path, meta }, scope, {
          kind: "naked",
          labels: map(labels, mangleBreakLabel),
          completion,
          loop,
        }),
        path,
      );
    }
    case "StaticBlock": {
      return makeEffectStatement(
        makeExpressionEffect(
          makeEarlyErrorExpression("Illegal static block", path),
          path,
        ),
        path,
      );
    }
    case "WithStatement": {
      const mode = getMode(scope);
      if (mode === "strict") {
        return listEarlyErrorStatement(
          "'with' is illegal in strict mode",
          path,
        );
      } else if (mode === "sloppy") {
        return concatStatement([
          listUndefinedCompletion(path, completion),
          bindSequence(
            cacheConstant(
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
                      makePrimitiveExpression({ undefined: null }, path),
                      [makeReadCacheExpression(raw_frame, path)],
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
                (frame) =>
                  makeBlockStatement(
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
                        kind: "naked",
                        labels: map(labels, mangleBreakLabel),
                        completion,
                        loop,
                      },
                    ),
                    path,
                  ),
              ),
          ),
        ]);
      } else {
        throw new AranTypeError(mode);
      }
    }
    case "IfStatement": {
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeIfStatement(
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
              kind: "then",
              labels: map(labels, mangleBreakLabel),
              completion,
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
                  kind: "else",
                  labels: map(labels, mangleBreakLabel),
                  completion,
                  loop,
                },
              )
            : makeControlBlock([], zeroSequence({ content: [] }), path),
          path,
        ),
      ]);
    }
    case "TryStatement": {
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "block"),
            scope,
            {
              kind: "try",
              labels: map(labels, mangleBreakLabel),
              loop,
              completion,
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
                  labels: map(labels, mangleBreakLabel),
                  completion,
                  loop,
                },
              )
            : makeControlBlock(
                [],
                bindSequence(
                  mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
                    extendScope(scope, frame),
                  ),
                  (scope) =>
                    makeControlBody(
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throw", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [
                              makeScopeLoadExpression(
                                {
                                  path,
                                  meta: forkMeta((meta = nextMeta(meta))),
                                },
                                scope,
                                { type: "read-error", mode: getMode(scope) },
                              ),
                            ],
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
          hasTryFinalizer(node)
            ? unbuildControlBody(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "finalizer",
                ),
                scope,
                {
                  kind: "finally",
                  labels: map(labels, mangleBreakLabel),
                  loop,
                  // a: try { throw "boum"; }
                  //    catch { 123; }
                  //    finally { 456; break a }
                  // > 456
                  completion,
                },
              )
            : makeControlBlock([], EMPTY_CONTROL_BODY, path),
          path,
        ),
      ]);
    }
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : []),
        ...map(labels, mangleBreakLabel),
      ];
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          makeControlBody(
            bindSequence(
              mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
                extendScope(scope, frame),
              ),
              (scope) =>
                makeWhileStatement(
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
                      kind: "while",
                      labels: inner_label_array,
                      loop,
                      completion,
                    },
                  ),
                  path,
                ),
            ),
          ),
          path,
        ),
      ]);
    }
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : []),
        ...map(labels, mangleBreakLabel),
      ];
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          makeControlBody(
            bindSequence(
              mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
                extendScope(scope, frame),
              ),
              (scope) =>
                bindSequence(
                  cacheWritable(
                    forkMeta((meta = nextMeta(meta))),
                    makePrimitiveExpression(true, path),
                    path,
                  ),
                  (initial) =>
                    makeWhileStatement(
                      makeConditionalExpression(
                        makeReadCacheExpression(initial, path),
                        makeSequenceExpression(
                          listWriteCacheEffect(
                            initial,
                            makePrimitiveExpression(false, path),
                            path,
                          ),
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
                          kind: "while",
                          labels: inner_label_array,
                          loop,
                          completion,
                        },
                      ),
                      path,
                    ),
                ),
            ),
          ),
          path,
        ),
      ]);
    }
    case "ForStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(path)] : []),
        ...map(labels, mangleBreakLabel),
      ];
      const inner_label_array = [
        ...(hasEmptyContinue(node.body)
          ? [mangleEmptyContinueLabel(path)]
          : []),
        ...map(labels, mangleContinueLabel),
      ];
      if (isForLexical(node)) {
        const hoisting = hoistBlock(mode, node.init);
        return concatStatement([
          listUndefinedCompletion(path, completion),
          makeBlockStatement(
            makeControlBlock(
              outer_label_array,
              bindSequence(
                mapSequence(
                  setupRegularFrame({ path }, hoisting, null),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  makeControlBody(
                    concatStatement([
                      unbuildStatement(
                        drillSite(node, path, meta, "init"),
                        scope,
                        {
                          labels: [],
                          completion,
                          loop: { break: null, continue: null },
                        },
                      ),
                      bindSequence(
                        flatSequence(
                          map(hoisting, ([variable, kind]) =>
                            mapSequence(
                              cacheWritable(
                                forkMeta((meta = nextMeta(meta))),
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
                              (cache) =>
                                /**
                                 * @type {(
                                 *   import("../scope").InitializeOperation & {
                                 *     right: import("../cache").WritableCache,
                                 *   }
                                 * )}
                                 */ ({
                                  type: "initialize",
                                  mode,
                                  kind,
                                  variable,
                                  right: cache,
                                }),
                            ),
                          ),
                        ),
                        (operations) =>
                          bindSequence(
                            cacheWritable(
                              forkMeta((meta = nextMeta(meta))),
                              makePrimitiveExpression(true, path),
                              path,
                            ),
                            (first) =>
                              bindSequence(
                                cacheWritable(
                                  forkMeta((meta = nextMeta(meta))),
                                  makePrimitiveExpression(true, path),
                                  path,
                                ),
                                (test) =>
                                  makeWhileStatement(
                                    makeConditionalExpression(
                                      makeReadCacheExpression(first, path),
                                      makePrimitiveExpression(true, path),
                                      makeReadCacheExpression(test, path),
                                      path,
                                    ),
                                    makeControlBlock(
                                      [],
                                      bindSequence(
                                        mapSequence(
                                          setupRegularFrame(
                                            { path },
                                            hoisting,
                                            null,
                                          ),
                                          (frame) => extendScope(scope, frame),
                                        ),
                                        (scope) =>
                                          makeControlBody(
                                            concatStatement([
                                              makeEffectStatement(
                                                concatEffect(
                                                  map(operations, (operation) =>
                                                    listScopeSaveEffect(
                                                      { path, meta },
                                                      scope,
                                                      operation,
                                                    ),
                                                  ),
                                                ),
                                                path,
                                              ),
                                              makeEffectStatement(
                                                makeConditionalEffect(
                                                  makeReadCacheExpression(
                                                    first,
                                                    path,
                                                  ),
                                                  listWriteCacheEffect(
                                                    first,
                                                    makePrimitiveExpression(
                                                      false,
                                                      path,
                                                    ),
                                                    path,
                                                  ),
                                                  hasForUpdate(node)
                                                    ? makeExpressionEffect(
                                                        unbuildExpression(
                                                          drillSite(
                                                            node,
                                                            path,
                                                            forkMeta(
                                                              (meta =
                                                                nextMeta(meta)),
                                                            ),
                                                            "update",
                                                          ),
                                                          scope,
                                                          null,
                                                        ),
                                                        path,
                                                      )
                                                    : EMPTY_EFFECT,
                                                  path,
                                                ),
                                                path,
                                              ),
                                              hasForTest(node)
                                                ? makeEffectStatement(
                                                    listWriteCacheEffect(
                                                      test,
                                                      unbuildExpression(
                                                        drillSite(
                                                          node,
                                                          path,
                                                          forkMeta(
                                                            (meta =
                                                              nextMeta(meta)),
                                                          ),
                                                          "test",
                                                        ),
                                                        scope,
                                                        null,
                                                      ),
                                                      path,
                                                    ),
                                                    path,
                                                  )
                                                : EMPTY_STATEMENT,
                                              makeIfStatement(
                                                makeReadCacheExpression(
                                                  test,
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
                                                    kind: "then",
                                                    labels: inner_label_array,
                                                    completion,
                                                    loop,
                                                  },
                                                ),
                                                makeControlBlock(
                                                  [],
                                                  EMPTY_CONTROL_BODY,
                                                  path,
                                                ),
                                                path,
                                              ),
                                              makeEffectStatement(
                                                concatEffect(
                                                  map(
                                                    operations,
                                                    ({
                                                      variable,
                                                      right: cache,
                                                    }) =>
                                                      listWriteCacheEffect(
                                                        cache,
                                                        makeScopeLoadExpression(
                                                          {
                                                            path,
                                                            meta: forkMeta(
                                                              (meta =
                                                                nextMeta(meta)),
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
                                            ]),
                                          ),
                                      ),
                                      path,
                                    ),
                                    path,
                                  ),
                              ),
                          ),
                      ),
                    ]),
                  ),
              ),
              path,
            ),
            path,
          ),
        ]);
      } else {
        return concatStatement([
          listUndefinedCompletion(path, completion),
          makeControlStatement(
            outer_label_array,
            makeControlBody(
              bindSequence(
                mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
                  extendScope(scope, frame),
                ),
                (scope) =>
                  concatStatement([
                    hasForInit(node)
                      ? unbuildInit(
                          drillSite(
                            node,
                            path,
                            forkMeta((meta = nextMeta(meta))),
                            "init",
                          ),
                          scope,
                          null,
                        )
                      : EMPTY_STATEMENT,
                    makeWhileStatement(
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
                        : makePrimitiveExpression(true, path),
                      hasForUpdate(node)
                        ? makeControlBlock(
                            [],
                            bindSequence(
                              mapSequence(
                                setupRegularFrame({ path }, [], null),
                                (frame) => extendScope(scope, frame),
                              ),
                              (scope) =>
                                makeControlBody(
                                  concatStatement([
                                    makeBlockStatement(
                                      unbuildControlBody(
                                        drillSite(
                                          node,
                                          path,
                                          forkMeta((meta = nextMeta(meta))),
                                          "body",
                                        ),
                                        scope,
                                        {
                                          kind: "naked",
                                          labels: inner_label_array,
                                          completion,
                                          loop,
                                        },
                                      ),
                                      path,
                                    ),
                                    makeEffectStatement(
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
                                  ]),
                                ),
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
                              kind: "naked",
                              labels: inner_label_array,
                              loop,
                              completion,
                            },
                          ),
                      path,
                    ),
                  ]),
              ),
            ),
            path,
          ),
        ]);
      }
    }
    case "ForInStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : []),
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
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          bindSequence(
            mapSequence(setupRegularFrame({ path }, [], null), (frame) =>
              extendScope(scope, frame),
            ),
            (scope) =>
              makeControlBody(
                concatStatement([
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
                  bindSequence(
                    cacheConstant(
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
                            makeIntrinsicExpression("aran.listForInKey", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [makeReadCacheExpression(right, path)],
                            path,
                          ),
                          path,
                        ),
                        (keys) =>
                          bindSequence(
                            cacheWritable(
                              forkMeta((meta = nextMeta(meta))),
                              makePrimitiveExpression(0, path),
                              path,
                            ),
                            (index) =>
                              makeWhileStatement(
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
                                makeControlBlock(
                                  [],
                                  bindSequence(
                                    mapSequence(
                                      setupRegularFrame(
                                        { path },
                                        hoistBlock(mode, node.left),
                                        null,
                                      ),
                                      (frame) => extendScope(scope, frame),
                                    ),
                                    (scope) =>
                                      makeControlBody(
                                        concatStatement([
                                          bindSequence(
                                            cacheConstant(
                                              forkMeta((meta = nextMeta(meta))),
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
                                              makeEffectStatement(
                                                unbuildLeftBody(
                                                  drillSite(
                                                    node,
                                                    path,
                                                    forkMeta(
                                                      (meta = nextMeta(meta)),
                                                    ),
                                                    "left",
                                                  ),
                                                  scope,
                                                  { right },
                                                ),
                                                path,
                                              ),
                                          ),
                                          makeIfStatement(
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
                                                kind: "then",
                                                labels: inner_label_array,
                                                completion,
                                                loop,
                                              },
                                            ),
                                            makeControlBlock(
                                              [],
                                              EMPTY_CONTROL_BODY,
                                              path,
                                            ),
                                            path,
                                          ),
                                          makeEffectStatement(
                                            listWriteCacheEffect(
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
                                        ]),
                                      ),
                                  ),
                                  path,
                                ),
                                path,
                              ),
                          ),
                      ),
                  ),
                ]),
              ),
          ),
          path,
        ),
      ]);
    }
    case "ForOfStatement": {
      const mode = getMode(scope);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const inner_label_array = [
        ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
        ...map(labels, mangleContinueLabel),
      ];
      const outer_label_array = [
        ...(hasEmptyBreak(node.body) ? [loop.break] : []),
        ...map(labels, mangleBreakLabel),
      ];
      return concatStatement([
        listUndefinedCompletion(path, completion),
        makeControlStatement(
          outer_label_array,
          bindSequence(
            mapSequence(
              setupRegularFrame({ path }, hoistBlock(mode, node.left), null),
              (frame) => extendScope(scope, frame),
            ),
            (scope) =>
              makeControlBody(
                concatStatement([
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
                  bindSequence(
                    cacheConstant(
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
                              makeIntrinsicExpression("Symbol.iterator", path),
                              path,
                            ),
                            makeReadCacheExpression(iterable, path),
                            [],
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
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                  path,
                                ),
                                (step) =>
                                  makeTryStatement(
                                    makeControlBlock(
                                      [],
                                      bindSequence(
                                        mapSequence(
                                          setupRegularFrame(
                                            { path },
                                            hoistBlock(mode, node.left),
                                            null,
                                          ),
                                          (frame) => extendScope(scope, frame),
                                        ),
                                        (scope) =>
                                          makeControlBody(
                                            makeWhileStatement(
                                              makeSequenceExpression(
                                                listNextIteratorEffect(
                                                  { path },
                                                  {
                                                    asynchronous: node.await,
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
                                              makeControlBlock(
                                                [],
                                                bindSequence(
                                                  mapSequence(
                                                    setupRegularFrame(
                                                      { path },
                                                      hoistBlock(
                                                        mode,
                                                        node.left,
                                                      ),
                                                      null,
                                                    ),
                                                    (frame) =>
                                                      extendScope(scope, frame),
                                                  ),
                                                  (scope) =>
                                                    makeControlBody(
                                                      bindSequence(
                                                        cacheConstant(
                                                          forkMeta(
                                                            (meta =
                                                              nextMeta(meta)),
                                                          ),
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
                                                        (value) =>
                                                          makeTryStatement(
                                                            makeControlBlock(
                                                              [],
                                                              bindSequence(
                                                                mapSequence(
                                                                  setupRegularFrame(
                                                                    {
                                                                      path,
                                                                    },
                                                                    hoistBlock(
                                                                      mode,
                                                                      node.left,
                                                                    ),
                                                                    null,
                                                                  ),
                                                                  (frame) =>
                                                                    extendScope(
                                                                      scope,
                                                                      frame,
                                                                    ),
                                                                ),
                                                                (scope) =>
                                                                  makeControlBody(
                                                                    concatStatement(
                                                                      [
                                                                        makeEffectStatement(
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
                                                                        makeBlockStatement(
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
                                                                              kind: "naked",
                                                                              labels:
                                                                                inner_label_array,
                                                                              completion,
                                                                              loop,
                                                                            },
                                                                          ),
                                                                          path,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                              ),
                                                              path,
                                                            ),
                                                            makeControlBlock(
                                                              [],
                                                              bindSequence(
                                                                mapSequence(
                                                                  setupRegularFrame(
                                                                    {
                                                                      path,
                                                                    },
                                                                    [],
                                                                    null,
                                                                  ),
                                                                  (frame) =>
                                                                    extendScope(
                                                                      scope,
                                                                      frame,
                                                                    ),
                                                                ),
                                                                (scope) =>
                                                                  makeControlBody(
                                                                    concatStatement(
                                                                      [
                                                                        makeTryStatement(
                                                                          makeControlBlock(
                                                                            [],
                                                                            makeControlBody(
                                                                              bindSequence(
                                                                                mapSequence(
                                                                                  setupRegularFrame(
                                                                                    {
                                                                                      path,
                                                                                    },
                                                                                    [],
                                                                                    null,
                                                                                  ),
                                                                                  (
                                                                                    frame,
                                                                                  ) =>
                                                                                    extendScope(
                                                                                      scope,
                                                                                      frame,
                                                                                    ),
                                                                                ),
                                                                                (
                                                                                  _scope,
                                                                                ) =>
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
                                                                                        [],
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
                                                                          makeControlBlock(
                                                                            [],
                                                                            EMPTY_CONTROL_BODY,
                                                                            path,
                                                                          ),
                                                                          makeControlBlock(
                                                                            [],
                                                                            EMPTY_CONTROL_BODY,
                                                                            path,
                                                                          ),
                                                                          path,
                                                                        ),
                                                                        makeEffectStatement(
                                                                          makeExpressionEffect(
                                                                            makeApplyExpression(
                                                                              makeIntrinsicExpression(
                                                                                "aran.throw",
                                                                                path,
                                                                              ),
                                                                              makePrimitiveExpression(
                                                                                {
                                                                                  undefined:
                                                                                    null,
                                                                                },
                                                                                path,
                                                                              ),
                                                                              [
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
                                                                              ],
                                                                              path,
                                                                            ),
                                                                            path,
                                                                          ),
                                                                          path,
                                                                        ),
                                                                      ],
                                                                    ),
                                                                  ),
                                                              ),
                                                              path,
                                                            ),
                                                            makeControlBlock(
                                                              [],
                                                              EMPTY_CONTROL_BODY,
                                                              path,
                                                            ),
                                                            path,
                                                          ),
                                                      ),
                                                    ),
                                                ),
                                                path,
                                              ),
                                              path,
                                            ),
                                          ),
                                      ),
                                      path,
                                    ),
                                    makeControlBlock(
                                      [],
                                      bindSequence(
                                        mapSequence(
                                          setupRegularFrame({ path }, [], null),
                                          (frame) => extendScope(scope, frame),
                                        ),
                                        (scope) =>
                                          makeControlBody(
                                            concatStatement([
                                              makeEffectStatement(
                                                listWriteCacheEffect(
                                                  step,
                                                  makeObjectExpression(
                                                    makeIntrinsicExpression(
                                                      "Object.prototype",
                                                      path,
                                                    ),
                                                    [
                                                      [
                                                        makePrimitiveExpression(
                                                          "done",
                                                          path,
                                                        ),
                                                        makePrimitiveExpression(
                                                          true,
                                                          path,
                                                        ),
                                                      ],
                                                      [
                                                        makePrimitiveExpression(
                                                          "value",
                                                          path,
                                                        ),
                                                        makePrimitiveExpression(
                                                          { undefined: null },
                                                          path,
                                                        ),
                                                      ],
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
                                                      "aran.throw",
                                                      path,
                                                    ),
                                                    makePrimitiveExpression(
                                                      {
                                                        undefined: null,
                                                      },
                                                      path,
                                                    ),
                                                    [
                                                      makeScopeLoadExpression(
                                                        {
                                                          path,
                                                          meta: forkMeta(
                                                            (meta =
                                                              nextMeta(meta)),
                                                          ),
                                                        },
                                                        scope,
                                                        {
                                                          type: "read-error",
                                                          mode,
                                                        },
                                                      ),
                                                    ],
                                                    path,
                                                  ),
                                                  path,
                                                ),
                                                path,
                                              ),
                                            ]),
                                          ),
                                      ),
                                      path,
                                    ),
                                    makeControlBlock(
                                      [],
                                      bindSequence(
                                        mapSequence(
                                          setupRegularFrame({ path }, [], null),
                                          (frame) => extendScope(scope, frame),
                                        ),
                                        (_scope) =>
                                          makeControlBody(
                                            makeEffectStatement(
                                              listReturnIteratorEffect(
                                                { path },
                                                {
                                                  iterator,
                                                  step,
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
                              ),
                          ),
                      ),
                  ),
                ]),
              ),
          ),
          path,
        ),
      ]);
    }
    case "SwitchStatement": {
      const remainder = listSwitchRemainder(node);
      const child_loop = {
        break: mangleEmptyBreakLabel(path),
        continue: loop.continue,
      };
      const outer_label_array = [
        ...(remainder.length > 0 || some(node.cases, hasEmptyBreak)
          ? [mangleEmptyBreakLabel(path)]
          : []),
        ...map(labels, mangleBreakLabel),
      ];
      const mode = getMode(scope);
      return concatStatement([
        listUndefinedCompletion(path, completion),
        bindSequence(
          cacheConstant(
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
            makeControlStatement(
              outer_label_array,
              bindSequence(
                mapSequence(
                  setupRegularFrame(
                    { path },
                    flatMap(flatMap(node.cases, getConsequent), (node) =>
                      hoistBlock(mode, node),
                    ),
                    null,
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) =>
                  makeControlBody(
                    bindSequence(
                      cacheWritable(
                        forkMeta((meta = nextMeta(meta))),
                        makePrimitiveExpression(false, path),
                        path,
                      ),
                      (matched) =>
                        concatStatement([
                          ...mapIndex(node.cases.length, (index) =>
                            unbuildHoistedStatement(
                              drillDeepSite(
                                node,
                                path,
                                forkMeta((meta = nextMeta(meta))),
                                "cases",
                                index,
                              ),
                              scope,
                              {
                                parent: "block",
                              },
                            ),
                          ),
                          ...mapIndex(node.cases.length, (index) =>
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
                                last: index === node.cases.length - 1,
                                discriminant,
                                loop: child_loop,
                                matched,
                                completion,
                              },
                            ),
                          ),
                          ...(remainder.length === 0
                            ? []
                            : [
                                makeIfStatement(
                                  makeReadCacheExpression(matched, path),
                                  makeControlBlock(
                                    [],
                                    EMPTY_CONTROL_BODY,
                                    path,
                                  ),
                                  makeControlBlock(
                                    [],
                                    bindSequence(
                                      mapSequence(
                                        setupRegularFrame(
                                          { path },
                                          flatMap(remainder, (node) =>
                                            hoistBlock(mode, node),
                                          ),
                                          null,
                                        ),
                                        (frame) => extendScope(scope, frame),
                                      ),
                                      (scope) =>
                                        makeControlBody(
                                          concatStatement(
                                            map(remainder, (node) =>
                                              unbuildStatement(
                                                {
                                                  node,
                                                  path,
                                                  meta: forkMeta(
                                                    (meta = nextMeta(meta)),
                                                  ),
                                                },
                                                scope,
                                                {
                                                  labels: [],
                                                  completion,
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
                              ]),
                        ]),
                    ),
                  ),
              ),
              path,
            ),
        ),
      ]);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     parent: "block" | "closure" | "program";
 *     labels: [],
 *     completion: import("./statement").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const listBodyStatement = ({ node, path, meta }, scope, options) =>
  concatStatement([
    ...mapIndex(node.length, (index) =>
      unbuildHoistedStatement(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
        scope,
        options,
      ),
    ),
    ...mapIndex(node.length, (index) =>
      unbuildStatement(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
        scope,
        options,
      ),
    ),
  ]);
