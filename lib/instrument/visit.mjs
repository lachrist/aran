/* eslint-disable no-use-before-define */

import {
  StaticError,
  map,
  flatMap,
  hasOwn,
  reduceReverse,
  enumerate,
} from "../util/index.mjs";

import { PARAMETER_ENUM, unpackPrimitive } from "../syntax.mjs";

import {
  makeApplyExpression,
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeClosureExpression,
  makeConditionalExpression,
  makeDeclareEnclaveStatement,
  makeEffectStatement,
  makeEvalExpression,
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  makeControlBlock,
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

import { makeGetExpression, makeObjectExpression } from "./intrinsic.mjs";

import { cut } from "./cut.mjs";

import { makeForwardExpression } from "./forward.mjs";

import { makeTriggerExpression } from "./trigger.mjs";

import {
  makeNewReadExpression,
  makeOldReadExpression,
  makeNewWriteEffect,
  makeOldWriteEffect,
  makeLayerClosureBlock,
  makeLayerControlBlock,
  makeLayerPseudoBlock,
} from "./layer.mjs";

import {
  COMPLETION_VARIABLE,
  mangleCalleeVariable,
  mangleParameterVariable,
} from "./variable.mjs";

const {
  undefined,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @template S, L, V
 * @typedef {{
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
 * }} Context
 */

///////////
// Other //
///////////

/**
 * @type {{
 *   program: {[K in ProgramKind]: Parameter[]},
 *   closure: {[K in ClosureKind]: Parameter[]},
 *   block: {[K in BlockKind]: Parameter[]},
 * }}
 */
const parameter_mapping = {
  program: {
    eval: ["import", "super.call", "super.get", "super.set"],
    module: ["import", "import.meta"],
    script: ["import"],
  },
  closure: {
    arrow: ["arguments"],
    function: ["this", "new.target", "arguments"],
    method: ["this", "arguments"],
    constructor: ["this", "new.target", "arguments"],
  },
  block: {
    naked: [],
    then: [],
    else: [],
    loop: [],
    try: [],
    catch: ["error"],
    finally: [],
  },
};

/** @type {<X>(x: X) => [x, boolean]} */
const makeTrueEntry = (x) => [x, true];

/** @type {<X>(x: X) => [x, boolean]} */
const makeFalseEntry = (x) => [x, false];

const OVERWRITTEN = /** @type {Record<Parameter, boolean>} */ (
  reduceEntry(map(PARAMETER_ENUM, makeFalseEntry))
);

/** @type {(expression: Expression<Usage>, effect: Effect<Usage>) => Expression<Usage>} */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

/** @type {(parameter: Parameter) => [Expression<Usage>, Expression<Usage>]} */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeParameterExpression(parameter),
];

/** @type {(parameters: Parameter[]) => Expression<Usage>} */
const makeParameterObjectExpression = (parameters) =>
  makeObjectExpression(
    makePrimitiveExpression("Object.prototype"),
    map(parameters, makeParameterEntry),
  );

/**
 * @type {(
 *   overwritten: Record<Parameter, boolean>,
 *   parameters: Parameter[],
 *   triggered: boolean,
 * ) => Record<Parameter, boolean>}
 */
const updateOverwritten = (overwritten, parameters, triggered) => ({
  ...overwritten,
  ...reduceEntry(map(parameters, triggered ? makeTrueEntry : makeFalseEntry)),
});

////////////////
// Build Trap //
////////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Expression<Usage>}
 */
const makeTrapExpression = (point, path, context) =>
  cut(point, context.pointcut)
    ? makeTriggerExpression(point, path, context)
    : makeForwardExpression(point);

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Effect<Usage>[]}
 */
const listTrapEffect = (point, path, context) =>
  cut(point, context.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, path, context))]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 * ) => Statement<Usage>[]}
 */
const listTrapStatement = (point, path, context) =>
  cut(point, context.pointcut)
    ? [
        makeEffectStatement(
          makeExpressionEffect(makeTriggerExpression(point, path, context)),
        ),
      ]
    : [];

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   point: Point<S, L, V>,
 *   path: string,
 *   context: Context<S, L, V>,
 *   parameters: Parameter[],
 * ) => Statement<Usage>[]}
 */
const listEnterTrapStatement = (point, path, context, parameters) => {
  if (cut(point, context.pointcut)) {
    const right = makeTriggerExpression(point, path, context);
    if (parameters.length === 0) {
      return [makeEffectStatement(makeExpressionEffect(right))];
    } else if (parameters.length === 1) {
      const parameter = parameters[0];
      return [
        makeEffectStatement(
          makeNewWriteEffect(
            mangleParameterVariable(parameter),
            makeGetExpression(right, makePrimitiveExpression(parameter)),
            undefined,
          ),
        ),
      ];
    } else {
      return [
        makeEffectStatement(
          makeNewWriteEffect(mangleParameterVariable(null), right, undefined),
        ),
        ...map(parameters, (parameter) =>
          makeEffectStatement(
            makeNewWriteEffect(
              mangleParameterVariable(parameter),
              makeGetExpression(
                makeNewReadExpression(mangleParameterVariable(null), undefined),
                makePrimitiveExpression(parameter),
              ),
              undefined,
            ),
          ),
        ),
      ];
    }
  } else {
    return [];
  }
};

///////////
// Block //
///////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ClosureBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parameters: Parameter[],
 *   makers: {
 *     makeEnterPoint: (parameters: Expression<Usage>, variables: V[], serial: S) => Point<S, L, V>,
 *     makeCompletionPoint: (completion: Expression<Usage>, serial: S) => Point<S, L, V>,
 *     makeFailurePoint: (failure: Expression<Usage>, serial: S) => Point<S, L, V>,
 *     makeLeavePoint: (serial: S) => Point<S, L, V>,
 *   }
 * ) => ClosureBlock<Usage>}
 */
const instrumentClosureBlock = (
  node,
  path,
  old_overwritten,
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint, makeFailurePoint, makeLeavePoint },
) => {
  const enter_statement_array = listEnterTrapStatement(
    makeEnterPoint(
      makeParameterObjectExpression(parameters),
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  const completion_point = makeCompletionPoint(
    instrumentExpression(
      node.completion,
      `${path}_completion`,
      new_overwritten,
      context,
    ),
    node.tag,
  );
  const completion_cut = cut(completion_point, context.pointcut);
  const failure_point = makeFailurePoint(
    makeParameterExpression("error"),
    node.tag,
  );
  const failure_cut = cut(failure_point, context.pointcut);
  const leave_point = makeLeavePoint(node.tag);
  const leave_cut = cut(leave_point, context.pointcut);
  const body = [
    ...enter_statement_array,
    ...flatMap(enumerate(node.statements.length), (index) =>
      instrumentStatement(
        node.statements[index],
        `${path}_${index}`,
        new_overwritten,
        context,
      ),
    ),
  ];
  const completion = completion_cut
    ? makeTriggerExpression(completion_point, path, context)
    : makeForwardExpression(completion_point);
  if (failure_cut || leave_cut) {
    return makeLayerClosureBlock(
      node.variables,
      [
        makeTryStatement(
          makeControlBlock(
            [],
            [],
            [
              ...body,
              makeEffectStatement(
                makeNewWriteEffect(COMPLETION_VARIABLE, completion, undefined),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            [
              makeEffectStatement(
                makeExpressionEffect(
                  makeApplyExpression(
                    makeIntrinsicExpression("aran.throw"),
                    makePrimitiveExpression({ undefined: null }),
                    [
                      failure_cut
                        ? makeTriggerExpression(failure_point, path, context)
                        : makeParameterExpression("error"),
                    ],
                  ),
                ),
              ),
            ],
          ),
          makeControlBlock(
            [],
            [],
            leave_cut
              ? [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeTriggerExpression(leave_point, path, context),
                    ),
                  ),
                ]
              : [],
          ),
        ),
      ],
      makeNewReadExpression(COMPLETION_VARIABLE, undefined),
    );
  } else {
    return makeLayerClosureBlock(node.variables, body, completion);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ControlBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parameters: Parameter[],
 *   makers: {
 *     makeEnterPoint: (labels: L[], parameters: Expression<Usage>, variables: V[], serial: S) => Point<S, L, V>,
 *     makeCompletionPoint: (serial: S) => Point<S, L, V>,
 *     makeFailurePoint: (failure: Expression<Usage>, serial: S) => Point<S, L, V>,
 *     makeLeavePoint: (serial: S) => Point<S, L, V>,
 *   }
 * ) => ControlBlock<Usage>}
 */
const instrumentControlBlock = (
  node,
  path,
  old_overwritten,
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint, makeFailurePoint, makeLeavePoint },
) => {
  const enter_statement_array = listEnterTrapStatement(
    makeEnterPoint(
      map(node.labels, context.parseLabel),
      makeParameterObjectExpression(parameters),
      map(node.variables, context.parseVariable),
      node.tag,
    ),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  const completion_point = makeCompletionPoint(node.tag);
  const completion_cut = cut(completion_point, context.pointcut);
  const failure_point = makeFailurePoint(
    makeParameterExpression("error"),
    node.tag,
  );
  const failure_cut = cut(failure_point, context.pointcut);
  const leave_point = makeLeavePoint(node.tag);
  const leave_cut = cut(leave_point, context.pointcut);
  const body = [
    ...enter_statement_array,
    ...flatMap(enumerate(node.statements.length), (index) =>
      instrumentStatement(
        node.statements[index],
        `${path}_${index}`,
        new_overwritten,
        context,
      ),
    ),
    ...(completion_cut
      ? [
          makeEffectStatement(
            makeExpressionEffect(
              makeTriggerExpression(completion_point, path, context),
            ),
          ),
        ]
      : []),
  ];
  if (failure_cut || leave_cut) {
    return makeLayerControlBlock(node.labels, node.variables, [
      makeTryStatement(
        makeControlBlock([], [], body),
        makeControlBlock(
          [],
          [],
          [
            makeEffectStatement(
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("aran.throw"),
                  makePrimitiveExpression({ undefined: null }),
                  [
                    failure_cut
                      ? makeTriggerExpression(failure_point, path, context)
                      : makeParameterExpression("error"),
                  ],
                ),
              ),
            ),
          ],
        ),
        makeControlBlock(
          [],
          [],
          leave_cut
            ? [
                makeEffectStatement(
                  makeExpressionEffect(
                    makeTriggerExpression(leave_point, path, context),
                  ),
                ),
              ]
            : [],
        ),
      ),
    ]);
  } else {
    return makeLayerControlBlock(node.labels, node.variables, body);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: PseudoBlock<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>,
 *   parameters: Parameter[],
 *   makers: {
 *     makeEnterPoint: (parameters: Expression<Usage>, serial: S) => Point<S, L, V>,
 *     makeCompletionPoint: (completion: Expression<Usage>, serial: S) => Point<S, L, V>,
 *   }
 * ) => PseudoBlock<Usage>}
 */
const instrumentPseudoBlock = (
  node,
  path,
  old_overwritten,
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint },
) => {
  const enter_statement_array = listEnterTrapStatement(
    makeEnterPoint(makeParameterObjectExpression(parameters), node.tag),
    path,
    context,
    parameters,
  );
  const new_overwritten = updateOverwritten(
    old_overwritten,
    parameters,
    enter_statement_array.length > 0,
  );
  const completion_point = makeCompletionPoint(
    instrumentExpression(
      node.completion,
      `${path}_completion`,
      new_overwritten,
      context,
    ),
    node.tag,
  );
  const completion_cut = cut(completion_point, context.pointcut);
  return makeLayerPseudoBlock(
    context.escape,
    [
      ...enter_statement_array,
      ...flatMap(enumerate(node.statements.length), (index) =>
        instrumentStatement(
          node.statements[index],
          `${path}_${index}`,
          new_overwritten,
          context,
        ),
      ),
    ],
    completion_cut
      ? makeTriggerExpression(completion_point, path, context)
      : makeForwardExpression(completion_point),
  );
};

/////////////
// Program //
/////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Program<S>,
 *   context: Context<S, L, V>,
 * ) => Program<Usage>}
 */
export const instrumentProgram = (node, context) => {
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        instrumentClosureBlock(
          node.body,
          "",
          OVERWRITTEN,
          context,
          parameter_mapping.program.eval,
          {
            makeEnterPoint: (parameters, variables, serial) => ({
              type: "program.enter",
              kind: "eval",
              links: [],
              parameters,
              variables,
              serial,
            }),
            makeCompletionPoint: (completion, serial) => ({
              type: "program.completion",
              kind: "eval",
              value: completion,
              serial,
            }),
            makeFailurePoint: (failure, serial) => ({
              type: "program.failure",
              kind: "eval",
              value: failure,
              serial,
            }),
            makeLeavePoint: (serial) => ({
              type: "program.leave",
              kind: "eval",
              serial,
            }),
          },
        ),
      );
    case "ModuleProgram":
      return makeModuleProgram(
        node.links,
        instrumentClosureBlock(
          node.body,
          "",
          OVERWRITTEN,
          context,
          parameter_mapping.program.module,
          {
            makeEnterPoint: (parameters, variables, serial) => ({
              type: "program.enter",
              kind: "module",
              links: node.links,
              parameters,
              variables,
              serial,
            }),
            makeCompletionPoint: (completion, serial) => ({
              type: "program.completion",
              kind: "module",
              value: completion,
              serial,
            }),
            makeFailurePoint: (failure, serial) => ({
              type: "program.failure",
              kind: "module",
              value: failure,
              serial,
            }),
            makeLeavePoint: (serial) => ({
              type: "program.leave",
              kind: "module",
              serial,
            }),
          },
        ),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        instrumentPseudoBlock(
          node.body,
          "",
          OVERWRITTEN,
          context,
          parameter_mapping.program.script,
          {
            makeEnterPoint: (parameters, serial) => ({
              type: "program.enter",
              kind: "script",
              links: [],
              parameters,
              variables: [],
              serial,
            }),
            makeCompletionPoint: (completion, serial) => ({
              type: "program.completion",
              kind: "script",
              value: completion,
              serial,
            }),
          },
        ),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

///////////////
// Statement //
///////////////

/**
 * @type {(
 *   kind: BlockKind,
 * ) => {
 *   makeEnterPoint: <S extends Json, L extends Json, V extends Json>(
 *     labels: L[],
 *     parameters: Expression<Usage>,
 *     variables: V[],
 *     serial: S
 *   ) => Point<S, L, V>,
 *   makeCompletionPoint: <S extends Json, L extends Json, V extends Json>(serial: S) => Point<S, L, V>,
 *   makeFailurePoint: <S extends Json, L extends Json, V extends Json>(failure: Expression<Usage>, serial: S) => Point<S, L, V>,
 *   makeLeavePoint: <S extends Json, L extends Json, V extends Json>(serial: S) => Point<S, L, V>,
 * }}
 */
const compileStatementPointMaker = (kind) => ({
  makeEnterPoint: (labels, parameters, variables, serial) => ({
    type: "block.enter",
    kind,
    labels,
    parameters,
    variables,
    serial,
  }),
  makeCompletionPoint: (serial) => ({
    type: "block.completion",
    kind,
    serial,
  }),
  makeFailurePoint: (failure, serial) => ({
    type: "block.failure",
    kind,
    value: failure,
    serial,
  }),
  makeLeavePoint: (serial) => ({
    type: "block.leave",
    kind,
    serial,
  }),
});

const makers = {
  naked: compileStatementPointMaker("naked"),
  then: compileStatementPointMaker("then"),
  else: compileStatementPointMaker("else"),
  loop: compileStatementPointMaker("loop"),
  try: compileStatementPointMaker("try"),
  catch: compileStatementPointMaker("catch"),
  finally: compileStatementPointMaker("finally"),
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Statement<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>
 * ) => Statement<Usage>[]}
 */
const instrumentStatement = (node, path, overwritten, context) => {
  const { parseLabel } = context;
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(node.inner, `${path}1`, overwritten, context),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(
            {
              type: "return.before",
              value: instrumentExpression(
                node.result,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
      ];
    case "DeclareEnclaveStatement": {
      return [
        makeDeclareEnclaveStatement(
          node.kind,
          node.variable,
          makeTrapExpression(
            {
              type: "enclave.declare.before",
              kind: node.kind,
              variable: node.variable,
              value: instrumentExpression(
                node.value,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
        ...listTrapStatement(
          {
            type: "enclave.declare.after",
            kind: node.kind,
            variable: node.variable,
            serial: node.tag,
          },
          path,
          context,
        ),
      ];
    }
    case "BreakStatement":
      return [
        ...map(
          listTrapEffect(
            {
              type: "break.before",
              label: parseLabel(node.label),
              serial: node.tag,
            },
            path,
            context,
          ),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      ];
    case "DebuggerStatement": {
      return [
        ...listTrapStatement(
          {
            type: "debugger.before",
            serial: node.tag,
          },
          path,
          context,
        ),
        makeDebuggerStatement(),
        ...map(
          listTrapEffect(
            {
              type: "debugger.after",
              serial: node.tag,
            },
            path,
            context,
          ),
          makeEffectStatement,
        ),
      ];
    }
    case "BlockStatement":
      return [
        makeBlockStatement(
          instrumentControlBlock(
            node.do,
            `${path}1`,
            overwritten,
            context,
            parameter_mapping.block.naked,
            makers.naked,
          ),
        ),
      ];
    case "IfStatement":
      return [
        makeIfStatement(
          makeTrapExpression(
            {
              type: "test.before",
              kind: "if",
              value: instrumentExpression(
                node.if,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
          instrumentControlBlock(
            node.then,
            `${path}2`,
            overwritten,
            context,
            parameter_mapping.block.then,
            makers.then,
          ),
          instrumentControlBlock(
            node.else,
            `${path}3`,
            overwritten,
            context,
            parameter_mapping.block.else,
            makers.else,
          ),
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(
            {
              type: "test.before",
              kind: "while",
              value: instrumentExpression(
                node.while,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
          instrumentControlBlock(
            node.do,
            `${path}2`,
            overwritten,
            context,
            parameter_mapping.block.loop,
            makers.loop,
          ),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          instrumentControlBlock(
            node.try,
            `${path}1`,
            overwritten,
            context,
            parameter_mapping.block.try,
            makers.try,
          ),
          instrumentControlBlock(
            node.catch,
            `${path}2`,
            overwritten,
            context,
            parameter_mapping.block.catch,
            makers.catch,
          ),
          instrumentControlBlock(
            node.finally,
            `${path}3`,
            overwritten,
            context,
            parameter_mapping.block.finally,
            makers.finally,
          ),
        ),
      ];
    default:
      throw new StaticError("invalid statement node", node);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Effect<S>,
 *   path: string,
 *   overwritten: Record<Parameter, boolean>,
 *   context: Context<S, L, V>
 * ) => Effect<Usage>[]}
 */
const instrumentEffect = (node, path, overwritten, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(
            {
              type: "drop.before",
              value: instrumentExpression(
                node.discard,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
      ];
    case "WriteEffect":
      return [
        makeOldWriteEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "write.before",
              variable: parseVariable(node.variable),
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
      ];
    case "ExportEffect":
      return [
        makeExportEffect(
          node.export,
          makeTrapExpression(
            {
              type: "export.before",
              specifier: node.export,
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
      ];
    case "WriteEnclaveEffect":
      return [
        makeWriteEnclaveEffect(
          node.variable,
          makeTrapExpression(
            {
              type: "enclave.write.before",
              variable: node.variable,
              value: instrumentExpression(
                node.right,
                `${path}1`,
                overwritten,
                context,
              ),
              serial: node.tag,
            },
            path,
            context,
          ),
        ),
        ...listTrapEffect(
          {
            type: "enclave.write.after",
            variable: node.variable,
            serial: node.tag,
          },
          path,
          context,
        ),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

// /**
//  * @type {<S extends Json, L extends Json, V extends Json>(
//  *   node: Expression<S>,
//  *   path: string,
//  *   overwritten: Record<Parameter, boolean>,
//  *   context: Context<S, L, V>
//  * ) => Expression<Usage>}
//  */

/**
 * @template {Json} S
 * @template {Json} L
 * @template {Json} V
 * @param {Expression<S>} node
 * @param {string} path
 * @param {Record<Parameter, boolean>} overwritten
 * @param {Context<S, L, V>} context
 * @returns {Expression<Usage>}
 */
export const instrumentExpression = (node, path, overwritten, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(
        {
          type: "primitive.after",
          value: unpackPrimitive(node.primitive),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ParameterExpression":
      return makeTrapExpression(
        {
          type: "parameter.after",
          name: node.parameter,
          value: overwritten[node.parameter]
            ? makeNewReadExpression(
                mangleParameterVariable(node.parameter),
                undefined,
              )
            : makeParameterExpression(node.parameter),
          serial: node.tag,
        },
        path,
        context,
      );
    case "IntrinsicExpression":
      return makeTrapExpression(
        {
          type: "intrinsic.after",
          name: node.intrinsic,
          value: makeIntrinsicExpression(node.intrinsic),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ImportExpression":
      return makeTrapExpression(
        {
          type: "import.after",
          source: node.source,
          specifier: node.import,
          value: makeImportExpression(node.source, node.import),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ReadExpression":
      return makeTrapExpression(
        {
          type: "read.after",
          variable: parseVariable(node.variable),
          value: makeOldReadExpression(node.variable),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          /** @type {Point<S, L, V>} */ ({
            type: "enclave.read.before",
            variable: node.variable,
            serial: node.tag,
          }),
          path,
          context,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          /** @type {Point<S, L, V>} */ ({
            type: "enclave.read.after",
            variable: node.variable,
            value: makeReadEnclaveExpression(node.variable),
            serial: node.tag,
          }),
          path,
          context,
        ),
      );
    case "TypeofEnclaveExpression":
      return reduceReverse(
        listTrapEffect(
          /** @type {Point<S, L, V>} */ ({
            type: "enclave.typeof.before",
            variable: node.variable,
            serial: node.tag,
          }),
          path,
          context,
        ),
        makeFlipSequenceExpression,
        makeTrapExpression(
          /** @type {Point<S, L, V>} */ ({
            type: "enclave.typeof.after",
            variable: node.variable,
            value: makeTypeofEnclaveExpression(node.variable),
            serial: node.tag,
          }),
          path,
          context,
        ),
      );
    case "ClosureExpression": {
      const variable = mangleCalleeVariable(path);
      const expression = makeTrapExpression(
        {
          type: "closure.after",
          kind: node.kind,
          asynchronous: node.asynchronous,
          generator: node.generator,
          value: makeClosureExpression(
            node.kind,
            node.asynchronous,
            node.generator,
            instrumentClosureBlock(
              node.body,
              `${path}1`,
              overwritten,
              context,
              parameter_mapping.closure[node.kind],
              {
                makeEnterPoint: (parameters, variables, serial) => ({
                  type: "closure.enter",
                  kind: node.kind,
                  callee: makeNewReadExpression(variable, undefined),
                  parameters,
                  variables,
                  serial,
                }),
                makeCompletionPoint: (completion, serial) => ({
                  type: "closure.completion",
                  kind: node.kind,
                  value: completion,
                  serial,
                }),
                makeFailurePoint: (failure, serial) => ({
                  type: "closure.failure",
                  kind: node.kind,
                  value: failure,
                  serial,
                }),
                makeLeavePoint: (serial) => ({
                  type: "closure.leave",
                  kind: node.kind,
                  serial,
                }),
              },
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
      return hasOwn(
        expression.tag,
        makeNewReadExpression(variable, undefined).variable,
      )
        ? makeSequenceExpression(
            makeNewWriteEffect(variable, expression, undefined),
            makeNewReadExpression(variable, undefined),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        instrumentEffect(node.head, `${path}1`, overwritten, context),
        makeFlipSequenceExpression,
        instrumentExpression(node.tail, `${path}2`, overwritten, context),
      );
    case "ConditionalExpression":
      return makeTrapExpression(
        {
          type: "conditional.after",
          value: makeConditionalExpression(
            makeTrapExpression(
              {
                type: "conditional.before",
                value: instrumentExpression(
                  node.condition,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
            instrumentExpression(
              node.consequent,
              `${path}2`,
              overwritten,
              context,
            ),
            instrumentExpression(
              node.alternate,
              `${path}3`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "AwaitExpression":
      return makeTrapExpression(
        {
          type: "await.after",
          value: makeAwaitExpression(
            makeTrapExpression(
              {
                type: "await.before",
                value: instrumentExpression(
                  node.promise,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "YieldExpression":
      return makeTrapExpression(
        {
          type: "yield.after",
          delegate: node.delegate,
          value: makeYieldExpression(
            node.delegate,
            makeTrapExpression(
              {
                type: "yield.before",
                delegate: node.delegate,
                value: instrumentExpression(
                  node.item,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "EvalExpression":
      return makeTrapExpression(
        {
          type: "eval.after",
          value: makeEvalExpression(
            makeTrapExpression(
              {
                type: "eval.before",
                value: instrumentExpression(
                  node.code,
                  `${path}1`,
                  overwritten,
                  context,
                ),
                serial: node.tag,
              },
              path,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ApplyExpression":
      return makeTrapExpression(
        {
          type: "apply",
          callee: instrumentExpression(
            node.callee,
            `${path}1`,
            overwritten,
            context,
          ),
          this: instrumentExpression(
            node.this,
            `${path}2`,
            overwritten,
            context,
          ),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}3_${index}`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    case "ConstructExpression":
      return makeTrapExpression(
        {
          type: "construct",
          callee: instrumentExpression(
            node.callee,
            `${path}1`,
            overwritten,
            context,
          ),
          arguments: map(enumerate(node.arguments.length), (index) =>
            instrumentExpression(
              node.arguments[index],
              `${path}2_${index}`,
              overwritten,
              context,
            ),
          ),
          serial: node.tag,
        },
        path,
        context,
      );
    default:
      throw new StaticError("invalid expression node", node);
  }
};
