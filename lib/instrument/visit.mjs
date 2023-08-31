/* eslint-disable no-use-before-define */

import {
  PARAMETER_ENUM,
  makeApplyExpression,
  makeBreakStatement,
  makeDebuggerStatement,
  makeImportExpression,
  makeIntrinsicExpression,
  makeReadEnclaveExpression,
  makeTypeofEnclaveExpression,
  unpackPrimitive,
} from "../syntax.mjs";

import {
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

import {
  StaticError,
  map,
  flatMap,
  hasOwn,
  reduceReverse,
  enumerate,
} from "../util/index.mjs";

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

const {
  undefined,
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

/** @type {{[K in ClosureKind]: Parameter[]}} */
const closures = {
  arrow: ["arguments"],
  function: ["this", "new.target", "arguments"],
  method: ["this", "arguments"],
  constructor: ["this", "new.target", "arguments"],
};

const OVERWRITTEN = /** @type {Record<Parameter, boolean>} */ (
  reduceEntry(map(PARAMETER_ENUM, (parameter) => [parameter, false]))
);

/** @type {(expression: Expression<Usage>, effect: Effect<Usage>) => Expression<Usage>} */
const makeFlipSequenceExpression = (expression, effect) =>
  makeSequenceExpression(effect, expression);

////////////////
// Build Trap //
////////////////

/**
 * @template S, L, V
 * @typedef {{
 *   pointcut: Pointcut<S, L, V>;
 *   advice: string;
 *   path: string;
 *   inline: {
 *     label: boolean;
 *     serial: boolean;
 *     variable: boolean;
 *   };
 *   stringifyLabel: (variable: L) => string;
 *   stringifyVariable: (variable: V) => string
 * }} TrapContext
 */

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   context: TrapContext<S, L, V>,
 *   point: Point<S, L, V>,
 * ) => Expression<Usage>}
 */
const makeTrapExpression = (context, point) =>
  cut(point, context.pointcut)
    ? makeTriggerExpression(point, context)
    : makeForwardExpression(point);

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   context: TrapContext<S, L, V>,
 *   point: Point<S, L, V>,
 * ) => Effect<Usage>[]}
 */
const listTrapEffect = (context, point) =>
  cut(point, context.pointcut)
    ? [makeExpressionEffect(makeTriggerExpression(point, context))]
    : [];

///////////
// Block //
///////////

/** @type {(parameter: Parameter) => [Expression<Usage>, Expression<Usage>]} */
const makeParameterEntry = (parameter) => [
  makePrimitiveExpression(parameter),
  makeParameterExpression(parameter),
];

/** @type {(parameters: Parameter[]) => Expression<Usage>} */
const makeParameterObjectExpression = (parameters) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [
      makeIntrinsicExpression("Object.prototype"),
      ...flatMap(parameters, makeParameterEntry),
    ],
  );

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ClosureBlock<S>,
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
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint, makeFailurePoint, makeLeavePoint },
) => {
  const enter_point = makeEnterPoint(
    makeParameterObjectExpression(parameters),
    map(node.variables, context.parseVariable),
    node.tag,
  );
  const enter_cut = cut(enter_point, context.pointcut);
  const overwritten = {
    ...context.overwritten,
    ...reduceEntry(map(parameters, (parameter) => [parameter, enter_cut])),
  };
  const completion_point = makeCompletionPoint(
    instrumentExpression(node.completion, {
      ...context,
      path: `${context.path}_completion`,
      overwritten,
    }),
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
    ...(enter_cut
      ? [
          makeEffectStatement(
            makeNewWriteEffect(
              "",
              "parameters",
              makeTriggerExpression(enter_point, context),
              undefined,
            ),
          ),
        ]
      : []),
    ...flatMap(enumerate(node.statements.length), (index) =>
      instrumentStatement(node.statements[index], {
        ...context,
        overwritten,
        path: `${context.path}_${index}`,
      }),
    ),
  ];
  const completion = completion_cut
    ? makeTriggerExpression(completion_point, context)
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
                makeNewWriteEffect("", "completion", completion, undefined),
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
                        ? makeTriggerExpression(failure_point, context)
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
                      makeTriggerExpression(leave_point, context),
                    ),
                  ),
                ]
              : [],
          ),
        ),
      ],
      makeNewReadExpression("", "completion", undefined),
    );
  } else {
    return makeLayerClosureBlock(node.variables, body, completion);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: ControlBlock<S>,
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
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint, makeFailurePoint, makeLeavePoint },
) => {
  const enter_point = makeEnterPoint(
    map(node.labels, context.parseLabel),
    makeParameterObjectExpression(parameters),
    map(node.variables, context.parseVariable),
    node.tag,
  );
  const enter_cut = cut(enter_point, context.pointcut);
  const overwritten = {
    ...context.overwritten,
    ...reduceEntry(map(parameters, (parameter) => [parameter, enter_cut])),
  };
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
    ...(enter_cut
      ? [
          makeEffectStatement(
            makeNewWriteEffect(
              "",
              "parameters",
              makeTriggerExpression(enter_point, context),
              undefined,
            ),
          ),
        ]
      : []),
    ...flatMap(enumerate(node.statements.length), (index) =>
      instrumentStatement(node.statements[index], {
        ...context,
        overwritten,
        path: `${context.path}_${index}`,
      }),
    ),
    ...(completion_cut
      ? [
          makeEffectStatement(
            makeExpressionEffect(
              makeTriggerExpression(completion_point, context),
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
                      ? makeTriggerExpression(failure_point, context)
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
                    makeTriggerExpression(leave_point, context),
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
  context,
  parameters,
  { makeEnterPoint, makeCompletionPoint },
) => {
  const enter_point = makeEnterPoint(
    makeParameterObjectExpression(parameters),
    node.tag,
  );
  const enter_cut = cut(enter_point, context.pointcut);
  const overwritten = {
    ...context.overwritten,
    ...reduceEntry(map(parameters, (parameter) => [parameter, enter_cut])),
  };
  const completion_point = makeCompletionPoint(
    instrumentExpression(node.completion, {
      ...context,
      path: `${context.path}_completion`,
      overwritten,
    }),
    node.tag,
  );
  const completion_cut = cut(completion_point, context.pointcut);
  return makeLayerPseudoBlock(
    context.escape,
    [
      ...(enter_cut
        ? [
            makeEffectStatement(
              makeNewWriteEffect(
                "",
                "parameters",
                makeTriggerExpression(enter_point, context),
                undefined,
              ),
            ),
          ]
        : []),
      ...flatMap(enumerate(node.statements.length), (index) =>
        instrumentStatement(node.statements[index], {
          ...context,
          overwritten,
          path: `${context.path}_${index}`,
        }),
      ),
    ],
    completion_cut
      ? makeTriggerExpression(completion_point, context)
      : makeForwardExpression(completion_point),
  );
};

/////////////
// Program //
/////////////

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Program<S>,
 *   root_context: {
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
export const instrumentProgram = (node, root_context) => {
  const context = {
    ...root_context,
    path: "",
    overwritten: OVERWRITTEN,
  };
  switch (node.type) {
    case "EvalProgram":
      return makeEvalProgram(
        instrumentClosureBlock(
          node.body,
          context,
          ["import", "super.call", "super.get", "super.set"],
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
        instrumentClosureBlock(node.body, context, ["import", "import.meta"], {
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
        }),
      );
    case "ScriptProgram":
      return makeScriptProgram(
        instrumentPseudoBlock(node.body, context, ["import"], {
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
        }),
      );
    default:
      throw new StaticError("invalid program node", node);
  }
};

///////////////
// Statement //
///////////////

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
  while: compileStatementPointMaker("while"),
  try: compileStatementPointMaker("try"),
  catch: compileStatementPointMaker("catch"),
  finally: compileStatementPointMaker("finally"),
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Statement<S>,
 *   context: Context<S, L, V>
 * ) => Statement<Usage>[]}
 */
const instrumentStatement = (node, context) => {
  const { parseLabel } = context;
  switch (node.type) {
    case "EffectStatement":
      return map(
        instrumentEffect(node.inner, {
          ...context,
          path: `${context.path}1`,
        }),
        makeEffectStatement,
      );
    case "ReturnStatement":
      return [
        makeReturnStatement(
          makeTrapExpression(context, {
            type: "return.before",
            value: instrumentExpression(node.result, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
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
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
        ...map(
          listTrapEffect(context, {
            type: "enclave.declare.after",
            kind: node.kind,
            variable: node.variable,
            serial: node.tag,
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
            label: parseLabel(node.label),
            serial: node.tag,
          }),
          makeEffectStatement,
        ),
        makeBreakStatement(node.label),
      ];
    case "DebuggerStatement": {
      return [
        ...map(
          listTrapEffect(context, {
            type: "debugger.before",
            serial: node.tag,
          }),
          makeEffectStatement,
        ),
        makeDebuggerStatement(),
        ...map(
          listTrapEffect(context, {
            type: "debugger.after",
            serial: node.tag,
          }),
          makeEffectStatement,
        ),
      ];
    }
    case "BlockStatement":
      return [
        makeBlockStatement(
          instrumentControlBlock(
            node.body,
            {
              ...context,
              path: `${context.path}1`,
            },
            [],
            makers.naked,
          ),
        ),
      ];
    case "IfStatement":
      return [
        makeIfStatement(
          makeTrapExpression(context, {
            type: "test.before",
            kind: "if",
            value: instrumentExpression(node.if, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
          instrumentControlBlock(
            node.then,
            {
              ...context,
              path: `${context.path}2`,
            },
            [],
            makers.then,
          ),
          instrumentControlBlock(
            node.else,
            {
              ...context,
              path: `${context.path}3`,
            },
            [],
            makers.else,
          ),
        ),
      ];
    case "WhileStatement":
      return [
        makeWhileStatement(
          makeTrapExpression(context, {
            type: "test.before",
            kind: "while",
            value: instrumentExpression(node.while, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
          instrumentControlBlock(
            node.body,
            {
              ...context,
              path: `${context.path}2`,
            },
            [],
            makers.while,
          ),
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          instrumentControlBlock(
            node.try,
            {
              ...context,
              serial,
              path: `${context.path}1`,
            },
            [],
            makers.try,
          ),
          instrumentControlBlock(
            node.catch,
            {
              ...context,
              path: `${context.path}2`,
            },
            ["error"],
            makers.catch,
          ),
          instrumentControlBlock(
            node.finally,
            {
              ...context,
              path: `${context.path}3`,
            },
            [],
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
 *   context: Context<S, L, V>,
 * ) => Effect<Usage>[]}
 */
const instrumentEffect = (node, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "ExpressionEffect":
      return [
        makeExpressionEffect(
          makeTrapExpression(context, {
            type: "drop.before",
            value: instrumentExpression(node.discard, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
      ];
    case "WriteEffect":
      return [
        makeOldWriteEffect(
          node.variable,
          makeTrapExpression(context, {
            type: "write.before",
            variable: parseVariable(node.variable),
            value: instrumentExpression(node.right, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
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
            value: instrumentExpression(node.right, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
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
            value: instrumentExpression(node.right, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
        ...listTrapEffect(context, {
          type: "enclave.write.after",
          variable: node.variable,
          serial: node.tag,
        }),
      ];
    default:
      throw new StaticError("invalid effect node", node);
  }
};

/**
 * @type {<S extends Json, L extends Json, V extends Json>(
 *   node: Expression<S>,
 *   context: Context<S, L, V>,
 * ) => Expression<Usage>}
 */
export const instrumentExpression = (node, context) => {
  const { parseVariable } = context;
  switch (node.type) {
    case "PrimitiveExpression":
      return makeTrapExpression(context, {
        type: "primitive.after",
        value: unpackPrimitive(node.primitive),
        serial: node.tag,
      });
    case "ParameterExpression":
      return makeTrapExpression(context, {
        type: "parameter.after",
        name: node.parameter,
        value: context.overwritten[node.parameter]
          ? makeNewReadExpression("", "parameters", undefined)
          : makeParameterExpression(node.parameter),
        serial: node.tag,
      });
    case "IntrinsicExpression":
      return makeTrapExpression(context, {
        type: "intrinsic.after",
        name: node.intrinsic,
        value: makeIntrinsicExpression(node.intrinsic),
        serial: node.tag,
      });
    case "ImportExpression":
      return makeTrapExpression(context, {
        type: "import.after",
        source: node.source,
        specifier: node.import,
        value: makeImportExpression(node.source, node.import),
        serial: node.tag,
      });
    case "ReadExpression":
      return makeTrapExpression(context, {
        type: "read.after",
        variable: parseVariable(node.variable),
        value: makeOldReadExpression(node.variable),
        serial: node.tag,
      });
    case "ReadEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, {
          type: "enclave.read.before",
          variable: node.variable,
          serial: node.tag,
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, {
          type: "enclave.read.after",
          variable: node.variable,
          value: makeReadEnclaveExpression(node.variable),
          serial: node.tag,
        }),
      );
    case "TypeofEnclaveExpression":
      return reduceReverse(
        listTrapEffect(context, {
          type: "enclave.typeof.before",
          variable: node.variable,
          serial: node.tag,
        }),
        makeFlipSequenceExpression,
        makeTrapExpression(context, {
          type: "enclave.typeof.after",
          variable: node.variable,
          value: makeTypeofEnclaveExpression(node.variable),
          serial: node.tag,
        }),
      );
    case "ClosureExpression": {
      const expression = makeTrapExpression(context, {
        type: "closure.after",
        kind: node.kind,
        asynchronous: node.asynchronous,
        generator: node.generator,
        value: makeClosureExpression(
          node.kind,
          node.asynchronous,
          node.generator,
          instrumentClosureBlock(node.body, context, closures[node.kind], {
            makeEnterPoint: (parameters, variables, serial) => ({
              type: "closure.enter",
              kind: node.kind,
              callee: makeNewReadExpression(context.path, "callee", undefined),
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
          }),
        ),
        serial: node.tag,
      });
      return hasOwn(
        expression.tag,
        makeNewReadExpression(context.path, "callee", undefined).variable,
      )
        ? makeSequenceExpression(
            makeNewWriteEffect(context.path, "callee", expression, undefined),
            makeNewReadExpression(context.path, "callee", undefined),
          )
        : expression;
    }
    case "SequenceExpression":
      return reduceReverse(
        instrumentEffect(node.head, {
          ...context,
          path: `${context.path}1`,
        }),
        makeFlipSequenceExpression,
        instrumentExpression(node.tail, {
          ...context,
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
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
          instrumentExpression(node.consequent, {
            ...context,
            path: `${context.path}2`,
          }),
          instrumentExpression(node.alternate, {
            ...context,
            path: `${context.path}3`,
          }),
        ),
        serial: node.tag,
      });
    case "AwaitExpression":
      return makeTrapExpression(context, {
        type: "await.after",
        value: makeAwaitExpression(
          makeTrapExpression(context, {
            type: "await.before",
            value: instrumentExpression(node.promise, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
        serial: node.tag,
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
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
        serial: node.tag,
      });
    case "EvalExpression":
      return makeTrapExpression(context, {
        type: "eval.after",
        value: makeEvalExpression(
          makeTrapExpression(context, {
            type: "eval.before",
            value: instrumentExpression(node.code, {
              ...context,
              path: `${context.path}1`,
            }),
            serial: node.tag,
          }),
        ),
        serial: node.tag,
      });
    case "ApplyExpression":
      return makeTrapExpression(context, {
        type: "apply",
        callee: instrumentExpression(node.callee, {
          ...context,
          path: `${context.path}1`,
        }),
        this: instrumentExpression(node.this, {
          ...context,
          path: `${context.path}2`,
        }),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(node.arguments[index], {
            ...context,
            path: `${context.path}3_${index}`,
          }),
        ),
        serial: node.tag,
      });
    case "ConstructExpression":
      return makeTrapExpression(context, {
        type: "construct",
        callee: instrumentExpression(node.callee, {
          ...context,
          path: `${context.path}1`,
        }),
        arguments: map(enumerate(node.arguments.length), (index) =>
          instrumentExpression(node.arguments[index], {
            ...context,
            path: `${context.path}2_${index}`,
          }),
        ),
        serial: node.tag,
      });
    default:
      throw new StaticError("invalid expression node", node);
  }
};
