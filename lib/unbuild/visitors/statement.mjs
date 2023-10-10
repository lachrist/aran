import { SyntaxAranError } from "../../error.mjs";
import {
  StaticError,
  filter,
  filterOut,
  flatMap,
  includes,
  map,
} from "../../util/index.mjs";
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
import { unbuildControlBlock } from "./block.mjs";
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
import { wrapOriginArray } from "../origin.mjs";
import { isLastValue } from "../completion.mjs";

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
 * @type {<N>(o: { node: N }) => N}
 */
export const getNode = ({ node }) => node;

/**
 * @type {(
 *   pair: {
 *     node: estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
 * ) => {
 *   node: estree.Statement,
 *   path: unbuild.Path,
 * }[]}
 */
const drillConsequent = (pair) => drillAll(drillArray(pair, "consequent"));

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
            makePrimitiveExpression({ undefined: null }),
            false,
          ),
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
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const wrapBlock = (context, labels, frame, makeBody) =>
  labels.length === 0 && listKey(frame.kinds).length === 0
    ? makeBody(context)
    : [
        makeBlockStatement(
          makeScopeControlBlock(context, frame, labels, makeBody),
        ),
      ];

/**
 * @type {(
 *   asynchronous: boolean,
 *   expression: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const wrapAwait = (asynchronous, expression) =>
  asynchronous ? makeAwaitExpression(expression) : expression;

/** @type {<X>(object: { consequent: X}) => X} */
export const getConsequent = ({ consequent }) => consequent;

/**
 * @type {(node: estree.Node) => boolean}
 */
export const isHoisted = (node) =>
  node.type === "FunctionDeclaration" ||
  (node.type === "LabeledStatement" && isHoisted(node.body)) ||
  ((node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration") &&
    node.declaration != null &&
    node.declaration.type === "FunctionDeclaration");

/** @type {(pair: { node: estree.Node }) => boolean} */
export const isPairHoisted = ({ node }) => isHoisted(node);

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
export const unbuildStatement = wrapOriginArray(
  ({ node, path }, context, { labels, completion, loop }) => {
    switch (node.type) {
      case "EmptyStatement":
        return [];
      case "DebuggerStatement":
        return [makeDebuggerStatement()];
      case "ReturnStatement":
        return [
          makeReturnStatement(
            node.argument == null
              ? makePrimitiveExpression({ undefined: null })
              : unbuildExpression(
                  {
                    node: node.argument,
                    path: /** @type {unbuild.Path} */ (`${path}.argument`),
                  },
                  context,
                  { name: ANONYMOUS },
                ),
          ),
        ];
      case "ExpressionStatement":
        if (completion !== null && isLastValue(path, completion.root)) {
          return [
            makeEffectStatement(
              makeWriteEffect(
                completion.variable,
                unbuildExpression(
                  drill({ node, path }, "expression"),
                  context,
                  {
                    name: ANONYMOUS,
                  },
                ),
                true,
              ),
            ),
          ];
        } else {
          return map(
            unbuildEffect(drill({ node, path }, "expression"), context, null),
            (effect) => makeEffectStatement(effect),
          );
        }
      case "ThrowStatement":
        return [
          makeEffectStatement(
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("aran.throw"),
                makePrimitiveExpression({ undefined: null }),
                [
                  unbuildExpression(
                    drill({ node, path }, "argument"),
                    context,
                    {
                      name: ANONYMOUS,
                    },
                  ),
                ],
              ),
            ),
          ),
        ];
      case "BreakStatement": {
        if (node.label == null) {
          if (loop.break === null) {
            throw new SyntaxAranError("Illegal break statement", node);
          } else {
            return [makeBreakStatement(loop.break)];
          }
        } else if (includes(labels, node.label.name)) {
          return [];
        } else {
          return [
            makeBreakStatement(
              mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
            ),
          ];
        }
      }
      case "ContinueStatement":
        if (node.label == null) {
          if (loop.continue === null) {
            throw new SyntaxAranError("Illegal continue statement", node);
          } else {
            return [makeBreakStatement(loop.continue)];
          }
        } else if (includes(labels, node.label.name)) {
          return [];
        } else {
          return [
            makeBreakStatement(
              mangleContinueLabel(
                /** @type {estree.Label} */ (node.label.name),
              ),
            ),
          ];
        }
      case "VariableDeclaration":
        return flatMap(
          drillAll(drillArray({ node, path }, "declarations")),
          (pair) => unbuildDeclarator(pair, context, null),
        );
      case "FunctionDeclaration":
        if (node.id == null) {
          throw new SyntaxAranError("missing function name", node);
        } else {
          const right = mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("function_right"),
            path,
          );
          return [
            makeEffectStatement(
              makeWriteEffect(
                right,
                unbuildFunction(
                  { node, path },
                  {
                    ...context,
                    record: {
                      ...context.record,
                      "super.prototype": ".illegal",
                      "super.constructor": ".illegal",
                    },
                  },
                  {
                    kind: "function",
                    name: ANONYMOUS,
                  },
                ),
                true,
              ),
            ),
            ...listScopeInitializeStatement(
              context,
              /** @type {estree.Variable} */ (node.id.name),
              right,
            ),
          ];
        }
      case "ClassDeclaration": {
        if (node.id == null) {
          throw new SyntaxAranError("missing function name", node);
        } else {
          const right = mangleMetaVariable(
            BASENAME,
            /** @type {__unique} */ ("class_right"),
            path,
          );
          return [
            makeEffectStatement(
              makeWriteEffect(
                right,
                unbuildClass({ node, path }, context, { name: ANONYMOUS }),
                true,
              ),
            ),
            ...listScopeInitializeStatement(
              context,
              /** @type {estree.Variable} */ (node.id.name),
              right,
            ),
          ];
        }
      }
      case "ImportDeclaration":
        return [];
      case "ExportNamedDeclaration":
        return hasDeclarationExportNamedDeclaration(node)
          ? unbuildStatement(drill({ node, path }, "declaration"), context, {
              labels: [],
              completion,
              loop,
            })
          : [];
      case "ExportDefaultDeclaration":
        return unbuildDefault(
          drill({ node, path }, "declaration"),
          context,
          null,
        );
      case "ExportAllDeclaration":
        return [];
      case "LabeledStatement":
        return unbuildStatement(drill({ node, path }, "body"), context, {
          labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
          completion,
          loop,
        });
      case "BlockStatement":
        return [
          makeBlockStatement(
            unbuildControlBlock({ node, path }, context, {
              labels: map(labels, mangleBreakLabel),
              completion,
              loop,
              kinds: {},
            }),
          ),
        ];
      case "StaticBlock":
        throw new SyntaxAranError("illegal static block", node);
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
            ),
          ),
          makeBlockStatement(
            unbuildControlBlock(
              drill({ node, path }, "body"),
              {
                ...context,
                scope: extendDynamicScope(context, frame),
              },
              {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
                kinds: {},
              },
            ),
          ),
        ];
      }
      case "IfStatement":
        return [
          ...makeUndefinedCompletion(path, completion),
          makeIfStatement(
            unbuildExpression(drill({ node, path }, "test"), context, {
              name: ANONYMOUS,
            }),
            unbuildControlBlock(drill({ node, path }, "consequent"), context, {
              labels: map(labels, mangleBreakLabel),
              completion,
              loop,
              kinds: {},
            }),
            hasAlternate(node)
              ? unbuildControlBlock(
                  drill({ node, path }, "alternate"),
                  context,
                  {
                    labels: map(labels, mangleBreakLabel),
                    completion,
                    loop,
                    kinds: {},
                  },
                )
              : makeScopeControlBlock(
                  context,
                  {
                    type: "block",
                    kinds: {},
                  },
                  map(labels, mangleBreakLabel),
                  (_context) => [],
                ),
          ),
        ];
      case "TryStatement":
        return [
          ...makeUndefinedCompletion(path, completion),
          makeTryStatement(
            unbuildControlBlock(drill({ node, path }, "block"), context, {
              labels: map(labels, mangleBreakLabel),
              loop,
              completion,
              kinds: {},
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
                    kinds: {},
                  },
                  map(labels, mangleBreakLabel),
                  (_context) => [
                    makeEffectStatement(
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.throw"),
                          makePrimitiveExpression({ undefined: null }),
                          [makeReadExpression("catch.error")],
                        ),
                      ),
                    ),
                  ],
                ),
            hasFinalizer(node)
              ? unbuildControlBlock(
                  drill({ node, path }, "finalizer"),
                  context,
                  {
                    labels: map(labels, mangleBreakLabel),
                    loop,
                    // a: try { throw "boum"; }
                    //    catch { 123; }
                    //    finally { 456; break a }
                    // > 456
                    completion,
                    kinds: {},
                  },
                )
              : makeScopeControlBlock(
                  context,
                  {
                    type: "block",
                    kinds: {},
                  },
                  map(labels, mangleBreakLabel),
                  (_context) => [],
                ),
          ),
        ];
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
              kinds: {},
            },
            (context) => [
              makeWhileStatement(
                unbuildExpression(drill({ node, path }, "test"), context, {
                  name: ANONYMOUS,
                }),
                unbuildControlBlock(drill({ node, path }, "body"), context, {
                  labels: [
                    ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                    ...map(labels, mangleContinueLabel),
                  ],
                  loop,
                  completion,
                  kinds: {},
                }),
              ),
            ],
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
              kinds: {},
            },
            (context) => [
              makeEffectStatement(
                makeWriteEffect(initial, makePrimitiveExpression(true), true),
              ),
              makeWhileStatement(
                makeConditionalExpression(
                  makeReadExpression(initial),
                  makeSequenceExpression(
                    makeWriteEffect(
                      initial,
                      makePrimitiveExpression(false),
                      false,
                    ),
                    makePrimitiveExpression(true),
                  ),
                  unbuildExpression(drill({ node, path }, "test"), context, {
                    name: ANONYMOUS,
                  }),
                ),
                unbuildControlBlock(drill({ node, path }, "body"), context, {
                  labels: [
                    ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                    ...map(labels, mangleContinueLabel),
                  ],
                  loop,
                  completion,
                  kinds: {},
                }),
              ),
            ],
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
              ...(hasEmptyBreak(node.body)
                ? [mangleEmptyBreakLabel(path)]
                : []),
              ...map(labels, mangleBreakLabel),
            ],
            {
              type: "block",
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
                  : makePrimitiveExpression(true),
                hasUpdate(node)
                  ? makeScopeControlBlock(
                      context,
                      {
                        type: "block",
                        kinds: {},
                      },
                      [],
                      (context) => [
                        makeBlockStatement(
                          unbuildControlBlock(
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
                              kinds: {},
                            },
                          ),
                        ),
                        ...map(
                          unbuildEffect(
                            drill({ node, path }, "update"),
                            context,
                            null,
                          ),
                          (effect) => makeEffectStatement(effect),
                        ),
                      ],
                    )
                  : unbuildControlBlock(
                      drill({ node, path }, "body"),
                      context,
                      {
                        labels: [
                          ...(hasEmptyContinue(node.body)
                            ? [loop.continue]
                            : []),
                          ...map(labels, mangleContinueLabel),
                        ],
                        loop,
                        completion,
                        kinds: {},
                      },
                    ),
              ),
            ],
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
                ...map(
                  unbuildLeftInit(drill({ node, path }, "left"), context, null),
                  (effect) => makeEffectStatement(effect),
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    right,
                    makeApplyExpression(
                      makeIntrinsicExpression("Object"),
                      makePrimitiveExpression({ undefined: null }),
                      [
                        unbuildExpression(
                          drill({ node, path }, "right"),
                          context,
                          { name: ANONYMOUS },
                        ),
                      ],
                    ),
                    true,
                  ),
                ),
                makeEffectStatement(
                  makeWriteEffect(accumulation, makeArrayExpression([]), true),
                ),
                makeEffectStatement(
                  makeWriteEffect(prototype, makeReadExpression(right), true),
                ),
                makeWhileStatement(
                  makeBinaryExpression(
                    "!==",
                    makeReadExpression(prototype),
                    makePrimitiveExpression(null),
                  ),
                  makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      kinds: {},
                    },
                    [],
                    (_context) => [
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("Array.prototype.push"),
                            makeReadExpression(accumulation),
                            [
                              makeApplyExpression(
                                makeIntrinsicExpression("Object.keys"),
                                makePrimitiveExpression({ undefined: null }),
                                [makeReadExpression(prototype)],
                              ),
                            ],
                          ),
                        ),
                      ),
                      makeEffectStatement(
                        makeWriteEffect(
                          prototype,
                          makeApplyExpression(
                            makeIntrinsicExpression("Reflect.getPrototypeOf"),
                            makePrimitiveExpression({ undefined: null }),
                            [makeReadExpression(prototype)],
                          ),
                          false,
                        ),
                      ),
                    ],
                  ),
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    keys,
                    makeApplyExpression(
                      makeIntrinsicExpression("Array.prototype.flat"),
                      makeReadExpression(accumulation),
                      [],
                    ),
                    true,
                  ),
                ),
                makeEffectStatement(
                  makeWriteEffect(index, makePrimitiveExpression(0), true),
                ),
                makeWhileStatement(
                  makeBinaryExpression(
                    "<",
                    makeReadExpression(index),
                    makeGetExpression(
                      makeReadExpression(keys),
                      makePrimitiveExpression("length"),
                    ),
                  ),
                  makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      kinds: hoistBlock([node.left]),
                    },
                    [],
                    (context) => {
                      const key = mangleMetaVariable(
                        BASENAME,
                        /** @type {__unique} */ ("for_in_key"),
                        path,
                      );
                      return [
                        makeEffectStatement(
                          makeWriteEffect(
                            key,
                            makeGetExpression(
                              makeReadExpression(keys),
                              makeReadExpression(index),
                            ),
                            true,
                          ),
                        ),
                        ...unbuildLeftBody(
                          drill({ node, path }, "left"),
                          context,
                          { right: key },
                        ),
                        makeBlockStatement(
                          unbuildControlBlock(
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
                              kinds: {},
                              loop,
                            },
                          ),
                        ),
                        makeEffectStatement(
                          makeWriteEffect(
                            index,
                            makeBinaryExpression(
                              "+",
                              makeReadExpression(index),
                              makePrimitiveExpression(1),
                            ),
                            false,
                          ),
                        ),
                      ];
                    },
                  ),
                ),
              ];
            },
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
              kinds: hoistBlock([node.left]),
            },
            (context) => {
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
                ...map(
                  unbuildLeftInit(drill({ node, path }, "left"), context, null),
                  (effect) => makeEffectStatement(effect),
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    iterator,
                    wrapAwait(
                      node.await,
                      makeApplyExpression(
                        makeGetExpression(
                          unbuildExpression(
                            drill({ node, path }, "right"),
                            context,
                            { name: ANONYMOUS },
                          ),
                          makePrimitiveExpression("Symbol.iterator"),
                        ),
                        makePrimitiveExpression({ undefined: null }),
                        [],
                      ),
                    ),
                    true,
                  ),
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    next,
                    wrapAwait(
                      node.await,
                      makeApplyExpression(
                        makeGetExpression(
                          makeReadExpression(iterator),
                          makePrimitiveExpression("next"),
                        ),
                        makePrimitiveExpression({ undefined: null }),
                        [],
                      ),
                    ),
                    true,
                  ),
                ),
                makeTryStatement(
                  makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      kinds: hoistBlock([node.left]),
                    },
                    [],
                    (context) => [
                      makeWhileStatement(
                        makeUnaryExpression(
                          "!",
                          makeGetExpression(
                            makeReadExpression(next),
                            makePrimitiveExpression("done"),
                          ),
                        ),
                        makeScopeControlBlock(
                          context,
                          {
                            type: "block",
                            kinds: hoistBlock([node.left]),
                          },
                          [],
                          (context) => {
                            const item = mangleMetaVariable(
                              BASENAME,
                              /** @type {__unique} */ ("item"),
                              path,
                            );
                            return [
                              makeEffectStatement(
                                makeWriteEffect(
                                  item,
                                  makeGetExpression(
                                    makeReadExpression(next),
                                    makePrimitiveExpression("value"),
                                  ),
                                  true,
                                ),
                              ),
                              ...unbuildLeftBody(
                                drill({ node, path }, "left"),
                                context,
                                { right: item },
                              ),
                              makeBlockStatement(
                                unbuildControlBlock(
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
                                    kinds: {},
                                    loop,
                                  },
                                ),
                              ),
                              makeEffectStatement(
                                makeWriteEffect(
                                  next,
                                  wrapAwait(
                                    node.await,
                                    makeApplyExpression(
                                      makeGetExpression(
                                        makeReadExpression(iterator),
                                        makePrimitiveExpression("next"),
                                      ),
                                      makePrimitiveExpression({
                                        undefined: null,
                                      }),
                                      [],
                                    ),
                                  ),
                                  false,
                                ),
                              ),
                            ];
                          },
                        ),
                      ),
                    ],
                  ),
                  makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      kinds: {},
                    },
                    [],
                    (_context) => [
                      makeEffectStatement(
                        makeExpressionEffect(
                          makeApplyExpression(
                            makeIntrinsicExpression("aran.throw"),
                            makePrimitiveExpression({ undefined: null }),
                            [makeReadExpression("catch.error")],
                          ),
                        ),
                      ),
                    ],
                  ),
                  makeScopeControlBlock(
                    context,
                    {
                      type: "block",
                      kinds: {},
                    },
                    [],
                    (_context) => [
                      makeEffectStatement(
                        makeConditionalEffect(
                          makeGetExpression(
                            makeReadExpression(next),
                            makePrimitiveExpression("done"),
                          ),
                          [],
                          [
                            makeConditionalEffect(
                              makeBinaryExpression(
                                "==",
                                makeGetExpression(
                                  makeReadExpression(iterator),
                                  makePrimitiveExpression("return"),
                                ),
                                makePrimitiveExpression(null),
                              ),
                              [],
                              [
                                // no wrapAwait here
                                makeExpressionEffect(
                                  makeApplyExpression(
                                    makeGetExpression(
                                      makeReadExpression(iterator),
                                      makePrimitiveExpression("return"),
                                    ),
                                    makeReadExpression(next),
                                    [],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ];
            },
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
                  ),
                ),
                makeEffectStatement(
                  makeWriteEffect(
                    matched,
                    makePrimitiveExpression(false),
                    true,
                  ),
                ),
                ...flatMap(
                  filter(
                    flatMap(
                      drillAll(drillArray({ node, path }, "cases")),
                      drillConsequent,
                    ),
                    isPairHoisted,
                  ),
                  (child) =>
                    unbuildStatement(child, context, {
                      labels: [],
                      completion: null,
                      loop: {
                        break: null,
                        continue: null,
                      },
                    }),
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
          ),
        ];
      }
      default:
        throw new StaticError("illegal statement node", node);
    }
  },
);

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
 *     labels: [],
 *     completion: Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listBodyStatement = (
  pairs,
  context,
  { labels, completion, loop },
) =>
  flatMap(
    [...filter(pairs, isPairHoisted), ...filterOut(pairs, isPairHoisted)],
    ({ node, path }) =>
      unbuildStatement({ node, path }, context, {
        labels,
        completion,
        loop,
      }),
  );
