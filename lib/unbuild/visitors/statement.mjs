import {
  compileGet,
  flatMap,
  includes,
  map,
  mapObject,
  pairup,
  some,
  zipLast,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  extendDynamicScope,
  extendStaticScope,
  listScopeInitializeEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
  splitMeta,
  zipMeta,
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
import { drill, drillArray, splitSite } from "../site.mjs";
import {
  isBlockVariableDeclarationSite,
  isDeclarationSite,
  isNotNullishSite,
} from "../predicate.mjs";
import { unbuildDefault } from "./default.mjs";
import { unbuildInit, unbuildLeftBody, unbuildLeftInit } from "./left.mjs";
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
  makeReturnArgumentExpression,
  makeReadCatchErrorExpression,
} from "../param/index.mjs";
import {
  bindSequence,
  dropSequence,
  flatSequence,
  listenSequence,
  mapSequence,
  thenSequence,
  passSequence,
  sequenceControlBlock,
  sequenceControlStatement,
  tellSequence,
  zeroSequence,
} from "../sequence.mjs";
import {
  listNextIteratorEffect,
  listReturnIteratorEffect,
} from "../helper.mjs";

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

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
 *   site: {
 *     node:
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
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
      const metas = splitMeta(meta, ["drill", "result"]);
      const sites = drill({ node, path, meta: metas.drill }, ["argument"]);
      return [
        makeReturnStatement(
          makeReturnArgumentExpression({ path, meta: metas.result }, scope, {
            argument: isNotNullishSite(sites.argument)
              ? unbuildExpression(sites.argument, scope, {})
              : null,
          }),
          path,
        ),
      ];
    }
    case "ExpressionStatement": {
      const sites = drill({ node, path, meta }, ["expression"]);
      if (completion !== null && isLastValue(path, completion.root)) {
        return map(
          listWriteCacheEffect(
            completion.cache,
            unbuildExpression(sites.expression, scope, {}),
            path,
          ),
          (node) => makeEffectStatement(node, path),
        );
      } else {
        return map(unbuildEffect(sites.expression, scope, {}), (node) =>
          makeEffectStatement(node, path),
        );
      }
    }
    case "ThrowStatement": {
      const sites = drill({ node, path, meta }, ["argument"]);
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("aran.throw", path),
              makePrimitiveExpression({ undefined: null }, path),
              [unbuildExpression(sites.argument, scope, {})],
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
      const sites = drill({ node, path, meta }, ["declarations"]);
      return map(
        flatMap(drillArray(sites.declarations), (site) =>
          unbuildDeclarator(site, scope, {}),
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
                name: makePrimitiveExpression("default", path),
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
                name: makePrimitiveExpression("default", path),
              }),
              path,
            ),
            path,
          ),
        ];
      } else {
        const metas = splitMeta(meta, ["drill", "initialize"]);
        return map(
          listScopeInitializeEffect({ path, meta: metas.initialize }, scope, {
            variable: /** @type {estree.Variable} */ (node.id.name),
            right: unbuildClass({ node, path, meta: metas.drill }, scope, {
              name: makePrimitiveExpression(node.id.name, path),
            }),
          }),
          (node) => makeEffectStatement(node, path),
        );
      }
    }
    case "ImportDeclaration": {
      return [];
    }
    case "ExportNamedDeclaration": {
      const sites = drill({ node, path, meta }, ["declaration"]);
      return isNotNullishSite(sites.declaration) &&
        isDeclarationSite(sites.declaration)
        ? unbuildStatement(sites.declaration, scope, {
            labels: [],
            completion,
            loop,
          })
        : [];
    }
    case "ExportDefaultDeclaration": {
      const sites = drill({ node, path, meta }, ["declaration"]);
      return unbuildDefault(sites.declaration, scope, {});
    }
    case "ExportAllDeclaration": {
      return [];
    }
    case "LabeledStatement": {
      const sites = drill({ node, path, meta }, ["body"]);
      return unbuildStatement(sites.body, scope, {
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
      const metas = splitMeta(meta, ["drill", "raw_frame", "frame"]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "body",
        "object",
      ]);
      return [
        ...listUndefinedCompletion(path, completion),
        ...listenSequence(
          bindSequence(
            passSequence(
              cacheConstant(
                metas.raw_frame,
                unbuildExpression(sites.object, scope, {}),
                path,
              ),
              (node) => makeEffectStatement(node, path),
            ),
            (raw_frame) =>
              bindSequence(
                passSequence(
                  cacheConstant(
                    metas.frame,
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
                  (node) => makeEffectStatement(node, path),
                ),
                (frame) =>
                  tellSequence([
                    makeBlockStatement(
                      unbuildControlBody(
                        sites.body,
                        {
                          ...scope,
                          scope: extendDynamicScope(scope, frame),
                        },
                        {
                          labels: map(labels, mangleBreakLabel),
                          completion,
                          loop,
                        },
                      ),
                      path,
                    ),
                  ]),
              ),
          ),
        ),
      ];
    }
    case "IfStatement": {
      const sites = drill({ node, path, meta }, [
        "test",
        "consequent",
        "alternate",
      ]);
      return [
        ...listUndefinedCompletion(path, completion),
        makeIfStatement(
          unbuildExpression(sites.test, scope, {}),
          unbuildControlBody(sites.consequent, scope, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
          }),
          isNotNullishSite(sites.alternate)
            ? unbuildControlBody(sites.alternate, scope, {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : sequenceControlBlock(
                dropSequence(
                  extendStaticScope({ path }, scope, {
                    frame: { situ: "local", link: null, kinds: {} },
                  }),
                ),
                [],
                path,
              ),
          path,
        ),
      ];
    }
    case "TryStatement": {
      const sites = drill({ node, path, meta }, [
        "block",
        "handler",
        "finalizer",
      ]);
      return [
        ...listUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(sites.block, scope, {
            labels: map(labels, mangleBreakLabel),
            loop,
            completion,
          }),
          isNotNullishSite(sites.handler)
            ? unbuildCatch(sites.handler, scope, {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : sequenceControlBlock(
                bindSequence(
                  extendStaticScope(
                    { path },
                    { ...scope, catch: true },
                    {
                      frame: { situ: "local", link: null, kinds: {} },
                    },
                  ),
                  (scope) =>
                    tellSequence([
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throw", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [makeReadCatchErrorExpression({ path }, scope)],
                            path,
                          ),
                          path,
                        ),
                        path,
                      ),
                    ]),
                ),
                [],
                path,
              ),
          isNotNullishSite(sites.finalizer)
            ? unbuildControlBody(sites.finalizer, scope, {
                labels: map(labels, mangleBreakLabel),
                loop,
                // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                completion,
              })
            : sequenceControlBlock(
                dropSequence(
                  extendStaticScope({ path }, scope, {
                    frame: { situ: "local", link: null, kinds: {} },
                  }),
                ),
                [],
                path,
              ),
          path,
        ),
      ];
    }
    case "WhileStatement": {
      const sites = drill({ node, path, meta }, ["body", "test"]);
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
          bindSequence(
            extendStaticScope({ path }, scope, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
            (scope) =>
              tellSequence([
                makeWhileStatement(
                  unbuildExpression(sites.test, scope, {}),
                  unbuildControlBody(sites.body, scope, {
                    labels: inner_label_array,
                    loop,
                    completion,
                  }),
                  path,
                ),
              ]),
          ),
          outer_label_array,
          path,
        ),
      ];
    }
    case "DoWhileStatement": {
      const metas = splitMeta(meta, ["drill", "initial"]);
      const sites = drill({ node, path, meta: metas.drill }, ["body", "test"]);
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
          bindSequence(
            extendStaticScope({ path }, scope, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
            (scope) =>
              bindSequence(
                passSequence(
                  cacheWritable(
                    metas.initial,
                    makePrimitiveExpression(true, path),
                    path,
                  ),
                  (node) => makeEffectStatement(node, path),
                ),
                (initial) =>
                  tellSequence([
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
                        unbuildExpression(sites.test, scope, {}),
                        path,
                      ),
                      unbuildControlBody(sites.body, scope, {
                        labels: inner_label_array,
                        loop,
                        completion,
                      }),
                      path,
                    ),
                  ]),
              ),
          ),
          outer_label_array,
          path,
        ),
      ];
    }
    case "ForStatement": {
      const metas = splitMeta(meta, [
        "drill",
        "mirror",
        "first",
        "test",
        "initialize",
        "update",
      ]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "body",
        "init",
        "test",
        "update",
      ]);
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
      if (
        isNotNullishSite(sites.init) &&
        isBlockVariableDeclarationSite(sites.init)
      ) {
        const TS_NARROW_sites_init = sites.init;
        const kinds = hoistBlock(scope.mode, [sites.init.node]);
        return [
          ...listUndefinedCompletion(path, completion),
          makeBlockStatement(
            sequenceControlBlock(
              bindSequence(
                extendStaticScope({ path }, scope, {
                  frame: { situ: "local", link: null, kinds },
                }),
                (scope) =>
                  thenSequence(
                    tellSequence(
                      unbuildStatement(TS_NARROW_sites_init, scope, {
                        labels: [],
                        completion,
                        loop: { break: null, continue: null },
                      }),
                    ),
                    bindSequence(
                      passSequence(
                        flatSequence(
                          map(
                            zipMeta(
                              metas.mirror,
                              /** @type {estree.Variable[]} */ (listKey(kinds)),
                            ),
                            ([meta, variable]) => {
                              const metas = splitMeta(meta, ["cache", "read"]);
                              return mapSequence(
                                cacheWritable(
                                  metas.read,
                                  makeScopeReadExpression(
                                    {
                                      path,
                                      meta: metas.read,
                                    },
                                    scope,
                                    { variable },
                                  ),
                                  path,
                                ),
                                (cache) => pairup(variable, cache),
                              );
                            },
                          ),
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      (entries) =>
                        bindSequence(
                          passSequence(
                            cacheWritable(
                              metas.first,
                              makePrimitiveExpression(true, path),
                              path,
                            ),
                            (node) => makeEffectStatement(node, path),
                          ),
                          (first) =>
                            bindSequence(
                              passSequence(
                                cacheWritable(
                                  metas.test,
                                  makePrimitiveExpression(true, path),
                                  path,
                                ),
                                (node) => makeEffectStatement(node, path),
                              ),
                              (test) =>
                                tellSequence([
                                  makeWhileStatement(
                                    makeConditionalExpression(
                                      makeReadCacheExpression(first, path),
                                      makePrimitiveExpression(true, path),
                                      makeReadCacheExpression(test, path),
                                      path,
                                    ),
                                    sequenceControlBlock(
                                      bindSequence(
                                        extendStaticScope({ path }, scope, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds,
                                          },
                                        }),
                                        (scope) =>
                                          tellSequence([
                                            ...map(
                                              flatMap(
                                                zipMeta(
                                                  metas.initialize,
                                                  entries,
                                                ),
                                                ([meta, [variable, cache]]) =>
                                                  listScopeInitializeEffect(
                                                    { path, meta },
                                                    scope,
                                                    {
                                                      variable,
                                                      right:
                                                        makeReadCacheExpression(
                                                          cache,
                                                          path,
                                                        ),
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
                                                isNotNullishSite(sites.update)
                                                  ? [
                                                      makeExpressionEffect(
                                                        unbuildExpression(
                                                          sites.update,
                                                          scope,
                                                          {},
                                                        ),
                                                        path,
                                                      ),
                                                    ]
                                                  : [],
                                                path,
                                              ),
                                              path,
                                            ),
                                            ...(isNotNullishSite(sites.test)
                                              ? map(
                                                  listWriteCacheEffect(
                                                    test,
                                                    unbuildExpression(
                                                      sites.test,
                                                      scope,
                                                      {},
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
                                                sites.body,
                                                scope,
                                                {
                                                  labels: inner_label_array,
                                                  completion,
                                                  loop,
                                                },
                                              ),
                                              sequenceControlBlock(
                                                dropSequence(
                                                  extendStaticScope(
                                                    { path },
                                                    scope,
                                                    {
                                                      frame: {
                                                        situ: "local",
                                                        link: null,
                                                        kinds: {},
                                                      },
                                                    },
                                                  ),
                                                ),
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
                                                    makeScopeReadExpression(
                                                      {
                                                        path,
                                                        meta: metas.update,
                                                      },
                                                      scope,
                                                      { variable },
                                                    ),
                                                    path,
                                                  ),
                                              ),
                                              (node) =>
                                                makeEffectStatement(node, path),
                                            ),
                                          ]),
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
              ),
              outer_label_array,
              path,
            ),
            path,
          ),
        ];
      } else {
        const TS_NARROW_update = sites.update;
        return [
          ...listUndefinedCompletion(path, completion),
          ...sequenceControlStatement(
            bindSequence(
              extendStaticScope({ path }, scope, {
                frame: { situ: "local", link: null, kinds: {} },
              }),
              (scope) =>
                tellSequence([
                  ...(isNotNullishSite(sites.init)
                    ? unbuildInit(sites.init, scope, {})
                    : []),
                  makeWhileStatement(
                    isNotNullishSite(sites.test)
                      ? unbuildExpression(sites.test, scope, {})
                      : makePrimitiveExpression(true, path),
                    isNotNullishSite(TS_NARROW_update)
                      ? sequenceControlBlock(
                          bindSequence(
                            extendStaticScope({ path }, scope, {
                              frame: { situ: "local", link: null, kinds: {} },
                            }),
                            (scope) =>
                              tellSequence([
                                makeBlockStatement(
                                  unbuildControlBody(sites.body, scope, {
                                    labels: inner_label_array,
                                    completion,
                                    loop,
                                  }),
                                  path,
                                ),
                                ...map(
                                  unbuildEffect(TS_NARROW_update, scope, {}),
                                  (effect) => makeEffectStatement(effect, path),
                                ),
                              ]),
                          ),
                          [],
                          path,
                        )
                      : unbuildControlBody(sites.body, scope, {
                          labels: inner_label_array,
                          loop,
                          completion,
                        }),
                    path,
                  ),
                ]),
            ),
            outer_label_array,
            path,
          ),
        ];
      }
    }
    case "ForInStatement": {
      const metas = splitMeta(meta, ["drill", "keys", "index", "right"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["left", "right", "body"]),
        "left",
        splitSite,
      );
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
          bindSequence(
            extendStaticScope({ path }, scope, {
              frame: {
                situ: "local",
                link: null,
                kinds: hoistBlock(scope.mode, [node.left]),
              },
            }),
            (scope) =>
              thenSequence(
                tellSequence(unbuildLeftInit(sites.left.car, scope, {})),
                bindSequence(
                  passSequence(
                    cacheConstant(
                      metas.right,
                      unbuildExpression(sites.right, scope, {}),
                      path,
                    ),
                    (node) => makeEffectStatement(node, path),
                  ),
                  (right) =>
                    bindSequence(
                      passSequence(
                        cacheConstant(
                          metas.keys,
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.listForInKey", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [makeReadCacheExpression(right, path)],
                            path,
                          ),
                          path,
                        ),
                        (node) => makeEffectStatement(node, path),
                      ),
                      (keys) =>
                        bindSequence(
                          passSequence(
                            cacheWritable(
                              metas.index,
                              makePrimitiveExpression(0, path),
                              path,
                            ),
                            (node) => makeEffectStatement(node, path),
                          ),
                          (index) =>
                            tellSequence([
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
                                  bindSequence(
                                    extendStaticScope({ path }, scope, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: hoistBlock(scope.mode, [
                                          node.left,
                                        ]),
                                      },
                                    }),
                                    (scope) =>
                                      tellSequence([
                                        ...map(
                                          unbuildLeftBody(
                                            sites.left.cdr,
                                            scope,
                                            {
                                              right: makeGetExpression(
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
                                            },
                                          ),
                                          (node) =>
                                            makeEffectStatement(node, path),
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
                                            sites.body,
                                            scope,
                                            {
                                              labels: inner_label_array,
                                              completion,
                                              loop,
                                            },
                                          ),
                                          sequenceControlBlock(
                                            bindSequence(
                                              extendStaticScope(
                                                { path },
                                                { ...scope, catch: true },
                                                {
                                                  frame: {
                                                    situ: "local",
                                                    link: null,
                                                    kinds: {},
                                                  },
                                                },
                                              ),
                                              (_scope) => zeroSequence(null),
                                            ),
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
                                              makePrimitiveExpression(1, path),
                                              path,
                                            ),
                                            path,
                                          ),
                                          (node) =>
                                            makeEffectStatement(node, path),
                                        ),
                                      ]),
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
          ),
          outer_label_array,
          path,
        ),
      ];
    }
    case "ForOfStatement": {
      const metas = splitMeta(meta, [
        "drill",
        "iterable",
        "iterator",
        "next",
        "step",
        "value",
      ]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["left", "right", "body"]),
        "left",
        splitSite,
      );
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
          bindSequence(
            extendStaticScope({ path }, scope, {
              frame: {
                situ: "local",
                link: null,
                kinds: hoistBlock(scope.mode, [node.left]),
              },
            }),
            (scope) =>
              thenSequence(
                tellSequence(unbuildLeftInit(sites.left.car, scope, {})),
                bindSequence(
                  passSequence(
                    cacheConstant(
                      metas.iterable,
                      unbuildExpression(sites.right, scope, {}),
                      path,
                    ),
                    (node) => makeEffectStatement(node, path),
                  ),
                  (iterable) =>
                    bindSequence(
                      passSequence(
                        cacheConstant(
                          metas.iterator,
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
                        (node) => makeEffectStatement(node, path),
                      ),
                      (iterator) =>
                        bindSequence(
                          passSequence(
                            cacheConstant(
                              metas.next,
                              makeGetExpression(
                                makeReadCacheExpression(iterator, path),
                                makePrimitiveExpression("next", path),
                                path,
                              ),
                              path,
                            ),
                            (node) => makeEffectStatement(node, path),
                          ),
                          (next) =>
                            bindSequence(
                              passSequence(
                                cacheWritable(
                                  metas.step,
                                  makePrimitiveExpression(
                                    { undefined: null },
                                    path,
                                  ),
                                  path,
                                ),
                                (node) => makeEffectStatement(node, path),
                              ),
                              (step) =>
                                tellSequence([
                                  makeTryStatement(
                                    sequenceControlBlock(
                                      bindSequence(
                                        extendStaticScope({ path }, scope, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds: hoistBlock(scope.mode, [
                                              node.left,
                                            ]),
                                          },
                                        }),
                                        (scope) =>
                                          tellSequence([
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
                                                bindSequence(
                                                  extendStaticScope(
                                                    { path },
                                                    scope,
                                                    {
                                                      frame: {
                                                        situ: "local",
                                                        link: null,
                                                        kinds: hoistBlock(
                                                          scope.mode,
                                                          [node.left],
                                                        ),
                                                      },
                                                    },
                                                  ),
                                                  (scope) =>
                                                    bindSequence(
                                                      passSequence(
                                                        cacheConstant(
                                                          metas.value,
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
                                                        (node) =>
                                                          makeEffectStatement(
                                                            node,
                                                            path,
                                                          ),
                                                      ),
                                                      (value) =>
                                                        tellSequence([
                                                          makeTryStatement(
                                                            sequenceControlBlock(
                                                              bindSequence(
                                                                extendStaticScope(
                                                                  { path },
                                                                  scope,
                                                                  {
                                                                    frame: {
                                                                      situ: "local",
                                                                      link: null,
                                                                      kinds:
                                                                        hoistBlock(
                                                                          scope.mode,
                                                                          [
                                                                            node.left,
                                                                          ],
                                                                        ),
                                                                    },
                                                                  },
                                                                ),
                                                                (scope) =>
                                                                  tellSequence([
                                                                    ...map(
                                                                      unbuildLeftBody(
                                                                        sites
                                                                          .left
                                                                          .cdr,
                                                                        scope,
                                                                        {
                                                                          right:
                                                                            makeReadCacheExpression(
                                                                              value,
                                                                              path,
                                                                            ),
                                                                        },
                                                                      ),
                                                                      (node) =>
                                                                        makeEffectStatement(
                                                                          node,
                                                                          path,
                                                                        ),
                                                                    ),
                                                                    makeBlockStatement(
                                                                      unbuildControlBody(
                                                                        sites.body,
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
                                                                  ]),
                                                              ),
                                                              [],
                                                              path,
                                                            ),
                                                            sequenceControlBlock(
                                                              bindSequence(
                                                                extendStaticScope(
                                                                  { path },
                                                                  {
                                                                    ...scope,
                                                                    catch: true,
                                                                  },
                                                                  {
                                                                    frame: {
                                                                      situ: "local",
                                                                      link: null,
                                                                      kinds: {},
                                                                    },
                                                                  },
                                                                ),
                                                                (scope) =>
                                                                  tellSequence([
                                                                    makeTryStatement(
                                                                      sequenceControlBlock(
                                                                        bindSequence(
                                                                          extendStaticScope(
                                                                            {
                                                                              path,
                                                                            },
                                                                            scope,
                                                                            {
                                                                              frame:
                                                                                {
                                                                                  situ: "local",
                                                                                  link: null,
                                                                                  kinds:
                                                                                    {},
                                                                                },
                                                                            },
                                                                          ),
                                                                          (
                                                                            _scope,
                                                                          ) =>
                                                                            tellSequence(
                                                                              [
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
                                                                            ),
                                                                        ),
                                                                        [],
                                                                        path,
                                                                      ),
                                                                      sequenceControlBlock(
                                                                        dropSequence(
                                                                          extendStaticScope(
                                                                            {
                                                                              path,
                                                                            },
                                                                            scope,
                                                                            {
                                                                              frame:
                                                                                {
                                                                                  situ: "local",
                                                                                  link: null,
                                                                                  kinds:
                                                                                    {},
                                                                                },
                                                                            },
                                                                          ),
                                                                        ),
                                                                        [],
                                                                        path,
                                                                      ),
                                                                      sequenceControlBlock(
                                                                        dropSequence(
                                                                          extendStaticScope(
                                                                            {
                                                                              path,
                                                                            },
                                                                            scope,
                                                                            {
                                                                              frame:
                                                                                {
                                                                                  situ: "local",
                                                                                  link: null,
                                                                                  kinds:
                                                                                    {},
                                                                                },
                                                                            },
                                                                          ),
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
                                                                            makeReadCatchErrorExpression(
                                                                              {
                                                                                path,
                                                                              },
                                                                              scope,
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
                                                              [],
                                                              path,
                                                            ),
                                                            sequenceControlBlock(
                                                              dropSequence(
                                                                extendStaticScope(
                                                                  { path },
                                                                  scope,
                                                                  {
                                                                    frame: {
                                                                      situ: "local",
                                                                      link: null,
                                                                      kinds: {},
                                                                    },
                                                                  },
                                                                ),
                                                              ),
                                                              [],
                                                              path,
                                                            ),
                                                            path,
                                                          ),
                                                        ]),
                                                    ),
                                                ),
                                                [],
                                                path,
                                              ),
                                              path,
                                            ),
                                          ]),
                                      ),
                                      [],
                                      path,
                                    ),
                                    sequenceControlBlock(
                                      bindSequence(
                                        extendStaticScope(
                                          { path },
                                          { ...scope, catch: true },
                                          {
                                            frame: {
                                              situ: "local",
                                              link: null,
                                              kinds: {},
                                            },
                                          },
                                        ),
                                        (scope) =>
                                          tellSequence([
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
                                                makeEffectStatement(node, path),
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
                                                    makeReadCatchErrorExpression(
                                                      { path },
                                                      scope,
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
                                      [],
                                      path,
                                    ),
                                    sequenceControlBlock(
                                      bindSequence(
                                        extendStaticScope({ path }, scope, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds: {},
                                          },
                                        }),
                                        (_scope) =>
                                          tellSequence(
                                            map(
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
                                          ),
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
              ),
          ),
          outer_label_array,
          path,
        ),
      ];
    }
    case "SwitchStatement": {
      const metas = splitMeta(meta, [
        "drill",
        "discriminant",
        "matched",
        "remainder",
      ]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["discriminant", "cases"]),
        "cases",
        splitSite,
      );
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
      return [
        ...listUndefinedCompletion(path, completion),
        ...listenSequence(
          bindSequence(
            passSequence(
              cacheConstant(
                metas.discriminant,
                unbuildExpression(sites.discriminant, scope, {}),
                path,
              ),
              (node) => makeEffectStatement(node, path),
            ),
            (discriminant) =>
              tellSequence(
                sequenceControlStatement(
                  bindSequence(
                    extendStaticScope({ path }, scope, {
                      frame: {
                        situ: "local",
                        link: null,
                        kinds: hoistBlock(
                          scope.mode,
                          flatMap(node.cases, getConsequent),
                        ),
                      },
                    }),
                    (scope) =>
                      bindSequence(
                        passSequence(
                          cacheWritable(
                            metas.matched,
                            makePrimitiveExpression(false, path),
                            path,
                          ),
                          (node) => makeEffectStatement(node, path),
                        ),
                        (matched) =>
                          tellSequence([
                            ...flatMap(drillArray(sites.cases.car), (site) =>
                              unbuildHoistedStatement(site, scope, {
                                parent: "block",
                              }),
                            ),
                            ...flatMap(
                              zipLast(drillArray(sites.cases.cdr)),
                              ([site, last]) =>
                                unbuildCase(site, scope, {
                                  last,
                                  discriminant,
                                  loop: child_loop,
                                  matched,
                                  completion,
                                }),
                            ),
                            ...(remainder.length === 0
                              ? []
                              : [
                                  makeIfStatement(
                                    makeReadCacheExpression(matched, path),
                                    sequenceControlBlock(
                                      dropSequence(
                                        extendStaticScope({ path }, scope, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds: hoistBlock(
                                              scope.mode,
                                              remainder,
                                            ),
                                          },
                                        }),
                                      ),
                                      [],
                                      path,
                                    ),
                                    sequenceControlBlock(
                                      bindSequence(
                                        extendStaticScope({ path }, scope, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds: hoistBlock(
                                              scope.mode,
                                              remainder,
                                            ),
                                          },
                                        }),
                                        (scope) =>
                                          tellSequence(
                                            flatMap(
                                              zipMeta(
                                                metas.remainder,
                                                remainder,
                                              ),
                                              ([meta, node]) =>
                                                unbuildStatement(
                                                  { node, path, meta },
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
                                      [],
                                      path,
                                    ),
                                    path,
                                  ),
                                ]),
                          ]),
                      ),
                  ),
                  outer_label_array,
                  path,
                ),
              ),
          ),
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
 *   sites: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   scope: import("../scope").Scope,
 *   options: {
 *     parent: "block" | "closure" | "program";
 *     labels: [],
 *     completion: import("./statement.d.ts").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBodyStatement = (pairs, scope, options) => [
  ...flatMap(pairs, (pair) => unbuildHoistedStatement(pair, scope, options)),
  ...flatMap(pairs, (pair) => unbuildStatement(pair, scope, options)),
];
