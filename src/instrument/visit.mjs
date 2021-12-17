
import {
  matchNode,
} from "../ast/index.mjs";

import {makeTrapExpression, makeTrapEffect, makeTrapStatementArray} from "./trap.mjs";

import {
  extendScriptScope,
  extendScope,
  isScopeVariableUsed,
  isScopeVariableInitialized,
} from "./scope.mjs";

const PERFORM_IMPORT = "import";
const PERFORM_GET_SUPER_ENCLAVE = "get_super";
const PERFORM_SET_SUPER_ENCLAVE = "set_super";
const PERFORM_CALL_SUPER_ENCLAVE = "call_super";

/////////////
// Helpers //
/////////////

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

const makeInitializeStatement = (scope, variable) => makeEffectStatement(
  makeScopeInitializeEffect(
    scope,
    variable,
    makeInitializeExpression(variable),
  ),
);

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

///////////
// Visit //
///////////

const default_callback = generateThrowError("missing instrument callback");
const generateVisit = (callbacks) => (context, node) => dispatchNode(contex, node, callbacks, default_callback);
const generateContextlessVisit = (callbacks) => (node) => dispatchNode(null, node, callbacks, default_callback);

/////////////
// Program //
/////////////

export const visitProgram = generateVisit({
  __proto__: null,
  ScriptProgram: (context, statements, serial) => {
    const scope = extendScriptScope(context.scope, context.script);
    const child_context = {...context, scope};
    const visited_statements = flatMap(
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
              [],
            ),
          ),
        ] : [],
      map(
        filter(
          variables,
          (variable) => !isScopeVariableInitialized(scope, variable),
        ),
        (variable) => makeInitializeStatement(
          scope,
          variable,
        ),
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
    );
  },
  ModuleProgram: (context, links, block, serial) => makeModuleProgram(
    links,
    visitBlock(
      {
        ... context,
        scope,
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
  EvalProgram: (context, enclaves, identifiers, serial) => makeEvalProgram(
    enclaves,
    map(identifiers, makeOldVariable),
    visitBlock(
      {
        ... context,
        scope,
        kind: "eval",
        header: makeTrapStatementArray(
          context,
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

const visitLink = generateContextlessVisit({
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

const accumulateDeclaration = (scope, declaration) => {
  declareScopeVariable(scope, declaration);
  return scope;
};

const makeOldeclaration = (variable) => ({
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

const visitBlock = generateVisit({
  __proto__: null,
  Block: (context, labels, variables, statements, serial) => {
    const scope = reduce(
      concat(
        map(labels, makeLabEntry),
        map(variables, makeVarEntry),
        map(variables, makeOldEntry),
      ),
      accumulateDeclaration,
      extendScope(context.scope),
    );
    const child_context = {
      ... context,
      scope,
      header: null,
      kind: null,
    };
    const enter_statements = makeTrapStatementArray(
      context.trap,
      "enter",
      context.kind,
      zip(
        repeat(child_scope, labels.length),
        map(labels, makeLabVariable),
      ),
      zip(
        repeat(child_scope, variables.length),
        map(variables, makeVarVariable),
      ),
      serial,
    );
    const visited_statements = flatMap(
      statements,
      (statement) => visitStatement(child_context, statement),
    );
    const completion_statements = isCompletionKind(context.kind)
      ? []
      : makeTrapStatementArray(
        context.trap,
        "completion",
        serial,
      );
    const failure_statements = makeEffectStatement(
      makeExpressionEffect(
        makeThrowExpresson(
          makeTrapExpression(
            context.trap,
            "failure",
            makeArgumentExpression("error"),
            serial,
          ),
        ),
      ),
    );
    const leave_statements = makeTrapStatementArray(
      context.trap,
      "leave",
      serial,
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
          (variable) => makeInitializeStatement(child_scope, variable)
        ),
        makeOptimizedTryStatement(
          concat(
            enter_statements,
            visited_statements,
            completion_statements,
          ),
          failure_statements,
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
        context.trap,
        "return",
        visitExpression(context, expression),
        serial,
      ),
    ),
  ],
  DebuggerStatement: (context, serial) => concat(
    makeTrapStatementArray(context.trap, "debugger", serial),
    [makeDebuggerStatement()],
  ),
  BreakStatement: (context, label, serial) => concat(
    makeTrapStatementArray(
      context.trap,
      "break",
      [scope, makeLabelVariable(label)],
      serial],
    ),
    [makeBreakStatement(label)],
  ),
  EffectStatement: (context, effect, serial) => [makeEffectStatement(
    visitEffect(context, effect),
  )],
  DeclareEnclaveStatement: (context, kind, variable, expression) => [makeDeclareEnclaveStatement(
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
  )],
  BlockStatement: (context, block, serial) => [makeBlockStatement(
    visitBlock(context, "block", [], block),
  )],
  IfStatement: (context, expression, block1, block2, serial) => [makeIfStatement(
    makeTrapExpression(
      context.trap,
      "test",
      visitExpression(context, expression),
      serial,
    ),
    visitBlock(context, "consequent", [], block1),
    visitBlock(context, "alternate", [], block2),
  )],
  WhileStatement: (context, expression, block, serial) => [makeWhileStatement(
    makeTrapExpression(
      context.trap,
      "test",
      visitExpression(context, expression),
      serial,
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
    makeOldVariable(variable),
    makeTrapExpression(
      context.trap,
      "write",
      [scope, makeVarVariable(variable)],
      [scope, makeOldVariable(variable)],
      serial,
    ),
  ),
  StaticExportEffect: (context, specifier, expression, serial) => makeStaticExportEffect(
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
    declareScopeDuplicable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapEffect(
      context.trap,
      "enclave-write",
      [scope, perform_variable],
      variable,
      visitExpression(context, expression),
      serial,
    );
  },
  SetSuperEnclaveEffect: (context, expression1, expression2, _serial) => {
    const perform_variable = makeNewVariable(PERFORM_SET_SUPER_ENCLAVE);
    declareScopeDuplicable(context.scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapEffect(
      context.trap,
      "enclave-set-super",
      [scope, perform_variable],
      visitExpression(context, expression1),
      visitExpression(context, expression2),
      serial,
    );
  },
  SequenceEffect: (context, effect1, effect2, _serial) => makeSequenceEffect(
    visitEffect(context, effect1),
    visitEffect(context, effect2),
  ),
  ConditionalEffect: (context, expression, effec1, effect2, _serial) => makeConditionalEffect(
    makeTrapExpression(
      context.trap,
      "test",
      visitExpression(context, expression),
      serial,
    ),
    visitEffect(context, effect1),
    visitEffect(context, effect2),
  ),
  ExpressionEffect: (context, expression, serial) => makeExpressionEffect(
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

const visitExpression = generateVisit({
  __proto__: null,
  InputExpression: (context, serial) => makeTrapExpression(
    context.trap,
    "parameters",
    makeInputExpression(),
    serial,
  ),
  LiteralExpression: (context, literal, serial) => makeTrapExpression(
    context.trap,
    "literal",
    literal,
    serial,
  ),
  IntrinsicExpression: (context, name, serial) => makeTrapExpression(
    context.trap,
    "intrinsic",
    name,
    makeIntrinsicExpression(name),
    serial,
  ),
  StaticImportExpression: (context, source, specifier) => makeTrapExpression(
    context.trap,
    "import",
    source,
    specifier,
    makeImportExpression(source, specifier),
    serial,
  ),
  ReadExpression: (context, variable) => makeTrapExpression(
    context.trap,
    "read",
    [context.scope, makeVarVariable(variable)],
    [context.scope, makeOldVariable(variable)],
    serial,
  ),
  ReadEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeRECVariable(variable);
    declareScopeVariable(scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false
    });
    return makeTrapExpression(
      context.trap,
      "enclave-read",
      [scope, perform_variable],
      variable,
      serial,
    );
  },
  TypeofEnclaveExpression: (context, variable, serial) => {
    const perform_variable = makeTECVariable(variable);
    declareScopeVariable(scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false
    });
    return makeTrapExpression(
      context.trap,
      "enclave-typeof",
      [scope, perform_variable],
      variable,
      serial,
    );
  },
  GetSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeNewVariable(PERFORM_GET_SUPER_ENCLAVE);
    declareScopeVariable(scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false
    });
    return makeTrapExpression(
      context.trap,
      "enclave-get-super",
      [scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
  CallSuperEnclaveExpression: (context, expression, serial) => {
    const perform_variable = makeNewVariable(PERFORM_CALL_SUPER_ENCLAVE);
    declareScopeVariable(scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false
    });
    return makeTrapExpression(
      context.trap,
      "enclave-call-super",
      [scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
  ClosureExpression: (context, kind, asynchronous, generator, block) => {
    const callee_variable = makeNewVariable(`callee${String(incrementCounter(context.counter))}`);
    const expression = makeTrapExpression(
      context.trap,
      kind,
      asynchronous,
      generator,
      makeClosureExpression(
        kind,
        asynchronous,
        generator,
        visitBlock(
          context,
          kind,
          makeTrapStatementArray(
            context.trap,
            "arrival",
            kind,
            null,
            [context.scope, callee_variable],
            serial,
          ),
          block,
        ),
      ),
    );
    return isScopeVariableUsed(context.scope, callee_variable)
      ? makeSequenceExpression(
        makeScopeInitializeEffect(
          context.scope,
          callee_variable,
          expression,
        ),
        makeScopeReadExpression(
          context.scope,
          callee_variable,
        ),
      )
      : expression;
  },
  AwaitExpression: (context, expression, serial) => makeAwaitExpresson(
    makeTrapExpression(
      context.trap,
      "await",
      visitExpression(context, expression),
      serial,
    ),
  ),
  YieldExpression: (context, delegate, expression, serial) => makeYieldExpresson(
    delegate,
    makeTrapExpression(
      context.trap,
      "yield",
      delegate,
      visitExpression(context, expression),
      serial,
    ),
  ),
  ThrowExpression: (context, expression, serial) => makeThrowExpresson(
    makeTrapExpression(
      context.trap,
      "throw",
      visitExpression(context, expression),
      serial,
    ),
  ),
  SequenceExpression: (context, effect, expression, serial) => makeSequenceExpression(
    visitEffect(context, effect),
    visitExpression(context, expression),
  ),
  ConditionalExpression: (context, expression1, expression2, expression3, serial) => makeConditionalExpression(
    makeTrapExpression(
      context.trap,
      "test",
      visitExpression(context, expression1),
      serial,
    ),
    visitExpression(context, expression2),
    visitExpression(context, expression3),
  ),
  EvalExpression: (context, enclaves, identifiers, expression, serial) => makeTrapExpression(
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
    const perform_variable = makeNewVariable(PERFORM_IMPORT);
    declareScopeDuplicable(scope, {
      variable: perform_variable,
      value: null,
      duplicable: true,
      initialized: false,
    });
    return makeTrapExpression(
      context.trap,
      "dynamic-import",
      [scope, perform_variable],
      visitExpression(context, expression),
      serial,
    );
  },
  // Combiners //
  ApplyExpression: (context, expression1, expression2, expressions, serial) => makeTrapExpression(
    context.trap,
    "apply",
    visitExpression(context, expression1),
    visitExpression(context, expression2),
    map(expressions, (expression) => visitExpression(context, expression)),
    serial,
  ),
  ConstructExpression: (context, expression, expressions, serial) => makeTrapExpression(
    context.trap,
    "construct",
    visitExpression(context, expression1),
    map(expressions, (expression) => visitExpression(context, expression)),
    serial,
  ),
  UnaryExpression: (context, operator, expression, serial) => makeTrapExpression(
    context.trap,
    "unary",
    operator,
    visitExpression(context, expression),
    serial,
  ),
  BinaryExpression: (context, operator, expression1, expression2, serial) => makeTrapExpression(
    context.trap,
    "binary",
    operator,
    visitExpression(context, expression1),
    visitExpression(context, expression2),
    serial,
  ),
  ObjectExpression: (context, expression, properties, serial) => makeTrapExpression(
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
