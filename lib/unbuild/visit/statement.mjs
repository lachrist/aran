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
  makeBlockStatement,
  makeBreakStatement,
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
          makeWriteEffect(frame.var, frame.val, serial),
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
            makeWriteEffect(initial.var, initial.val, serial),
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
    default:
      throw new TypeSyntaxAranError(BASENAME, node);
  }
};
