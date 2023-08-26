/* eslint-disable no-use-before-define */

import {
  makeAwaitExpression,
  makeBlockStatement,
  makeClosureExpression,
  makeConditionalExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeEvalExpression,
  makeEvalProgram,
  makeExportEffect,
  makeExpressionEffect,
  makeIfStatement,
  makeModuleProgram,
  makeParameterExpression,
  makePrimitiveExpression,
  makeReturnStatement,
  makeScriptProgram,
  makeSequenceExpression,
  makeTryStatement,
  makeWhileStatement,
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
  makeTransparentBlock,
  hasMetaReadExpression,
  makeMetaReadExpression,
  makeMetaDeclareExpression,
  makeMetaInitializeEffect,
  makeLayerBlock,
  makeBaseReadExpression,
  makeBaseWriteEffect,
} from "./layer.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @typedef {{
 *   path: string,
 *   serial: Json,
 *   pointcut: Pointcut,
 *   advice: string,
 *   enclave: string,
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

/** @type {(parent_serial: Json, node: Node) => Json} */
const updateSerial = (parent_serial, node) =>
  hasOwn(node, "tag") ? /** @type {Json} */ (node.tag) : parent_serial;

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
          makeTransparentBlock(statements1),
          makeTransparentBlock(statements2),
          makeTransparentBlock(statements3),
        ),
      ];

/** @type {(expression: Expression, effect: Effect) => Expression} */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

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

///////////////////////
// Build Point Split //
///////////////////////

/**
 * @type {(
 *   context: {
 *     inline: { serial: boolean },
 *     path: string,
 *   },
 *   serial: Json,
 * ) => PointSplit}
 */
const makeSerialPointSplit = (
  { inline: { serial: inline }, path },
  serial,
) => ({
  static: serial,
  dynamic: inline
    ? makeJsonExpression(serial)
    : makeMetaDeclareExpression(mangleSerialVariable(path), serial),
});

/**
 * @type {(
 *   context: {
 *     inline: { variable: boolean },
 *     parseVariable: (variable: string) => Json,
 *   },
 *   varible: string,
 * ) => PointSplit}
 */
const makeVariablePointSplit = (
  { inline: { variable: inline }, parseVariable },
  variable,
) => {
  const digest_variable = parseVariable(variable);
  return {
    static: digest_variable,
    dynamic: inline
      ? makeJsonExpression(digest_variable)
      : makeMetaReadExpression(mangleVariableVariable(variable)),
  };
};

/**
 * @type {(
 *   context: {
 *     inline: { variable: boolean },
 *     parseLabel: (variable: string) => Json,
 *   },
 *   label: string,
 * ) => PointSplit}
 */
const makeLabelPointSplit = (
  { inline: { variable: inline }, parseLabel },
  label,
) => {
  const digest_label = parseLabel(label);
  return {
    static: digest_label,
    dynamic: inline
      ? makeJsonExpression(digest_label)
      : makeMetaReadExpression(mangleLabelVariable(label)),
  };
};

/** @type {(parameter: Parameter) => [Parameter, Expression]} */
const makeParameterEntry = (parameter) => [
  parameter,
  makeParameterExpression(parameter),
];

////////////////
// Build Trap //
////////////////

/**
 * @type {(
 *   context: {
 *     pointcut: Pointcut,
 *     advice: string,
 *   },
 *   point: Point,
 * ) => Expression | null}
 */
const attemptTrapExpression = ({ pointcut, advice }, point) =>
  cut(pointcut, point) ? makeTriggerExpression(advice, point) : null;

/**
 * @type {(
 *   context: {
 *     pointcut: Pointcut,
 *     advice: string,
 *   },
 *   point: Point,
 * ) => Expression}
 */
const makeTrapExpression = ({ pointcut, advice }, point) =>
  cut(pointcut, point)
    ? makeTriggerExpression(advice, point)
    : makeForwardExpression(point);

/**
 * @type {(
 *   context: {
 *     pointcut: Pointcut,
 *     advice: string,
 *   },
 *   point: Point,
 * ) => Effect[]}
 */
const listTrapEffect = ({ pointcut, advice }, point) =>
  cut(pointcut, point)
    ? [makeExpressionEffect(makeTriggerExpression(advice, point))]
    : [];

/////////////////
// Build Point //
/////////////////

/**
 * @type {(
 *   node: Block,
 *   parent: Parent,
 *   context: {
 *     inline: { variable: boolean, label: boolean, serial: boolean },
 *     parseLabel: (label: string) => Json,
 *     parseVariable: (variable: string) => Json,
 *     path: string,
 *   },
 *   serial: Json,
 * ) => Point}
 */
const makeEnterPoint = (block, parent, context, serial) => {
  switch (parent.type) {
    case "module":
      return {
        type: "module.enter",
        links: parent.links,
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, (variable) =>
          makeVariablePointSplit(context, variable),
        ),
        serial: makeSerialPointSplit(context, serial),
      };
    case "eval":
      return {
        type: "eval.enter",
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, (variable) =>
          makeVariablePointSplit(context, variable),
        ),
        serial: makeSerialPointSplit(context, serial),
      };
    case "block":
      return {
        type: "block.enter",
        kind: parent.kind,
        labels: map(block.labels, (variable) =>
          makeLabelPointSplit(context, variable),
        ),
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, (variable) =>
          makeVariablePointSplit(context, variable),
        ),
        serial: makeSerialPointSplit(context, serial),
      };
    case "closure":
      return {
        type: "closure.enter",
        kind: parent.kind,
        callee: parent.callee,
        parameters: reduceEntry(map(parent.parameters, makeParameterEntry)),
        variables: map(block.variables, (variable) =>
          makeVariablePointSplit(context, variable),
        ),
        serial: makeSerialPointSplit(context, serial),
      };
    default:
      throw new StaticError("invalid parent", parent);
  }
};

////////////////
// Instrument //
////////////////

/** @type {(node: Link) => LinkData} */
const serializeLink = (node) => {
  switch (node.type) {
    case "ImportLink":
      return {
        type: "import",
        import: node.import,
        source: node.source,
      };
    case "ExportLink":
      return {
        type: "export",
        export: node.export,
      };
    case "AggregateLink":
      return {
        type: "aggregate",
        source: node.source,
        import: node.import,
        export: node.export,
      };
    default:
      throw new StaticError("invalid link node", node);
  }
};

/** @type {(node: Program, context: Context) => Program} */
export const instrumentProgram = (node, context) => {
  const serial = updateSerial(context.serial, node);
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
            value: instrumentExpression(node.test, {
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
            value: instrumentExpression(node.value, {
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
            value: instrumentExpression(node.value, {
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
            value: instrumentExpression(node.argument, {
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
