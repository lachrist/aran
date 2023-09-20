import { TypeSyntaxAranError } from "../../error.mjs";
import { DynamicError, flatMap, includes, map } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
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
} from "../../estree/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";
import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildPatternEffect, unbuildPatternStatement } from "./pattern.mjs";

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

const BASENAME = /** @type {basename} */ "update";

/**
 * @template S
 * @typedef {import("./context.d.ts").Context<S>} Context
 */

/**
 * @type {<S>(
 *   context1: Context<S>,
 *   labels: unbuild.Label[],
 *   frame: import("../scope/index.mjs").Frame<S>,
 *   makeBody: (context2: Context<S>) => aran.Statement<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const wrapBlock = (context, labels, frame, makeBody, serial) =>
  labels.length === 0 && listKey(frame.kinds).length === 0
    ? makeBody(context)
    : [
        makeBlockStatement(
          makeScopeControlBlock(context, frame, labels, makeBody, serial),
          serial,
        ),
      ];

/**
 * @type {<S>(
 *   asynchronous: boolean,
 *   expression: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const wrapAwait = (asynchronous, expression, serial) =>
  asynchronous ? makeAwaitExpression(expression, serial) : expression;

/**
 * @type {<S>(
 *   node: estree.Statement,
 *   context: import("./context.js").Context<S>,
 *   labels: estree.Label[],
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildStatement = (node, context, labels) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "DebuggerStatement":
      return [makeDebuggerStatement(serial)];
    case "ReturnStatement":
      return [
        makeReturnStatement(
          node.argument == null
            ? makePrimitiveExpression({ undefined: null }, serial)
            : unbuildExpression(node.argument, context, null),
          serial,
        ),
      ];
    case "BreakStatement": {
      if (node.label == null) {
        if (context.break === null) {
          throw new DynamicError("Illegal break statement", node);
        } else {
          return [makeBreakStatement(context.break, serial)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
            serial,
          ),
        ];
      }
    }
    case "ContinueStatement":
      if (node.label == null) {
        if (context.continue === null) {
          throw new DynamicError("Illegal continue statement", node);
        } else {
          return [makeBreakStatement(context.continue, serial)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleContinueLabel(/** @type {estree.Label} */ (node.label.name)),
            serial,
          ),
        ];
      }
    case "BlockStatement":
      return [
        makeBlockStatement(
          unbuildControlBlock(node, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          serial,
        ),
      ];
    case "WithStatement": {
      const frame = {
        var: mangleMetaVariable(hash, BASENAME, "with"),
        val: unbuildExpression(node.object, context, null),
      };
      return [
        makeEffectStatement(
          makeWriteEffect(frame.var, frame.val, serial, true),
          serial,
        ),
        makeBlockStatement(
          unbuildControlBlock(node.body, context, {
            labels: map(labels, mangleBreakLabel),
            with: frame.var,
          }),
          serial,
        ),
      ];
    }
    case "IfStatement":
      return [
        makeIfStatement(
          unbuildExpression(node.test, context, null),
          unbuildControlBlock(node.consequent, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          node.alternate == null
            ? makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                map(labels, mangleBreakLabel),
                (_context) => [],
                serial,
              )
            : unbuildControlBlock(node.alternate, context, {
                labels: map(labels, mangleBreakLabel),
                with: null,
              }),
          serial,
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          unbuildControlBlock(node.block, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          node.handler == null
            ? makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                map(labels, mangleBreakLabel),
                (_context) => [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.throw", serial),
                        makePrimitiveExpression({ undefined: null }, serial),
                        [makeReadExpression("catch.error", serial)],
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              )
            : unbuildCatch(
                node.handler,
                context,
                map(labels, mangleBreakLabel),
              ),
          node.finalizer == null
            ? makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                map(labels, mangleBreakLabel),
                (_context) => [],
                serial,
              )
            : unbuildControlBlock(node.finalizer, context, {
                labels: map(labels, mangleBreakLabel),
                with: null,
              }),
          serial,
        ),
      ];
    case "WhileStatement":
      return wrapBlock(
        context,
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        {
          type: "block",
          kinds: {},
          with: null,
        },
        // eslint-disable-next-line no-shadow
        (context) => [
          makeWhileStatement(
            unbuildExpression(node.test, context, null),
            unbuildControlBlock(
              node.body,
              {
                ...context,
                break: mangleEmptyBreakLabel(hash),
                continue: mangleEmptyContinueLabel(hash),
              },
              {
                labels: [
                  ...(hasEmptyContinue(node.body)
                    ? [mangleEmptyContinueLabel(hash)]
                    : []),
                  ...map(labels, mangleContinueLabel),
                ],
                with: null,
              },
            ),
            serial,
          ),
        ],
        serial,
      );
    case "DoWhileStatement": {
      const initial = {
        var: mangleMetaVariable(hash, BASENAME, "initial_do"),
        val: makePrimitiveExpression(true, serial),
      };
      return wrapBlock(
        context,
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        {
          type: "block",
          kinds: {},
          with: null,
        },
        // eslint-disable-next-line no-shadow
        (context) => [
          makeEffectStatement(
            makeWriteEffect(initial.var, initial.val, serial, true),
            serial,
          ),
          makeWhileStatement(
            makeConditionalExpression(
              makeReadExpression(initial.var, serial),
              makeSequenceExpression(
                makeWriteEffect(
                  initial.var,
                  makePrimitiveExpression(false, serial),
                  serial,
                  false,
                ),
                makePrimitiveExpression(true, serial),
                serial,
              ),
              unbuildExpression(node.test, context, null),
              serial,
            ),
            unbuildControlBlock(
              node.body,
              {
                ...context,
                break: mangleEmptyBreakLabel(hash),
                continue: mangleEmptyContinueLabel(hash),
              },
              {
                labels: [
                  ...(hasEmptyContinue(node.body)
                    ? [mangleEmptyContinueLabel(hash)]
                    : []),
                  ...map(labels, mangleContinueLabel),
                ],
                with: null,
              },
            ),
            serial,
          ),
        ],
        serial,
      );
    }
    case "VariableDeclaration":
      return flatMap(node.declarations, (child) =>
        unbuildDeclarator(child, context, node),
      );
    case "ForStatement":
      return wrapBlock(
        context,
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        {
          type: "block",
          kinds: hoistBlock(node.init == null ? [] : [node.init]),
          with: null,
        },
        // eslint-disable-next-line no-shadow
        (context) => [
          ...(node.init == null
            ? []
            : node.init.type === "VariableDeclaration"
            ? unbuildStatement(node.init, context, [])
            : map(unbuildEffect(node.init, context), (effect) =>
                makeEffectStatement(effect, serial),
              )),
          makeWhileStatement(
            node.test == null
              ? makePrimitiveExpression(true, serial)
              : unbuildExpression(node.test, context, null),
            node.update == null
              ? unbuildControlBlock(node.body, context, {
                  labels: [
                    ...(hasEmptyContinue(node.body)
                      ? [mangleEmptyContinueLabel(hash)]
                      : []),
                    ...map(labels, mangleContinueLabel),
                  ],
                  with: null,
                })
              : makeScopeControlBlock(
                  context,
                  {
                    type: "block",
                    kinds: {},
                    with: null,
                  },
                  [],
                  // eslint-disable-next-line no-shadow
                  (context) => [
                    makeBlockStatement(
                      unbuildControlBlock(node.body, context, {
                        labels: [
                          ...(hasEmptyContinue(node.body)
                            ? [mangleEmptyContinueLabel(hash)]
                            : []),
                          ...map(labels, mangleContinueLabel),
                        ],
                        with: null,
                      }),
                      serial,
                    ),
                    ...map(
                      unbuildEffect(
                        /** @type {estree.Expression} */ (node.update),
                        context,
                      ),
                      (effect) => makeEffectStatement(effect, serial),
                    ),
                  ],
                  serial,
                ),
            serial,
          ),
        ],
        serial,
      );
    case "ForInStatement": {
      // for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}
      //
      // Variables in the left hand side belongs to the body of the while but still
      // they must be shadowed to the right-hand side.
      //
      // > for (const x in {a:x, b:2}) { console.log(x) }
      // Thrown:
      // ReferenceError: Cannot access 'x' before initialization
      return wrapBlock(
        context,
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        {
          type: "block",
          kinds: hoistBlock([node.left]),
          with: null,
        },
        // eslint-disable-next-line no-shadow
        (context) => {
          const right = {
            var: mangleMetaVariable(hash, BASENAME, "right"),
            val: makeApplyExpression(
              makeIntrinsicExpression("Object", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [unbuildExpression(node.right, context, null)],
              serial,
            ),
          };
          const accumulation = {
            var: mangleMetaVariable(hash, BASENAME, "accumulation"),
            val: makeArrayExpression([], serial),
          };
          const prototype = {
            var: mangleMetaVariable(hash, BASENAME, "prototype"),
            val: makeReadExpression(right.var, serial),
          };
          const index = {
            var: mangleMetaVariable(hash, BASENAME, "index"),
            val: makeReadExpression(right.var, serial),
          };
          const keys = {
            var: mangleMetaVariable(hash, BASENAME, "keys"),
            val: makeApplyExpression(
              makeIntrinsicExpression("Array.prototype.flat", serial),
              makeReadExpression(accumulation.var, serial),
              [],
              serial,
            ),
          };
          return [
            ...(node.left.type === "VariableDeclaration"
              ? flatMap(node.left.declarations, (child) =>
                  child.init == null
                    ? []
                    : map(unbuildEffect(child.init, context), (effect) =>
                        makeEffectStatement(effect, serial),
                      ),
                )
              : []),
            makeEffectStatement(
              makeWriteEffect(right.var, right.val, serial, true),
              serial,
            ),
            makeEffectStatement(
              makeWriteEffect(accumulation.var, accumulation.val, serial, true),
              serial,
            ),
            makeEffectStatement(
              makeWriteEffect(prototype.var, prototype.val, serial, true),
              serial,
            ),
            makeWhileStatement(
              makeBinaryExpression(
                "!==",
                makeReadExpression(prototype.var, serial),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                [],
                (_context) => [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("Array.prototype.push", serial),
                        makeReadExpression(accumulation.var, serial),
                        [
                          makeApplyExpression(
                            makeIntrinsicExpression("Object.keys", serial),
                            makePrimitiveExpression(
                              { undefined: null },
                              serial,
                            ),
                            [makeReadExpression(prototype.var, serial)],
                            serial,
                          ),
                        ],
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                  makeEffectStatement(
                    makeWriteEffect(
                      prototype.var,
                      makeApplyExpression(
                        makeIntrinsicExpression(
                          "Reflect.getPrototypeOf",
                          serial,
                        ),
                        makePrimitiveExpression({ undefined: null }, serial),
                        [makeReadExpression(prototype.var, serial)],
                        serial,
                      ),
                      serial,
                      false,
                    ),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
            makeEffectStatement(
              makeWriteEffect(keys.var, keys.val, serial, true),
              serial,
            ),
            makeEffectStatement(
              makeWriteEffect(
                index.var,
                makePrimitiveExpression(0, serial),
                serial,
                true,
              ),
              serial,
            ),
            makeWhileStatement(
              makeBinaryExpression(
                "<",
                makeReadExpression(index.var, serial),
                makeGetExpression(
                  makeReadExpression(keys.var, serial),
                  makePrimitiveExpression("length", serial),
                  serial,
                ),
                serial,
              ),
              makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: hoistBlock([node.left]),
                  with: null,
                },
                [],
                // eslint-disable-next-line no-shadow
                (context) => {
                  const key = {
                    var: mangleMetaVariable(hash, BASENAME, "key"),
                    val: makeGetExpression(
                      makeReadExpression(keys.var, serial),
                      makeReadExpression(index.var, serial),
                      serial,
                    ),
                  };
                  return [
                    makeEffectStatement(
                      makeWriteEffect(key.var, key.val, serial, true),
                      serial,
                    ),
                    ...(node.left.type === "VariableDeclaration"
                      ? unbuildPatternStatement(
                          node.left.declarations[0].id,
                          context,
                          key.var,
                        )
                      : map(
                          unbuildPatternEffect(node.left, context, key.var),
                          (effect) => makeEffectStatement(effect, serial),
                        )),
                    makeBlockStatement(
                      unbuildControlBlock(node.body, context, {
                        labels: [
                          ...(hasEmptyContinue(node.body)
                            ? [mangleEmptyContinueLabel(hash)]
                            : []),
                          ...map(labels, mangleContinueLabel),
                        ],
                        with: null,
                      }),
                      serial,
                    ),
                    makeEffectStatement(
                      makeWriteEffect(
                        index.var,
                        makeBinaryExpression(
                          "+",
                          makeReadExpression(index.var, serial),
                          makePrimitiveExpression(1, serial),
                          serial,
                        ),
                        serial,
                        false,
                      ),
                      serial,
                    ),
                  ];
                },
                serial,
              ),
              serial,
            ),
          ];
        },
        serial,
      );
    }
    case "ForOfStatement":
      return wrapBlock(
        context,
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        {
          type: "block",
          kinds: hoistBlock([node.left]),
          with: null,
        },
        // eslint-disable-next-line no-shadow
        (context) => {
          const iterator = {
            var: mangleMetaVariable(hash, BASENAME, "iterator"),
            val: wrapAwait(
              node.await,
              makeApplyExpression(
                makeGetExpression(
                  unbuildExpression(node.right, context, null),
                  makePrimitiveExpression("Symbol.iterator", serial),
                  serial,
                ),
                makePrimitiveExpression({ undefined: null }, serial),
                [],
                serial,
              ),
              serial,
            ),
          };
          const next = {
            var: mangleMetaVariable(hash, BASENAME, "next"),
            val: wrapAwait(
              node.await,
              makeApplyExpression(
                makeGetExpression(
                  makeReadExpression(iterator.var, serial),
                  makePrimitiveExpression("next", serial),
                  serial,
                ),
                makePrimitiveExpression({ undefined: null }, serial),
                [],
                serial,
              ),
              serial,
            ),
          };
          return [
            ...(node.left.type === "VariableDeclaration"
              ? flatMap(node.left.declarations, (child) =>
                  child.init == null
                    ? []
                    : map(unbuildEffect(child.init, context), (effect) =>
                        makeEffectStatement(effect, serial),
                      ),
                )
              : []),
            makeEffectStatement(
              makeWriteEffect(iterator.var, iterator.val, serial, true),
              serial,
            ),
            makeEffectStatement(
              makeWriteEffect(next.var, next.val, serial, true),
              serial,
            ),
            makeTryStatement(
              makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: hoistBlock([node.left]),
                  with: null,
                },
                [],
                // eslint-disable-next-line no-shadow
                (context) => [
                  makeWhileStatement(
                    makeUnaryExpression(
                      "!",
                      makeGetExpression(
                        makeReadExpression(next.var, serial),
                        makePrimitiveExpression("done", serial),
                        serial,
                      ),
                      serial,
                    ),
                    makeScopeControlBlock(
                      context,
                      {
                        type: "block",
                        kinds: hoistBlock([node.left]),
                        with: null,
                      },
                      [],
                      // eslint-disable-next-line no-shadow
                      (context) => {
                        const item = {
                          var: mangleMetaVariable(hash, BASENAME, "item"),
                          val: makeGetExpression(
                            makeReadExpression(next.var, serial),
                            makePrimitiveExpression("value", serial),
                            serial,
                          ),
                        };
                        return [
                          makeEffectStatement(
                            makeWriteEffect(item.var, item.val, serial, true),
                            serial,
                          ),
                          ...(node.left.type === "VariableDeclaration"
                            ? unbuildPatternStatement(
                                node.left.declarations[0].id,
                                context,
                                item.var,
                              )
                            : map(
                                unbuildPatternEffect(
                                  node.left,
                                  context,
                                  item.var,
                                ),
                                (effect) => makeEffectStatement(effect, serial),
                              )),
                          makeBlockStatement(
                            unbuildControlBlock(
                              node.body,
                              {
                                ...context,
                                break: mangleEmptyBreakLabel(hash),
                                continue: mangleEmptyContinueLabel(hash),
                              },
                              {
                                labels: [
                                  ...(hasEmptyContinue(node.body)
                                    ? [mangleEmptyContinueLabel(hash)]
                                    : []),
                                  ...map(labels, mangleContinueLabel),
                                ],
                                with: null,
                              },
                            ),
                            serial,
                          ),
                          makeEffectStatement(
                            makeWriteEffect(next.var, next.val, serial, false),
                            serial,
                          ),
                        ];
                      },
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              ),
              makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                [],
                (_context) => [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.throw", serial),
                        makePrimitiveExpression({ undefined: null }, serial),
                        [makeReadExpression("catch.error", serial)],
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              ),
              makeScopeControlBlock(
                context,
                {
                  type: "block",
                  kinds: {},
                  with: null,
                },
                [],
                // eslint-disable-next-line no-shadow
                (_context) => [
                  makeEffectStatement(
                    makeConditionalEffect(
                      makeGetExpression(
                        makeReadExpression(next.var, serial),
                        makePrimitiveExpression("done", serial),
                        serial,
                      ),
                      [],
                      [
                        makeConditionalEffect(
                          makeBinaryExpression(
                            "==",
                            makeGetExpression(
                              makeReadExpression(iterator.var, serial),
                              makePrimitiveExpression("return", serial),
                              serial,
                            ),
                            makePrimitiveExpression(null, serial),
                            serial,
                          ),
                          [],
                          [
                            // no wrapAwait here
                            makeExpressionEffect(
                              makeApplyExpression(
                                makeGetExpression(
                                  makeReadExpression(iterator.var, serial),
                                  makePrimitiveExpression("return", serial),
                                  serial,
                                ),
                                makeReadExpression(next.var, serial),
                                [],
                                serial,
                              ),
                              serial,
                            ),
                          ],
                          serial,
                        ),
                      ],
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              ),
              serial,
            ),
          ];
        },
        serial,
      );
    default:
      throw new TypeSyntaxAranError(BASENAME, node);
  }
};
