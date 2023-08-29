/* eslint-disable no-use-before-define */

import { PARAMETER_ENUM, unpackPrimitive } from "../syntax.mjs";

import {
  makeAwaitExpression,
  makeBlockStatement,
  makeClosureExpression,
  makeConditionalExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeEvalExpression,
  makeProgram,
  makeBlock,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeParameterExpression,
  makePrimitiveExpression,
  makeReturnStatement,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
  makeWriteEnclaveEffect,
  makeYieldExpression,
} from "./syntax.mjs";

import {
  StaticError,
  map,
  flatMap,
  hasOwn,
  reduceReverse,
  enumerate,
} from "../util/index.mjs";

import { makeGetExpression, makeJsonExpression } from "../intrinsic.mjs";

import { cut } from "./cut.mjs";

import { makeForwardExpression } from "./forward.mjs";

import { makeTriggerExpression } from "./trigger.mjs";

import {
  mangleLabelVariable,
  mangleVariableVariable,
  mangleCalleeVariable,
  mangleSerialVariable,
  mangleParameterVariable,
} from "./variable.mjs";

import {
  makeLayerBlock,
  makeLayerProgram,
  makeLayerClosureExpression,
  makeNewReadExpression,
  makeOldReadExpression,
  makeNewWriteEffect,
  makeOldWriteEffect,
} from "./layer.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template S, L, V
 * @typedef {{
 *   path: string,
 *   pointcut: Pointcut<S, L, V>,
 *   advice: string,
 *   escape: string,
 *   inline: {
 *     variable: boolean,
 *     label: boolean,
 *     serial: boolean,
 *   },
 *   parseLabel: (label: string) => L,
 *   parseVariable: (variable: string) => V,
 *   stringifyLabel: (label: L) => string,
 *   stringifyVariable: (variable: V) => string,
 *   overwritten: Record<Parameter, boolean>,
 * }} Context
 */

/**
 * @typedef {{
 *   type: "module",
 *   links: Link[],
 *   parameters: Parameter[],
 * } | {
 *   type: "eval",
 *   parameters: Parameter[],
 * } | {
 *   type: "closure",
 *   kind: "arrow" | "function" | "method" | "constructor",
 *   callee: Expression<Usage>,
 *   parameters: Parameter[],
 * } | {
 *   type: "block"
 *   kind: "naked" | "then" | "else" | "try" | "catch" | "finally" | "while",
 *   parameters: Parameter[],
 * }} Parent
 */

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
const closures = {
  arrow: ["arguments"],
  function: ["this", "new.target", "arguments"],
  method: ["this", "arguments"],
  constructor: ["this", "new.target", "arguments"],
};

/** @type {{[K in ProgramKind]: Parameter[]}} */
const programs = {
  module: ["import", "import.meta"],
  eval: ["import", "super.get", "super.set", "super.call"],
  script: ["import"],
};

const OVERWRITTEN = /** @type {Record<Parameter, boolean>} */ (
  reduceEntry(map(PARAMETER_ENUM, (parameter) => [parameter, false]))
);

/**
 * @type {(
 *   statements1: Statement<Usage>[],
 *   statements2: Statement<Usage>[],
 *   statements3: Statement<Usage>[],
 * ) => Statement<Usage>[]}
 */
const listOptimizeTryStatement = (statements1, statements2, statements3) =>
  statements2.length === 1 &&
  statements2[0].type === "EffectStatement" &&
  statements2[0].inner.type === "ExpressionEffect" &&
  statements2[0].inner.discard.type === "ApplyExpression" &&
  statements2[0].inner.discard.callee.type === "IntrinsicExpression" &&
  statements2[0].inner.discard.callee.intrinsic === "aran.throw" &&
  statements2[0].inner.discard.this.type === "PrimitiveExpression" &&
  statements2[0].inner.discard.arguments.length === 1 &&
  statements2[0].inner.discard.arguments[0].type === "ParameterExpression" &&
  statements2[0].inner.discard.arguments[0].parameter === "error" &&
  statements3.length === 0
    ? statements1
    : [
        makeTryStatement(
          makeBlock([], [], statements1),
          makeBlock([], [], statements2),
          makeBlock([], [], statements3),
        ),
      ];

/** @type {(expression: Expression<Usage>, effect: Effect<Usage>) => Expression<Usage>} */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/** @type {(parameter: Parameter) => [Parameter, Expression]} */
const makeParameterEntry = (parameter) => [
  parameter,
  makeParameterExpression(parameter),
];

////////////////
// Build Trap //
////////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   context: Context<S, L, V>,
 *   point: Point<S, L, V>,
 * ) => Expression<Usage> | null}
 */
const attemptTrapExpression = (context, point) =>
  cut(point, context.pointcut) ? makeTriggerExpression(point, context) : null;

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   context: Context<S, L, V>,
 *   point: Point<S, L, V>,
 * ) => Expression<Usage>}
 */
const makeTrapExpression = (context, point) =>
  cut(point, context.pointcut)
    ? makeTriggerExpression(point, context)
    : makeForwardExpression(point);

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   context: Context<S, L, V>,
 *   point: Point<S, L, V>,
 * ) => Effect<Usage>[]}
 */
const listTrapEffect = (context, point) =>
  cut(point, context.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, context))]
    : [];

/////////////////
// Build Point //
/////////////////

// /**
//  * @type {<S, L, V>(
//  *   node: Block<Usage>,
//  *   parent: Parent,
//  *   context: {
//  *     inline: { variable: boolean, label: boolean, serial: boolean },
//  *     parseLabel: (label: L) => Json,
//  *     parseVariable: (variable: V) => Json,
//  *   },
//  *   serial: S,
//  * ) => Point<S, L, V>}
//  */
// const makeEnterPoint = (block, parent, context, serial) => {
//   const { parseLabel, parseVariable } = context;
//   switch (parent.type) {
//     case "module":
//       return {
//         type: "module.enter",
//         links: parent.links,
//         parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
//         variables: map(block.variables, parseVariable),
//         serial,
//       };
//     case "eval":
//       return {
//         type: "eval.enter",
//         parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
//         variables: map(block.variables, (variable) =>
//           makeVariablePointSplit(context, variable),
//         ),
//         serial: makeSerialPointSplit(context, serial),
//       };
//     case "block":
//       return {
//         type: "block.enter",
//         kind: parent.kind,
//         labels: map(block.labels, (variable) =>
//           makeLabelPointSplit(context, variable),
//         ),
//         parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
//         variables: map(block.variables, (variable) =>
//           makeVariablePointSplit(context, variable),
//         ),
//         serial: makeSerialPointSplit(context, serial),
//       };
//     case "closure":
//       return {
//         type: "closure.enter",
//         kind: parent.kind,
//         callee: parent.callee,
//         parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
//         variables: map(block.variables, (variable) =>
//           makeVariablePointSplit(context, variable),
//         ),
//         serial: makeSerialPointSplit(context, serial),
//       };
//     default:
//       throw new StaticError("invalid parent", parent);
//   }
// };

////////////////
// Instrument //
////////////////

/**
 * @type {<S, L, V>(
 *   node: Program<Usage>,
 *   context: {
 *     advice: string,
 *     escape: string,
 *     pointcut: Pointcut<S, L, V>,
 *     parseLabel: (label: string) => L,
 *     stringifyLabel: (label: L) => string,
 *     parseVariable: (variable: string) => V,
 *     stringifyVariable: (variable: V) => string,
 *     inline: { variable: boolean, label: boolean, serial: boolean },
 *   },
 * ) => Program<Usage>}
 */
export const instrumentProgram = (node, { escape, ...partial_context }) => {
  const context = {
    ...partial_context,
    path: "",
    overwritten: OVERWRITTEN,
  };
  // Maybe CompletionBlock are not such a grest idea after all...
  return makeLayerProgram(escape, node.kind, node.links, node.variables, []);
  if (node.kind === "script") {
  } else {
    return makeLayerProgram();
  }

  switch (node.type) {
    case "ScriptProgram": {
      const completion = attemptCompletionExpression(node.statements);
      return makeScriptProgram([
        ...map(
          listTrapEffect(context, {
            type: "script.before",
            parameters: reduceEntry(map(programs.script, makeParameterEntry)),
            serial: makeSerialPointSplit(context, serial),
          }),
          makeEffectStatement,
        ),
        ...flatMap(
          enumerate(node.statements.length - (completion === null ? 0 : 1)),
          (index) =>
            instrumentStatement(node.statements[index], {
              ...context,
              path: `${context.path}_${index}_`,
              serial,
            }),
        ),
        ...map(
          listTrapEffect(context, {
            type: "script.after",
            value: instrumentExpression(
              completion === null
                ? makePrimitiveExpression({ undefined: null })
                : completion,
              {
                ...context,
                path: `${context.path}_completion_`,
                serial,
              },
            ),
            serial: makeSerialPointSplit(context, serial),
          }),
          makeEffectStatement,
        ),
      ]);
    }
    case "EvalProgram":
      return makeEvalProgram(
        instrumentBlock(
          node.body,
          {
            ...context,
            path: `${context.path}1`,
            serial,
          },
          {
            type: "eval",
            parameters: programs.eval,
          },
        ),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        node.links,
        instrumentBlock(
          node.body,
          {
            ...context,
            path: `${context.path}1`,
            serial,
          },
          {
            type: "module",
            links: map(node.links, serializeLink),
            parameters: programs.module,
          },
        ),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

/**
 * @type {(
 *   node: Block,
 *   context: Context,
 *   parent: Parent,
 * ) => Block}
 */
const instrumentBlock = (node, context, parent) => {
  const serial = updateSerial(context.serial, node);
  const trap = attemptTrapExpression(
    context,
    makeEnterPoint(node, parent, context, serial),
  );
  const overwritten = {
    ...context.overwritten,
    ...reduceEntry(
      map(parent.parameters, (parameter) => [parameter, trap !== null]),
    ),
  };
  const completion =
    parent.type === "eval"
      ? attemptCompletionExpression(node.statements)
      : null;
  const { parseVariable, parseLabel } = context;
  return makeLayerBlock(
    node.labels,
    node.variables,
    /** @type {[string, Json][]} */ ([
      ...map(node.variables, (variable) => [
        mangleVariableVariable(variable),
        parseVariable(variable),
      ]),
      ...map(node.labels, (label) => [
        mangleLabelVariable(label),
        parseLabel(label),
      ]),
    ]),
    listOptimizeTryStatement(
      [
        ...(trap === null
          ? []
          : [
              makeEffectStatement(
                makeMetaInitializeEffect(mangleParameterVariable(null), trap),
              ),
              ...map(parent.parameters, (parameter) =>
                makeEffectStatement(
                  makeMetaInitializeEffect(
                    mangleParameterVariable(parameter),
                    makeGetExpression(
                      makeMetaReadExpression(mangleParameterVariable(null)),
                      makePrimitiveExpression(parameter),
                    ),
                  ),
                ),
              ),
            ]),
        ...flatMap(
          enumerate(node.statements.length - (completion === null ? 0 : 1)),
          (index) =>
            instrumentStatement(node.statements[index], {
              ...context,
              overwritten,
              path: `${context.path}_${index}_`,
            }),
        ),
        ...map(
          listTrapEffect(
            context,
            parent.type === "eval"
              ? {
                  type: "eval.success",
                  value: instrumentExpression(
                    completion === null
                      ? makePrimitiveExpression({ undefined: null })
                      : completion,
                    {
                      ...context,
                      overwritten,
                      path: `${context.path}_completion_`,
                    },
                  ),
                  serial: makeSerialPointSplit(context, serial),
                }
              : {
                  type: `${parent.type}.success`,
                  serial: makeSerialPointSplit(context, serial),
                },
          ),
          makeEffectStatement,
        ),
      ],
      map(
        listTrapEffect(context, {
          type: `${parent.type}.failure`,
          value: makeParameterExpression("error"),
          serial: makeSerialPointSplit(context, serial),
        }),
        makeEffectStatement,
      ),
      map(
        listTrapEffect(context, {
          type: `${parent.type}.leave`,
          serial: makeSerialPointSplit(context, serial),
        }),
        makeEffectStatement,
      ),
    ),
  );
};

/** @type {(node: Statement, context: Context) => Statement[]} */
const instrumentStatement = (node, context) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(node.effect, {
          ...context,
          serial,
          path: `${context.path}1`,
        }),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(context, {
            type: "return.before",
            value: instrumentExpression(node.value, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
      ];
    case "DeclareEnclaveStatement": {
      return [
        makeDeclareEnclaveStatement(
          node.kind,
          node.variable,
          makeTrapExpression(context, {
            type: "enclave.declare.before",
            kind: node.kind,
            variable: node.variable,
            value: instrumentExpression(node.value, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
        ...map(
          listTrapEffect(context, {
            type: "enclave.declare.after",
            kind: node.kind,
            variable: node.variable,
            serial: makeSerialPointSplit(context, serial),
          }),
          makeEffectStatement,
        ),
      ];
    }
    case "BreakStatement":
      return [
        ...map(
          listTrapEffect(context, {
            type: "break.before",
            label: makeLabelPointSplit(context, node.label),
            serial: makeSerialPointSplit(context, serial),
          }),
          makeEffectStatement,
        ),
      ];
    case "DebuggerStatement": {
      return [
        ...map(
          listTrapEffect(context, {
            type: "debugger.before",
            serial: makeSerialPointSplit(context, serial),
          }),
          makeEffectStatement,
        ),
        node,
        ...map(
          listTrapEffect(context, {
            type: "debugger.after",
            serial: makeSerialPointSplit(context, serial),
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
            blocks.naked,
          ),
        ),
      ];
    case "IfStatement":
      return [
        makeIfStatement(
          makeTrapExpression(context, {
            type: "test.before",
            kind: "if",
            value: instrumentExpression(node.test, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
          instrumentBlock(
            node.then,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            blocks.then,
          ),
          instrumentBlock(
            node.else,
            {
              ...context,
              serial,
              path: `${context.path}3`,
            },
            blocks.else,
          ),
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(context, {
            type: "test.before",
            kind: "while",
            value: instrumentExpression(node.test, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
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
            blocks.try,
          ),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}2`,
            },
            blocks.catch,
          ),
          instrumentBlock(
            node.body,
            {
              ...context,
              serial,
              path: `${context.path}3`,
            },
            blocks.finally,
          ),
        ),
      ];
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/** @type {(node: Effect, context: Context) => Effect[]} */
const instrumentEffect = (node, context) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(context, {
            type: "drop.before",
            value: instrumentExpression(node.discard, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
      ];
    case "WriteEffect":
      return [
        makeBaseWriteEffect(
          node.variable,
          makeTrapExpression(context, {
            type: "write.before",
            variable: makeVariablePointSplit(context, node.variable),
            value: instrumentExpression(node.value, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
      ];
    case "ExportEffect":
      return [
        makeExportEffect(
          node.export,
          makeTrapExpression(context, {
            type: "export.before",
            specifier: node.export,
            value: instrumentExpression(node.value, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
      ];
    case "WriteEnclaveEffect":
      return [
        makeWriteEnclaveEffect(
          node.variable,
          makeTrapExpression(context, {
            type: "enclave.write.before",
            variable: node.variable,
            value: instrumentExpression(node.value, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
        ...listTrapEffect(context, {
          type: "enclave.write.after",
          variable: node.variable,
          serial: makeSerialPointSplit(context, serial),
        }),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/** @type {(node: Expression, context: Context) => Expression} */
export const instrumentExpression = (node, context) => {
  const serial = updateSerial(context.serial, node);
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(context, {
        type: "primitive.after",
        value: unpackPrimitive(node.primitive),
        serial: makeSerialPointSplit(context, serial),
      });
    case "ParameterExpression":
      return makeTrapExpression(context, {
        type: "parameter.after",
        name: node.parameter,
        value: context.overwritten[node.parameter]
          ? makeMetaReadExpression(mangleParameterVariable(node.parameter))
          : node,
        serial: makeSerialPointSplit(context, serial),
      });
    case "IntrinsicExpression":
      return makeTrapExpression(context, {
        type: "intrinsic.after",
        name: node.intrinsic,
        value: node,
        serial: makeSerialPointSplit(context, serial),
      });
    case "ImportExpression":
      return makeTrapExpression(context, {
        type: "import.after",
        source: node.source,
        specifier: node.import,
        value: node,
        serial: makeSerialPointSplit(context, serial),
      });
    case "ReadExpression":
      return makeTrapExpression(context, {
        type: "read.after",
        variable: makeVariablePointSplit(context, node.variable),
        value: makeBaseReadExpression(node.variable),
        serial: makeSerialPointSplit(context, serial),
      });
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, {
          type: "enclave.read.before",
          variable: node.variable,
          serial: makeSerialPointSplit(context, serial),
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, {
          type: "enclave.read.after",
          variable: node.variable,
          value: node,
          serial: makeSerialPointSplit(context, serial),
        }),
      );
    case "TypeofEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, {
          type: "enclave.typeof.before",
          variable: node.variable,
          serial: makeSerialPointSplit(context, serial),
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, {
          type: "enclave.typeof.after",
          variable: node.variable,
          value: node,
          serial: makeSerialPointSplit(context, serial),
        }),
      );
    case "ClosureExpression": {
      const variable = mangleCalleeVariable(context.path);
      const expression = makeTrapExpression(context, {
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
            {
              type: "closure",
              kind: node.kind,
              callee: makeMetaReadExpression(variable),
              parameters: closures[node.kind],
            },
          ),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
      return hasMetaReadExpression([expression], variable)
        ? makeSequenceExpression(
            makeMetaInitializeEffect(variable, expression),
            makeMetaReadExpression(variable),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        instrumentEffect(node.effect, {
          ...context,
          serial,
          path: `${context.path}1`,
        }),
        makeFlipSequenceExpression,
        instrumentExpression(node.value, {
          ...context,
          serial,
          path: `${context.path}2`,
        }),
      );
    case "ConditionalExpression":
      return makeTrapExpression(context, {
        type: "conditional.after",
        value: makeConditionalExpression(
          makeTrapExpression(context, {
            type: "conditional.before",
            value: instrumentExpression(node.condition, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
          instrumentExpression(node.consequent, {
            ...context,
            serial,
            path: `${context.path}2`,
          }),
          instrumentExpression(node.alternate, {
            ...context,
            serial,
            path: `${context.path}3`,
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    case "AwaitExpression":
      return makeTrapExpression(context, {
        type: "await.after",
        value: makeAwaitExpression(
          makeTrapExpression(context, {
            type: "await.before",
            value: instrumentExpression(node.promise, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    case "YieldExpression":
      return makeTrapExpression(context, {
        type: "yield.after",
        delegate: node.delegate,
        value: makeYieldExpression(
          node.delegate,
          makeTrapExpression(context, {
            type: "yield.before",
            delegate: node.delegate,
            value: instrumentExpression(node.item, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    case "EvalExpression":
      return makeTrapExpression(context, {
        type: "eval.after",
        value: makeEvalExpression(
          makeTrapExpression(context, {
            type: "eval.before",
            value: instrumentExpression(node.code, {
              ...context,
              serial,
              path: `${context.path}1`,
            }),
            serial: makeSerialPointSplit(context, serial),
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    case "ApplyExpression":
      return makeTrapExpression(context, {
        type: "apply",
        callee: instrumentExpression(node.callee, {
          ...context,
          serial,
          path: `${context.path}1`,
        }),
        this: instrumentExpression(node.this, {
          ...context,
          serial,
          path: `${context.path}2`,
        }),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(node.arguments[index], {
            ...context,
            serial,
            path: `${context.path}3_${index}`,
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    case "ConstructExpression":
      return makeTrapExpression(context, {
        type: "construct",
        callee: instrumentExpression(node.callee, {
          ...context,
          serial,
          path: `${context.path}1`,
        }),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(node.arguments[index], {
            ...context,
            serial,
            path: `${context.path}2_${index}`,
          }),
        ),
        serial: makeSerialPointSplit(context, serial),
      });
    default:
      throw new StaticError("invalid expression node", node);
  }
};
