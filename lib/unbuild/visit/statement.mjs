import { DynamicSyntaxAranError, StaticSyntaxAranError } from "../../error.mjs";
import {
  DynamicError,
  enumerate,
  flatMap,
  includes,
  map,
  pop,
  push,
  pushAll,
  reverse,
  slice,
} from "../../util/index.mjs";
import {
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
import { unbuildCase } from "./case.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildClass } from "./class.mjs";
import { ANONYMOUS } from "../name.mjs";

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

const BASENAME = /** @basename */ "statement";

/**
 * @typedef {null | {
 *   variable: unbuild.Variable,
 *   last: boolean,
 * }} Completion
 */

/**
 * @type {<S>(
 *   completion: Completion,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
const makeUndefinedCompletion = (completion, serial) =>
  completion !== null && completion.last
    ? [
        makeEffectStatement(
          makeWriteEffect(
            completion.variable,
            makePrimitiveExpression({ undefined: null }, serial),
            serial,
            false,
          ),
          serial,
        ),
      ]
    : [];

/**
 * @template S
 * @typedef {import("./context.d.ts").Context<S>} Context
 */

const valued = [
  "ExpressionStatement",
  "WithStatement",
  "IfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "SwitchStatement",
  "TryStatement",
  "SwitchStatement",
];

/**
 * @type {(
 *   nodes: (
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *     | estree.SwitchCase
 *   )[],
 *   last: boolean,
 * ) => boolean }
 */
export const updateLast = (nodes, last) => {
  const stack = reverse(nodes);
  while (stack.length > 0) {
    const node = pop(stack);
    if (includes(valued, node.type)) {
      return false;
    }
    if (node.type === "BreakStatement" || node.type === "ContinueStatement") {
      return true;
    }
    if (node.type === "LabeledStatement") {
      push(stack, node.body);
    } else if (node.type === "SwitchCase") {
      pushAll(stack, reverse(node.consequent));
    } else if (node.type === "BlockStatement") {
      pushAll(stack, reverse(node.body));
    }
  }
  return last;
};

/**
 * @type {<S>(
 *   context1: Context<S>,
 *   labels: unbuild.Label[],
 *   frame: import("../scope/index.mjs").Frame,
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

/** @type {<X>(object: { consequent: X}) => X} */
export const getConsequent = ({ consequent }) => consequent;

/**
 * @type {<S>(
 *   node:
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration,
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     labels: estree.Label[],
 *     completion: null | {
 *       last: boolean,
 *       variable: unbuild.Variable,
 *     }
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildStatement = (node, context, { labels, completion }) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "EmptyStatement":
      return [];
    case "DebuggerStatement":
      return [makeDebuggerStatement(serial)];
    case "ReturnStatement":
      return [
        makeReturnStatement(
          node.argument == null
            ? makePrimitiveExpression({ undefined: null }, serial)
            : unbuildExpression(node.argument, context, { name: ANONYMOUS }),
          serial,
        ),
      ];
    case "ExpressionStatement":
      if (completion !== null && completion.last) {
        return [
          makeEffectStatement(
            makeWriteEffect(
              completion.variable,
              unbuildExpression(node.expression, context, { name: ANONYMOUS }),
              serial,
              true,
            ),
            serial,
          ),
        ];
      } else {
        return map(unbuildEffect(node.expression, context), (effect) =>
          makeEffectStatement(effect, serial),
        );
      }
    case "ThrowStatement":
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("aran.throw", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [unbuildExpression(node.argument, context, { name: ANONYMOUS })],
              serial,
            ),
            serial,
          ),
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
    case "VariableDeclaration":
      return flatMap(node.declarations, (child) =>
        unbuildDeclarator(child, context),
      );
    case "FunctionDeclaration":
      if (node.id == null) {
        throw new DynamicSyntaxAranError("missing function name", node);
      } else {
        const right = mangleMetaVariable(hash, BASENAME, "right");
        return [
          makeEffectStatement(
            makeWriteEffect(
              right,
              unbuildFunction(
                node,
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
              serial,
              true,
            ),
            serial,
          ),
          ...listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            right,
            serial,
          ),
        ];
      }
    case "ClassDeclaration": {
      if (node.id == null) {
        throw new DynamicSyntaxAranError("missing function name", node);
      } else {
        const right = mangleMetaVariable(hash, BASENAME, "right");
        return [
          makeEffectStatement(
            makeWriteEffect(
              right,
              unbuildClass(node, context, { name: ANONYMOUS }),
              serial,
              true,
            ),
            serial,
          ),
          ...listScopeInitializeStatement(
            context,
            /** @type {estree.Variable} */ (node.id.name),
            right,
            serial,
          ),
        ];
      }
    }
    case "ImportDeclaration":
      return [];
    case "ExportNamedDeclaration":
      return node.declaration == null
        ? []
        : unbuildStatement(node.declaration, context, {
            labels: [],
            completion,
          });
    case "ExportDefaultDeclaration":
      switch (node.declaration.type) {
        case "VariableDeclaration":
          throw new DynamicSyntaxAranError("invalid default declaration", node);
        case "FunctionDeclaration":
          return node.declaration.id == null
            ? [
                makeEffectStatement(
                  makeExportEffect(
                    /** @type {estree.Specifier} */ ("default"),
                    unbuildFunction(
                      node.declaration,
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
                        name: {
                          type: "static",
                          kind: "init",
                          base: /** @type {estree.Specifier} */ ("default"),
                        },
                      },
                    ),
                    serial,
                  ),
                  serial,
                ),
              ]
            : unbuildStatement(node.declaration, context, {
                labels: [],
                completion,
              });
        case "ClassDeclaration":
          return node.declaration.id == null
            ? [
                makeEffectStatement(
                  makeExportEffect(
                    /** @type {estree.Specifier} */ ("default"),
                    unbuildClass(node.declaration, context, {
                      name: {
                        type: "static",
                        kind: "init",
                        base: /** @type {estree.Specifier} */ ("default"),
                      },
                    }),
                    serial,
                  ),
                  serial,
                ),
              ]
            : unbuildStatement(node.declaration, context, {
                labels: [],
                completion,
              });
        default:
          unbuildExpression(node.declaration, context, {
            name: {
              type: "static",
              kind: "init",
              base: /** @type {estree.Specifier} */ ("default"),
            },
          });
      }
    case "ExportAllDeclaration":
      return [];
    case "LabeledStatement":
      return unbuildStatement(node.body, context, {
        labels: [...labels, /** @type {estree.Label} */ (node.label.name)],
        completion,
      });
    case "BlockStatement":
      return [
        makeBlockStatement(
          unbuildControlBlock(node, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            kinds: {},
            with: null,
          }),
          serial,
        ),
      ];
    case "StaticBlock":
      throw new DynamicSyntaxAranError("illegal static block", node);
    case "WithStatement": {
      const frame = mangleMetaVariable(hash, BASENAME, "frame");
      return [
        ...makeUndefinedCompletion(completion, serial),
        makeEffectStatement(
          makeWriteEffect(
            frame,
            unbuildExpression(node.object, context, { name: ANONYMOUS }),
            serial,
            true,
          ),
          serial,
        ),
        makeBlockStatement(
          unbuildControlBlock(node.body, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            kinds: {},
            with: frame,
          }),
          serial,
        ),
      ];
    }
    case "IfStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        makeIfStatement(
          unbuildExpression(node.test, context, { name: ANONYMOUS }),
          unbuildControlBlock(node.consequent, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            kinds: {},
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
                completion,
                kinds: {},
                with: null,
              }),
          serial,
        ),
      ];
    case "TryStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        makeTryStatement(
          unbuildControlBlock(node.block, context, {
            labels: map(labels, mangleBreakLabel),
            completion,
            kinds: {},
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
            : unbuildCatch(node.handler, context, {
                labels: map(labels, mangleBreakLabel),
                completion,
              }),
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
                // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                completion:
                  completion === null
                    ? null
                    : { variable: completion.variable, last: false },
                kinds: {},
                with: null,
              }),
          serial,
        ),
      ];
    case "WhileStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
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
              unbuildExpression(node.test, context, { name: ANONYMOUS }),
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
                  completion,
                  kinds: {},
                  with: null,
                },
              ),
              serial,
            ),
          ],
          serial,
        ),
      ];
    case "DoWhileStatement": {
      const initial = mangleMetaVariable(hash, BASENAME, "initial_do");
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
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
              makeWriteEffect(
                initial,
                makePrimitiveExpression(true, serial),
                serial,
                true,
              ),
              serial,
            ),
            makeWhileStatement(
              makeConditionalExpression(
                makeReadExpression(initial, serial),
                makeSequenceExpression(
                  makeWriteEffect(
                    initial,
                    makePrimitiveExpression(false, serial),
                    serial,
                    false,
                  ),
                  makePrimitiveExpression(true, serial),
                  serial,
                ),
                unbuildExpression(node.test, context, { name: ANONYMOUS }),
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
                  completion,
                  kinds: {},
                  with: null,
                },
              ),
              serial,
            ),
          ],
          serial,
        ),
      ];
    }
    case "ForStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
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
              ? unbuildStatement(node.init, context, { labels: [], completion })
              : map(unbuildEffect(node.init, context), (effect) =>
                  makeEffectStatement(effect, serial),
                )),
            makeWhileStatement(
              node.test == null
                ? makePrimitiveExpression(true, serial)
                : unbuildExpression(node.test, context, { name: ANONYMOUS }),
              node.update == null
                ? unbuildControlBlock(node.body, context, {
                    labels: [
                      ...(hasEmptyContinue(node.body)
                        ? [mangleEmptyContinueLabel(hash)]
                        : []),
                      ...map(labels, mangleContinueLabel),
                    ],
                    completion,
                    kinds: {},
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
                          completion,
                          kinds: {},
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
        ),
      ];
    case "ForInStatement": {
      // for ((console.log("obj"), {})[(console.log("prop"), "foo")] in (console.log("right"), {foo:1, bar:2})) {}
      //
      // Variables in the left hand side belongs to the body of the while but still
      // they must be shadowed to the right-hand side.
      //
      // > for (const x in {a:x, b:2}) { console.log(x) }
      // Thrown:
      // ReferenceError: Cannot access 'x' before initialization
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
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
            const right = mangleMetaVariable(hash, BASENAME, "right");
            const accumulation = mangleMetaVariable(
              hash,
              BASENAME,
              "accumulation",
            );
            const prototype = mangleMetaVariable(hash, BASENAME, "prototype");
            const index = mangleMetaVariable(hash, BASENAME, "index");
            const keys = mangleMetaVariable(hash, BASENAME, "keys");
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
                makeWriteEffect(
                  right,
                  makeApplyExpression(
                    makeIntrinsicExpression("Object", serial),
                    makePrimitiveExpression({ undefined: null }, serial),
                    [
                      unbuildExpression(node.right, context, {
                        name: ANONYMOUS,
                      }),
                    ],
                    serial,
                  ),
                  serial,
                  true,
                ),
                serial,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  accumulation,
                  makeArrayExpression([], serial),
                  serial,
                  true,
                ),
                serial,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  prototype,
                  makeReadExpression(right, serial),
                  serial,
                  true,
                ),
                serial,
              ),
              makeWhileStatement(
                makeBinaryExpression(
                  "!==",
                  makeReadExpression(prototype, serial),
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
                          makeIntrinsicExpression(
                            "Array.prototype.push",
                            serial,
                          ),
                          makeReadExpression(accumulation, serial),
                          [
                            makeApplyExpression(
                              makeIntrinsicExpression("Object.keys", serial),
                              makePrimitiveExpression(
                                { undefined: null },
                                serial,
                              ),
                              [makeReadExpression(prototype, serial)],
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
                        prototype,
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "Reflect.getPrototypeOf",
                            serial,
                          ),
                          makePrimitiveExpression({ undefined: null }, serial),
                          [makeReadExpression(prototype, serial)],
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
                makeWriteEffect(
                  keys,
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.prototype.flat", serial),
                    makeReadExpression(accumulation, serial),
                    [],
                    serial,
                  ),
                  serial,
                  true,
                ),
                serial,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  index,
                  makePrimitiveExpression(0, serial),
                  serial,
                  true,
                ),
                serial,
              ),
              makeWhileStatement(
                makeBinaryExpression(
                  "<",
                  makeReadExpression(index, serial),
                  makeGetExpression(
                    makeReadExpression(keys, serial),
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
                    const key = mangleMetaVariable(hash, BASENAME, "key");
                    return [
                      makeEffectStatement(
                        makeWriteEffect(
                          key,
                          makeGetExpression(
                            makeReadExpression(keys, serial),
                            makeReadExpression(index, serial),
                            serial,
                          ),
                          serial,
                          true,
                        ),
                        serial,
                      ),
                      ...(node.left.type === "VariableDeclaration"
                        ? unbuildPatternStatement(
                            node.left.declarations[0].id,
                            context,
                            key,
                          )
                        : map(
                            unbuildPatternEffect(node.left, context, key),
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
                          completion,
                          kinds: {},
                          with: null,
                        }),
                        serial,
                      ),
                      makeEffectStatement(
                        makeWriteEffect(
                          index,
                          makeBinaryExpression(
                            "+",
                            makeReadExpression(index, serial),
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
        ),
      ];
    }
    case "ForOfStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
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
            const iterator = mangleMetaVariable(hash, BASENAME, "iterator");
            const next = mangleMetaVariable(hash, BASENAME, "next");
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
                makeWriteEffect(
                  iterator,
                  wrapAwait(
                    node.await,
                    makeApplyExpression(
                      makeGetExpression(
                        unbuildExpression(node.right, context, {
                          name: ANONYMOUS,
                        }),
                        makePrimitiveExpression("Symbol.iterator", serial),
                        serial,
                      ),
                      makePrimitiveExpression({ undefined: null }, serial),
                      [],
                      serial,
                    ),
                    serial,
                  ),
                  serial,
                  true,
                ),
                serial,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  next,
                  wrapAwait(
                    node.await,
                    makeApplyExpression(
                      makeGetExpression(
                        makeReadExpression(iterator, serial),
                        makePrimitiveExpression("next", serial),
                        serial,
                      ),
                      makePrimitiveExpression({ undefined: null }, serial),
                      [],
                      serial,
                    ),
                    serial,
                  ),
                  serial,
                  true,
                ),
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
                          makeReadExpression(next, serial),
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
                          const item = mangleMetaVariable(
                            hash,
                            BASENAME,
                            "item",
                          );
                          return [
                            makeEffectStatement(
                              makeWriteEffect(
                                item,
                                makeGetExpression(
                                  makeReadExpression(next, serial),
                                  makePrimitiveExpression("value", serial),
                                  serial,
                                ),
                                serial,
                                true,
                              ),
                              serial,
                            ),
                            ...(node.left.type === "VariableDeclaration"
                              ? unbuildPatternStatement(
                                  node.left.declarations[0].id,
                                  context,
                                  item,
                                )
                              : map(
                                  unbuildPatternEffect(
                                    node.left,
                                    context,
                                    item,
                                  ),
                                  (effect) =>
                                    makeEffectStatement(effect, serial),
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
                                  completion,
                                  kinds: {},
                                  with: null,
                                },
                              ),
                              serial,
                            ),
                            makeEffectStatement(
                              makeWriteEffect(
                                next,
                                wrapAwait(
                                  node.await,
                                  makeApplyExpression(
                                    makeGetExpression(
                                      makeReadExpression(iterator, serial),
                                      makePrimitiveExpression("next", serial),
                                      serial,
                                    ),
                                    makePrimitiveExpression(
                                      { undefined: null },
                                      serial,
                                    ),
                                    [],
                                    serial,
                                  ),
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
                          makeReadExpression(next, serial),
                          makePrimitiveExpression("done", serial),
                          serial,
                        ),
                        [],
                        [
                          makeConditionalEffect(
                            makeBinaryExpression(
                              "==",
                              makeGetExpression(
                                makeReadExpression(iterator, serial),
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
                                    makeReadExpression(iterator, serial),
                                    makePrimitiveExpression("return", serial),
                                    serial,
                                  ),
                                  makeReadExpression(next, serial),
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
        ),
      ];
    case "SwitchStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
        ...wrapBlock(
          context,
          [
            ...(hasEmptyBreak(node) ? [mangleEmptyBreakLabel(hash)] : []),
            ...map(labels, mangleBreakLabel),
          ],
          {
            type: "block",
            kinds: hoistBlock(flatMap(node.cases, getConsequent)),
            with: null,
          },
          // eslint-disable-next-line no-shadow
          (context) => {
            const discriminant = mangleMetaVariable(
              hash,
              BASENAME,
              "discriminant",
            );
            const matched = mangleMetaVariable(hash, BASENAME, "matched");
            return [
              makeEffectStatement(
                makeWriteEffect(
                  discriminant,
                  unbuildExpression(node.discriminant, context, {
                    name: ANONYMOUS,
                  }),
                  serial,
                  true,
                ),
                serial,
              ),
              makeEffectStatement(
                makeWriteEffect(
                  matched,
                  makePrimitiveExpression(false, serial),
                  serial,
                  true,
                ),
                serial,
              ),
              ...(completion === null
                ? flatMap(node.cases, (child) =>
                    unbuildCase(child, context, {
                      discriminant,
                      matched,
                      completion,
                    }),
                  )
                : flatMap(enumerate(node.cases.length), (index) =>
                    unbuildCase(node.cases[index], context, {
                      discriminant,
                      matched,
                      completion: {
                        variable: completion.variable,
                        last: updateLast(
                          slice(node.cases, index + 1, node.cases.length),
                          completion.last,
                        ),
                      },
                    }),
                  )),
            ];
          },
          serial,
        ),
      ];
    default:
      throw new StaticSyntaxAranError(BASENAME, node);
  }
};

/**
 * @type {<S>(
 *   nodes: (
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[],
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     labels: [],
 *     completion: Completion,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildAllStatement = (nodes, context, { labels, completion }) =>
  completion === null
    ? flatMap(nodes, (child) =>
        unbuildStatement(child, context, { labels, completion: null }),
      )
    : flatMap(enumerate(nodes.length), (index) =>
        unbuildStatement(nodes[index], context, {
          labels: [],
          completion: {
            variable: completion.variable,
            last: updateLast(
              slice(nodes, index + 1, nodes.length),
              completion.last,
            ),
          },
        }),
      );
