
import {makeTrapExpression} from "./trap.mjs";
import {
  makeScopeBlock,
} from "./scope.mjs";

const PERFORM_IMPORT = "import";
const PERFORM_GET_SUPER_ENCLAVE = "get_super";
const PERFORM_SET_SUPER_ENCLAVE = "set_super";
const PERFORM_CALL_SUPER_ENCLAVE = "call_super";

////////////
// Makers //
////////////

const makeArrayExpression = (expressions) => makeApplyExpression(
  makeIntrinsicExpression("Array.of"),
  makePrimitiveExpression({undefined:null}),
  expressions,
);

const makeSimpleArrowExpression = (expression) = makeClosureExpression(
  "arrow",
  false,
  false,
  makeBlock(
    [],
    [],
    [
      makeReturnStatement(expression),
    ],
  ),
);

const makeArgumentExpression = (literal) => makeApplyExpression(
  makeIntrinsicExpression("Reflect.get"),
  makePrimitiveExpression({undefined:null}),
  [
    makeInputExpression(),
    makePrimitiveExpression(literal),
  ],
);

const makeInitializeExpression = (variable) => {
  if (isNewVariable(variable)) {
    if (variable === makeNewVariable(PERFORM_GET_SUPER_ENCLAVE)) {
      return makeSimpleArrowExpression(
        makeGetSuperEnclaveExpression(
          makeArgumentExpression(0),
        ),
      );
    }
    if (variable === makeNewVariable(PERFORM_SET_SUPER_ENCLAVE)) {
      return makeSimpleArrowExpression(
        makeSetSuperEnclaveEffect(
          makeArgumentExpression(0),
          makeArgumentExpression(1),
        ),
      );
    }
    if (variable === makeNewVariable(PERFORM_CALL_SUPER_ENCLAVE)) {
      return makeSimpleArrowExpression(
        makeCallSuperEnclaveExpression(
          makeArgumentExpression(0),
        ),
      );
    }
    if (variable === makeNewVariable(PERFORM_DYNAMIC_IMPORT)) {
      return makeSimpleArrowExpression(
        makeDynamicImportExpression(
          makeArgumentExpression(0),
        ),
      );
    }
    throw new Error("could not initialized new variable");
  }
  if (isRECVariable(variable)) {
    return makeSimpleArrowExpression(
      makeReadEnclaveExpression(
        getVariableBody(variable),
      ),
    );
  }
  if (isTECVariable(variable)) {
    return makeTypeofEnclaveExpression(
      makeTypeofEnclaveExpression(
        getVariableBody(variable),
      ),
    );
  }
  if (isWECVariable(variable)) {
    return makeSimpleArrowExpression(
      makeWriteEnclave(
        getVariableBody(variable),
        makeArgumentExpression(0),
      ),
    );
  }
  if (isLabVariable(variable)) {
    return makeObjectExpression(
      makeLiteralExpression(null),
      map(
        toEntries(unmangleLabel(getVariableBody(variable))),
        makePrimitiveProperty,
      ),
    );
  }
  if (isVarVariable(variable)) {
    return makeObjectExpression(
      makeLiteralExpression(null),
      map(
        toEntries(unmangleVariable(getVariableBody(variable))),
        makeLiteralProperty,
      ),
    );
  }
  throw new Error("could not initialize variable");
};

const throw_error_statement = makeEffectStatement(
  makeExpressionEffect(
    makeThrowExpresson(
      makeArgumentExpression("error"),
    ),
  ),
);

const makeOptimizedTryStatementArray = (statements1, statements2, statements3) => (
  statements2.length === 1 &&
  matchNode(statements2[0], throw_error_statement) &&
  statements3.length === 0
  ? statements1
  : [makeTryStatement(statements1, statements2, statements3)]
);

////////////
// Helper //
////////////

const default_callback = generateThrowError("missing instrument callback");

const generateVisit = (callbacks) => (context, node) => dispatch(contex, node, callbacks, default_callback);

const generateContextlessVisit = (callbacks) => (node) => dispatch(null, node, callbacks, default_callback);

/////////////
// Program //
/////////////

export const instrumentProgram = generateVisit({
  __proto__: null,
  ScriptProgram: (context, statements, serial) => {
    const scope = extendScriptScope(context.scope, context.namespace);
    const child_context = {...context, scope};
    const instrumented_statements = flatMap(
      statements,
      (statement) => visitStatement(child_context, statement),
    );
    const variables = getScopeVariableArray(scope);
    return concat(
      variables.length > 0
        ? [
          makeDeclareEnclaveStatement(
            "let",
            context.namespace,
            makeObjectExpression(
              makeLiteralExpression(null),
            ),
          ),
        ] : [],
      map(
        filter(
          variables,
          (variable) => !isScopeVariableInitialized(scope, variable),
        ),
        (variable) => makeEffectStatement(
          makeScopeInitializeEffect(
            scope,
            variable,
            makeInitializeExpression(variable),
          ),
        ),
      ),
      makeTrapStatementArray(
        context,
        "arrival",
        ["script", null, null, serial],
      ),
      instrumented_statements,
    );
  },
  ModuleProgram: (context, links, block, serial) => makeModuleProgram(
    links,
    instrumentBlock(
      {
        ... context,
        scope,
        kind: "module",
        header: makeTrapStatementArray(
          context,
          "arrival",
          ["module", map(links, extractLink), null, serial],
        ),
      },
      block,
    ),
  ),
  EvalProgram: (context, enclaves, identifiers, serial) => makeEvalProgram(
    enclaves,
    identifiers,
    instrumentBlock(
      {
        ... context,
        scope,
        kind: "eval",
        header: makeTrapStatementArray(
          context,
          "arrival",
          ["eval", null, null, serial],
        ),
      },
      block,
    ),
  ),
});

///////////
// Links //
///////////

const extractLink = generateContextlessVisit({
  __proto__: null,
  ImportLink: (_context, source, specifier) => ({type: "import", source, import:specifier}),
  ExportLink: (_context, source, specifier) => ({type: "export", export:specifier}),
  AggregateLink: (_context, source, specifier1, specifier2) => ({type: "aggregate", source, import:specifier1, export:specifier2})
});

///////////
// Block //
///////////

const isCompletionKind = (kind) => (
  kind === "eval" ||
  kind === "module" ||
  kind === "arrow" ||
  kind === "function" ||
  kind === "method" ||
  kind === "constructor"
);

const accumulateEntry = (entry, scope) => {
  declareScope(scope, entry[0], entry[1]);
  return scope;
};

const makeBaseEntry = (variable) => [
  makeBaseVariable(variable),
  null,
];

const makeVariableEntry = (variable) => [
  makeVariableVariable(variable),
  unmangleVariable(variable),
];

const makeLabelEntry = (label) => [
  makeLabelVariable(label),
  unmangleLabel(label),
];

const instrumentBlock = generateVisit({
  __proto__: null,
  Block: (context, labels, variables, statements, serial) => {
    const scope = reduce(
      concat(
        map(variables, makeBaseEntry),
        map(variables, makeVariableEntry),
        map(labels, makeLabelEntry),
      ),
      accumulateEntry,
      extendScope(context.scope),
    );
    const child_context = {
      ... context,
      scope,
      header: null,
      kind: null,
    };
    const enter_statements = makeTrapStatementArray(
      context,
      "enter",
      [
        context.kind,
        zip(
          repeat(child_scope, labels.length),
          map(labels, makeLabelVariable),
        ),
        zip(
          repeat(child_scope, variables.length),
          map(variables, makeVariableVariable),
        ),
        serial,
      ],
    );
    const instrumented_statements = flatMap(
      statements,
      (statement) => instrumentStatement(child_context, statement),
    );
    const completion_statements = isCompletionKind(context.kind)
      ? []
      : makeTrapStatementArray(
        context,
        "completion",
        [serial],
      );
    const catch_statements = makeEffectStatement(
      makeExpressionEffect(
        makeThrowExpresson(
          makeTrapExpression(
            context,
            "catch",
            [makeArgumentExpression("error"), serial],
          ),
        ),
      ),
    );
    const leave_statements = makeTrapStatementArray(
      context,
      "leave",
      [serial],
    );
    const scope_variables = getScopeVariableArray(scope);
    return makeBlock(
      labels,
      scope_variables,
      [
        header,
        map(
          filter(
            variables,
            (variable) => !isScopeVariableInitialized(scope, variable),
          ),
          (variable) => makeEffectStatement(
            makeScopeInitializeEffect(
              scope,
              variable,
              makeInitializeExpression(variable),
            ),
          ),
        ),
        makeOptimizedTryStatement(
          concat(
            enter_statements,
            instrumented_statements,
            completion_statements,
          ),
          catch_statements,
          leave_statements,
        ),
      ],
    );
  },
});

///////////////
// Statement //
///////////////

const visitStatement = generateInstrument({
  __proto__: null,
  ReturnStatement: (context, expression, serial) => [
    makeReturnStatement(
      makeTrapExpression(
        context,
        "return",
        [visitExpression(context, expression), serial],
      ),
    ),
  ],
  DebuggerStatement: (context, serial) => concat(
    makeTrapStatementArray(context, "debugger", [serial]),
    makeDebuggerStatement(),
  ),
  BreakStatement: (context, label, serial) => concat(
    makeTrapStatementArray(
      context,
      "break",
      [[scope, makeLabelVariable(label)], serial],
    ),
    makeBreakStatement(label),
  ),
  EffectStatement: (context, effect, serial) => [makeEffectStatement(
    visitEffect(context, effect),
  )],
  DeclareEnclaveStatement: (context, kind, expression) => [makeDeclareEnclaveStatement(
    kind,
    variable,
    makeTrapExpression(
      context,
      "enclave-declare",
      [kind, variable, visitExpression(context, expression)],
    ),
  )],
  BlockStatement: (context, block, serial) => [makeBlockStatement(
    visitBlock(context, "block", [], block),
  )],
  IfStatement: (context, expression, block1, block2, serial) => [makeIfStatement(
    makeTrapExpression(
      context,
      "test",
      [visitExpression(context, expression), serial],
    ),
    visitBlock(context, "consequent", [], block1),
    visitBlock(context, "alternate", [], block2),
  )],
  WhileStatement: (context, expression, block, serial) => [makeWhileStatement(
    makeTrapExpression(
      context,
      "test",
      [visitExpression(context, expression), serial],
    ),
    visitBlock(context, "while", [], block),
  )],
  TryStatement: (context, block1, block2, block3, _serial) => [makeTryStatement(
    visitBlock(context, "try", [], block1),
    visitBlock(context, "catch", [], block2),
    visitBlock(context, "finally", [], block3),
  )],
});

////////////
// Effect //
////////////

const visitEffect = generateVisit({
  __proto__: null,
  WriteEffect: (context, variable, expression, serial) => makeScopeWriteEffect(
    context.scope,
    makeBaseVariable(variable),
    makeTrapExpression(
      context,
      "write",
      [
        [scope, makeVariableVariable(variable)],
        [scope, makeBaseVariable(variable)],
        serial,
      ],
    ),
  ),
  WriteEnclaveEffect: (context, variable, expression, serial) => {
    const perform_variable = makeWriteEnclaveVariable(variable);
    declareScopeDuplicable(context.scope, perform_variable, null);
    return makeWriteEnclaveEffect(
      variable,
      makeTrapExpression(
        context,
        "enclave-write",
        [
          [scope, perform_variable],
          variable,
          visitExpression(context, expression),
          serial,
        ],
      ),
    );
  },
  StaticExportEffect: (context, specifier, expression, serial) => makeStaticExportEffect(
    specifier,
    makeTrapExpression(
      context,
      "export",
      [specifier, visitExpression(context, expression), serial],
    ),
  ),
  SetSuperEnclaveEffect: (context, expression1, expression2, _serial) => {
    const perform_variable = makeSingletonVariable(PERFORM_SET_SUPER_ENCLAVE);
    declareScopeDuplicable(context.scope, perform_variable, null);
    return makeTrapExpression(
      "enclave-set-super",
      [
        [scope, perform_variable],
        visitExpression(context, expression1),
        visitExpression(context, expression2),
        serial,
      ],
      makeSetSuperEnclaveEffect(),
    );
  },
  SequenceEffect: (context, effect1, effect2, _serial) => makeSequenceEffect(
    visitEffect(context, effect1),
    visitEffect(context, effect2),
  ),
  ConditionalEffect: (context, expression, effec1, effect2, _serial) => makeConditionalEffect(
    makeTrapExpression(
      context,
      "test",
      [visitExpression(context, expression), serial],
    ),
    visitEffect(context, effect1),
    visitEffect(context, effect2),
  ),
  ExpressionEffect: (context, expression, serial) => makeExpressionEffect(
    makeTrapExpression(
      context,
      "effect",
      [visitExpression(context, expression), serial],
    ),
  ),
});

////////////////
// Expression //
////////////////

const visitExpression = generateVisit({
  __proto__: null,
  InputExpression: (context, serial) => makeTrapExpression(
    context,
    "parameters",
    [makeInputExpression(), serial],
  ),
  LiteralExpression: (context, literal, serial) => makeTrapExpression(
    context,
    "literal",
    [literal, serial],
  ),
  IntrinsicExpression: (context, name, serial) => makeTrapExpression(
    context,
    "intrinsic",
    [name, serial],
  ),
  StaticImportExpression: (context, source, specifier) => makeTrapExpression(
    context,
    "import",
    [source, specifier, makeImportExpression(source, specifier), serial],
  ),
  ReadExpression: (context, variable) => makeTrapExpression(
    context,
    "read",
    [
      [context.scope, makeVariableVariable(variable)],
      [context.scope, makeBaseVariable(variable)],
      serial,
    ],
  ),
  ReadEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeReadEnclaveVariable(variable);
    declareScopeDuplicable(scope, perform_variable, null);
    return makeTrapExpression(
      context,
      "enclave-read",
      [[scope, perform_variable], variable, serial],
    );
  ),
  ReadEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeReadEnclaveVariable(variable);
    declareScopeDuplicable(scope, perform_variable, null);
    return makeTrapExpression(
      context,
      "enclave-typeof",
      [[scope, perform_variable], variable, serial],
    );
  ),
  GetSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeUniqueVariable(PERFORM_GET_SUPER_ENCLAVE);
    declareScopeDuplicable(scope, perform_variable, null);
    return makeTrapExpression(
      context,
      "enclave-get-super",
      [
        [scope, perform_variable],
        visitExpression(context, expression),
        serial,
      ],
    );
  },
  CallSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeUniqueVariable(PERFORM_CALL_SUPER_ENCLAVE);
    declareScopeDuplicable(scope, perform_variable, null);
    return makeTrapExpression(
      context,
      "enclave-call-super",
      [
        [scope, perform_variable],
        visitExpression(context, expression),
        serial,
      ],
    );
  },
  ClosureExpression: (context, kind, asynchronous, generator, block) => {
    const callee_variable = make
    const callee_variable = registerNewVariable(context.scope, null);
    const expression = makeClosureExpression(
      kind,
      asynchronous,
      generator,
      visitBlock(
        context,
        kind,
        makeTrapStatementArray(
          context,
          "arrival",
          [kind, null, {scope:context.scope, variable}, serial]
        ),
        block,
      ),
    );
    return isNewRead(context.scope, variable)
      ? makeSequenceExpression(
        makeNewWriteEffect(
          context.scope,
          variable,
          expression,
        ),
        makeNewReadExpression(
          context.scope,
          variable,
        ),
      : expression;
  },
  AwaitExpression: (context, expression, serial) => makeAwaitExpresson(
    makeTrapExpression(
      context,
      "await",
      [visitExpression(context, expression), serial],
    ),
  ),
  YieldExpression: (context, delegate, expression, serial) => makeYieldExpresson(
    delegate,
    makeTrapExpression(
      context,
      "await",
      [delegate, visitExpression(context, expression), serial],
    ),
  ),
  AwaitExpression: (context, expression, serial) => makeThrowExpresson(
    makeTrapExpression(
      context,
      "throw",
      [visitExpression(context, expression), serial],
    ),
  ),
  SequenceExpression: (context, effect, expression, serial) => makeSequenceExpression(
    visitEffect(context, effect),
    visitExpression(context, expression),
  ),
  ConditionalExpression: (context, expression1, expression2, expression3, serial) => makeConditionalExpression(
    makeTrapExpression(
      context,
      "test",
      [visitExpression(context, expression1), serial],
    ),
    visitExpression(context, expression2),
    visitExpression(context, expression3),
  ),
  EvalExpression: (context, enclaves, identifiers, expression, serial) => makeTrapExpression(
    context,
    "eval-output",
    [
      makeScopeEvalExpression(
        context.scope,
        enclaves,
        identifiers,
        makeTrapExpression(
          context
          "eval-input",
          [
            visitExpression(context, expression),
            serial,
          ],
        ),
      ),
      serial,
    ],
  ),
  DynamicImportExpression: (context, expression, serial) => makeTrapExpression(

    const variable = makeUniqueVariable(PERFORM_IMPORT);
    declareScopeDuplicable(scope, variable);
    return makeTrapExpression(
      context,
      "import",
      [source, specifier]
    );

    context,
    "dynamic-import",
    [
      null,
      visitExpression(context, expression),
      serial,
    ],
  ),
  // Combiners //
  ApplyExpression: (context, expression1, expression2, expressions, serial) => makeTrapExpression(
    context,
    "apply",
    [
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      map(expressions, (expression) => visitExpression(context, expression)),
      serial,
    ],
  ),
  ConstructExpression: (context, expression, expressions, serial) => makeTrapExpression(
    context,
    "construct",
    [
      visitExpression(context, expression1),
      map(expressions, (expression) => visitExpression(context, expression)),
      serial,
    ],
  ),
  UnaryExpression: (context, operator, expression, serial) => makeTrapExpression(
    context,
    "unary",
    [operator, visitExpression(context, expression), serial],
  ),
  BinaryExpression: (context, operator, expression1, expression2, serial) => makeTrapExpression(
    context,
    "binary",
    [operator, visitExpression(context, expression1), visitExpression(context, expression2), serial],
  ),
  ObjectExpression: (context, expression, properties, serial) => makeTrapExpression(
    context,
    "object",
    [
      visitExpression(context, expression),
      map(properties, (property) => [
        visitExpression(context, property[0]),
        visitExpression(context, property[1]),
      ]),
    ],
  ),
});
