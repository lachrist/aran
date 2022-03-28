/* eslint-disable no-use-before-define */

import {
  map,
  concat,
  filter,
  flatMap,
  reduce,
  zip,
  repeat,
  flat,
} from "array-lite";

import {
  partial1,
  assert,
  throwError,
  incrementCounter,
  returnFirst,
} from "../util.mjs";

import {
  matchNode,
  dispatchNode,
  makeScriptProgram,
  makeModuleProgram,
  makeGlobalEvalProgram,
  makeLocalEvalProgram,
  makeEnclaveEvalProgram,
  makeBlock,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeDeclareStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  makeWriteEffect as makeRawWriteEffect,
  makeExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeInputExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeImportExpression,
  makeReadExpression as makeRawReadExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  makeEvalExpression,
  makeApplyExpression,
} from "../ast/index.mjs";

import {unmangleLabel, unmangleVariable} from "./unmangle.mjs";

import {makeMetaVariable} from "../variable.mjs";

import {
  makeNewVariable,
  makeOldVariable,
  makeLabVariable,
  makeVarVariable,
  getVariableBody,
  isLabVariable,
  isVarVariable,
} from "./variable.mjs";

import {makeTrapExpression, makeTrapStatementArray} from "./trap.mjs";

import {
  extendScriptScope,
  extendScope,
  declareScopeVariable,
  isScopeVariableUsed,
  isScopeVariableInitialized,
  makeScopeInitializeEffect,
  makeScopeReadExpression,
  makeScopeWriteEffect,
  getUsedScopeVariableArray,
} from "./scope.mjs";

const {
  Error,
  undefined,
  String,
  Object: {entries: toEntries},
} = globalThis;

////////////////
// Initialize //
////////////////

const makeLiteralObjectExpression = (object) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeLiteralExpression({undefined: null}),
    concat(
      [makeLiteralExpression(null)],
      map(flat(toEntries(object)), makeLiteralExpression),
    ),
  );

export const makeInitializeExpression = (variable) => {
  if (isLabVariable(variable)) {
    return makeLiteralObjectExpression(
      unmangleLabel(getVariableBody(variable)),
    );
  }
  if (isVarVariable(variable)) {
    return makeLiteralObjectExpression(
      unmangleVariable(getVariableBody(variable)),
    );
  }
  /* c8 ignore start */
  throw new Error("could not initialize variable");
  /* c8 ignore stop */
};

const makeInitializeStatement = (scope, variable) =>
  makeEffectStatement(
    makeScopeInitializeEffect(
      scope,
      variable,
      makeInitializeExpression(variable),
    ),
  );

////////////////////////////////////
// makeOptimizedTryStatementArray //
////////////////////////////////////

const returnTrue = partial1(returnFirst, true);

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
  is_completion,
  statements1,
  statements2,
  statements3,
) =>
  matchNode(
    null,
    statements2,
    is_completion
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

///////////
// Visit //
///////////

const default_callback = partial1(throwError, "missing instrument callback");
const generateVisit = (callbacks) => (context, node) =>
  dispatchNode(context, node, callbacks, default_callback);
const generateContextlessVisit = (callbacks) => (node) =>
  dispatchNode(null, node, callbacks, default_callback);

/////////////
// Program //
/////////////

export const visitProgram = generateVisit({
  __proto__: null,
  ScriptProgram: (context, statements, serial) => {
    const scope = extendScriptScope(context.scope, context.script);
    const child_context = {...context, scope};
    const visited_statements = flatMap(statements, (statement) =>
      visitStatement(child_context, statement),
    );
    const variables = getUsedScopeVariableArray(scope);
    return makeScriptProgram(
      concat(
        variables.length > 0
          ? [
              makeDeclareStatement(
                "let",
                context.script,
                makeApplyExpression(
                  makeIntrinsicExpression("aran.createObject"),
                  makeLiteralExpression({undefined: null}),
                  [makeLiteralExpression(null)],
                ),
              ),
            ]
          : [],
        map(
          filter(
            variables,
            (variable) => !isScopeVariableInitialized(scope, variable),
          ),
          (variable) => makeInitializeStatement(scope, variable),
        ),
        makeTrapStatementArray(
          context.trap,
          "arrival",
          "script",
          null,
          null,
          serial,
        ),
        visited_statements,
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
          header: makeTrapStatementArray(
            context.trap,
            "arrival",
            "module",
            map(links, visitLink),
            null,
            serial,
          ),
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
          header: makeTrapStatementArray(
            context.trap,
            "arrival",
            "global-eval",
            null,
            null,
            serial,
          ),
        },
        block,
      ),
    ),
  LocalEvalProgram: (context, variables, block, serial) =>
    makeLocalEvalProgram(
      map(variables, makeOldVariable),
      visitBlock(
        {
          ...context,
          scope: reduce(
            concat(
              map(variables, makeVarDeclaration),
              map(variables, makeOldDeclaration),
            ),
            accumulateDeclaration,
            extendScope(context.scope),
          ),
          kind: "local-eval",
          header: makeTrapStatementArray(
            context.trap,
            "arrival",
            "local-eval",
            null,
            null,
            serial,
          ),
        },
        block,
      ),
    ),
  EnclaveEvalProgram: (context, enclaves, block, serial) =>
    makeEnclaveEvalProgram(
      enclaves,
      visitBlock(
        {
          ...context,
          kind: "enclave-eval",
          header: makeTrapStatementArray(
            context.trap,
            "arrival",
            "enclave-eval",
            null,
            null,
            serial,
          ),
        },
        block,
      ),
    ),
});

///////////
// Links //
///////////

export const visitLink = generateContextlessVisit({
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
});

///////////
// Block //
///////////

const isCompletionKind = (kind) =>
  kind === "eval" ||
  kind === "module" ||
  kind === "arrow" ||
  kind === "function" ||
  kind === "method" ||
  kind === "constructor";

const accumulateDeclaration = (scope, declaration) => {
  declareScopeVariable(scope, declaration);
  return scope;
};

const makeOldDeclaration = (variable) => ({
  variable: makeOldVariable(variable),
  value: null,
  duplicable: false,
  initialized: true,
});

const makeVarDeclaration = (variable) => ({
  variable: makeVarVariable(variable),
  value: unmangleVariable(variable),
  duplicable: false,
  initialized: false,
});

const makeLabDeclaration = (label) => ({
  variable: makeLabVariable(label),
  value: unmangleLabel(label),
  duplicable: false,
  initialized: false,
});

export const visitBlock = generateVisit({
  __proto__: null,
  Block: (context, labels, variables, statements, serial) => {
    const child_scope = reduce(
      concat(
        map(labels, makeLabDeclaration),
        map(variables, makeVarDeclaration),
        map(variables, makeOldDeclaration),
      ),
      accumulateDeclaration,
      extendScope(context.scope),
    );
    const child_context = {
      ...context,
      scope: child_scope,
      header: null,
      kind: null,
    };
    const is_completion = isCompletionKind(context.kind);
    const enter_statements = makeTrapStatementArray(
      context.trap,
      "enter",
      context.kind,
      zip(repeat(child_scope, labels.length), map(labels, makeLabVariable)),
      zip(
        repeat(child_scope, variables.length),
        map(variables, makeVarVariable),
      ),
      serial,
    );
    const visited_statements = flatMap(statements, (statement) =>
      visitStatement(child_context, statement),
    );
    const completion_statements = is_completion
      ? []
      : makeTrapStatementArray(context.trap, "completion", serial);
    const failure_expression = makeApplyExpression(
      makeIntrinsicExpression("aran.throw"),
      makeLiteralExpression({undefined: null}),
      [
        makeTrapExpression(
          context.trap,
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
      is_completion
        ? makeReturnStatement(failure_expression)
        : makeEffectStatement(makeExpressionEffect(failure_expression)),
    ];
    const leave_statements = makeTrapStatementArray(
      context.trap,
      "leave",
      serial,
    );
    const scope_variables = getUsedScopeVariableArray(child_scope);
    return makeBlock(
      labels,
      scope_variables,
      concat(
        context.header,
        map(
          filter(
            scope_variables,
            (variable) => !isScopeVariableInitialized(child_scope, variable),
          ),
          (variable) => makeInitializeStatement(child_scope, variable),
        ),
        makeOptimizedTryStatementArray(
          is_completion,
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

export const visitStatement = generateVisit({
  __proto__: null,
  ReturnStatement: (context, expression, serial) => [
    makeReturnStatement(
      makeTrapExpression(
        context.trap,
        "return",
        visitExpression(context, expression),
        serial,
      ),
    ),
  ],
  DebuggerStatement: (context, serial) =>
    concat(makeTrapStatementArray(context.trap, "debugger", serial), [
      makeDebuggerStatement(),
    ]),
  BreakStatement: (context, label, serial) =>
    concat(
      makeTrapStatementArray(
        context.trap,
        "break",
        [context.scope, makeLabVariable(label)],
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
        context.trap,
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
      visitBlock({...context, kind: "block", header: []}, block),
    ),
  ],
  IfStatement: (context, expression, block1, block2, serial) => [
    makeIfStatement(
      makeTrapExpression(
        context.trap,
        "test",
        visitExpression(context, expression),
        serial,
      ),
      visitBlock({...context, kind: "consequent", header: []}, block1),
      visitBlock({...context, kind: "alternate", header: []}, block2),
    ),
  ],
  WhileStatement: (context, expression, block, serial) => [
    makeWhileStatement(
      makeTrapExpression(
        context.trap,
        "test",
        visitExpression(context, expression),
        serial,
      ),
      visitBlock({...context, kind: "while", header: []}, block),
    ),
  ],
  TryStatement: (context, block1, block2, block3, _serial) => [
    makeTryStatement(
      visitBlock({...context, kind: "try", header: []}, block1),
      visitBlock({...context, kind: "catch", header: []}, block2),
      visitBlock({...context, kind: "finally", header: []}, block3),
    ),
  ],
});

////////////
// Effect //
////////////

export const visitEffect = generateVisit({
  __proto__: null,
  WriteEffect: (context, variable, expression, serial) =>
    makeScopeWriteEffect(
      context.scope,
      makeOldVariable(variable),
      makeTrapExpression(
        context.trap,
        "write",
        [context.scope, makeVarVariable(variable)],
        visitExpression(context, expression),
        serial,
      ),
    ),
  ExportEffect: (context, specifier, expression, serial) =>
    makeExportEffect(
      specifier,
      makeTrapExpression(
        context.trap,
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
        context.trap,
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
        context.trap,
        "drop",
        visitExpression(context, expression),
        serial,
      ),
    ),
});

////////////////
// Expression //
////////////////

export const visitExpression = generateVisit({
  __proto__: null,
  InputExpression: (context, serial) =>
    makeTrapExpression(
      context.trap,
      "parameters",
      makeInputExpression(),
      serial,
    ),
  LiteralExpression: (context, literal, serial) =>
    makeTrapExpression(context.trap, "literal", literal, serial),
  IntrinsicExpression: (context, name, serial) =>
    makeTrapExpression(
      context.trap,
      "intrinsic",
      name,
      makeIntrinsicExpression(name),
      serial,
    ),
  ImportExpression: (context, source, specifier, serial) =>
    makeTrapExpression(
      context.trap,
      "import",
      source,
      specifier,
      makeImportExpression(source, specifier),
      serial,
    ),
  ReadExpression: (context, variable, serial) =>
    makeTrapExpression(
      context.trap,
      "read",
      [context.scope, makeVarVariable(variable)],
      makeScopeReadExpression(context.scope, makeOldVariable(variable)),
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
    const callee_variable = makeNewVariable(
      `callee${String(incrementCounter(context.counter))}`,
    );
    declareScopeVariable(context.scope, {
      variable: callee_variable,
      value: null,
      duplicable: false,
      initialized: false,
    });
    const expression = makeTrapExpression(
      context.trap,
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
            header: makeTrapStatementArray(
              context.trap,
              "arrival",
              kind,
              null,
              [context.scope, callee_variable],
              serial,
            ),
          },
          block,
        ),
      ),
    );
    return isScopeVariableUsed(context.scope, callee_variable)
      ? makeSequenceExpression(
          makeScopeInitializeEffect(context.scope, callee_variable, expression),
          makeScopeReadExpression(context.scope, callee_variable),
        )
      : expression;
  },
  AwaitExpression: (context, expression, serial) =>
    makeAwaitExpression(
      makeTrapExpression(
        context.trap,
        "await",
        visitExpression(context, expression),
        serial,
      ),
    ),
  YieldExpression: (context, delegate, expression, serial) =>
    makeYieldExpression(
      delegate,
      makeTrapExpression(
        context.trap,
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
        context.trap,
        "test",
        visitExpression(context, expression1),
        serial,
      ),
      visitExpression(context, expression2),
      visitExpression(context, expression3),
    ),
  EvalExpression: (context, variables, expression, serial) =>
    makeEvalExpression(
      map(variables, makeOldVariable),
      makeTrapExpression(
        context.trap,
        "eval",
        visitExpression(context, expression),
        serial,
      ),
    ),
  // Combiners //
  ApplyExpression: (context, expression1, expression2, expressions, serial) =>
    makeTrapExpression(
      context.trap,
      "apply",
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      map(expressions, (arg_expression) =>
        visitExpression(context, arg_expression),
      ),
      serial,
    ),
  ConstructExpression: (context, expression, expressions, serial) =>
    makeTrapExpression(
      context.trap,
      "construct",
      visitExpression(context, expression),
      map(expressions, (arg_expression) =>
        visitExpression(context, arg_expression),
      ),
      serial,
    ),
  InvokeExpression: (
    context,
    expression1,
    expression2,
    expressions,
    serial,
  ) => {
    let this_variable = null;
    return makeTrapExpression(
      context.trap,
      "invoke",
      (cut) => {
        if (cut) {
          this_variable = makeMetaVariable(
            `this_${String(incrementCounter(context.counter))}`,
          );
          declareScopeVariable(context.scope, {
            variable: makeOldVariable(this_variable),
            value: null,
            duplicable: false,
            initialized: true,
          });
          declareScopeVariable(context.scope, {
            variable: makeVarVariable(this_variable),
            value: unmangleVariable(this_variable),
            duplicable: false,
            initialized: false,
          });
          return visitExpression(
            context,
            makeSequenceExpression(
              makeRawWriteEffect(this_variable, expression1, serial),
              makeApplyExpression(
                makeIntrinsicExpression("aran.get", serial),
                makeLiteralExpression({undefined: null}, serial),
                [makeRawReadExpression(this_variable, serial), expression2],
                serial,
              ),
              serial,
            ),
          );
        } else {
          return visitExpression(context, expression1);
        }
      },
      (cut) => {
        if (cut) {
          assert(this_variable !== null, "expected presence of this variable");
          return visitExpression(
            context,
            makeRawReadExpression(this_variable, serial),
          );
        } else {
          return visitExpression(context, expression2);
        }
      },
      map(expressions, (expression) => visitExpression(context, expression)),
    );
  },
});
