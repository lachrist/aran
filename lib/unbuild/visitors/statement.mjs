import {
  flatMap,
  guard,
  includes,
  map,
  mapObject,
  pairup,
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
  makeAwaitExpression,
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
} from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
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
import { listReturnIterableEffect } from "../helper.mjs";
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

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @type {(
 *   path: unbuild.Path,
 *   completion: import("./statement.d.ts").Completion,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const makeUndefinedCompletion = (path, completion) =>
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

/** @type {<X>(object: { consequent: X}) => X} */
const getConsequent = ({ consequent }) => consequent;

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
 *   context: import("../context.js").Context,
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
  context,
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
          makeReturnArgumentExpression({ path, meta: metas.result }, context, {
            argument: isNotNullishSite(sites.argument)
              ? unbuildExpression(sites.argument, context, {})
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
            unbuildExpression(sites.expression, context, {}),
            path,
          ),
          (node) => makeEffectStatement(node, path),
        );
      } else {
        return map(unbuildEffect(sites.expression, context, {}), (node) =>
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
              [unbuildExpression(sites.argument, context, {})],
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
          unbuildDeclarator(site, context, {}),
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
              unbuildFunction({ node, path, meta }, context, {
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
              unbuildClass({ node, path, meta }, context, {
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
          listScopeInitializeEffect({ path, meta: metas.initialize }, context, {
            variable: /** @type {estree.Variable} */ (node.id.name),
            right: unbuildClass({ node, path, meta: metas.drill }, context, {
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
        ? unbuildStatement(sites.declaration, context, {
            labels: [],
            completion,
            loop,
          })
        : [];
    }
    case "ExportDefaultDeclaration": {
      const sites = drill({ node, path, meta }, ["declaration"]);
      return unbuildDefault(sites.declaration, context, {});
    }
    case "ExportAllDeclaration": {
      return [];
    }
    case "LabeledStatement": {
      const sites = drill({ node, path, meta }, ["body"]);
      return unbuildStatement(sites.body, context, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          unbuildControlBody({ node, path, meta }, context, {
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
      const metas = splitMeta(meta, ["drill", "object"]);
      const sites = drill({ node, path, meta: metas.drill }, [
        "body",
        "object",
      ]);
      return [
        ...makeUndefinedCompletion(path, completion),
        ...listenSequence(
          bindSequence(
            passSequence(
              cacheConstant(
                metas.object,
                unbuildExpression(sites.object, context, {
                  meta: metas.object,
                }),
                path,
              ),
              (node) => makeEffectStatement(node, path),
            ),
            (object) =>
              tellSequence([
                makeBlockStatement(
                  unbuildControlBody(
                    sites.body,
                    { ...context, scope: extendDynamicScope(context, object) },
                    { labels: map(labels, mangleBreakLabel), completion, loop },
                  ),
                  path,
                ),
              ]),
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
        ...makeUndefinedCompletion(path, completion),
        makeIfStatement(
          unbuildExpression(sites.test, context, {}),
          unbuildControlBody(sites.consequent, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
          }),
          isNotNullishSite(sites.alternate)
            ? unbuildControlBody(sites.alternate, context, {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : sequenceControlBlock(
                dropSequence(
                  extendStaticScope({ path }, context, {
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
        ...makeUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(sites.block, context, {
            labels: map(labels, mangleBreakLabel),
            loop,
            completion,
          }),
          isNotNullishSite(sites.handler)
            ? unbuildCatch(sites.handler, context, {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : sequenceControlBlock(
                bindSequence(
                  extendStaticScope(
                    { path },
                    { ...context, catch: true },
                    {
                      frame: { situ: "local", link: null, kinds: {} },
                    },
                  ),
                  (context) =>
                    tellSequence([
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throw", path),
                            makePrimitiveExpression({ undefined: null }, path),
                            [makeReadCatchErrorExpression({ path }, context)],
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
            ? unbuildControlBody(sites.finalizer, context, {
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
                  extendStaticScope({ path }, context, {
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
      return [
        ...makeUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
            (context) =>
              tellSequence([
                makeWhileStatement(
                  unbuildExpression(sites.test, context, {}),
                  unbuildControlBody(sites.body, context, {
                    labels: [
                      ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                      ...map(labels, mangleContinueLabel),
                    ],
                    loop,
                    completion,
                  }),
                  path,
                ),
              ]),
          ),
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
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
      return [
        ...makeUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: { situ: "local", link: null, kinds: {} },
            }),
            (context) =>
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
                        unbuildExpression(sites.test, context, {}),
                        path,
                      ),
                      unbuildControlBody(sites.body, context, {
                        labels: [
                          ...(hasEmptyContinue(node.body)
                            ? [loop.continue]
                            : []),
                          ...map(labels, mangleContinueLabel),
                        ],
                        loop,
                        completion,
                      }),
                      path,
                    ),
                  ]),
              ),
          ),
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
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
        const kinds = hoistBlock(context.mode, [sites.init.node]);
        return [
          ...makeUndefinedCompletion(path, completion),
          makeBlockStatement(
            sequenceControlBlock(
              bindSequence(
                extendStaticScope({ path }, context, {
                  frame: { situ: "local", link: null, kinds },
                }),
                (context) =>
                  thenSequence(
                    tellSequence(
                      unbuildStatement(TS_NARROW_sites_init, context, {
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
                                    context,
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
                                        extendStaticScope({ path }, context, {
                                          frame: {
                                            situ: "local",
                                            link: null,
                                            kinds,
                                          },
                                        }),
                                        (context) =>
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
                                                    context,
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
                                                          context,
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
                                                      context,
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
                                                context,
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
                                                    context,
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
                                                      context,
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
          ...makeUndefinedCompletion(path, completion),
          ...sequenceControlStatement(
            bindSequence(
              extendStaticScope({ path }, context, {
                frame: { situ: "local", link: null, kinds: {} },
              }),
              (context) =>
                tellSequence([
                  ...(isNotNullishSite(sites.init)
                    ? unbuildInit(sites.init, context, {})
                    : []),
                  makeWhileStatement(
                    isNotNullishSite(sites.test)
                      ? unbuildExpression(sites.test, context, {})
                      : makePrimitiveExpression(true, path),
                    isNotNullishSite(TS_NARROW_update)
                      ? sequenceControlBlock(
                          bindSequence(
                            extendStaticScope({ path }, context, {
                              frame: { situ: "local", link: null, kinds: {} },
                            }),
                            (context) =>
                              tellSequence([
                                makeBlockStatement(
                                  unbuildControlBody(sites.body, context, {
                                    labels: inner_label_array,
                                    completion,
                                    loop,
                                  }),
                                  path,
                                ),
                                ...map(
                                  unbuildEffect(TS_NARROW_update, context, {}),
                                  (effect) => makeEffectStatement(effect, path),
                                ),
                              ]),
                          ),
                          [],
                          path,
                        )
                      : unbuildControlBody(sites.body, context, {
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
      // for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}
      //
      // Variables in the left hand side belongs to the body of the while but still
      // they must be shadowed to the right-hand side.
      //
      // > for (const x in {a:x, b:2}) { console.log(x) }
      // Thrown:
      // ReferenceError: Cannot access 'x' before initialization
      return [
        ...makeUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: {
                situ: "local",
                link: null,
                kinds: hoistBlock(context.mode, [node.left]),
              },
            }),
            (context) =>
              thenSequence(
                tellSequence(unbuildLeftInit(sites.left.car, context, {})),
                bindSequence(
                  passSequence(
                    cacheConstant(
                      metas.right,
                      unbuildExpression(sites.right, context, {}),
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
                                    extendStaticScope({ path }, context, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: hoistBlock(context.mode, [
                                          node.left,
                                        ]),
                                      },
                                    }),
                                    (context) =>
                                      tellSequence([
                                        ...map(
                                          unbuildLeftBody(
                                            sites.left.cdr,
                                            context,
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
                                            context,
                                            {
                                              labels: [
                                                ...(hasEmptyContinue(node.body)
                                                  ? [loop.continue]
                                                  : []),
                                                ...map(
                                                  labels,
                                                  mangleContinueLabel,
                                                ),
                                              ],
                                              completion,
                                              loop,
                                            },
                                          ),
                                          sequenceControlBlock(
                                            bindSequence(
                                              extendStaticScope(
                                                { path },
                                                { ...context, catch: true },
                                                {
                                                  frame: {
                                                    situ: "local",
                                                    link: null,
                                                    kinds: {},
                                                  },
                                                },
                                              ),
                                              (_context) => zeroSequence(null),
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
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
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
        "proper",
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
      return [
        ...makeUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: {
                situ: "local",
                link: null,
                kinds: hoistBlock(context.mode, [node.left]),
              },
            }),
            (context) =>
              thenSequence(
                tellSequence(unbuildLeftInit(sites.left.car, context, {})),
                bindSequence(
                  passSequence(
                    cacheConstant(
                      metas.iterable,
                      unbuildExpression(sites.right, context, {}),
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
                            cacheWritable(
                              metas.next,
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
                              path,
                            ),
                            (node) => makeEffectStatement(node, path),
                          ),
                          (next) =>
                            tellSequence([
                              makeTryStatement(
                                sequenceControlBlock(
                                  bindSequence(
                                    extendStaticScope({ path }, context, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: hoistBlock(context.mode, [
                                          node.left,
                                        ]),
                                      },
                                    }),
                                    (context) =>
                                      tellSequence([
                                        ...map(
                                          listWriteCacheEffect(
                                            next,
                                            guard(
                                              node.await,
                                              (node) =>
                                                makeAwaitExpression(node, path),
                                              makeApplyExpression(
                                                makeGetExpression(
                                                  makeReadCacheExpression(
                                                    iterator,
                                                    path,
                                                  ),
                                                  makePrimitiveExpression(
                                                    "next",
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
                                            ),
                                            path,
                                          ),
                                          (node) =>
                                            makeEffectStatement(node, path),
                                        ),
                                        makeWhileStatement(
                                          makeUnaryExpression(
                                            "!",
                                            makeGetExpression(
                                              makeReadCacheExpression(
                                                next,
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
                                          sequenceControlBlock(
                                            bindSequence(
                                              extendStaticScope(
                                                { path },
                                                context,
                                                {
                                                  frame: {
                                                    situ: "local",
                                                    link: null,
                                                    kinds: hoistBlock(
                                                      context.mode,
                                                      [node.left],
                                                    ),
                                                  },
                                                },
                                              ),
                                              (context) =>
                                                tellSequence([
                                                  ...map(
                                                    unbuildLeftBody(
                                                      sites.left.cdr,
                                                      context,
                                                      {
                                                        right:
                                                          makeGetExpression(
                                                            makeReadCacheExpression(
                                                              next,
                                                              path,
                                                            ),
                                                            makePrimitiveExpression(
                                                              "value",
                                                              path,
                                                            ),
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
                                                      context,
                                                      {
                                                        labels: [
                                                          ...(hasEmptyContinue(
                                                            node.body,
                                                          )
                                                            ? [loop.continue]
                                                            : []),
                                                          ...map(
                                                            labels,
                                                            mangleContinueLabel,
                                                          ),
                                                        ],
                                                        completion,
                                                        loop,
                                                      },
                                                    ),
                                                    path,
                                                  ),
                                                  ...map(
                                                    listWriteCacheEffect(
                                                      next,
                                                      guard(
                                                        node.await,
                                                        (node) =>
                                                          makeAwaitExpression(
                                                            node,
                                                            path,
                                                          ),
                                                        makeApplyExpression(
                                                          makeGetExpression(
                                                            makeReadCacheExpression(
                                                              iterator,
                                                              path,
                                                            ),
                                                            makePrimitiveExpression(
                                                              "next",
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
                                                      ),
                                                      path,
                                                    ),
                                                    (node) =>
                                                      makeEffectStatement(
                                                        node,
                                                        path,
                                                      ),
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
                                  [],
                                  path,
                                ),
                                sequenceControlBlock(
                                  bindSequence(
                                    extendStaticScope(
                                      { path },
                                      { ...context, catch: true },
                                      {
                                        frame: {
                                          situ: "local",
                                          link: null,
                                          kinds: {},
                                        },
                                      },
                                    ),
                                    (context) =>
                                      tellSequence([
                                        makeEffectStatement(
                                          makeExpressionEffect(
                                            makeApplyExpression(
                                              makeIntrinsicExpression(
                                                "aran.throw",
                                                path,
                                              ),
                                              makePrimitiveExpression(
                                                { undefined: null },
                                                path,
                                              ),
                                              [
                                                makeReadCatchErrorExpression(
                                                  { path },
                                                  context,
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
                                    extendStaticScope({ path }, context, {
                                      frame: {
                                        situ: "local",
                                        link: null,
                                        kinds: {},
                                      },
                                    }),
                                    (_context) =>
                                      tellSequence(
                                        map(
                                          listReturnIterableEffect(
                                            { path },
                                            { iterator, next },
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
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          path,
        ),
      ];
    }
    case "SwitchStatement": {
      const metas = splitMeta(meta, ["drill", "discriminant", "matched"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["discriminant", "cases"]),
        "cases",
        splitSite,
      );
      const loop_break = mangleEmptyBreakLabel(path);
      return [
        ...makeUndefinedCompletion(path, completion),
        ...sequenceControlStatement(
          bindSequence(
            extendStaticScope({ path }, context, {
              frame: {
                situ: "local",
                link: null,
                kinds: hoistBlock(
                  context.mode,
                  flatMap(node.cases, getConsequent),
                ),
              },
            }),
            (context) =>
              bindSequence(
                passSequence(
                  cacheConstant(
                    metas.discriminant,
                    unbuildExpression(sites.discriminant, context, {}),
                    path,
                  ),
                  (node) => makeEffectStatement(node, path),
                ),
                (discriminant) =>
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
                          unbuildHoistedStatement(site, context, {
                            parent: "block",
                          }),
                        ),
                        ...flatMap(drillArray(sites.cases.cdr), (site) =>
                          unbuildCase(site, context, {
                            discriminant,
                            loop: {
                              break: loop_break,
                              continue: loop.continue,
                            },
                            matched,
                            completion,
                          }),
                        ),
                      ]),
                  ),
              ),
          ),
          [
            ...(hasEmptyBreak(node) ? [loop_break] : []),
            ...map(labels, mangleBreakLabel),
          ],
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
 *   sites: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   context: import("../context.js").Context,
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
export const listBodyStatement = (pairs, context, options) => [
  ...flatMap(pairs, (pair) => unbuildHoistedStatement(pair, context, options)),
  ...flatMap(pairs, (pair) => unbuildStatement(pair, context, options)),
];
