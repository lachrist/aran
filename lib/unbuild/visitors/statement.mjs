import { AranTypeError, flatMap, includes, map } from "../../util/index.mjs";
import {
  extendDynamicScope,
  listScopeInitializeStatement,
  makeScopeControlBlock,
} from "../scope/index.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleEmptyBreakLabel,
  mangleEmptyContinueLabel,
  mangleMetaVariable,
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
  makeWriteEffect,
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
import { ANONYMOUS } from "../name.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import {
  hasAlternate,
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

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

const BASENAME = /** @type {__basename} */ ("statement");

/**
 * @typedef {null | {
 *   variable: unbuild.Variable,
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
          makeWriteEffect(
            completion.variable,
            makePrimitiveExpression({ undefined: null }, path),
            false,
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
          node.argument == null
            ? makePrimitiveExpression({ undefined: null }, path)
            : unbuildExpression(
                {
                  node: node.argument,
                  path: /** @type {unbuild.Path} */ (`${path}.argument`),
                },
                context,
                { name: ANONYMOUS },
              ),
          path,
        ),
      ];
    }
    case "ExpressionStatement": {
      if (completion !== null && isLastValue(path, completion.root)) {
        return [
          makeEffectStatement(
            makeWriteEffect(
              completion.variable,
              unbuildExpression(drill({ node, path }, "expression"), context, {
                name: ANONYMOUS,
              }),
              true,
              path,
            ),
            path,
          ),
        ];
      } else {
        return map(
          unbuildEffect(drill({ node, path }, "expression"), context, null),
          (effect) => makeEffectStatement(effect, path),
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
                  name: ANONYMOUS,
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
        drillAll(drillArray({ node, path }, "declarations")),
        (pair) => unbuildDeclarator(pair, context, null),
      );
    }
    case "FunctionDeclaration": {
      return node.id === null
        ? [
            makeEffectStatement(
              makeExportEffect(
                /** @type {estree.Specifier} */ ("default"),
                unbuildFunction({ node, path }, context, {
                  type: "function",
                  name: ANONYMOUS,
                }),
                path,
              ),
              path,
            ),
          ]
        : [];
    }
    case "ClassDeclaration": {
      return node.id == null
        ? [
            makeEffectStatement(
              makeExportEffect(
                /** @type {estree.Specifier} */ ("default"),
                unbuildClass({ node, path }, context, {
                  name: {
                    type: "static",
                    kind: "init",
                    base: /** @type {estree.Specifier} */ ("default"),
                  },
                }),
                path,
              ),
              path,
            ),
          ]
        : listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            {
              var: mangleMetaVariable(
                BASENAME,
                /** @type {__unique} */ ("class_right"),
                path,
              ),
              val: unbuildClass({ node, path }, context, { name: ANONYMOUS }),
            },
            path,
          );
    }
    case "ImportDeclaration": {
      return [];
    }
    case "ExportNamedDeclaration": {
      return hasDeclarationExportNamedDeclaration(node)
        ? unbuildStatement(drill({ node, path }, "declaration"), context, {
            labels: [],
            completion,
            loop,
          })
        : [];
    }
    case "ExportDefaultDeclaration": {
      return unbuildDefault(
        drill({ node, path }, "declaration"),
        context,
        null,
      );
    }
    case "ExportAllDeclaration": {
      return [];
    }
    case "LabeledStatement": {
      return unbuildStatement(drill({ node, path }, "body"), context, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
        loop,
      });
    }
    case "BlockStatement": {
      return [
        makeBlockStatement(
          unbuildControlBody({ node, path }, context, {
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
      const frame = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("with"),
        path,
      );
      return [
        ...makeUndefinedCompletion(path, completion),
        makeEffectStatement(
          makeWriteEffect(
            frame,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            true,
            path,
          ),
          path,
        ),
        makeBlockStatement(
          unbuildControlBody(
            drill({ node, path }, "body"),
            {
              ...context,
              scope: extendDynamicScope(context, frame),
            },
            {
              labels: map(labels, mangleBreakLabel),
              completion,
              loop,
            },
          ),
          path,
        ),
      ];
    }
    case "IfStatement": {
      return [
        ...makeUndefinedCompletion(path, completion),
        makeIfStatement(
          unbuildExpression(drill({ node, path }, "test"), context, {
            name: ANONYMOUS,
          }),
          unbuildControlBody(drill({ node, path }, "consequent"), context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
          }),
          hasAlternate(node)
            ? unbuildControlBody(drill({ node, path }, "alternate"), context, {
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
      return [
        ...makeUndefinedCompletion(path, completion),
        makeTryStatement(
          unbuildControlBody(drill({ node, path }, "block"), context, {
            labels: map(labels, mangleBreakLabel),
            loop,
            completion,
          }),
          hasHandler(node)
            ? unbuildCatch(drill({ node, path }, "handler"), context, {
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
                name: ANONYMOUS,
              }),
              unbuildControlBody(drill({ node, path }, "body"), context, {
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
      const loop = {
        break: mangleEmptyBreakLabel(path),
        continue: mangleEmptyContinueLabel(path),
      };
      const initial = mangleMetaVariable(
        BASENAME,
        /** @type {__unique} */ ("initial_do"),
        path,
      );
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
            makeEffectStatement(
              makeWriteEffect(
                initial,
                makePrimitiveExpression(true, path),
                true,
                path,
              ),
              path,
            ),
            makeWhileStatement(
              makeConditionalExpression(
                makeReadExpression(initial, path),
                makeSequenceExpression(
                  makeWriteEffect(
                    initial,
                    makePrimitiveExpression(false, path),
                    false,
                    path,
                  ),
                  makePrimitiveExpression(true, path),
                  path,
                ),
                unbuildExpression(drill({ node, path }, "test"), context, {
                  name: ANONYMOUS,
                }),
                path,
              ),
              unbuildControlBody(drill({ node, path }, "body"), context, {
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
    case "ForStatement": {
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
              ? unbuildInit(drill({ node, path }, "init"), context, null)
              : []),
            makeWhileStatement(
              hasTest(node)
                ? unbuildExpression(drill({ node, path }, "test"), context, {
                    name: ANONYMOUS,
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
                          null,
                        ),
                        (effect) => makeEffectStatement(effect, path),
                      ),
                    ],
                    path,
                  )
                : unbuildControlBody(drill({ node, path }, "body"), context, {
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
          (context) => {
            const right = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("for_in_right"),
              path,
            );
            const accumulation = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("for_in_accumulation"),
              path,
            );
            const prototype = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("for_in_prototype"),
              path,
            );
            const index = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("for_in_index"),
              path,
            );
            const keys = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("for_in_keys"),
              path,
            );
            return [
              ...unbuildLeftInit(drill({ node, path }, "left"), context, null),
              makeEffectStatement(
                makeWriteEffect(
                  right,
                  makeApplyExpression(
                    makeIntrinsicExpression("Object", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      unbuildExpression(
                        drill({ node, path }, "right"),
                        context,
                        { name: ANONYMOUS },
                      ),
                    ],
                    path,
                  ),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  accumulation,
                  makeArrayExpression([], path),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  prototype,
                  makeReadExpression(right, path),
                  true,
                  path,
                ),
                path,
              ),
              makeWhileStatement(
                makeBinaryExpression(
                  "!==",
                  makeReadExpression(prototype, path),
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
                          makeIntrinsicExpression("Array.prototype.push", path),
                          makeReadExpression(accumulation, path),
                          [
                            makeApplyExpression(
                              makeIntrinsicExpression("Object.keys", path),
                              makePrimitiveExpression(
                                { undefined: null },
                                path,
                              ),
                              [makeReadExpression(prototype, path)],
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
                      makeWriteEffect(
                        prototype,
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.getPrototypeOf",
                            path,
                          ),
                          makePrimitiveExpression({ undefined: null }, path),
                          [makeReadExpression(prototype, path)],
                          path,
                        ),
                        false,
                        path,
                      ),
                      path,
                    ),
                  ],
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  keys,
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.prototype.flat", path),
                    makeReadExpression(accumulation, path),
                    [],
                    path,
                  ),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  index,
                  makePrimitiveExpression(0, path),
                  true,
                  path,
                ),
                path,
              ),
              makeWhileStatement(
                makeBinaryExpression(
                  "<",
                  makeReadExpression(index, path),
                  makeGetExpression(
                    makeReadExpression(keys, path),
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
                    ...unbuildLeftBody(drill({ node, path }, "left"), context, {
                      right: {
                        var: mangleMetaVariable(
                          BASENAME,
                          /** @type {__unique} */ ("for_in_key"),
                          path,
                        ),
                        val: makeGetExpression(
                          makeReadExpression(keys, path),
                          makeReadExpression(index, path),
                          path,
                        ),
                      },
                    }),
                    makeBlockStatement(
                      unbuildControlBody(
                        drill({ node, path }, "body"),
                        context,
                        {
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
                      makeWriteEffect(
                        index,
                        makeBinaryExpression(
                          "+",
                          makeReadExpression(index, path),
                          makePrimitiveExpression(1, path),
                          path,
                        ),
                        false,
                        path,
                      ),
                      path,
                    ),
                  ],
                  path,
                ),
                path,
              ),
            ];
          },
          path,
        ),
      ];
    }
    case "ForOfStatement": {
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
          (context) => {
            const generator = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("generator"),
              path,
            );
            const iterator = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("iterator"),
              path,
            );
            const next = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("next"),
              path,
            );
            return [
              ...unbuildLeftInit(drill({ node, path }, "left"), context, null),
              makeEffectStatement(
                makeWriteEffect(
                  generator,
                  unbuildExpression(drill({ node, path }, "right"), context, {
                    name: ANONYMOUS,
                  }),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  iterator,
                  wrapAwait(
                    node.await,
                    makeApplyExpression(
                      makeGetExpression(
                        makeReadExpression(generator, path),
                        makeIntrinsicExpression("Symbol.iterator", path),
                        path,
                      ),
                      makeReadExpression(generator, path),
                      [],
                      path,
                    ),
                    path,
                  ),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  next,
                  wrapAwait(
                    node.await,
                    makeApplyExpression(
                      makeGetExpression(
                        makeReadExpression(iterator, path),
                        makePrimitiveExpression("next", path),
                        path,
                      ),
                      makeReadExpression(iterator, path),
                      [],
                      path,
                    ),
                    path,
                  ),
                  true,
                  path,
                ),
                path,
              ),
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
                    makeWhileStatement(
                      makeUnaryExpression(
                        "!",
                        makeGetExpression(
                          makeReadExpression(next, path),
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
                              right: {
                                var: mangleMetaVariable(
                                  BASENAME,
                                  /** @type {__unique} */ ("item"),
                                  path,
                                ),
                                val: makeGetExpression(
                                  makeReadExpression(next, path),
                                  makePrimitiveExpression("value", path),
                                  path,
                                ),
                              },
                            },
                          ),
                          makeBlockStatement(
                            unbuildControlBody(
                              drill({ node, path }, "body"),
                              context,
                              {
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
                            makeWriteEffect(
                              next,
                              wrapAwait(
                                node.await,
                                makeApplyExpression(
                                  makeGetExpression(
                                    makeReadExpression(iterator, path),
                                    makePrimitiveExpression("next", path),
                                    path,
                                  ),
                                  makeReadExpression(iterator, path),
                                  [],
                                  path,
                                ),
                                path,
                              ),
                              false,
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
                          makeReadExpression(next, path),
                          makePrimitiveExpression("done", path),
                          path,
                        ),
                        [],
                        [
                          makeConditionalEffect(
                            makeBinaryExpression(
                              "==",
                              makeGetExpression(
                                makeReadExpression(iterator, path),
                                makePrimitiveExpression("return", path),
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
                                    makeReadExpression(iterator, path),
                                    makePrimitiveExpression("return", path),
                                    path,
                                  ),
                                  makeReadExpression(iterator, path),
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
            ];
          },
          path,
        ),
      ];
    }
    case "SwitchStatement": {
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
          (context) => {
            const discriminant = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("discriminant"),
              path,
            );
            const matched = mangleMetaVariable(
              BASENAME,
              /** @type {__unique} */ ("matched"),
              path,
            );
            return [
              makeEffectStatement(
                makeWriteEffect(
                  discriminant,
                  unbuildExpression(
                    drill({ node, path }, "discriminant"),
                    context,
                    {
                      name: ANONYMOUS,
                    },
                  ),
                  true,
                  path,
                ),
                path,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  matched,
                  makePrimitiveExpression(false, path),
                  true,
                  path,
                ),
                path,
              ),
              ...flatMap(
                drillAll(drillArray({ node, path }, "cases")),
                (pair) =>
                  unbuildHoistedStatement(pair, context, { parent: "block" }),
              ),
              ...flatMap(
                drillAll(drillArray({ node, path }, "cases")),
                (pair) =>
                  unbuildCase(pair, context, {
                    discriminant,
                    loop: {
                      break: loop_break,
                      continue: loop.continue,
                    },
                    matched,
                    completion,
                  }),
              ),
            ];
          },
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
 *     node: (
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration
 *     ),
 *     path: unbuild.Path,
 *   }[],
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
