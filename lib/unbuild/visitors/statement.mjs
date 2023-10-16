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
 * @type {(node: estree.Node) => boolean}
 */
const isHoisted = (node) =>
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
          throw new SyntaxAranError("Illegal break statement", node);
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
          throw new SyntaxAranError("Illegal continue statement", node);
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
              path,
            ),
            path,
          ),
          ...listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            right,
            path,
          ),
        ];
      }
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
              path,
            ),
            path,
          ),
          ...listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            right,
            path,
          ),
        ];
      }
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
          unbuildControlBlock({ node, path }, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
            kinds: {},
          }),
          path,
        ),
      ];
    }
    case "StaticBlock": {
      throw new SyntaxAranError("illegal static block", node);
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
          unbuildControlBlock(drill({ node, path }, "consequent"), context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            loop,
            kinds: {},
          }),
          hasAlternate(node)
            ? unbuildControlBlock(drill({ node, path }, "alternate"), context, {
                labels: map(labels, mangleBreakLabel),
                completion,
                loop,
                kinds: {},
              })
            : makeScopeControlBlock(
                context,
                {
                  type: "block",
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
            ? unbuildControlBlock(drill({ node, path }, "finalizer"), context, {
                labels: map(labels, mangleBreakLabel),
                loop,
                // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                completion,
                kinds: {},
              })
            : makeScopeControlBlock(
                context,
                {
                  type: "block",
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
              unbuildControlBlock(drill({ node, path }, "body"), context, {
                labels: [
                  ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                  ...map(labels, mangleContinueLabel),
                ],
                loop,
                completion,
                kinds: {},
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
                : unbuildControlBlock(drill({ node, path }, "body"), context, {
                    labels: [
                      ...(hasEmptyContinue(node.body) ? [loop.continue] : []),
                      ...map(labels, mangleContinueLabel),
                    ],
                    loop,
                    completion,
                    kinds: {},
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
                (effect) => makeEffectStatement(effect, path),
              ),
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
                            makeReadExpression(keys, path),
                            makeReadExpression(index, path),
                            path,
                          ),
                          true,
                          path,
                        ),
                        path,
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
                    ];
                  },
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
                (effect) => makeEffectStatement(effect, path),
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
                        makePrimitiveExpression("Symbol.iterator", path),
                        path,
                      ),
                      makePrimitiveExpression({ undefined: null }, path),
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
                      makePrimitiveExpression({ undefined: null }, path),
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
                                  makeReadExpression(next, path),
                                  makePrimitiveExpression("value", path),
                                  path,
                                ),
                                true,
                                path,
                              ),
                              path,
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
                                    makePrimitiveExpression(
                                      {
                                        undefined: null,
                                      },
                                      path,
                                    ),
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
                          ];
                        },
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
                                  makeReadExpression(next, path),
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
          path,
        ),
      ];
    }
    default: {
      throw new StaticError("illegal statement node", node);
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
