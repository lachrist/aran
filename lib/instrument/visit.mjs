/* eslint-disable no-use-before-define */

/** @typedef {Json | undefined} Tag */

/**
 * @typedef {{
 *   enclave: string | null,
 *   path: string,
 *   serial: Json,
 *   pointcut: Pointcut,
 *   advice: string,
 *   inline: {
 *     variable: boolean,
 *     label: boolean,
 *     serial: boolean,
 *   },
 *   parseLabel: (label: string) => Json,
 *   stringifyLabel: (label: Json) => string,
 *   parseVariable: (variable: string) => Json,
 *   stringifyVariable: (variable: Json) => string,
 *   overwritten: Record<Parameter, boolean>,
 * }} Context
 */

/**
 * @typedef {{
 *   makeSerialExpression: (path: string, serial: Json) =>  Expression,
 *   makeVariableExpression: (variable: Json) => Expression,
 *   makeLabelExpression: (label: Json) => Expression,
 *  }} MakeDynamicArgument
 */

/**
 * @typedef {{makers: MakeDynamicArgument}} ContextCache
 */

/**
 * @typedef {{
 *   type: "module",
 *   links: LinkData[],
 *   parameters: Parameter[],
 * } | {
 *   type: "eval",
 *   parameters: Parameter[],
 * } | {
 *   type: "closure",
 *   kind: "arrow" | "function" | "method" | "constructor",
 *   callee: Expression,
 *   parameters: Parameter[],
 * } | {
 *   type: "block"
 *   kind: "naked" | "then" | "else" | "try" | "catch" | "finally" | "while",
 *   parameters: Parameter[],
 * }} Parent
 */

import {
  makeAwaitExpression,
  makeBlock,
  makeBlockStatement,
  makeClosureExpression,
  makeConditionalExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeEvalExpression,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeParameterExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEffect,
  makeWriteEnclaveEffect,
  makeYieldExpression,
  unpackPrimitive,
} from "../syntax.mjs";

import {
  StaticError,
  map,
  flatMap,
  hasOwn,
  reduceReverse,
  enumerate,
  filter,
} from "../util/index.mjs";

import { makeGetExpression, makeJsonExpression } from "../intrinsic.mjs";

import { cut } from "./cut.mjs";

import { makeForwardExpression } from "./forward.mjs";

import { makeTriggerExpression } from "./trigger.mjs";

import {
  isNewVariable,
  mangleArgVariable,
  mangleLabVariable,
  mangleNewVariable,
  mangleOldVariable,
  mangleVarVariable,
} from "./variable.mjs";
import {
  hasLoadDeep,
  listLoadEntryShallow,
  makeLoadExpression,
  makeSaveEffect,
} from "./scope.mjs";

const {
  undefined,
  Object: { fromEntries: reduceEntry, entries: listEntry },
  Reflect: { ownKeys: listKey },
} = globalThis;

///////////
// Other //
///////////

/** @type {{[K in BlockKind]: Parent}} */
const blocks = {
  naked: {
    type: "block",
    kind: "naked",
    parameters: [],
  },
  then: {
    type: "block",
    kind: "then",
    parameters: [],
  },
  else: {
    type: "block",
    kind: "else",
    parameters: [],
  },
  while: {
    type: "block",
    kind: "while",
    parameters: [],
  },
  try: {
    type: "block",
    kind: "try",
    parameters: [],
  },
  catch: {
    type: "block",
    kind: "catch",
    parameters: ["error"],
  },
  finally: {
    type: "block",
    kind: "finally",
    parameters: [],
  },
};

/** @type {{[K in ClosureKind]: Parameter[]}} */
const params = {
  arrow: ["arguments"],
  function: ["this", "new.target", "arguments"],
  method: ["this", "arguments"],
  constructor: ["this", "new.target", "arguments"],
};

/** @type {(parent_serial: Json, node: Node) => Json} */
const updateSerial = (parent_serial, node) =>
  hasOwn(node, "tag") ? /** @type {Json} */ (node.tag) : parent_serial;

/** @type {(entry: [string, Tag]) => Statement[]} */
const listInitializeStatement = ([variable, tag]) =>
  tag === undefined
    ? []
    : [makeEffectStatement(makeWriteEffect(variable, makeJsonExpression(tag)))];

/** @type {(statements1: Statement[], statements2: Statement[], statements3: Statement[]) => Statement[]} */
const listOptimizeTryStatement = (statements1, statements2, statements3) =>
  statements2.length === 1 &&
  statements2[0].type === "EffectStatement" &&
  statements2[0].effect.type === "ExpressionEffect" &&
  statements2[0].effect.discard.type === "ApplyExpression" &&
  statements2[0].effect.discard.callee.type === "IntrinsicExpression" &&
  statements2[0].effect.discard.callee.intrinsic === "aran.throw" &&
  statements2[0].effect.discard.this.type === "PrimitiveExpression" &&
  statements2[0].effect.discard.arguments.length === 1 &&
  statements2[0].effect.discard.arguments[0].type === "ParameterExpression" &&
  statements2[0].effect.discard.arguments[0].parameter === "error" &&
  statements3.length === 0
    ? statements1
    : [
        makeTryStatement(
          makeBlock([], [], statements1),
          makeBlock([], [], statements2),
          makeBlock([], [], statements3),
        ),
      ];

/** @type {(context: Context) => ContextCache} */
const compileContextCache = (context) => {
  const { enclave, stringifyLabel, stringifyVariable } = context;
  return {
    makers: {
      makeLabelExpression: context.inline.label
        ? makeJsonExpression
        : (digest_label) =>
            makeLoadExpression(
              enclave,
              mangleLabVariable(stringifyLabel(digest_label)),
              digest_label,
            ),
      makeVariableExpression: context.inline.variable
        ? makeJsonExpression
        : (digest_label) =>
            makeLoadExpression(
              enclave,
              mangleVarVariable(stringifyVariable(digest_label)),
              digest_label,
            ),
      makeSerialExpression: context.inline.serial
        ? makeJsonExpression
        : (path, serial) =>
            makeLoadExpression(
              enclave,
              mangleNewVariable(path, "serial"),
              serial,
            ),
    },
  };
};

//////////
// Util //
//////////

/** @type {(expression: Expression, effect: Effect) => Expression} */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

//////////////////
// Trap Builder //
//////////////////

/**
 * @type {(
 *   context: { pointcut: Pointcut, advice: string, path: string },
 *   cache: ContextCache,
 *   point: Point,
 * ) => Expression | null}
 */
const attemptTrapExpression = (
  { pointcut, advice, path },
  { makers },
  point,
) =>
  cut(pointcut, point)
    ? makeTriggerExpression(advice, point, path, makers)
    : null;

/**
 * @type {(
 *   context: { pointcut: Pointcut, advice: string, path: string },
 *   cache: { makers: MakeDynamicArgument },
 *   point: Point,
 * ) => Expression}
 */
const makeTrapExpression = ({ pointcut, advice, path }, { makers }, point) =>
  cut(pointcut, point)
    ? makeTriggerExpression(advice, point, path, makers)
    : makeForwardExpression(point);

/**
 * @type {(
 *   context: { pointcut: Pointcut, advice: string, path: string },
 *   cache: { makers: MakeDynamicArgument },
 *   point: Point,
 * ) => Effect[]}
 */
const listTrapEffect = ({ pointcut, advice, path }, { makers }, point) =>
  cut(pointcut, point)
    ? [makeExpressionEffect(makeTriggerExpression(advice, point, path, makers))]
    : [];

/////////////////
// Build Point //
/////////////////

/** @type {(parameter: Parameter) => [Parameter, Expression]} */
const makeParameterEntry = (parameter) => [
  parameter,
  makeParameterExpression(parameter),
];

/** @type {(node: Block, parent: Parent, context: Context) => Point} */
const makeEnterPoint = (block, parent, context) => {
  switch (parent.type) {
    case "module":
      return {
        type: "module.enter",
        links: parent.links,
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, context.parseVariable),
        serial: context.serial,
      };
    case "eval":
      return {
        type: "eval.enter",
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, context.parseVariable),
        serial: context.serial,
      };
    case "block":
      return {
        type: "block.enter",
        kind: parent.kind,
        labels: map(block.labels, context.parseLabel),
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, context.parseVariable),
        serial: context.serial,
      };
    case "closure":
      return {
        type: "closure.enter",
        kind: parent.kind,
        callee: parent.callee,
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, context.parseVariable),
        serial: context.serial,
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

////////////////
// Instrument //
////////////////

/** @type {(nodes: Node[]) => Expression | null} */
const attemptCompletionExpression = (nodes) => {
  if (nodes.length > 0) {
    const node = nodes[nodes.length - 1];
    return node.type === "EffectStatement" &&
      node.effect.type === "ExpressionEffect"
      ? node.effect.discard
      : null;
  } else {
    return null;
  }
};

/** @type {(entry: [string, Tag]) => boolean} */
const isNewEntry = ([variable, _tag]) => isNewVariable(variable);

/**
 * @type {(
 *   node: Block,
 *   context: Context,
 *   cache: ContextCache,
 *   parent: Parent,
 * ) => Block}
 */
const instrumentBlock = (node, old_context, old_cache, parent) => {
  const serial = updateSerial(old_context.serial, node);
  const new_context =
    old_context.enclave === null
      ? old_context
      : {
          ...old_context,
          enclave: null,
        };
  const new_cache =
    old_context.enclave === null ? old_cache : compileContextCache(new_context);
  const trap = attemptTrapExpression(
    new_context,
    new_cache,
    makeEnterPoint(node, parent, new_context),
  );
  const overwritten = {
    ...old_context.overwritten,
    ...reduceEntry(
      map(parent.parameters, (parameter) => [parameter, trap !== null]),
    ),
  };
  const completion =
    parent.type === "eval"
      ? attemptCompletionExpression(node.statements)
      : null;
  const statements1 = [
    ...(trap === null
      ? []
      : [
          makeEffectStatement(makeWriteEffect(mangleArgVariable(null), trap)),
          ...map(parent.parameters, (parameter) =>
            makeEffectStatement(
              makeSaveEffect(
                new_context.enclave,
                mangleArgVariable(parameter),
                makeGetExpression(
                  makeLoadExpression(
                    new_context.enclave,
                    mangleArgVariable(null),
                    null,
                  ),
                  makePrimitiveExpression(parameter),
                ),
              ),
            ),
          ),
        ]),
    ...flatMap(
      enumerate(node.statements.length - (completion === null ? 0 : 1)),
      (index) =>
        instrumentStatement(
          node.statements[index],
          {
            ...new_context,
            overwritten,
            path: `${new_context.path}_${index}_`,
          },
          new_cache,
        ),
    ),
    ...map(
      listTrapEffect(
        new_context,
        new_cache,
        parent.type === "eval"
          ? {
              type: "eval.success",
              value: instrumentExpression(
                completion === null
                  ? makePrimitiveExpression({ undefined: null })
                  : completion,
                {
                  ...new_context,
                  overwritten,
                  path: `${new_context.path}_completion_`,
                },
                new_cache,
              ),
              serial: new_context.serial,
            }
          : { type: `${parent.type}.success`, serial },
      ),
      makeEffectStatement,
    ),
  ];
  const statements2 = map(
    listTrapEffect(new_context, new_cache, {
      type: `${parent.type}.failure`,
      value: makeParameterExpression("error"),
      serial,
    }),
    makeEffectStatement,
  );
  const statements3 = map(
    listTrapEffect(new_context, new_cache, {
      type: `${parent.type}.leave`,
      serial,
    }),
    makeEffectStatement,
  );
  const { parseLabel, parseVariable } = new_context;
  const statements = [...statements1, ...statements2, ...statements3];
  const record = reduceEntry([
    ...filter(
      /** @type {[string, Tag][]} */
      ([
        ...(new_context.inline.label
          ? []
          : map(node.labels, (label) => [
              mangleLabVariable(label),
              parseLabel(label),
            ])),
        ...(new_context.inline.variable
          ? []
          : map(node.variables, (variable) => [
              mangleVarVariable(variable),
              parseVariable(variable),
            ])),
      ]),
      ([variable, _initial]) =>
        hasLoadDeep(new_context.enclave, variable, statements),
    ),
    ...filter(
      listLoadEntryShallow(new_context.enclave, statements),
      isNewEntry,
    ),
    ...map(node.variables, (variable) => [variable, undefined]),
  ]);
  return makeBlock(node.labels, /** @type {string[]} */ (listKey(record)), [
    ...flatMap(listEntry(record), listInitializeStatement),
    ...listOptimizeTryStatement(statements1, statements2, statements3),
  ]);
};

/** @type {(node: Statement, context: Context, cache: ContextCache) => Statement[]} */
const instrumentStatement = (node, context, cache) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(
          node.effect,
          {
            ...context,
            serial,
            path: `${context.path}1`,
          },
          cache,
        ),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(context, cache, {
            type: "return.before",
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
      ];
    case "DeclareEnclaveStatement": {
      return [
        makeDeclareEnclaveStatement(
          node.kind,
          node.variable,
          makeTrapExpression(context, cache, {
            type: "enclave.declare.before",
            kind: node.kind,
            variable: node.variable,
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
        ...map(
          listTrapEffect(context, cache, {
            type: "enclave.declare.after",
            kind: node.kind,
            variable: node.variable,
            serial,
          }),
          makeEffectStatement,
        ),
      ];
    }
    case "BreakStatement":
      return [
        ...map(
          listTrapEffect(context, cache, {
            type: "break.before",
            label: node.label,
            serial,
          }),
          makeEffectStatement,
        ),
      ];
    case "DebuggerStatement": {
      return [
        ...map(
          listTrapEffect(context, cache, {
            type: "debugger.before",
            serial,
          }),
          makeEffectStatement,
        ),
        node,
        ...map(
          listTrapEffect(context, cache, {
            type: "debugger.after",
            serial,
          }),
          makeEffectStatement,
        ),
      ];
    }
    case "BlockStatement":
      return [
        makeBlockStatement(
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}1`,
            },
            cache,
            blocks.naked,
          ),
        ),
      ];
    case "IfStatement":
      return [
        makeIfStatement(
          makeTrapExpression(context, cache, {
            type: "test.before",
            kind: "if",
            value: instrumentExpression(
              node.test,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
          instrumentBlock(
            node.then,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            cache,
            blocks.then,
          ),
          instrumentBlock(
            node.else,
            {
              ...context,
              serial,
              path: `${context.path}3`,
            },
            cache,
            blocks.else,
          ),
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(context, cache, {
            type: "test.before",
            kind: "while",
            value: instrumentExpression(
              node.test,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            cache,
            blocks.while,
          ),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}1`,
            },
            cache,
            blocks.try,
          ),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            cache,
            blocks.catch,
          ),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}3`,
            },
            cache,
            blocks.finally,
          ),
        ),
      ];
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/** @type {(node: Effect, context: Context, cache: ContextCache) => Effect[]} */
const instrumentEffect = (node, context, cache) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(context, cache, {
            type: "drop.before",
            value: instrumentExpression(
              node.discard,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
      ];
    case "WriteEffect":
      return [
        makeWriteEffect(
          mangleOldVariable(node.variable),
          makeTrapExpression(context, cache, {
            type: "write.before",
            variable: node.variable,
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
      ];
    case "ExportEffect":
      return [
        makeExportEffect(
          node.export,
          makeTrapExpression(context, cache, {
            type: "export.before",
            specifier: node.export,
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
      ];
    case "WriteEnclaveEffect":
      return [
        makeWriteEnclaveEffect(
          node.variable,
          makeTrapExpression(context, cache, {
            type: "enclave.write.before",
            variable: node.variable,
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
        ...listTrapEffect(context, cache, {
          type: "enclave.write.after",
          variable: node.variable,
          serial,
        }),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/** @type {(node: Expression, context: Context, cache: ContextCache) => Expression} */
export const instrumentExpression = (node, context, cache) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(context, cache, {
        type: "primitive.after",
        value: unpackPrimitive(node.primitive),
        serial,
      });
    case "ParameterExpression":
      return makeTrapExpression(context, cache, {
        type: "parameter.after",
        name: node.parameter,
        value: context.overwritten[node.parameter]
          ? makeLoadExpression(
              context.enclave,
              mangleArgVariable(node.parameter),
              null,
            )
          : node,
        serial,
      });
    case "IntrinsicExpression":
      return makeTrapExpression(context, cache, {
        type: "intrinsic.after",
        name: node.intrinsic,
        value: node,
        serial,
      });
    case "ImportExpression":
      return makeTrapExpression(context, cache, {
        type: "import.after",
        source: node.source,
        specifier: node.import,
        value: node,
        serial,
      });
    case "ReadExpression":
      return makeTrapExpression(context, cache, {
        type: "read.after",
        variable: node.variable,
        value: makeReadExpression(mangleOldVariable(node.variable)),
        serial,
      });
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, cache, {
          type: "enclave.read.before",
          variable: node.variable,
          serial,
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, cache, {
          type: "enclave.read.after",
          variable: node.variable,
          value: node,
          serial,
        }),
      );
    case "TypeofEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, cache, {
          type: "enclave.typeof.before",
          variable: node.variable,
          serial,
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, cache, {
          type: "enclave.typeof.after",
          variable: node.variable,
          value: node,
          serial,
        }),
      );
    case "ClosureExpression": {
      const variable = mangleNewVariable(context.path, "callee");
      const expression = makeTrapExpression(context, cache, {
        type: "closure.after",
        kind: node.kind,
        asynchronous: node.asynchronous,
        generator: node.generator,
        value: makeClosureExpression(
          node.kind,
          node.asynchronous,
          node.generator,
          instrumentBlock(
            node.body,
            { ...context, serial, path: `${context.path}1` },
            cache,
            {
              type: "closure",
              kind: node.kind,
              callee: makeLoadExpression(context.enclave, variable, null),
              parameters: params[node.kind],
            },
          ),
        ),
        serial,
      });
      return hasLoadDeep(context.enclave, variable, [expression])
        ? makeSequenceExpression(
            makeSaveEffect(context.enclave, variable, expression),
            makeLoadExpression(context.enclave, variable, null),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        instrumentEffect(
          node.effect,
          {
            ...context,
            serial,
            path: `${context.path}1`,
          },
          cache,
        ),
        makeFlipSequenceExpression,
        instrumentExpression(
          node.value,
          {
            ...context,
            serial,
            path: `${context.path}2`,
          },
          cache,
        ),
      );
    case "ConditionalExpression":
      return makeTrapExpression(context, cache, {
        type: "conditional.after",
        value: makeConditionalExpression(
          makeTrapExpression(context, cache, {
            type: "conditional.before",
            value: instrumentExpression(
              node.test,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
          instrumentExpression(
            node.consequent,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            cache,
          ),
          instrumentExpression(
            node.alternate,
            {
              ...context,
              serial,
              path: `${context.path}3`,
            },
            cache,
          ),
        ),
        serial,
      });
    case "AwaitExpression":
      return makeTrapExpression(context, cache, {
        type: "await.after",
        value: makeAwaitExpression(
          makeTrapExpression(context, cache, {
            type: "await.before",
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
        serial,
      });
    case "YieldExpression":
      return makeTrapExpression(context, cache, {
        type: "yield.after",
        delegate: node.delegate,
        value: makeYieldExpression(
          node.delegate,
          makeTrapExpression(context, cache, {
            type: "yield.before",
            delegate: node.delegate,
            value: instrumentExpression(
              node.value,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
        serial,
      });
    case "EvalExpression":
      return makeTrapExpression(context, cache, {
        type: "eval.after",
        value: makeEvalExpression(
          makeTrapExpression(context, cache, {
            type: "eval.before",
            value: instrumentExpression(
              node.argument,
              {
                ...context,
                serial,
                path: `${context.path}1`,
              },
              cache,
            ),
            serial,
          }),
        ),
        serial,
      });
    case "ApplyExpression":
      return makeTrapExpression(context, cache, {
        type: "apply",
        callee: instrumentExpression(
          node.callee,
          {
            ...context,
            serial,
            path: `${context.path}1`,
          },
          cache,
        ),
        this: instrumentExpression(
          node.this,
          {
            ...context,
            serial,
            path: `${context.path}2`,
          },
          cache,
        ),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(
            node.arguments[index],
            {
              ...context,
              serial,
              path: `${context.path}3_${index}`,
            },
            cache,
          ),
        ),
        serial,
      });
    case "ConstructExpression":
      return makeTrapExpression(context, cache, {
        type: "construct",
        callee: instrumentExpression(
          node.callee,
          {
            ...context,
            serial,
            path: `${context.path}1`,
          },
          cache,
        ),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(
            node.arguments[index],
            {
              ...context,
              serial,
              path: `${context.path}2_${index}`,
            },
            cache,
          ),
        ),
        serial,
      });
    default:
      throw new StaticError("invalid expression node", node);
  }
};
