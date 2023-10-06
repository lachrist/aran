import { SyntaxAranError } from "../../error.mjs";
import {
  StaticError,
  filter,
  filterOut,
  flatMap,
  flatMapIndex,
  includes,
  map,
  pop,
  push,
  pushAll,
  reverse,
  slice,
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
 * @typedef {import("../context.js").Context<S>} Context
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
 * @type {<S>(
 *   pair: {
 *     node:
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     labels: estree.Label[],
 *     completion: null | {
 *       last: boolean,
 *       variable: unbuild.Variable,
 *     },
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildStatement = (
  { node, path },
  context,
  { labels, completion, loop },
) => {
  const { serialize, digest } = context;
  const serial = serialize(node, path);
  const hash = digest(node, path);
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
            : unbuildExpression(
                {
                  node: node.argument,
                  path: /** @type {unbuild.Path} */ (`${path}.argument`),
                },
                context,
                { name: ANONYMOUS },
              ),
          serial,
        ),
      ];
    case "ExpressionStatement":
      if (completion !== null && completion.last) {
        return [
          makeEffectStatement(
            makeWriteEffect(
              completion.variable,
              unbuildExpression(drill({ node, path }, "expression"), context, {
                name: ANONYMOUS,
              }),
              serial,
              true,
            ),
            serial,
          ),
        ];
      } else {
        return map(
          unbuildEffect(drill({ node, path }, "expression"), context),
          (effect) => makeEffectStatement(effect, serial),
        );
      }
    case "ThrowStatement":
      return [
        makeEffectStatement(
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("aran.throw", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [
                unbuildExpression(drill({ node, path }, "argument"), context, {
                  name: ANONYMOUS,
                }),
              ],
              serial,
            ),
            serial,
          ),
          serial,
        ),
      ];
    case "BreakStatement": {
      if (node.label == null) {
        if (loop.break === null) {
          throw new SyntaxAranError("Illegal break statement", node);
        } else {
          return [makeBreakStatement(loop.break, serial)];
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
        if (loop.continue === null) {
          throw new SyntaxAranError("Illegal continue statement", node);
        } else {
          return [makeBreakStatement(loop.continue, serial)];
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
      return flatMap(
        drillAll(drillArray({ node, path }, "declarations")),
        (pair) => unbuildDeclarator(pair, context),
      );
    case "FunctionDeclaration":
      if (node.id == null) {
        throw new SyntaxAranError("missing function name", node);
      } else {
        const right = mangleMetaVariable(hash, BASENAME, "right");
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
        throw new SyntaxAranError("missing function name", node);
      } else {
        const right = mangleMetaVariable(hash, BASENAME, "right");
        return [
          makeEffectStatement(
            makeWriteEffect(
              right,
              unbuildClass({ node, path }, context, { name: ANONYMOUS }),
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
      return hasDeclarationExportNamedDeclaration(node)
        ? unbuildStatement(drill({ node, path }, "declaration"), context, {
            labels: [],
            completion,
            loop,
          })
        : [];
    case "ExportDefaultDeclaration":
      return unbuildDefault(drill({ node, path }, "declaration"), context);
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
          serial,
        ),
      ];
    case "StaticBlock":
      throw new SyntaxAranError("illegal static block", node);
    case "WithStatement": {
      const frame = mangleMetaVariable(hash, BASENAME, "frame");
      return [
        ...makeUndefinedCompletion(completion, serial),
        makeEffectStatement(
          makeWriteEffect(
            frame,
            unbuildExpression(drill({ node, path }, "object"), context, {
              name: ANONYMOUS,
            }),
            serial,
            true,
          ),
          serial,
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
          serial,
        ),
      ];
    }
    case "IfStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
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
                serial,
              ),
          serial,
        ),
      ];
    case "TryStatement":
      return [
        ...makeUndefinedCompletion(completion, serial),
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
          hasFinalizer(node)
            ? unbuildControlBlock(drill({ node, path }, "finalizer"), context, {
                labels: map(labels, mangleBreakLabel),
                loop,
                // a: try { throw "boum"; }
                //    catch { 123; }
                //    finally { 456; break a }
                // > 456
                completion:
                  completion === null
                    ? null
                    : { variable: completion.variable, last: false },
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
                serial,
              ),
          serial,
        ),
      ];
    case "WhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      return [
        ...makeUndefinedCompletion(completion, serial),
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
              serial,
            ),
          ],
          serial,
        ),
      ];
    }
    case "DoWhileStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      const initial = mangleMetaVariable(hash, BASENAME, "initial_do");
      return [
        ...makeUndefinedCompletion(completion, serial),
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
                unbuildExpression(drill({ node, path }, "test"), context, {
                  name: ANONYMOUS,
                }),
                serial,
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
              serial,
            ),
          ],
          serial,
        ),
      ];
    }
    case "ForStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
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
          },
          (context) => [
            ...(hasInit(node)
              ? unbuildInit(drill({ node, path }, "init"), context)
              : []),
            makeWhileStatement(
              hasTest(node)
                ? unbuildExpression(drill({ node, path }, "test"), context, {
                    name: ANONYMOUS,
                  })
                : makePrimitiveExpression(true, serial),
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
                        serial,
                      ),
                      ...map(
                        unbuildEffect(drill({ node, path }, "update"), context),
                        (effect) => makeEffectStatement(effect, serial),
                      ),
                    ],
                    serial,
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
              serial,
            ),
          ],
          serial,
        ),
      ];
    }
    case "ForInStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
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
        ...makeUndefinedCompletion(completion, serial),
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
              ...map(
                unbuildLeftInit(drill({ node, path }, "left"), context),
                (effect) => makeEffectStatement(effect, serial),
              ),
              makeEffectStatement(
                makeWriteEffect(
                  right,
                  makeApplyExpression(
                    makeIntrinsicExpression("Object", serial),
                    makePrimitiveExpression({ undefined: null }, serial),
                    [
                      unbuildExpression(
                        drill({ node, path }, "right"),
                        context,
                        { name: ANONYMOUS },
                      ),
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
                  },
                  [],
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
    case "ForOfStatement": {
      const loop = {
        break: mangleEmptyBreakLabel(hash),
        continue: mangleEmptyContinueLabel(hash),
      };
      return [
        ...makeUndefinedCompletion(completion, serial),
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
            const iterator = mangleMetaVariable(hash, BASENAME, "iterator");
            const next = mangleMetaVariable(hash, BASENAME, "next");
            return [
              ...map(
                unbuildLeftInit(drill({ node, path }, "left"), context),
                (effect) => makeEffectStatement(effect, serial),
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
                  },
                  [],
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
                        },
                        [],
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
                  },
                  [],
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
    }
    case "SwitchStatement": {
      const loop_break = mangleEmptyBreakLabel(hash);
      return [
        ...makeUndefinedCompletion(completion, serial),
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
              hash,
              BASENAME,
              "discriminant",
            );
            const matched = mangleMetaVariable(hash, BASENAME, "matched");
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
                    completion:
                      completion === null
                        ? null
                        : {
                            variable: completion.variable,
                            last: updateLast(
                              slice(node.cases, index + 1, node.cases.length),
                              completion.last,
                            ),
                          },
                  }),
              ),
            ];
          },
          serial,
        ),
      ];
    }
    default:
      throw new StaticError("illegal statement node", node);
  }
};

/**
 * @type {<S>(
 *   pairs: {
 *     node: (
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration
 *     ),
 *     path: unbuild.Path,
 *   }[],
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     labels: [],
 *     completion: Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildAllStatement = (
  pairs,
  context,
  { labels, completion, loop },
) => {
  const body = [
    ...filter(pairs, isPairHoisted),
    ...filterOut(pairs, isPairHoisted),
  ];
  return completion === null
    ? flatMap(body, (pair) =>
        unbuildStatement(pair, context, { labels, completion: null, loop }),
      )
    : flatMapIndex(pairs.length, (index) =>
        unbuildStatement(pairs[index], context, {
          labels: [],
          completion: {
            variable: completion.variable,
            last: updateLast(
              map(slice(pairs, index + 1, pairs.length), getNode),
              completion.last,
            ),
          },
          loop,
        }),
      );
};
