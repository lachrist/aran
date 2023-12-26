import {
  compileGet,
  flatMap,
  flatMapIndex,
  includes,
  listKey,
  map,
  pairup,
  some,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeScopeLoadExpression,
  listScopeSaveEffect,
  getMode,
  extendScope,
  setupRegularStaticFrame,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
} from "../mangle.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeConditionalEffect,
  makeConditionalExpression,
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
import { makeSyntaxErrorExpression } from "../syntax-error.mjs";
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
  sequenceControlBlock,
  sequenceControlStatement,
  zeroSequence,
  sequenceExpression,
  sequenceEffect,
  sequenceStatement,
} from "../sequence.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
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
 *   completion: import("./statement.d.ts").Completion,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const listUndefinedCompletion = (path, completion) =>
  completion !== null && isLastValue(path, completion.root)
    ? map(
        listWriteCacheEffect(
          completion.cache,
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        (node) => makeEffectStatement(node, path),
      )
    : [];

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
 *     completion: import("./statement.d.ts").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildStatement = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  switch (node.type) {
    case "EmptyStatement": {
      return [];
    }
    case "DebuggerStatement": {
      return [makeDebuggerStatement(path)];
    }
    case "ReturnStatement": {
      return [
        makeReturnStatement(
          sequenceExpression(
            mapSequence(
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
          ),
          path,
        ),
      ];
    }
    case "ExpressionStatement": {
      if (completion !== null && isLastValue(path, completion.root)) {
        return map(
          listWriteCacheEffect(
            completion.cache,
            unbuildExpression(
              drillSite(node, path, meta, "expression"),
              scope,
              null,
            ),
            path,
          ),
          (node) => makeEffectStatement(node, path),
        );
      } else {
        return map(
          unbuildEffect(drillSite(node, path, meta, "expression"), scope, null),
          (node) => makeEffectStatement(node, path),
        );
      }
    }
    case "ThrowStatement": {
      return [
        makeEffectStatement(
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
        ),
      ];
    }
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break === null) {
          return [
            makeEffectStatement(
              makeExpressionEffect(
                makeSyntaxErrorExpression("Illegal break statement", path),
                path,
              ),
              path,
            ),
          ];
        } else {
          return [makeBreakStatement(loop.break, path)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
            path,
          ),
        ];
      }
    }
    case "ContinueStatement": {
      if (node.label == null) {
        if (loop.continue === null) {
          return [
            makeEffectStatement(
              makeExpressionEffect(
                makeSyntaxErrorExpression("Illegal continue statement", path),
                path,
              ),
              path,
            ),
          ];
        } else {
          return [makeBreakStatement(loop.continue, path)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleContinueLabel(/** @type {estree.Label} */ (node.label.name)),
            path,
          ),
        ];
      }
    }
    case "VariableDeclaration": {
      return map(
        flatMapIndex(node.declarations.length, (index) =>
          unbuildDeclarator(
            drillDeepSite(node, path, meta, "declarations", index),
            scope,
            null,
          ),
        ),
        (node) => makeEffectStatement(node, path),
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return [
          makeEffectStatement(
            makeExportEffect(
              DEFAULT_SPECIFIER,
              unbuildFunction({ node, path, meta }, scope, {
                type: "function",
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        ];
      } else {
        return [];
      }
    }
    case "ClassDeclaration": {
      if (node.id === null) {
        return [
          makeEffectStatement(
            makeExportEffect(
              DEFAULT_SPECIFIER,
              unbuildClass({ node, path, meta }, scope, {
                name: { type: "default" },
              }),
              path,
            ),
            path,
          ),
        ];
      } else {
        const variable = /** @type {estree.Variable} */ (node.id.name);
        return map(
          sequenceEffect(
            mapSequence(
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
                  { type: "initialize", variable, mode: getMode(scope), right },
                ),
            ),
            path,
          ),
          (node) => makeEffectStatement(node, path),
        );
      }
    }
    case "ImportDeclaration": {
      return [];
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
        return [];
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
      return [];
    }
    case "LabeledStatement": {
      return unbuildStatement(drillSite(node, path, meta, "body"), scope, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          unbuildControlBody({ node, path, meta }, scope, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
          }),
          path,
        ),
      ];
    }
    case "StaticBlock": {
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeSyntaxErrorExpression("Illegal static block", path),
            path,
          ),
          path,
        ),
      ];
    }
    case "WithStatement": {
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceStatement(
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
              mapSequence(
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
                (frame) => [
                  makeBlockStatement(
                    unbuildControlBody(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "body",
                      ),
                      extendScope(scope, {
                        type: "dynamic-with",
                        record: frame,
                      }),
                      {
                        labels: map(labels, mangleBreakLabel),
                        completion,
                        loop,
                      },
                    ),
                    path,
                  ),
                ],
              ),
          ),
          path,
        ),
      ];
    }
    case "IfStatement": {
      return [
        ...listUndefinedCompletion(path, completion),
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
                  labels: map(labels, mangleBreakLabel),
                  completion,
                  loop,
                },
              )
            : sequenceControlBlock(zeroSequence({ body: [] }), [], path),
          path,
        ),
      ];
    }
    case "TryStatement": {
      return [
        ...listUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "block"),
            scope,
            {
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
            : sequenceControlBlock(
                mapSequence(
                  mapSequence(
                    setupRegularStaticFrame(
                      { path },
                      {},
                      {
                        mode: getMode(scope),
                        exports: {},
                      },
                    ),
                    (frame) => extendScope(scope, frame),
                  ),
                  (scope) => ({
                    body: [
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
                    ],
                  }),
                ),
                [],
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
                  labels: map(labels, mangleBreakLabel),
                  loop,
                  // a: try { throw "boum"; }
                  //    catch { 123; }
                  //    finally { 456; break a }
                  // > 456
                  completion,
                },
              )
            : sequenceControlBlock(zeroSequence({ body: [] }), [], path),
          path,
        ),
      ];
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          mapSequence(
            mapSequence(
              setupRegularStaticFrame(
                { path },
                {},
                { mode: getMode(scope), exports: {} },
              ),
              (frame) => extendScope(scope, frame),
            ),
            (scope) => ({
              body: [
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
                      labels: inner_label_array,
                      loop,
                      completion,
                    },
                  ),
                  path,
                ),
              ],
            }),
          ),
          outer_label_array,
          path,
        ),
      ];
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          mapSequence(
            mapSequence(
              setupRegularStaticFrame(
                { path },
                {},
                { mode: getMode(scope), exports: {} },
              ),
              (frame) => extendScope(scope, frame),
            ),
            (scope) => ({
              body: sequenceStatement(
                mapSequence(
                  cacheWritable(
                    forkMeta((meta = nextMeta(meta))),
                    makePrimitiveExpression(true, path),
                    path,
                  ),
                  (initial) => [
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
                          labels: inner_label_array,
                          loop,
                          completion,
                        },
                      ),
                      path,
                    ),
                  ],
                ),
                path,
              ),
            }),
          ),
          outer_label_array,
          path,
        ),
      ];
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
        const kinds = hoistBlock(mode, [node.init]);
        return [
          ...listUndefinedCompletion(path, completion),
          makeBlockStatement(
            sequenceControlBlock(
              mapSequence(
                mapSequence(
                  setupRegularStaticFrame({ path }, kinds, {
                    mode,
                    exports: {},
                  }),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) => ({
                  body: [
                    ...unbuildStatement(
                      drillSite(node, path, meta, "init"),
                      scope,
                      {
                        labels: [],
                        completion,
                        loop: { break: null, continue: null },
                      },
                    ),
                    ...sequenceStatement(
                      bindSequence(
                        flatSequence(
                          map(listKey(kinds), (variable) =>
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
                              (cache) => pairup(variable, cache),
                            ),
                          ),
                        ),
                        (entries) =>
                          bindSequence(
                            cacheWritable(
                              forkMeta((meta = nextMeta(meta))),
                              makePrimitiveExpression(true, path),
                              path,
                            ),
                            (first) =>
                              mapSequence(
                                cacheWritable(
                                  forkMeta((meta = nextMeta(meta))),
                                  makePrimitiveExpression(true, path),
                                  path,
                                ),
                                (test) => [
                                  makeWhileStatement(
                                    makeConditionalExpression(
                                      makeReadCacheExpression(first, path),
                                      makePrimitiveExpression(true, path),
                                      makeReadCacheExpression(test, path),
                                      path,
                                    ),
                                    sequenceControlBlock(
                                      mapSequence(
                                        mapSequence(
                                          setupRegularStaticFrame(
                                            { path },
                                            kinds,
                                            { mode, exports: {} },
                                          ),
                                          (frame) => extendScope(scope, frame),
                                        ),
                                        (scope) => ({
                                          body: [
                                            ...map(
                                              flatMap(
                                                entries,
                                                ([variable, cache]) =>
                                                  listScopeSaveEffect(
                                                    { path, meta },
                                                    scope,
                                                    {
                                                      type: "initialize",
                                                      mode,
                                                      variable,
                                                      right: cache,
                                                    },
                                                  ),
                                              ),
                                              (node) =>
                                                makeEffectStatement(node, path),
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
                                                  ? [
                                                      makeExpressionEffect(
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
                                                      ),
                                                    ]
                                                  : [],
                                                path,
                                              ),
                                              path,
                                            ),
                                            ...(hasForTest(node)
                                              ? map(
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
                                                  (node) =>
                                                    makeEffectStatement(
                                                      node,
                                                      path,
                                                    ),
                                                )
                                              : []),
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
                                                  labels: inner_label_array,
                                                  completion,
                                                  loop,
                                                },
                                              ),
                                              sequenceControlBlock(
                                                zeroSequence({ body: [] }),
                                                [],
                                                path,
                                              ),
                                              path,
                                            ),
                                            ...map(
                                              flatMap(
                                                entries,
                                                ([variable, cache]) =>
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
                                              (node) =>
                                                makeEffectStatement(node, path),
                                            ),
                                          ],
                                        }),
                                      ),
                                      [],
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
                  ],
                }),
              ),
              outer_label_array,
              path,
            ),
            path,
          ),
        ];
      } else {
        return [
          ...listUndefinedCompletion(path, completion),
          ...sequenceControlStatement(
            mapSequence(
              mapSequence(
                setupRegularStaticFrame({ path }, {}, { mode, exports: {} }),
                (frame) => extendScope(scope, frame),
              ),
              (scope) => ({
                body: [
                  ...(hasForInit(node)
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
                    : []),
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
                      ? sequenceControlBlock(
                          mapSequence(
                            mapSequence(
                              setupRegularStaticFrame({ path }, scope, {
                                mode,
                                exports: {},
                              }),
                              (frame) => extendScope(scope, frame),
                            ),
                            (scope) => ({
                              body: [
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
                                      labels: inner_label_array,
                                      completion,
                                      loop,
                                    },
                                  ),
                                  path,
                                ),
                                ...map(
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
                                  (effect) => makeEffectStatement(effect, path),
                                ),
                              ],
                            }),
                          ),
                          [],
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
                            loop,
                            completion,
                          },
                        ),
                    path,
                  ),
                ],
              }),
            ),
            outer_label_array,
            path,
          ),
        ];
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          mapSequence(
            mapSequence(
              setupRegularStaticFrame({ path }, {}, { mode, exports: {} }),
              (frame) => extendScope(scope, frame),
            ),
            (scope) => ({
              body: [
                ...unbuildLeftHead(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                ...sequenceStatement(
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
                              zeroSequence([
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
                                  sequenceControlBlock(
                                    mapSequence(
                                      mapSequence(
                                        setupRegularStaticFrame(
                                          { path },
                                          hoistBlock(mode, [node.left]),
                                          { mode, exports: {} },
                                        ),
                                        (frame) => extendScope(scope, frame),
                                      ),
                                      (scope) => ({
                                        body: [
                                          ...sequenceStatement(
                                            mapSequence(
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
                                                map(
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
                                                  (node) =>
                                                    makeEffectStatement(
                                                      node,
                                                      path,
                                                    ),
                                                ),
                                            ),
                                            path,
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
                                                labels: inner_label_array,
                                                completion,
                                                loop,
                                              },
                                            ),
                                            sequenceControlBlock(
                                              zeroSequence({ body: [] }),
                                              [],
                                              path,
                                            ),
                                            path,
                                          ),
                                          ...map(
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
                                            (node) =>
                                              makeEffectStatement(node, path),
                                          ),
                                        ],
                                      }),
                                    ),
                                    [],
                                    path,
                                  ),
                                  path,
                                ),
                              ]),
                          ),
                      ),
                  ),
                  path,
                ),
              ],
            }),
          ),
          outer_label_array,
          path,
        ),
      ];
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          mapSequence(
            mapSequence(
              setupRegularStaticFrame({ path }, hoistBlock(mode, [node.left]), {
                mode,
                exports: {},
              }),
              (frame) => extendScope(scope, frame),
            ),
            (scope) => ({
              body: [
                ...unbuildLeftHead(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                ...sequenceStatement(
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
                                  zeroSequence([
                                    makeTryStatement(
                                      sequenceControlBlock(
                                        mapSequence(
                                          mapSequence(
                                            setupRegularStaticFrame(
                                              { path },
                                              hoistBlock(mode, [node.left]),
                                              { mode, exports: {} },
                                            ),
                                            (frame) =>
                                              extendScope(scope, frame),
                                          ),
                                          (scope) => ({
                                            body: [
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
                                                sequenceControlBlock(
                                                  mapSequence(
                                                    mapSequence(
                                                      setupRegularStaticFrame(
                                                        { path },
                                                        hoistBlock(mode, [
                                                          node.left,
                                                        ]),
                                                        {
                                                          mode,
                                                          exports: {},
                                                        },
                                                      ),
                                                      (frame) =>
                                                        extendScope(
                                                          scope,
                                                          frame,
                                                        ),
                                                    ),
                                                    (scope) => ({
                                                      body: sequenceStatement(
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
                                                            zeroSequence([
                                                              makeTryStatement(
                                                                sequenceControlBlock(
                                                                  mapSequence(
                                                                    mapSequence(
                                                                      setupRegularStaticFrame(
                                                                        {
                                                                          path,
                                                                        },
                                                                        hoistBlock(
                                                                          mode,
                                                                          [
                                                                            node.left,
                                                                          ],
                                                                        ),
                                                                        {
                                                                          mode,
                                                                          exports:
                                                                            {},
                                                                        },
                                                                      ),
                                                                      (frame) =>
                                                                        extendScope(
                                                                          scope,
                                                                          frame,
                                                                        ),
                                                                    ),
                                                                    (
                                                                      scope,
                                                                    ) => ({
                                                                      body: [
                                                                        ...map(
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
                                                                          (
                                                                            node,
                                                                          ) =>
                                                                            makeEffectStatement(
                                                                              node,
                                                                              path,
                                                                            ),
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
                                                                              labels:
                                                                                inner_label_array,
                                                                              completion,
                                                                              loop,
                                                                            },
                                                                          ),
                                                                          path,
                                                                        ),
                                                                      ],
                                                                    }),
                                                                  ),
                                                                  [],
                                                                  path,
                                                                ),
                                                                sequenceControlBlock(
                                                                  mapSequence(
                                                                    mapSequence(
                                                                      setupRegularStaticFrame(
                                                                        {
                                                                          path,
                                                                        },
                                                                        {},
                                                                        {
                                                                          mode,
                                                                          exports:
                                                                            {},
                                                                        },
                                                                      ),
                                                                      (frame) =>
                                                                        extendScope(
                                                                          scope,
                                                                          frame,
                                                                        ),
                                                                    ),
                                                                    (
                                                                      scope,
                                                                    ) => ({
                                                                      body: [
                                                                        makeTryStatement(
                                                                          sequenceControlBlock(
                                                                            mapSequence(
                                                                              mapSequence(
                                                                                setupRegularStaticFrame(
                                                                                  {
                                                                                    path,
                                                                                  },
                                                                                  {},
                                                                                  {
                                                                                    mode,
                                                                                    exports:
                                                                                      {},
                                                                                  },
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
                                                                              ) => ({
                                                                                body: [
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
                                                                                ],
                                                                              }),
                                                                            ),
                                                                            [],
                                                                            path,
                                                                          ),
                                                                          sequenceControlBlock(
                                                                            zeroSequence(
                                                                              {
                                                                                body: [],
                                                                              },
                                                                            ),
                                                                            [],
                                                                            path,
                                                                          ),
                                                                          sequenceControlBlock(
                                                                            zeroSequence(
                                                                              {
                                                                                body: [],
                                                                              },
                                                                            ),
                                                                            [],
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
                                                                    }),
                                                                  ),
                                                                  [],
                                                                  path,
                                                                ),
                                                                sequenceControlBlock(
                                                                  zeroSequence({
                                                                    body: [],
                                                                  }),
                                                                  [],
                                                                  path,
                                                                ),
                                                                path,
                                                              ),
                                                            ]),
                                                        ),
                                                        path,
                                                      ),
                                                    }),
                                                  ),
                                                  [],
                                                  path,
                                                ),
                                                path,
                                              ),
                                            ],
                                          }),
                                        ),
                                        [],
                                        path,
                                      ),
                                      sequenceControlBlock(
                                        mapSequence(
                                          mapSequence(
                                            setupRegularStaticFrame(
                                              { path },
                                              {},
                                              { mode, exports: {} },
                                            ),
                                            (frame) =>
                                              extendScope(scope, frame),
                                          ),
                                          (scope) => ({
                                            body: [
                                              ...map(
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
                                                (node) =>
                                                  makeEffectStatement(
                                                    node,
                                                    path,
                                                  ),
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
                                            ],
                                          }),
                                        ),
                                        [],
                                        path,
                                      ),
                                      sequenceControlBlock(
                                        mapSequence(
                                          mapSequence(
                                            setupRegularStaticFrame(
                                              { path },
                                              {},
                                              { mode, exports: {} },
                                            ),
                                            (frame) =>
                                              extendScope(scope, frame),
                                          ),
                                          (_scope) => ({
                                            body: map(
                                              listReturnIteratorEffect(
                                                { path },
                                                {
                                                  iterator,
                                                  step,
                                                },
                                              ),
                                              (node) =>
                                                makeEffectStatement(node, path),
                                            ),
                                          }),
                                        ),
                                        [],
                                        path,
                                      ),
                                      path,
                                    ),
                                  ]),
                              ),
                          ),
                      ),
                  ),
                  path,
                ),
              ],
            }),
          ),
          outer_label_array,
          path,
        ),
      ];
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...sequenceStatement(
          mapSequence(
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
              sequenceControlStatement(
                mapSequence(
                  mapSequence(
                    setupRegularStaticFrame(
                      { path },
                      hoistBlock(mode, flatMap(node.cases, getConsequent)),
                      {
                        mode,
                        exports: {},
                      },
                    ),
                    (frame) => extendScope(scope, frame),
                  ),
                  (scope) => ({
                    body: sequenceStatement(
                      mapSequence(
                        cacheWritable(
                          forkMeta((meta = nextMeta(meta))),
                          makePrimitiveExpression(false, path),
                          path,
                        ),
                        (matched) => [
                          ...flatMapIndex(node.cases.length, (index) =>
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
                          ...flatMapIndex(node.cases.length, (index) =>
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
                                  sequenceControlBlock(
                                    zeroSequence({ body: [] }),
                                    [],
                                    path,
                                  ),
                                  sequenceControlBlock(
                                    mapSequence(
                                      mapSequence(
                                        setupRegularStaticFrame(
                                          { path },
                                          hoistBlock(mode, remainder),
                                          { mode, exports: {} },
                                        ),
                                        (frame) => extendScope(scope, frame),
                                      ),
                                      (scope) => ({
                                        body: flatMap(remainder, (node) =>
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
                                      }),
                                    ),
                                    [],
                                    path,
                                  ),
                                  path,
                                ),
                              ]),
                        ],
                      ),
                      path,
                    ),
                  }),
                ),
                outer_label_array,
                path,
              ),
          ),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("illegal statement node", node);
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
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBodyStatement = ({ node, path, meta }, scope, options) => [
  ...flatMapIndex(node.length, (index) =>
    unbuildHoistedStatement(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
      scope,
      options,
    ),
  ),
  ...flatMapIndex(node.length, (index) =>
    unbuildStatement(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), index),
      scope,
      options,
    ),
  ),
];
