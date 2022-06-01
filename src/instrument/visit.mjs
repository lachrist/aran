/* eslint-disable no-use-before-define */

import {includes, forEach, map, concat, filter, flatMap} from "array-lite";

import {
  partialx_,
  partialxx_,
  partialx_xx,
  partial__xx,
  partialxx_x,
  deadcode,
  constant,
  incrementCounter,
} from "../util/index.mjs";

import {
  matchNode,
  dispatchNode,
  makeBlock,
  makeModuleProgram,
  makeGlobalEvalProgram,
  makeExternalLocalEvalProgram,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeDeclareStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeInputExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeImportExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeApplyExpression,
} from "../ast/index.mjs";

import {makeJSONExpression, makeGetGlobalExpression} from "../intrinsic.mjs";

import {
  extendScope,
  makeScopeBlock,
  makeScopeInternalLocalEvalProgram,
  makeScopeScriptProgram,
} from "./scope.mjs";

import {
  VAR_SPLIT,
  LAB_SPLIT,
  NEW_SPLIT,
  OLD_SPLIT,
  declareSplitScope,
  isSplitScopeUsed,
  useSplitScope,
  makeSplitScopeWriteEffect,
  makeSplitScopeReadExpression,
  makeSplitScopeEvalExpression,
} from "./split.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

const {undefined, String} = globalThis;

const returnNull = constant(null);

const declareSplitScopeMangled = (scope, split, variable, unmangle) => {
  declareSplitScope(scope, split, variable, unmangle(variable));
};

const makeMangleInitializeStatement = (scope, split, variable, unmangle) =>
  makeEffectStatement(
    makeSplitScopeWriteEffect(
      scope,
      split,
      variable,
      makeJSONExpression(unmangle(variable)),
    ),
  );

// ////////////////
// // Initialize //
// ////////////////
//
// export const makeInitializeExpression = (
//   {unmangleVariable, unmangleLabel},
//   variable,
// ) => {
//   if (isLabVariable(variable)) {
//     return makeJSONExpression(
//       unmangleLabel(getVariableBody(variable)),
//     );
//   }
//   if (isVarVariable(variable)) {
//     return makeJSONExpression(
//       unmangleVariable(getVariableBody(variable)),
//     );
//   }
//   /* c8 ignore start */
//   throw new Error("could not initialize variable");
//   /* c8 ignore stop */
// };
//
// const makeInitializeStatement = (context, variable) =>
//   makeEffectStatement(
//     makeScopeInitializeEffect(
//       context.scope,
//       variable,
//       makeInitializeExpression(context, variable),
//     ),
//   );

////////////////////////////////////
// makeOptimizedTryStatementArray //
////////////////////////////////////

const returnTrue = constant(true);

const throw_error_expression_pattern = [
  "ApplyExpression",
  ["IntrinsicExpression", "aran.throw", returnTrue],
  ["LiteralExpression", undefined, returnTrue],
  [
    [
      "ApplyExpression",
      ["IntrinsicExpression", "aran.get", returnTrue],
      ["LiteralExpression", undefined, returnTrue],
      [
        ["InputExpression", returnTrue],
        ["LiteralExpression", "error", returnTrue],
      ],
      returnTrue,
    ],
  ],
  returnTrue,
];

const throw_error_statement_array_pattern = [
  [
    "EffectStatement",
    ["ExpressionEffect", throw_error_expression_pattern, returnTrue],
    returnTrue,
  ],
];

const throw_return_error_statement_array_pattern = [
  ["ReturnStatement", throw_error_expression_pattern, returnTrue],
];

const makeOptimizedTryStatementArray = (
  closed,
  statements1,
  statements2,
  statements3,
) =>
  matchNode(
    null,
    statements2,
    closed
      ? throw_return_error_statement_array_pattern
      : throw_error_statement_array_pattern,
  ) && statements3.length === 0
    ? statements1
    : [
        makeTryStatement(
          makeBlock([], [], statements1),
          makeBlock([], [], statements2),
          makeBlock([], [], statements3),
        ),
      ];

//////////
// Link //
//////////

export const jsonifyLink = partialx_xx(
  dispatchNode,
  null,
  {
    __proto__: null,
    ImportLink: (_context, source, specifier, _serial) => ({
      type: "import",
      source,
      import: specifier,
    }),
    ExportLink: (_context, specifier, _serial) => ({
      type: "export",
      export: specifier,
    }),
    AggregateLink: (_context, source, specifier1, specifier2, _serial) => ({
      type: "aggregate",
      source,
      import: specifier1,
      export: specifier2,
    }),
  },
  deadcode("unexpected link type"),
);

/////////////
// Program //
/////////////

export const visitProgram = partial__xx(
  dispatchNode,
  {
    __proto__: null,
    ScriptProgram: (context, statements1, serial) => {
      const namespace = `namespace${String(incrementCounter(context.counter))}`;
      declareSplitScope(context.scope, NEW_SPLIT, namespace, null);
      const statements2 = concat(
        makeTrapStatementArray(
          context.pointcut,
          namespace,
          context.scope,
          "arrival",
          "script",
          null,
          null,
          serial,
        ),
        flatMap(
          statements1,
          partialx_(visitStatement, {
            ...context,
            namespace,
          }),
        ),
      );
      return makeScopeScriptProgram(
        context.scope,
        concat(
          isSplitScopeUsed(context.scope, NEW_SPLIT, namespace)
            ? [
                makeEffectStatement(
                  makeSplitScopeWriteEffect(
                    context.scope,
                    NEW_SPLIT,
                    namespace,
                    makeGetGlobalExpression(context.global),
                  ),
                ),
              ]
            : [],
          statements2,
        ),
      );
    },
    ModuleProgram: (context, links, block, serial) =>
      makeModuleProgram(
        links,
        visitBlock(
          {
            ...context,
            kind: "module",
            arrival: {
              kind: "module",
              links: map(links, jsonifyLink),
              callee: null,
              serial,
            },
          },
          block,
        ),
      ),
    GlobalEvalProgram: (context, block, serial) =>
      makeGlobalEvalProgram(
        visitBlock(
          {
            ...context,
            kind: "global-eval",
            arrival: {
              kind: "global-eval",
              links: null,
              callee: null,
              serial,
            },
          },
          block,
        ),
      ),
    InternalLocalEvalProgram: (context, variables, block, serial) => {
      const scope = extendScope(context.scope);
      forEach(
        variables,
        partialxx_x(declareSplitScopeMangled, scope, OLD_SPLIT, returnNull),
      );
      forEach(variables, partialxx_(useSplitScope, scope, OLD_SPLIT));
      forEach(
        variables,
        partialxx_x(
          declareSplitScopeMangled,
          scope,
          VAR_SPLIT,
          context.unmangleVariable,
        ),
      );
      return makeScopeInternalLocalEvalProgram(
        scope,
        visitBlock(
          {
            ...context,
            scope,
            kind: "local-eval",
            arrival: {
              kind: "local-eval",
              links: null,
              callee: null,
              serial,
            },
          },
          block,
        ),
      );
    },
    ExternalLocalEvalProgram: (context, enclaves, block, serial) =>
      makeExternalLocalEvalProgram(
        enclaves,
        visitBlock(
          {
            ...context,
            kind: "enclave-eval",
            arrival: {
              kind: "enclave-eval",
              links: null,
              callee: null,
              serial,
            },
          },
          block,
        ),
      ),
  },
  deadcode("unexpected program type"),
);

///////////
// Block //
///////////

const closed_kind_array = [
  "eval",
  "module",
  "arrow",
  "function",
  "method",
  "constructor",
];

const root_kind_array = [
  "script",
  "module",
  "global-eval",
  "local-eval",
  "enclave-eval",
];

export const visitBlock = partial__xx(
  dispatchNode,
  {
    __proto__: null,
    Block: (context, labels, variables, statements, serial) => {
      const scope = extendScope(context.scope);
      forEach(
        labels,
        partialxx_x(
          declareSplitScopeMangled,
          scope,
          LAB_SPLIT,
          context.unmangleLabel,
        ),
      );
      forEach(
        variables,
        partialxx_x(
          declareSplitScopeMangled,
          scope,
          VAR_SPLIT,
          context.unmangleVariable,
        ),
      );
      forEach(
        variables,
        partialxx_x(declareSplitScopeMangled, scope, OLD_SPLIT, returnNull),
      );
      forEach(variables, partialxx_(useSplitScope, scope, OLD_SPLIT));
      if (includes(root_kind_array, context.kind)) {
        const namespace = `namespace${String(
          incrementCounter(context.counter),
        )}`;
        context = {...context, namespace};
        declareSplitScope(scope, NEW_SPLIT, namespace, null);
      }
      const closed = includes(closed_kind_array, context.kind);
      const enter_statements = makeTrapStatementArray(
        context.pointcut,
        context.namespace,
        scope,
        "enter",
        context.kind,
        labels,
        variables,
        serial,
      );
      const visited_statements = flatMap(
        statements,
        partialx_(visitStatement, {
          ...context,
          scope,
          arrival: null,
          kind: null,
        }),
      );
      const completion_statements = closed
        ? []
        : makeTrapStatementArray(
            context.pointcut,
            context.namespace,
            scope,
            "completion",
            serial,
          );
      const failure_expression = makeApplyExpression(
        makeIntrinsicExpression("aran.throw"),
        makeLiteralExpression({undefined: null}),
        [
          makeTrapExpression(
            context.pointcut,
            context.namespace,
            scope,
            "failure",
            makeApplyExpression(
              makeIntrinsicExpression("aran.get"),
              makeLiteralExpression({undefined: null}),
              [makeInputExpression(), makeLiteralExpression("error")],
            ),
            serial,
          ),
        ],
      );
      const failure_statements = [
        closed
          ? makeReturnStatement(failure_expression)
          : makeEffectStatement(makeExpressionEffect(failure_expression)),
      ];
      const leave_statements = makeTrapStatementArray(
        context.pointcut,
        context.namespace,
        scope,
        "leave",
        serial,
      );
      return makeScopeBlock(
        scope,
        labels,
        concat(
          includes(root_kind_array, context.kind) &&
            isSplitScopeUsed(scope, NEW_SPLIT, context.namespace)
            ? [
                makeEffectStatement(
                  makeSplitScopeWriteEffect(
                    scope,
                    NEW_SPLIT,
                    context.namespace,
                    makeGetGlobalExpression(context.global),
                  ),
                ),
              ]
            : [],
          context.arrival === null
            ? []
            : makeTrapStatementArray(
                context.pointcut,
                context.namespace,
                scope,
                "arrival",
                context.arrival.kind,
                context.arrival.links,
                context.arrival.callee,
                context.arrival.serial,
              ),
          map(
            filter(labels, partialxx_(isSplitScopeUsed, scope, LAB_SPLIT)),
            partialxx_x(
              makeMangleInitializeStatement,
              scope,
              LAB_SPLIT,
              context.unmangleLabel,
            ),
          ),
          map(
            filter(variables, partialxx_(isSplitScopeUsed, scope, VAR_SPLIT)),
            partialxx_x(
              makeMangleInitializeStatement,
              scope,
              VAR_SPLIT,
              context.unmangleVariable,
            ),
          ),
          makeOptimizedTryStatementArray(
            closed,
            concat(enter_statements, visited_statements, completion_statements),
            failure_statements,
            leave_statements,
          ),
        ),
      );
    },
  },
  deadcode("unexpected block type"),
);

///////////////
// Statement //
///////////////

export const visitStatement = partial__xx(
  dispatchNode,
  {
    __proto__: null,
    ReturnStatement: (context, expression, serial) => [
      makeReturnStatement(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "return",
          visitExpression(context, expression),
          serial,
        ),
      ),
    ],
    DebuggerStatement: (context, serial) =>
      concat(
        makeTrapStatementArray(
          context.pointcut,
          context.namespace,
          context.scope,
          "debugger",
          serial,
        ),
        [makeDebuggerStatement()],
      ),
    BreakStatement: (context, label, serial) =>
      concat(
        makeTrapStatementArray(
          context.pointcut,
          context.namespace,
          context.scope,
          "break",
          label,
          serial,
        ),
        [makeBreakStatement(label)],
      ),
    EffectStatement: (context, effect, _serial) => [
      makeEffectStatement(visitEffect(context, effect)),
    ],
    DeclareStatement: (context, kind, variable, expression, serial) => [
      makeDeclareStatement(
        kind,
        variable,
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "declare",
          kind,
          variable,
          visitExpression(context, expression),
          serial,
        ),
      ),
    ],
    BlockStatement: (context, block, _serial) => [
      makeBlockStatement(
        visitBlock({...context, kind: "block", arrival: null}, block),
      ),
    ],
    IfStatement: (context, expression, block1, block2, serial) => [
      makeIfStatement(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "test",
          visitExpression(context, expression),
          serial,
        ),
        visitBlock({...context, kind: "consequent", arrival: null}, block1),
        visitBlock({...context, kind: "alternate", arrival: null}, block2),
      ),
    ],
    WhileStatement: (context, expression, block, serial) => [
      makeWhileStatement(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "test",
          visitExpression(context, expression),
          serial,
        ),
        visitBlock({...context, kind: "while", arrival: null}, block),
      ),
    ],
    TryStatement: (context, block1, block2, block3, _serial) => [
      makeTryStatement(
        visitBlock({...context, kind: "try", arrival: null}, block1),
        visitBlock({...context, kind: "catch", arrival: null}, block2),
        visitBlock({...context, kind: "finally", arrival: null}, block3),
      ),
    ],
  },
  deadcode("unexpected statement type"),
);

////////////
// Effect //
////////////

export const visitEffect = partial__xx(
  dispatchNode,
  {
    __proto__: null,
    WriteEffect: (context, variable, expression, serial) =>
      makeSplitScopeWriteEffect(
        context.scope,
        OLD_SPLIT,
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "write",
          variable,
          visitExpression(context, expression),
          serial,
        ),
      ),
    ExportEffect: (context, specifier, expression, serial) =>
      makeExportEffect(
        specifier,
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "export",
          specifier,
          visitExpression(context, expression),
          serial,
        ),
      ),
    SequenceEffect: (context, effect1, effect2, _serial) =>
      makeSequenceEffect(
        visitEffect(context, effect1),
        visitEffect(context, effect2),
      ),
    ConditionalEffect: (context, expression, effect1, effect2, serial) =>
      makeConditionalEffect(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "test",
          visitExpression(context, expression),
          serial,
        ),
        visitEffect(context, effect1),
        visitEffect(context, effect2),
      ),
    ExpressionEffect: (context, expression, serial) =>
      makeExpressionEffect(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "drop",
          visitExpression(context, expression),
          serial,
        ),
      ),
  },
  deadcode("unexpected effect type"),
);

////////////////
// Expression //
////////////////

export const visitExpression = partial__xx(
  dispatchNode,
  {
    __proto__: null,
    InputExpression: (context, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "parameters",
        makeInputExpression(),
        serial,
      ),
    LiteralExpression: (context, literal, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "literal",
        literal,
        serial,
      ),
    IntrinsicExpression: (context, name, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "intrinsic",
        name,
        makeIntrinsicExpression(name),
        serial,
      ),
    ImportExpression: (context, source, specifier, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "import",
        source,
        specifier,
        makeImportExpression(source, specifier),
        serial,
      ),
    ReadExpression: (context, variable, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "read",
        variable,
        makeSplitScopeReadExpression(context.scope, OLD_SPLIT, variable),
        serial,
      ),
    ClosureExpression: (
      context,
      kind,
      asynchronous,
      generator,
      block,
      serial,
    ) => {
      const callee = `callee${String(incrementCounter(context.counter))}`;
      declareSplitScope(context.scope, NEW_SPLIT, callee, null);
      const expression = makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "closure",
        kind,
        asynchronous,
        generator,
        makeClosureExpression(
          kind,
          asynchronous,
          generator,
          visitBlock(
            {
              ...context,
              kind,
              arrival: {
                kind,
                links: null,
                callee,
                serial,
              },
            },
            block,
          ),
        ),
      );
      if (isSplitScopeUsed(context.scope, NEW_SPLIT, callee)) {
        return makeSequenceExpression(
          makeSplitScopeWriteEffect(
            context.scope,
            NEW_SPLIT,
            callee,
            expression,
          ),
          makeSplitScopeReadExpression(context.scope, NEW_SPLIT, callee),
        );
      } else {
        return expression;
      }
    },
    AwaitExpression: (context, expression, serial) =>
      makeAwaitExpression(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "await",
          visitExpression(context, expression),
          serial,
        ),
      ),
    YieldExpression: (context, delegate, expression, serial) =>
      makeYieldExpression(
        delegate,
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "yield",
          delegate,
          visitExpression(context, expression),
          serial,
        ),
      ),
    SequenceExpression: (context, effect, expression, _serial) =>
      makeSequenceExpression(
        visitEffect(context, effect),
        visitExpression(context, expression),
      ),
    ConditionalExpression: (
      context,
      expression1,
      expression2,
      expression3,
      serial,
    ) =>
      makeConditionalExpression(
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "test",
          visitExpression(context, expression1),
          serial,
        ),
        visitExpression(context, expression2),
        visitExpression(context, expression3),
      ),
    EvalExpression: (context, variables, expression, serial) =>
      makeSplitScopeEvalExpression(
        variables,
        [OLD_SPLIT, VAR_SPLIT],
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          context.scope,
          "eval",
          visitExpression(context, expression),
          serial,
        ),
      ),
    // Combiners //
    ApplyExpression: (context, expression1, expression2, expressions, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "apply",
        visitExpression(context, expression1),
        visitExpression(context, expression2),
        map(expressions, partialx_(visitExpression, context)),
        serial,
      ),
    ConstructExpression: (context, expression, expressions, serial) =>
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "construct",
        visitExpression(context, expression),
        map(expressions, partialx_(visitExpression, context)),
        serial,
      ),
  },
  deadcode("unexpected expression type"),
);
