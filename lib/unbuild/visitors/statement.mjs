import {
  AranTypeError,
  flatMap,
  includes,
  map,
  mapObject,
} from "../../util/index.mjs";
import {
  extendDynamicScope,
  listScopeInitializeStatement,
  makeScopeControlBlock,
} from "../scope/index.mjs";
import { makeParamResultExpression } from "../param-index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
  splitMeta,
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
  makeReadParameterExpression,
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
import { drill, drillArray, splitSite } from "../site.mjs";
import { isDeclarationSite, isNotNullishSite } from "../predicate.mjs";
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
 * @template N
 * @typedef {import("../site.mjs").Site<N>} Site
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
 *     completion: Completion,
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
          makeParamResultExpression(
            context,
            isNotNullishSite(sites.argument)
              ? unbuildExpression(sites.argument, context, {})
              : null,
            path,
            metas.result,
          ),
          path,
        ),
      ];
    }
    case "ExpressionStatement": {
      const sites = drill({ node, path, meta }, ["expression"]);
      if (completion !== null && isLastValue(path, completion.root)) {
        return [
          makeEffectStatement(
            makeWriteCacheEffect(
              completion.cache,
              unbuildExpression(sites.expression, context, {}),
              path,
            ),
            path,
          ),
        ];
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
      return flatMap(drillArray(sites.declarations), (site) =>
        unbuildDeclarator(site, context, {}),
      );
    }
    case "FunctionDeclaration": {
      if (node.id === null) {
        return [
          makeEffectStatement(
            makeExportEffect(
              /** @type {estree.Specifier} */ ("default"),
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
              /** @type {estree.Specifier} */ ("default"),
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
        return listScopeInitializeStatement(
          context,
          /** @type {estree.Variable} */ (node.id.name),
          unbuildClass({ node, path, meta: metas.drill }, context, {
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
        ...listInitCacheStatement(
          "constant",
          unbuildExpression(sites.object, context, { meta: metas.object }),
          { path, meta: metas.object },
          (object) => [
            makeBlockStatement(
              unbuildControlBody(
                sites.body,
                { ...context, scope: extendDynamicScope(context, object) },
                { labels: map(labels, mangleBreakLabel), completion, loop },
              ),
              path,
            ),
          ],
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
            : makeScopeControlBlock(
                context,
                { type: "block", kinds: {} },
                map(labels, mangleBreakLabel),
                (_context) => [],
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
            : makeScopeControlBlock(
                context,
                { type: "block", kinds: {} },
                map(labels, mangleBreakLabel),
                (_context) => [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.throw", path),
                        makePrimitiveExpression({ undefined: null }, path),
                        [makeReadParameterExpression("catch.error", path)],
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                ],
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
            : makeScopeControlBlock(
                context,
                { type: "block", kinds: {} },
                map(labels, mangleBreakLabel),
                (_context) => [],
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
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          { type: "block", kinds: {} },
          (context) => [
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
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          { type: "block", kinds: {} },
          (context) =>
            listInitCacheStatement(
              "writable",
              makePrimitiveExpression(true, path),
              { path, meta: metas.initial },
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
                    unbuildExpression(sites.test, context, {}),
                    path,
                  ),
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
              ],
            ),
          path,
        ),
      ];
    }
    case "ForStatement": {
      const sites = drill({ node, path, meta }, [
        "body",
        "init",
        "test",
        "update",
      ]);
      // ts shenanigans: preserve type narrowing in callback
      const sites_update = sites.update;
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
            kinds: hoistBlock(node.init == null ? [] : [node.init]),
          },
          (context) => [
            ...(isNotNullishSite(sites.init)
              ? unbuildInit(sites.init, context, {})
              : []),
            makeWhileStatement(
              isNotNullishSite(sites.test)
                ? unbuildExpression(sites.test, context, {})
                : makePrimitiveExpression(true, path),
              isNotNullishSite(sites_update)
                ? makeScopeControlBlock(
                    context,
                    { type: "block", kinds: {} },
                    [],
                    (context) => [
                      makeBlockStatement(
                        unbuildControlBody(sites.body, context, {
                          labels: [
                            ...(hasEmptyContinue(node.body)
                              ? [loop.continue]
                              : []),
                            ...map(labels, mangleContinueLabel),
                          ],
                          completion,
                          loop,
                        }),
                        path,
                      ),
                      ...map(
                        unbuildEffect(sites_update, context, {}),
                        (effect) => makeEffectStatement(effect, path),
                      ),
                    ],
                    path,
                  )
                : unbuildControlBody(sites.body, context, {
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
        "drill",
        "right",
        "accumulation",
        "prototype",
        "index",
        "keys",
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
          { type: "block", kinds: hoistBlock([node.left]) },
          (context) => [
            ...unbuildLeftInit(sites.left.car, context, {}),
            ...listInitCacheStatement(
              "constant",
              makeArrayExpression([], path),
              { path, meta: metas.accumulation },
              (accumulation) => [
                ...listInitCacheStatement(
                  "writable",
                  unbuildExpression(sites.right, context, {}),
                  { path, meta: metas.right },
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
                        { type: "block", kinds: {} },
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
                  { path, meta: metas.keys },
                  (keys) =>
                    listInitCacheStatement(
                      "writable",
                      makePrimitiveExpression(0, path),
                      { path, meta: metas.index },
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
                            { type: "block", kinds: hoistBlock([node.left]) },
                            [],
                            (context) => [
                              ...unbuildLeftBody(sites.left.cdr, context, {
                                right: makeGetExpression(
                                  makeReadCacheExpression(keys, path),
                                  makeReadCacheExpression(index, path),
                                  path,
                                ),
                              }),
                              makeBlockStatement(
                                unbuildControlBody(sites.body, context, {
                                  labels: [
                                    ...(hasEmptyContinue(node.body)
                                      ? [loop.continue]
                                      : []),
                                    ...map(labels, mangleContinueLabel),
                                  ],
                                  completion,
                                  loop,
                                }),
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
      const metas = splitMeta(meta, ["drill", "generator", "iterator", "next"]);
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
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node.body) ? [loop.break] : []),
            ...map(labels, mangleBreakLabel),
          ],
          { type: "block", kinds: hoistBlock([node.left]) },
          (context) => [
            ...unbuildLeftInit(sites.left.car, context, {}),
            ...listInitCacheStatement(
              "constant",
              unbuildExpression(sites.right, context, {}),
              { path, meta: metas.generator },
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
                  { path, meta: metas.iterator },
                  (iterator) =>
                    listInitCacheStatement(
                      "writable",
                      makePrimitiveExpression({ undefined: null }, path),
                      { path, meta: metas.next },
                      (next) => [
                        makeTryStatement(
                          makeScopeControlBlock(
                            context,
                            { type: "block", kinds: hoistBlock([node.left]) },
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
                                    kinds: hoistBlock([node.left]),
                                  },
                                  [],
                                  (context) => [
                                    ...unbuildLeftBody(
                                      sites.left.cdr,
                                      context,
                                      {
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
                                      unbuildControlBody(sites.body, context, {
                                        labels: [
                                          ...(hasEmptyContinue(node.body)
                                            ? [loop.continue]
                                            : []),
                                          ...map(labels, mangleContinueLabel),
                                        ],
                                        completion,
                                        loop,
                                      }),
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
                            { type: "block", kinds: {} },
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
                                    [
                                      makeReadParameterExpression(
                                        "catch.error",
                                        path,
                                      ),
                                    ],
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
                            { type: "block", kinds: {} },
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
      const metas = splitMeta(meta, ["drill", "discriminant", "matched"]);
      const sites = mapObject(
        drill({ node, path, meta: metas.drill }, ["discriminant", "cases"]),
        "cases",
        splitSite,
      );
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
            kinds: hoistBlock(flatMap(node.cases, getConsequent)),
          },
          (context) =>
            listInitCacheStatement(
              "constant",
              unbuildExpression(sites.discriminant, context, {}),
              { path, meta: metas.discriminant },
              (discriminant) =>
                listInitCacheStatement(
                  "writable",
                  makePrimitiveExpression(false, path),
                  { path, meta: metas.matched },
                  (matched) => [
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
 *   sites: import("../site.mjs").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   context: import("../context.js").Context,
 *   options: {
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
