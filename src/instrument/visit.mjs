/* eslint-disable no-use-before-define */

import { includes, forEach, map, concat, filter, flatMap } from "array-lite";

import {
  matchJSON,
  partial_x,
  partialx_,
  partialxx_,
  partialx__,
  partialxx_x,
  constant,
  constant_,
  incrementCounter,
} from "../util/index.mjs";

import { dispatchArrayNode0, dispatchArrayNode1 } from "../node.mjs";

import {
  makeBlock,
  makeEvalProgram,
  makeModuleProgram,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeDeclareExternalStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeParameterExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeImportExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeReadExternalExpression,
  makeTypeofExternalExpression,
  makeWriteExternalEffect,
  makeYieldExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeApplyExpression,
  makeEvalExpression,
} from "../ast/index.mjs";

import { makeJSONExpression } from "../intrinsic.mjs";

import {
  makeScopeScriptProgram,
  extendScope,
  makeScopeBlock,
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
} from "./split.mjs";

import { makeTrapExpression, makeTrapStatementArray } from "./trap.mjs";

const { String } = globalThis;

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

const returnTrue = constant_(true);

const throw_error_expression_pattern = [
  "ApplyExpression",
  ["IntrinsicExpression", "aran.throw", returnTrue],
  ["LiteralExpression", { undefined: null }, returnTrue],
  [["ParameterExpression", "error", returnTrue]],
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
  matchJSON(
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

const jsonifyLink = partialx_(dispatchArrayNode0, {
  ImportLink: ({ 1: source, 2: specifier }) => ({
    type: "import",
    source,
    import: specifier,
  }),
  ExportLink: ({ 1: specifier }) => ({
    type: "export",
    export: specifier,
  }),
  AggregateLink: ({ 1: source, 2: specifier1, 3: specifier2 }) => ({
    type: "aggregate",
    source,
    import: specifier1,
    export: specifier2,
  }),
});

/////////////
// Program //
/////////////

export const visitProgram = partialx__(dispatchArrayNode1, {
  ScriptProgram: ({ 1: statements1, 2: serial }, context) => {
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
        partial_x(visitStatement, {
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
                  makeReadExternalExpression(context.advice),
                ),
              ),
            ]
          : [],
        statements2,
      ),
    );
  },
  ModuleProgram: ({ 1: links, 2: block, 3: serial }, context) =>
    makeModuleProgram(
      links,
      visitBlock(block, {
        ...context,
        kind: "module",
        arrival: {
          kind: "module",
          links: map(links, jsonifyLink),
          callee: null,
          serial,
        },
      }),
    ),
  EvalProgram: ({ 1: block, 2: serial }, context) =>
    makeEvalProgram(
      visitBlock(block, {
        ...context,
        kind: "eval",
        arrival: {
          kind: "eval",
          links: null,
          callee: null,
          serial,
        },
      }),
    ),
});

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
  "internal-local-eval",
  "external-local-eval",
];

const visitBlock = partialx__(dispatchArrayNode1, {
  Block: ({ 1: labels, 2: variables, 3: statements, 4: serial }, context) => {
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
      const namespace = `namespace${String(incrementCounter(context.counter))}`;
      context = { ...context, namespace };
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
      partial_x(visitStatement, {
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
      makeLiteralExpression({ undefined: null }),
      [
        makeTrapExpression(
          context.pointcut,
          context.namespace,
          scope,
          "failure",
          makeParameterExpression("error"),
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
                  makeReadExternalExpression(context.advice),
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
});

///////////////
// Statement //
///////////////

const visitStatement = partialx__(dispatchArrayNode1, {
  ReturnStatement: ({ 1: expression, 2: serial }, context) => [
    makeReturnStatement(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "return",
        visitExpression(expression, context),
        serial,
      ),
    ),
  ],
  DebuggerStatement: ({ 1: serial }, context) =>
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
  BreakStatement: ({ 1: label, 2: serial }, context) =>
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
  EffectStatement: ({ 1: effect, 2: _serial }, context) => [
    makeEffectStatement(visitEffect(effect, context)),
  ],
  DeclareExternalStatement: (
    { 1: kind, 2: variable, 3: expression, 4: serial },
    context,
  ) => [
    makeDeclareExternalStatement(
      kind,
      variable,
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "declare-external",
        kind,
        variable,
        visitExpression(expression, context),
        serial,
      ),
    ),
  ],
  BlockStatement: ({ 1: block, 2: _serial }, context) => [
    makeBlockStatement(
      visitBlock(block, { ...context, kind: "block", arrival: null }),
    ),
  ],
  IfStatement: (
    { 1: expression, 2: block1, 3: block2, 4: serial },
    context,
  ) => [
    makeIfStatement(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "test",
        visitExpression(expression, context),
        serial,
      ),
      visitBlock(block1, { ...context, kind: "consequent", arrival: null }),
      visitBlock(block2, { ...context, kind: "alternate", arrival: null }),
    ),
  ],
  WhileStatement: ({ 1: expression, 2: block, 3: serial }, context) => [
    makeWhileStatement(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "test",
        visitExpression(expression, context),
        serial,
      ),
      visitBlock(block, { ...context, kind: "while", arrival: null }),
    ),
  ],
  TryStatement: ({ 1: block1, 2: block2, 3: block3, 4: _serial }, context) => [
    makeTryStatement(
      visitBlock(block1, { ...context, kind: "try", arrival: null }),
      visitBlock(block2, { ...context, kind: "catch", arrival: null }),
      visitBlock(block3, { ...context, kind: "finally", arrival: null }),
    ),
  ],
});

////////////
// Effect //
////////////

const visitEffect = partialx__(dispatchArrayNode1, {
  WriteEffect: ({ 1: variable, 2: expression, 3: serial }, context) =>
    makeSplitScopeWriteEffect(
      context.scope,
      OLD_SPLIT,
      variable,
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "write",
        variable,
        visitExpression(expression, context),
        serial,
      ),
    ),
  WriteExternalEffect: ({ 1: variable, 2: expression, 3: serial }, context) =>
    makeWriteExternalEffect(
      variable,
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "write-external",
        variable,
        visitExpression(expression, context),
        serial,
      ),
    ),
  ExportEffect: ({ 1: specifier, 2: expression, 3: serial }, context) =>
    makeExportEffect(
      specifier,
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "export",
        specifier,
        visitExpression(expression, context),
        serial,
      ),
    ),
  SequenceEffect: ({ 1: effect1, 2: effect2, 3: _serial }, context) =>
    makeSequenceEffect(
      visitEffect(effect1, context),
      visitEffect(effect2, context),
    ),
  ConditionalEffect: (
    { 1: expression, 2: effect1, 3: effect2, 4: serial },
    context,
  ) =>
    makeConditionalEffect(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "test",
        visitExpression(expression, context),
        serial,
      ),
      visitEffect(effect1, context),
      visitEffect(effect2, context),
    ),
  ExpressionEffect: ({ 1: expression, 2: serial }, context) =>
    makeExpressionEffect(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "drop",
        visitExpression(expression, context),
        serial,
      ),
    ),
});

////////////////
// Expression //
////////////////

const visitExpression = partialx__(dispatchArrayNode1, {
  ParameterExpression: ({ 1: parameter, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "parameter",
      parameter,
      makeParameterExpression(parameter),
      serial,
    ),
  LiteralExpression: ({ 1: literal, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "literal",
      literal,
      serial,
    ),
  IntrinsicExpression: ({ 1: name, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "intrinsic",
      name,
      makeIntrinsicExpression(name),
      serial,
    ),
  ImportExpression: ({ 1: source, 2: specifier, 3: serial }, context) =>
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
  ReadExpression: ({ 1: variable, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "read",
      variable,
      makeSplitScopeReadExpression(context.scope, OLD_SPLIT, variable),
      serial,
    ),
  ReadExternalExpression: ({ 1: variable, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "read-external",
      variable,
      makeReadExternalExpression(variable),
      serial,
    ),
  TypeofExternalExpression: ({ 1: variable, 2: serial }, context) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "typeof-external",
      variable,
      makeTypeofExternalExpression(variable),
      serial,
    ),
  ClosureExpression: (
    { 1: kind, 2: asynchronous, 3: generator, 4: block, 5: serial },
    context,
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
        visitBlock(block, {
          ...context,
          kind,
          arrival: {
            kind,
            links: null,
            callee,
            serial,
          },
        }),
      ),
      serial,
    );
    if (isSplitScopeUsed(context.scope, NEW_SPLIT, callee)) {
      return makeSequenceExpression(
        makeSplitScopeWriteEffect(context.scope, NEW_SPLIT, callee, expression),
        makeSplitScopeReadExpression(context.scope, NEW_SPLIT, callee),
      );
    } else {
      return expression;
    }
  },
  AwaitExpression: ({ 1: expression, 2: serial }, context) =>
    makeAwaitExpression(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "await",
        visitExpression(expression, context),
        serial,
      ),
    ),
  YieldExpression: ({ 1: delegate, 2: expression, 3: serial }, context) =>
    makeYieldExpression(
      delegate,
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "yield",
        delegate,
        visitExpression(expression, context),
        serial,
      ),
    ),
  SequenceExpression: ({ 1: effect, 2: expression, 3: _serial }, context) =>
    makeSequenceExpression(
      visitEffect(effect, context),
      visitExpression(expression, context),
    ),
  ConditionalExpression: (
    { 1: expression1, 2: expression2, 3: expression3, 4: serial },
    context,
  ) =>
    makeConditionalExpression(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "test",
        visitExpression(expression1, context),
        serial,
      ),
      visitExpression(expression2, context),
      visitExpression(expression3, context),
    ),
  // Combiners //
  EvalExpression: ({ 1: expression, 2: serial }, context) =>
    makeEvalExpression(
      makeTrapExpression(
        context.pointcut,
        context.namespace,
        context.scope,
        "eval",
        visitExpression(expression, context),
        serial,
      ),
    ),
  ApplyExpression: (
    { 1: expression1, 2: expression2, 3: expressions, 4: serial },
    context,
  ) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "apply",
      visitExpression(expression1, context),
      visitExpression(expression2, context),
      map(expressions, partial_x(visitExpression, context)),
      serial,
    ),
  ConstructExpression: (
    { 1: expression, 2: expressions, 3: serial },
    context,
  ) =>
    makeTrapExpression(
      context.pointcut,
      context.namespace,
      context.scope,
      "construct",
      visitExpression(expression, context),
      map(expressions, partial_x(visitExpression, context)),
      serial,
    ),
});
