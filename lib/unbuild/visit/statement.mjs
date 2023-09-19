import { TypeSyntaxAranError } from "../../error.mjs";
import { DynamicError, flatMap, includes, map } from "../../util/index.mjs";
import { makeLayerControlBlock } from "../layer/build.mjs";
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
import {
  extendScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "../scope/index.mjs";
import { unbuildDeclarator } from "./declarator.mjs";
import { unbuildEffect } from "./effect.mjs";

/**
 * @type {<S>(
 *   nodes: aran.Statement<unbuild.Atom<S>>[],
 *   labels: unbuild.Label[],
 *   free: unbuild.Variable[],
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const wrapBreakLoop = (nodes, labels, free, serial) =>
  labels.length === 0
    ? nodes
    : [
        makeBlockStatement(
          makeLayerControlBlock(labels, free, [], nodes, serial),
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
        var: mangleMetaVariable(hash, "statement", "with"),
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
            ? makeLayerControlBlock(
                map(labels, mangleBreakLabel),
                context.free_meta_variable_array,
                [],
                [],
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
            ? makeLayerControlBlock(
                map(labels, mangleBreakLabel),
                context.free_meta_variable_array,
                [],
                [
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
            ? makeLayerControlBlock(
                map(labels, mangleBreakLabel),
                context.free_meta_variable_array,
                [],
                [],
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
      return wrapBreakLoop(
        [
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
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        context.free_meta_variable_array,
        serial,
      );
    case "DoWhileStatement": {
      const initial = {
        var: mangleMetaVariable(hash, "statement", "initial_do"),
        val: makePrimitiveExpression(true, serial),
      };
      return wrapBreakLoop(
        [
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
        [
          ...(hasEmptyBreak(node.body) ? [mangleEmptyBreakLabel(hash)] : []),
          ...map(labels, mangleBreakLabel),
        ],
        context.free_meta_variable_array,
        serial,
      );
    }
    case "VariableDeclaration":
      return flatMap(node.declarations, (child) =>
        unbuildDeclarator(child, context, node),
      );
    case "ForStatement": {
      if (
        hasEmptyBreak(node.body) ||
        labels.length > 0 ||
        (node.init != null &&
          node.init.type === "VariableDeclaration" &&
          node.init.kind !== "var")
      ) {
        const scope = extendScope(
          context.strict,
          context.scope,
          hoistBlock(node.init == null ? [] : [node.init]),
          {
            type: "block",
            with: null,
          },
        );
        const child_context = {
          ...context,
          scope,
          break: mangleEmptyBreakLabel(hash),
          continue: mangleEmptyContinueLabel(hash),
        };
        return [
          makeBlockStatement(
            makeLayerControlBlock(
              [
                ...(hasEmptyBreak(node.body)
                  ? [mangleEmptyBreakLabel(hash)]
                  : []),
                ...map(labels, mangleBreakLabel),
              ],
              context.free_meta_variable_array,
              listScopeVariable(context.strict, scope),
              [
                ...listScopeDeclareStatement(context.strict, scope, serial),
                ...(node.init == null
                  ? []
                  : node.init.type === "VariableDeclaration"
                  ? unbuildStatement(node.init, child_context, [])
                  : map(unbuildEffect(node.init, child_context), (effect) =>
                      makeEffectStatement(effect, serial),
                    )),
                makeWhileStatement(
                  node.test == null
                    ? makePrimitiveExpression(true, serial)
                    : unbuildExpression(node.test, child_context, null),
                  node.update == null
                    ? unbuildControlBlock(node.body, child_context, {
                        labels: [
                          ...(hasEmptyContinue(node.body)
                            ? [mangleEmptyContinueLabel(hash)]
                            : []),
                          ...map(labels, mangleContinueLabel),
                        ],
                        with: null,
                      })
                    : makeLayerControlBlock(
                        [],
                        child_context.free_meta_variable_array,
                        [],
                        [
                          makeBlockStatement(
                            unbuildControlBlock(node.body, child_context, {
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
                            unbuildEffect(node.update, child_context),
                            (effect) => makeEffectStatement(effect, serial),
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
      } else {
        return [
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
              : makeLayerControlBlock(
                  [],
                  context.free_meta_variable_array,
                  [],
                  [
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
                    ...map(unbuildEffect(node.update, context), (effect) =>
                      makeEffectStatement(effect, serial),
                    ),
                  ],
                  serial,
                ),
            serial,
          ),
        ];
      }
    }
    default:
      throw new TypeSyntaxAranError("statement", node);
  }
};
