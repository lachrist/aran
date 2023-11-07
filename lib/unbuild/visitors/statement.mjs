import { AranTypeError, flatMap, includes, map } from "../../util/index.mjs";
import {
  extendDynamicScope,
  listScopeInitializeStatement,
  makeScopeControlBlock,
  makeScopeResultExpression,
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
  makeReadExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildCatch } from "./catch.mjs";
import { unbuildExpression } from "./expression.mjs";
import {
  hasEmptyBreak,
  hasEmptyContinue,
  hoistBlock,
} from "../query/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildCase } from "./case.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildClass } from "./class.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import {
  hasAlternate,
  hasArgument,
  hasDeclarationExportNamedDeclaration,
  hasFinalizer,
  hasHandler,
  hasInit,
  hasTest,
  hasUpdate,
} from "../predicate.mjs";
import { unbuildDefault } from "./default.mjs";
import { unbuildInit, unbuildLeftBody, unbuildLeftInit } from "./left.mjs";
import { isLastValue } from "../completion.mjs";
import { makeSyntaxErrorExpression } from "../report.mjs";
import { unbuildHoistedStatement } from "./hoisted.mjs";
import {
  listInitCacheStatement,
  makeReadCacheExpression,
  makeWriteCacheEffect,
} from "../cache.mjs";

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @typedef {null | {
 *   cache: import("../cache.mjs").WritableCache,
 *   root: estree.Program,
 * }} Completion
 */

/**
 * @type {(
 *   path: unbuild.Path,
 *   completion: Completion,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const makeUndefinedCompletion = (path, completion) =>
  completion !== null && isLastValue(path, completion.root)
    ? [
        makeEffectStatement(
          makeWriteCacheEffect(
            completion.cache,
            makePrimitiveExpression({ undefined: null }, path),
            path,
          ),
          path,
        ),
      ]
    : [];

/**
 * @type {(
 *   context1: import("../context.d.ts").Context,
 *   labels: unbuild.Label[],
 *   frame: import("../scope/index.mjs").Frame,
 *   makeBody: (
 *     context2: import("../context.d.ts").Context,
 *   ) => aran.Statement<unbuild.Atom>[],
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
const wrapBlock = (context, labels, frame, makeBody, path) =>
  labels.length === 0 && listKey(frame.kinds).length === 0
    ? makeBody(context)
    : [
        makeBlockStatement(
          makeScopeControlBlock(context, frame, labels, makeBody, path),
          path,
        ),
      ];

/**
 * @type {(
 *   asynchronous: boolean,
 *   expression: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const wrapAwait = (asynchronous, expression, path) =>
  asynchronous ? makeAwaitExpression(expression, path) : expression;

/** @type {<X>(object: { consequent: X}) => X} */
const getConsequent = ({ consequent }) => consequent;

/**
 * @type {(
 *   pair: {
 *     node:
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     labels: estree.Label[],
 *     completion: Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildStatement = (
  { node, path },
  context,
  { meta, labels, completion, loop },
) => {
  switch (node.type) {
    case "EmptyStatement": {
      return [];
    }
    case "DebuggerStatement": {
      return [makeDebuggerStatement(path)];
    }
    case "ReturnStatement": {
      const metas = splitMeta(meta, ["argument", "result"]);
      return [
        makeReturnStatement(
          makeScopeResultExpression(
            context,
            hasArgument(node)
              ? unbuildExpression(drill({ node, path }, "argument"), context, {
                  meta: metas.argument,
                })
              : null,
            path,
            metas.result,
          ),
          path,
        ),
      ];
    }
    case "ExpressionStatement": {
      if (completion !== null && isLastValue(path, completion.root)) {
        return [
          makeEffectStatement(
            makeWriteCacheEffect(
              completion.cache,
              unbuildExpression(drill({ node, path }, "expression"), context, {
                meta,
              }),
              path,
            ),
            path,
          ),
        ];
      } else {
        return map(
          unbuildEffect(drill({ node, path }, "expression"), context, { meta }),
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
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  meta,
                }),
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
      return flatMap(
        zipMeta(meta, drillAll(drillArray({ node, path }, "declarations"))),
        ([meta, pair]) => unbuildDeclarator(pair, context, { meta }),
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return [
          makeEffectStatement(
            makeExportEffect(
              /** @type {estree.Specifier} */ ("default"),
              unbuildFunction({ node, path }, context, {
                type: "function",
                meta,
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
              /** @type {estree.Specifier} */ ("default"),
              unbuildClass({ node, path }, context, {
                meta,
                name: makePrimitiveExpression("default", path),
              }),
              path,
            ),
            path,
          ),
        ];
      } else {
        const metas = splitMeta(meta, ["class", "initialize"]);
        return listScopeInitializeStatement(
          context,
          /** @type {estree.Variable} */ (node.id.name),
          unbuildClass({ node, path }, context, {
            meta: metas.class,
            name: makePrimitiveExpression(node.id.name, path),
          }),
          path,
          metas.initialize,
        );
      }
    }
    case "ImportDeclaration": {
      return [];
    }
    case "ExportNamedDeclaration": {
      return hasDeclarationExportNamedDeclaration(node)
        ? unbuildStatement(drill({ node, path }, "declaration"), context, {
            meta,
            labels: [],
            completion,
            loop,
          })
        : [];
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(drill({ node, path }, "declaration"), context, {
        meta,
      });
    }
    case "ExportAllDeclaration": {
      return [];
    }
    case "LabeledStatement": {
      return unbuildStatement(drill({ node, path }, "body"), context, {
        meta,
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          unbuildControlBody({ node, path }, context, {
            meta,
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
      const metas = splitMeta(meta, ["object", "body", "object_cache"]);
      return [
        ...makeUndefinedCompletion(path, completion),
        ...listInitCacheStatement(
          "constant",
          unbuildExpression(drill({ node, path }, "object"), context, {
            meta: metas.object,
          }),
          { path, meta: metas.object_cache },
          (object) => [
            makeBlockStatement(
              unbuildControlBody(
                drill({ node, path }, "body"),
                {
                  ...context,
                  scope: extendDynamicScope(context, object),
                },
                {
                  meta: metas.body,
                  labels: map(labels, mangleBreakLabel),
                  completion,
                  loop,
                },
              ),
              path,
            ),
          ],
        ),
      ];
    }
    case "IfStatement": {
      const metas = splitMeta(meta, ["test", "consequent", "alternate"]);
      return [
        ...makeUndefinedCompletion(path, completion),
        makeIfStatement(
          unbuildExpression(drill({ node, path }, "test"), context, {
            meta: metas.test,
          }),
          unbuildControlBody(drill({ node, path }, "consequent"), context, {
            meta: metas.consequent,
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
          }),
          hasAlternate(node)
            ? unbuildControlBody(drill({ node, path }, "alternate"), context, {
                meta: metas.alternate,
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : makeScopeControlBlock(
                context,
                {
                  type: "block",
                  this: null,
                  catch: false,
                  kinds: {},
                },
                map(labels, mangleBreakLabel),
                (_context) => [],
                path,
              ),
          path,
        ),
      ];
    }
    case "TryStatement": {
      const metas = splitMeta(meta, ["block", "handler", "finalizer"]);
      return [
        ...makeUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(drill({ node, path }, "block"), context, {
            meta: metas.block,
            labels: map(labels, mangleBreakLabel),
            loop,
            completion,
          }),
          hasHandler(node)
            ? unbuildCatch(drill({ node, path }, "handler"), context, {
                meta: metas.handler,
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
              })
            : makeScopeControlBlock(
                context,
                {
                  type: "block",
                  this: null,
                  catch: false,
                  kinds: {},
                },
                map(labels, mangleBreakLabel),
                (_context) => [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.throw", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [makeReadExpression("catch.error", path)],
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                ],
                path,
              ),
          hasFinalizer(node)
            ? unbuildControlBody(drill({ node, path }, "finalizer"), context, {
                meta: metas.finalizer,
                labels: map(labels, mangleBreakLabel),
                loop,
                // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                completion,
              })
            : makeScopeControlBlock(
                context,
                {
                  type: "block",
                  this: null,
                  catch: false,
                  kinds: {},
                },
                map(labels, mangleBreakLabel),
                (_context) => [],
                path,
              ),
          path,
        ),
      ];
    }
    case "WhileStatement": {
      const metas = splitMeta(meta, ["test", "body"]);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      return [
        ...makeUndefinedCompletion(path, completion),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: {},
          },
          (context) => [
            makeWhileStatement(
              unbuildExpression(drill({ node, path }, "test"), context, {
                meta: metas.test,
              }),
              unbuildControlBody(drill({ node, path }, "body"), context, {
                meta: metas.body,
                labels: [
                  ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                  ...map(labels, mangleContinueLabel),
                ],
                loop,
                completion,
              }),
              path,
            ),
          ],
          path,
        ),
      ];
    }
    case "DoWhileStatement": {
      const metas = splitMeta(meta, ["test", "body", "initial_cache"]);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      return [
        ...makeUndefinedCompletion(path, completion),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: {},
          },
          (context) =>
            listInitCacheStatement(
              "writable",
              makePrimitiveExpression(true, path),
              { path, meta: metas.initial_cache },
              (initial) => [
                makeWhileStatement(
                  makeConditionalExpression(
                    makeReadCacheExpression(initial, path),
                    makeSequenceExpression(
                      makeWriteCacheEffect(
                        initial,
                        makePrimitiveExpression(false, path),
                        path,
                      ),
                      makePrimitiveExpression(true, path),
                      path,
                    ),
                    unbuildExpression(drill({ node, path }, "test"), context, {
                      meta: metas.test,
                    }),
                    path,
                  ),
                  unbuildControlBody(drill({ node, path }, "body"), context, {
                    meta: metas.body,
                    labels: [
                      ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                      ...map(labels, mangleContinueLabel),
                    ],
                    loop,
                    completion,
                  }),
                  path,
                ),
              ],
            ),
          path,
        ),
      ];
    }
    case "ForStatement": {
      const metas = splitMeta(meta, ["init", "test", "update", "body"]);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      return [
        ...makeUndefinedCompletion(path, completion),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(path)] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: hoistBlock(node.init == null ? [] : [node.init]),
          },
          (context) => [
            ...(hasInit(node)
              ? unbuildInit(drill({ node, path }, "init"), context, {
                  meta: metas.init,
                })
              : []),
            makeWhileStatement(
              hasTest(node)
                ? unbuildExpression(drill({ node, path }, "test"), context, {
                    meta: metas.test,
                  })
                : makePrimitiveExpression(true, path),
              hasUpdate(node)
                ? makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      this: null,
                      catch: false,
                      kinds: {},
                    },
                    [],
                    (context) => [
                      makeBlockStatement(
                        unbuildControlBody(
                          drill({ node, path }, "body"),
                          context,
                          {
                            meta: metas.body,
                            labels: [
                              ...(hasEmptyContinue(node.body)
                                ? [loop.continue]
                                : []),
                              ...map(labels, mangleContinueLabel),
                            ],
                            completion,
                            loop,
                          },
                        ),
                        path,
                      ),
                      ...map(
                        unbuildEffect(
                          drill({ node, path }, "update"),
                          context,
                          { meta: metas.update },
                        ),
                        (effect) => makeEffectStatement(effect, path),
                      ),
                    ],
                    path,
                  )
                : unbuildControlBody(drill({ node, path }, "body"), context, {
                    meta: metas.body,
                    labels: [
                      ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                      ...map(labels, mangleContinueLabel),
                    ],
                    loop,
                    completion,
                  }),
              path,
            ),
          ],
          path,
        ),
      ];
    }
    case "ForInStatement": {
      const metas = splitMeta(meta, [
        "right_cache",
        "accumulation_cache",
        "prototype_cache",
        "index_cache",
        "keys_cache",
        "left_init",
        "left_body",
        "right",
        "body",
      ]);
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
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: hoistBlock([node.left]),
          },
          (context) => [
            ...unbuildLeftInit(drill({ node, path }, "left"), context, {
              meta: metas.left_init,
            }),
            ...listInitCacheStatement(
              "constant",
              makeArrayExpression([], path),
              { path, meta: metas.accumulation_cache },
              (accumulation) => [
                ...listInitCacheStatement(
                  "writable",
                  unbuildExpression(drill({ node, path }, "right"), context, {
                    meta: metas.right,
                  }),
                  { path, meta: metas.right_cache },
                  (right) => [
                    makeWhileStatement(
                      makeBinaryExpression(
                        "!==",
                        makeReadCacheExpression(right, path),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      makeScopeControlBlock(
                        context,
                        {
                          type: "block",
                          this: null,
                          catch: false,
                          kinds: {},
                        },
                        [],
                        (_context) => [
                          makeEffectStatement(
                            makeExpressionEffect(
                              makeApplyExpression(
                                makeIntrinsicExpression(
                                  "Array.prototype.push",
                                  path,
                                ),
                                makeReadCacheExpression(accumulation, path),
                                [
                                  makeApplyExpression(
                                    makeIntrinsicExpression(
                                      "Object.keys",
                                      path,
                                    ),
                                    makePrimitiveExpression(
                                      { undefined: null },
                                      path,
                                    ),
                                    [makeReadCacheExpression(right, path)],
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
                            makeWriteCacheEffect(
                              right,
                              makeApplyExpression(
                                makeIntrinsicExpression(
                                  "Reflect.getPrototypeOf",
                                  path,
                                ),
                                makePrimitiveExpression(
                                  { undefined: null },
                                  path,
                                ),
                                [makeReadCacheExpression(right, path)],
                                path,
                              ),
                              path,
                            ),
                            path,
                          ),
                        ],
                        path,
                      ),
                      path,
                    ),
                  ],
                ),
                ...listInitCacheStatement(
                  "constant",
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.prototype.flat", path),
                    makeReadCacheExpression(accumulation, path),
                    [],
                    path,
                  ),
                  { path, meta: metas.keys_cache },
                  (keys) =>
                    listInitCacheStatement(
                      "writable",
                      makePrimitiveExpression(0, path),
                      { path, meta: metas.index_cache },
                      (index) => [
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
                          makeScopeControlBlock(
                            context,
                            {
                              type: "block",
                              this: null,
                              catch: false,
                              kinds: hoistBlock([node.left]),
                            },
                            [],
                            (context) => [
                              ...unbuildLeftBody(
                                drill({ node, path }, "left"),
                                context,
                                {
                                  meta: metas.left_body,
                                  right: makeGetExpression(
                                    makeReadCacheExpression(keys, path),
                                    makeReadCacheExpression(index, path),
                                    path,
                                  ),
                                },
                              ),
                              makeBlockStatement(
                                unbuildControlBody(
                                  drill({ node, path }, "body"),
                                  context,
                                  {
                                    meta: metas.body,
                                    labels: [
                                      ...(hasEmptyContinue(node.body)
                                        ? [loop.continue]
                                        : []),
                                      ...map(labels, mangleContinueLabel),
                                    ],
                                    completion,
                                    loop,
                                  },
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
                            ],
                            path,
                          ),
                          path,
                        ),
                      ],
                    ),
                ),
              ],
            ),
          ],
          path,
        ),
      ];
    }
    case "ForOfStatement": {
      const metas = splitMeta(meta, [
        "left_init",
        "left_body",
        "right",
        "body",
        "generator_cache",
        "iterator_cache",
        "next_cache",
      ]);
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      return [
        ...makeUndefinedCompletion(path, completion),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: hoistBlock([node.left]),
          },
          (context) => [
            ...unbuildLeftInit(drill({ node, path }, "left"), context, {
              meta: metas.left_init,
            }),
            ...listInitCacheStatement(
              "constant",
              unbuildExpression(drill({ node, path }, "right"), context, {
                meta: metas.right,
              }),
              { path, meta: metas.generator_cache },
              (right) =>
                listInitCacheStatement(
                  "constant",
                  makeApplyExpression(
                    makeGetExpression(
                      makeReadCacheExpression(right, path),
                      makeIntrinsicExpression("Symbol.iterator", path),
                      path,
                    ),
                    makeReadCacheExpression(right, path),
                    [],
                    path,
                  ),
                  { path, meta: metas.iterator_cache },
                  (iterator) =>
                    listInitCacheStatement(
                      "writable",
                      makePrimitiveExpression({ undefined: null }, path),
                      { path, meta: metas.next_cache },
                      (next) => [
                        makeTryStatement(
                          makeScopeControlBlock(
                            context,
                            {
                              type: "block",
                              this: null,
                              catch: false,
                              kinds: hoistBlock([node.left]),
                            },
                            [],
                            (context) => [
                              makeEffectStatement(
                                makeWriteCacheEffect(
                                  next,
                                  wrapAwait(
                                    node.await,
                                    makeApplyExpression(
                                      makeGetExpression(
                                        makeReadCacheExpression(iterator, path),
                                        makePrimitiveExpression("next", path),
                                        path,
                                      ),
                                      makeReadCacheExpression(iterator, path),
                                      [],
                                      path,
                                    ),
                                    path,
                                  ),
                                  path,
                                ),
                                path,
                              ),
                              makeWhileStatement(
                                makeUnaryExpression(
                                  "!",
                                  makeGetExpression(
                                    makeReadCacheExpression(next, path),
                                    makePrimitiveExpression("done", path),
                                    path,
                                  ),
                                  path,
                                ),
                                makeScopeControlBlock(
                                  context,
                                  {
                                    type: "block",
                                    this: null,
                                    catch: false,
                                    kinds: hoistBlock([node.left]),
                                  },
                                  [],
                                  (context) => [
                                    ...unbuildLeftBody(
                                      drill({ node, path }, "left"),
                                      context,
                                      {
                                        meta: metas.left_body,
                                        right: makeGetExpression(
                                          makeReadCacheExpression(next, path),
                                          makePrimitiveExpression(
                                            "value",
                                            path,
                                          ),
                                          path,
                                        ),
                                      },
                                    ),
                                    makeBlockStatement(
                                      unbuildControlBody(
                                        drill({ node, path }, "body"),
                                        context,
                                        {
                                          meta: metas.body,
                                          labels: [
                                            ...(hasEmptyContinue(node.body)
                                              ? [loop.continue]
                                              : []),
                                            ...map(labels, mangleContinueLabel),
                                          ],
                                          completion,
                                          loop,
                                        },
                                      ),
                                      path,
                                    ),
                                    makeEffectStatement(
                                      makeWriteCacheEffect(
                                        next,
                                        wrapAwait(
                                          node.await,
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
                                          path,
                                        ),
                                        path,
                                      ),
                                      path,
                                    ),
                                  ],
                                  path,
                                ),
                                path,
                              ),
                            ],
                            path,
                          ),
                          makeScopeControlBlock(
                            context,
                            {
                              type: "block",
                              this: null,
                              catch: false,
                              kinds: {},
                            },
                            [],
                            (_context) => [
                              makeEffectStatement(
                                makeExpressionEffect(
                                  makeApplyExpression(
                                    makeIntrinsicExpression("aran.throw", path),
                                    makePrimitiveExpression(
                                      { undefined: null },
                                      path,
                                    ),
                                    [makeReadExpression("catch.error", path)],
                                    path,
                                  ),
                                  path,
                                ),
                                path,
                              ),
                            ],
                            path,
                          ),
                          makeScopeControlBlock(
                            context,
                            {
                              type: "block",
                              this: null,
                              catch: false,
                              kinds: {},
                            },
                            [],
                            (_context) => [
                              makeEffectStatement(
                                makeConditionalEffect(
                                  makeGetExpression(
                                    makeReadCacheExpression(next, path),
                                    makePrimitiveExpression("done", path),
                                    path,
                                  ),
                                  [],
                                  [
                                    makeConditionalEffect(
                                      makeBinaryExpression(
                                        "==",
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
                                        makePrimitiveExpression(null, path),
                                        path,
                                      ),
                                      [],
                                      [
                                        // no wrapAwait here
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
                                      ],
                                      path,
                                    ),
                                  ],
                                  path,
                                ),
                                path,
                              ),
                            ],
                            path,
                          ),
                          path,
                        ),
                      ],
                    ),
                ),
            ),
          ],
          path,
        ),
      ];
    }
    case "SwitchStatement": {
      const metas = splitMeta(meta, [
        "discriminant",
        "discriminant_cache",
        "cases_hoisted",
        "cases",
        "matched_cache",
        "body",
      ]);
      const loop_break = mangleEmptyBreakLabel(path);
      return [
        ...makeUndefinedCompletion(path, completion),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node) ? [loop_break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            this: null,
            catch: false,
            kinds: hoistBlock(flatMap(node.cases, getConsequent)),
          },
          (context) =>
            listInitCacheStatement(
              "constant",
              unbuildExpression(
                drill({ node, path }, "discriminant"),
                context,
                { meta: metas.discriminant },
              ),
              { path, meta: metas.discriminant_cache },
              (discriminant) =>
                listInitCacheStatement(
                  "writable",
                  makePrimitiveExpression(false, path),
                  { path, meta: metas.matched_cache },
                  (matched) => [
                    ...flatMap(
                      zipMeta(
                        metas.cases_hoisted,
                        drillAll(drillArray({ node, path }, "cases")),
                      ),
                      ([meta, pair]) =>
                        unbuildHoistedStatement(pair, context, {
                          meta,
                          parent: "block",
                        }),
                    ),
                    ...flatMap(
                      zipMeta(
                        metas.cases,
                        drillAll(drillArray({ node, path }, "cases")),
                      ),
                      ([meta, pair]) =>
                        unbuildCase(pair, context, {
                          meta,
                          discriminant,
                          loop: {
                            break: loop_break,
                            continue: loop.continue,
                          },
                          matched,
                          completion,
                        }),
                    ),
                  ],
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
 *   pairs: {
 *     node:
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *     parent: "block" | "closure" | "program";
 *     labels: [],
 *     completion: Completion,
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
