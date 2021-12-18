/* eslint-disable no-use-before-define */

import {map, concat, filter, flatMap, reduce, zip, repeat} from "array-lite";

import {
  generateThrowError,
  incrementCounter,
  generateReturn,
} from "../util.mjs";

import {
  matchNode,
  dispatchNode,
  makeScriptProgram,
  makeModuleProgram,
  makeEvalProgram,
  // makeImportLink,
  // makeExportLink,
  // makeAggregateLink,
  makeBlock,
  makeEffectStatement,
  makeReturnStatement,
  makeBreakStatement,
  makeDebuggerStatement,
  makeDeclareEnclaveStatement,
  makeBlockStatement,
  makeIfStatement,
  makeWhileStatement,
  makeTryStatement,
  // makeSetSuperEnclaveEffect,
  // makeWriteEffect,
  // makeWriteEnclaveEffect,
  makeStaticExportEffect,
  makeSequenceEffect,
  makeConditionalEffect,
  makeExpressionEffect,
  makeInputExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeStaticImportExpression,
  // makeReadExpression,
  // makeReadEnclaveExpression,
  // makeTypeofEnclaveExpression,
  makeClosureExpression,
  makeAwaitExpression,
  makeYieldExpression,
  makeThrowExpression,
  makeSequenceExpression,
  makeConditionalExpression,
  // makeGetSuperEnclaveExpression,
  // makeCallSuperEnclaveExpression,
  makeEvalExpression,
  // makeDynamicImportExpression,
  makeApplyExpression,
  // makeConstructExpression,
  // makeUnaryExpression,
  // makeBinaryExpression,
  makeObjectExpression,
} from "../ast/index.mjs";

import {unmangleLabel, unmangleVariable} from "./unmangle.mjs";

import {
  makeNewVariable,
  makeOldVariable,
  makeLabVariable,
  makeVarVariable,
  makeRECVariable,
  makeWECVariable,
  makeTECVariable,
} from "./variable.mjs";

import {
  makeTrapExpression,
  makeTrapEffect,
  makeTrapStatementArray,
} from "./trap.mjs";

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

import {
  makeInitializeExpression,
  PERFORM_SET_SUPER_ENCLAVE,
  PERFORM_GET_SUPER_ENCLAVE,
  PERFORM_CALL_SUPER_ENCLAVE,
  PERFORM_DYNAMIC_IMPORT,
} from "./initialize.mjs";

const {undefined, String} = globalThis;

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

const returnTrue = generateReturn(true);

const throw_error_statement_array_pattern = [
  [
    "EffectStatement",
    [
      "ExpressionEffect",
      [
        "ThrowExpression",
        [
          "ApplyExpression",
          ["IntrinsicExpression", "Reflect.get", returnTrue],
          ["LiteralExpression", undefined, returnTrue],
          [
            ["InputExpression", returnTrue],
            ["LiteralExpression", "error", returnTrue],
          ],
          returnTrue,
        ],
        returnTrue,
      ],
      returnTrue,
    ],
    returnTrue,
  ],
];

const makeOptimizedTryStatementArray = (
  statements1,
  statements2,
  statements3,
) =>
  matchNode(null, statements2, throw_error_statement_array_pattern) &&
  statements3.length === 0
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

const default_callback = generateThrowError("missing instrument callback");
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
              makeDeclareEnclaveStatement(
                "let",
                context.script,
                makeObjectExpression(makeLiteralExpression(null), []),
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
  EvalProgram: (context, enclaves, variables, block, serial) =>
    makeEvalProgram(
      enclaves,
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
          kind: "eval",
          header: makeTrapStatementArray(
            context.trap,
            "arrival",
            "eval",
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
    const completion_statements = isCompletionKind(context.kind)
      ? []
      : makeTrapStatementArray(context.trap, "completion", serial);
    const failure_statements = [
      makeEffectStatement(
        makeExpressionEffect(
          makeThrowExpression(
            makeTrapExpression(
              context.trap,
              "failure",
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.get"),
                makeLiteralExpression({undefined: null}),
                [makeInputExpression(), makeLiteralExpression("error")],
              ),
              serial,
            ),
          ),
        ),
      ),
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
  DeclareEnclaveStatement: (context, kind, variable, expression, serial) => [
    makeDeclareEnclaveStatement(
      kind,
      variable,
      makeTrapExpression(
        context.trap,
        "enclave-declare",
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
  StaticExportEffect: (context, specifier, expression, serial) =>
    makeStaticExportEffect(
      specifier,
      makeTrapExpression(
        context.trap,
        "export",
        specifier,
        visitExpression(context, expression),
        serial,
      ),
    ),
  WriteEnclaveEffect: (context, variable, expression, serial) => {
    const perform_variable = makeWECVariable(variable);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapEffect(
      context.trap,
      "enclave-write",
      [context.scope, perform_variable],
      variable,
      visitExpression(context, expression),
      serial,
    );
  },
  SetSuperEnclaveEffect: (context, expression1, expression2, serial) => {
    const perform_variable = makeNewVariable(PERFORM_SET_SUPER_ENCLAVE);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapEffect(
      context.trap,
      "enclave-set-super",
      [context.scope, perform_variable],
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      serial,
    );
  },
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
  StaticImportExpression: (context, source, specifier, serial) =>
    makeTrapExpression(
      context.trap,
      "import",
      source,
      specifier,
      makeStaticImportExpression(source, specifier),
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
  ReadEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeRECVariable(variable);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "enclave-read",
      [context.scope, perform_variable],
      variable,
      serial,
    );
  },
  TypeofEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeTECVariable(variable);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "enclave-typeof",
      [context.scope, perform_variable],
      variable,
      serial,
    );
  },
  GetSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeNewVariable(PERFORM_GET_SUPER_ENCLAVE);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "enclave-get-super",
      [context.scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
  CallSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeNewVariable(PERFORM_CALL_SUPER_ENCLAVE);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "enclave-call-super",
      [context.scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
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
  ThrowExpression: (context, expression, serial) =>
    makeThrowExpression(
      makeTrapExpression(
        context.trap,
        "throw",
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
  EvalExpression: (context, enclaves, identifiers, expression, serial) =>
    makeEvalExpression(
      enclaves,
      map(identifiers, makeOldVariable),
      makeTrapExpression(
        context.trap,
        "eval",
        visitExpression(context, expression),
        serial,
      ),
    ),
  DynamicImportExpression: (context, expression, serial) => {
    const perform_variable = makeNewVariable(PERFORM_DYNAMIC_IMPORT);
    declareScopeVariable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "dynamic-import",
      [context.scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
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
  UnaryExpression: (context, operator, expression, serial) =>
    makeTrapExpression(
      context.trap,
      "unary",
      operator,
      visitExpression(context, expression),
      serial,
    ),
  BinaryExpression: (context, operator, expression1, expression2, serial) =>
    makeTrapExpression(
      context.trap,
      "binary",
      operator,
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      serial,
    ),
  ObjectExpression: (context, expression, properties, serial) =>
    makeTrapExpression(
      context.trap,
      "object",
      visitExpression(context, expression),
      map(properties, (property) => [
        visitExpression(context, property[0]),
        visitExpression(context, property[1]),
      ]),
      serial,
    ),
});
