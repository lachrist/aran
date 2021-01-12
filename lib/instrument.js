"use strict";

const global_Array_isArray = global.Array.isArray;
const global_String = global.String;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");
const Tree = require("./tree");

const closure_matcher = ["closure", (sort) => true, (asynchronous) => true, (generator) => true, (block) => true];
const primitive_matcher = ["primitive", (primitive) => true];
const primitive_extractor = (context, node, primitive) => primitive;
const get_error_matcher = [
  "apply",
  ["intrinsic", "Reflect.get"],
  ["primitive", void 0],
  [
    ["read", "input"],
    ["primitive", "error"]]];
const primitive_undefined_matcher = ["primitive", void 0];
const read_input_matcher = ["read", "input"];

const trap_name_array = [
  // Informers //
  "aggregate",
  "completion",
  "leave",
  "break",
  "debugger",
  // Producers //
  "enter",
  "primitive",
  "closure",
  "intrinsic",
  "read",
  "import",
  // Consumers //
  "enclave-declare",
  "await",
  "yield",
  "drop",
  "test",
  "write",
  "return",
  "throw",
  "failure",
  "export",
  // Combiners //
  "enclave-write",
  "enclave-read",
  "enclave-typeof",
  "require",
  "eval",
  "object",
  "unary",
  "binary",
  "construct",
  "apply"];

const full_pointcut = ArrayLite.reduce(
  trap_name_array,
  (pointcut, name) => (
    pointcut[name] = true,
    pointcut),
  {__proto__:null});

const closure_pointcut = ArrayLite.reduce(
  trap_name_array,
  (pointcut, name) => (
    pointcut[name] = function (...args) { return global_Reflect_apply(
      this.__closure__,
      void 0,
      ArrayLite.concat([name], args)); },
    pointcut),
  {__proto__:null});

const parameter_array_object = {
  __proto__: null,
  "script": [],
  "module": [],
  "local-eval": [],
  "global-eval": [],
  "function": ["callee", "arguments", "this", "new.target"],
  "method": ["callee", "arguments", "this"],
  "constructor": ["callee", "arguments", "new.target"],
  "arrow": ["callee", "arguments"],
  "lone": [],
  "do": [],
  "then": [],
  "else": [],
  "try": [],
  "catch": ["error"],
  "finally": []};

const make_cut = (unmangle, serials, pointcut, _converters, _convert) => (
  _converters = {
    __proto__: null,
    "frame": (frame) => ({
      __proto__: null,
      module: _convert(["trade"], frame.module),
      labels: _convert(["label"], frame.labels),
      identifiers: _convert(["identifier"], frame.identifiers)}),
    "trade": (trade) => (
      trade.type === "import" ?
      {
        __proto__: null,
        type: "import",
        ImportExpression: _convert("specifier", trade.import),
        source: _convert("source", trade.source)} :
      (
        trade.type === "export" ?
        {
          __proto__: null,
          type: "export",
          ExportExpression: _convert("specifier", trade.export)} :
        // console.assert(trade.type === "aggregate")
        {
          __proto__: null,
          type: "aggregate",
          ImportExpression: _convert("specifier", trade.import),
          source: _convert("source", trade.source),
          ExportExpression: _convert("specifier", trade.export)})),
    "input": (sort) => ArrayLite.reduce(
      parameter_array_object[sort],
      (object, key) => (
        object[key] = null,
        object),
      {__proto__:null}),
    "enclave-identifier": (identifier) => identifier,
    "enclave-kind": (kind) => kind,
    "strict": (strict) => strict,
    "delegate": (delegate) => delegate,
    "asynchronous": (asynchronous) => asynchronous,
    "generator": (generator) => generator,
    "sort": (sort) => sort,
    "perform-eval": (unit) => null,
    "perform-require": (unit) => null,
    "perform-enclave-read": (identifier) => null,
    "perform-enclave-typeof": (identifier) => null,
    "perform-enclave-write": ({0:strict, 1:identifier}) => null,
    "perform-enclave-super-call": (unit) => null,
    "perform-enclave-super-member": (unit) => null,
    "node": (node) => global_Reflect_apply(global_Map_prototype_get, serials, [node]),
    "expression": (expression) => null,
    "specifier": (specifier) => specifier,
    "source": (source) => source,
    "primitive": (expression) => (
      Tree.match(null, expression, primitive_matcher) ?
      Tree.extract(null, expression, "primitive", primitive_extractor) :
      void 0),
    "intrinsic": (intrinsic) => intrinsic,
    "label": unmangle.label,
    "identifier": unmangle.identifier,
    "operator": (operator) => operator},
  _convert = (type, value) => (
    typeof type === "string" ?
    _converters[type](value) :
    ArrayLite.map(
      value,
      (
        type.length === 1 ?
        (value) => _convert(type[0], value) :
        (value, index) => _convert(type[index], value)))),
  (name, args, types) => (
    name in pointcut &&
    (
      typeof pointcut[name] === "function" ?
      global_Reflect_apply(
        pointcut[name],
        pointcut,
        ArrayLite.map(
          args,
          (arg, index) => _convert(types[index], arg))) :
      global_Boolean(pointcut[name]))));

const make_trap = (unmangle, serials, _converters, _convert) => (
  _converters = {
    __proto__: null,
    "trade": (trade) => Tree.ObjectExpression(
      Tree.PrimitiveExpression(null),
      ArrayLite.concat(
        [
          [
            Tree.PrimitiveExpression("type"),
            Tree.PrimitiveExpression(trade.type)]],
        (
          trade.type === "export" ?
          [] :
          [
            [
              Tree.PrimitiveExpression("import"),
              _convert("specifier", trade.import)],
            [
              Tree.PrimitiveExpression("source"),
              _convert("source", trade.source)]]),
        (
          trade.type === "import" ?
          [] :
          [
            [
              Tree.PrimitiveExpression("export"),
              _convert("specifier", trade.export)]]))),
    "frame": (frame) => Tree.ObjectExpression(
      Tree.PrimitiveExpression(null),
      [
        [
          Tree.PrimitiveExpression("module"),
          _convert(["trade"], frame.module)],
        [
          Tree.PrimitiveExpression("labels"),
          _convert(["label"], frame.labels)],
        [
          Tree.PrimitiveExpression("identifiers"),
          _convert(["identifier"], frame.identifiers)]]),
    "perform-eval": () => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.EvalExpression(
              Tree.ApplyExpression(
                Tree.IntrinsicExpression("Reflect.get"),
                Tree.PrimitiveExpression(void 0),
                [
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.get"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("arguments")]),
                  Tree.PrimitiveExpression(0)])))])),
    "perform-require": () => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.RequireExpression(
              Tree.ApplyExpression(
                Tree.IntrinsicExpression("Reflect.get"),
                Tree.PrimitiveExpression(void 0),
                [
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.get"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("arguments")]),
                  Tree.PrimitiveExpression(0)])))])),
    "enclave-kind": (kind) => Tree.PrimitiveExpression(kind),
    "enclave-identifier": (identifier) => Tree.PrimitiveExpression(identifier),
    "perform-enclave-read": (identifier) => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.EnclaveReadExpression(identifier))])),
    "perform-enclave-typeof": (identifier) => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.TypeofEnclaveExpression(identifier))])),
    "perform-enclave-write": ({strict, identifier}) => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.WriteEnclaveExpression(
              strict,
              identifier,
              Tree.ApplyExpression(
                Tree.IntrinsicExpression("Reflect.get"),
                Tree.PrimitiveExpression(void 0),
                [
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.get"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("arguments")]),
                  Tree.PrimitiveExpression(0)])))])),
    "perform-enclave-super-member": (unit) => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.SuperMemberEnclaveExpression(
              Tree.ApplyExpression(
                Tree.IntrinsicExpression("Reflect.get"),
                Tree.PrimitiveExpression(void 0),
                [
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.get"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("arguments")]),
                  Tree.PrimitiveExpression(0)])))])),
    "perform-enclave-super-call": (unit) => Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(
        [],
        [],
        [
          Tree.ReturnStatement(
            Tree.SuperCallEnclaveExpression(
              Tree.ApplyExpression(
                Tree.IntrinsicExpression("Reflect.get"),
                Tree.PrimitiveExpression(void 0),
                [
                  Tree.ApplyExpression(
                    Tree.IntrinsicExpression("Reflect.get"),
                    Tree.PrimitiveExpression(void 0),
                    [
                      Tree.ReadExpression("input"),
                      Tree.PrimitiveExpression("arguments")]),
                  Tree.PrimitiveExpression(0)])))])),
    "input": (input) => Tree.ReadExpression("input"),
    "node": (node) => Tree.PrimitiveExpression(
      global_Reflect_apply(global_Map_prototype_get, serials, [node])),
    "expression": (expression) => expression,
    "source": (source) => Tree.PrimitiveExpression(source),
    "specifier": (specifier) => Tree.PrimitiveExpression(specifier),
    "primitive": (primitive) => primitive,
    "intrinsic": (intrinsic) => Tree.PrimitiveExpression(intrinsic),
    "strict": (strict) => Tree.PrimitiveExpression(strict),
    "sort": (sort) => Tree.PrimitiveExpression(sort),
    "delegate": (delegate) => Tree.PrimitiveExpression(delegate),
    "asynchronous": (asynchronous) => Tree.PrimitiveExpression(asynchronous),
    "generator": (generator) => Tree.PrimitiveExpression(generator),
    "label": (label, _object) => (
      _object = unmangle.label(label),
      Tree.ObjectExpression(
        Tree.PrimitiveExpression(null),
          ArrayLite.map(
            global_Reflect_ownKeys(_object),
            (string) => [
              Tree.PrimitiveExpression(string),
              Tree.PrimitiveExpression(_object[string])]))),
    "identifier": (identifier, _object) => (
      _object = unmangle.identifier(identifier),
      Tree.ObjectExpression(
        Tree.PrimitiveExpression(null),
          ArrayLite.map(
            global_Reflect_ownKeys(_object),
            (string) => [
              Tree.PrimitiveExpression(string),
              Tree.PrimitiveExpression(_object[string])]))),
    "operator": (operator) => Tree.PrimitiveExpression(operator)},
  _convert = (type, value) => (
    typeof type === "string" ?
    _converters[type](value) :
    // console.assert(global_Array_isArray(type))
    Tree.ApplyExpression(
      Tree.IntrinsicExpression("Array.of"),
      Tree.PrimitiveExpression(void 0),
      ArrayLite.map(
        value,
        (
          type.length === 1 ?
          (value) => _convert(type[0], value) :
          (value, index) => _convert(type[index], value))))),
  (name, args, types) => Tree.ApplyExpression(
    Tree.ApplyExpression(
      Tree.IntrinsicExpression("Reflect.get"),
      Tree.PrimitiveExpression(void 0),
      [
        Tree.IntrinsicExpression("aran.advice"),
        Tree.PrimitiveExpression(name)]),
    Tree.IntrinsicExpression("aran.advice"),
    ArrayLite.map(
      args,
      (arg, index) => _convert(types[index], arg))));

const pass = () => Tree.PrimitiveExpression(void 0);
const forward_first = (arg1) => arg1;
const forward_second = (arg1, arg2) => arg2;
const forward_third = (arg1, arg2, arg3) => arg3;
const forward_fourth = (arg1, arg2, arg3, arg4) => arg4;

const make_weave = (cut, trap) => ArrayLite.reduce(
  [
    // Informers //
    ["completion", ["sort", "node"], pass],
    ["leave", ["sort", "node"], pass],
    ["continue", ["label", "node"], pass],
    ["break", ["label", "node"], pass],
    ["debugger", ["node"], pass],
    // Producers //
    [
      "enter",
      ["sort", "frame", "input", "node"],
      (sort, frame, input, node) => Tree.ReadExpression("input")],
    ["primitive", ["primitive", "node"], forward_first],
    ["closure", ["sort", "asynchronous", "generator", "expression", "node"], forward_fourth],
    ["intrinsic", ["intrinsic", "expression", "node"], forward_second],
    ["import", ["specifier", "source", "expression", "node"], forward_third],
    ["read", ["identifier", "expression", "node"], forward_second],
    // Consumers //
    ["enclave_declare", ["enclave-kind", "enclave-identifier", "expression", "node"], forward_third],
    ["yield", ["delegate", "expression", "node"], forward_second],
    ["await", ["expression", "node"], forward_first],
    ["drop", ["expression", "node"], forward_first],
    ["test", ["expression", "node"], forward_first],
    ["write", ["identifier", "expression", "node"], forward_second],
    ["return", ["expression", "node"], forward_first],
    ["throw", ["expression", "node"], forward_first],
    ["failure", ["sort", "expression", "node"], forward_second],
    ["export", ["specifier", "expression", "node"], forward_second],
    // Combiners //
    [
      "enclave_read",
      ["enclave-identifier", "perform-enclave-read", "node"],
      (identifier, perform, node) => Tree.EnclaveReadExpression(identifier)],
    [
      "enclave_typeof",
      ["enclave-identifier", "perform-enclave-typeof", "node"],
      (identifier, perform, node) => Tree.TypeofEnclaveExpression(identifier)],
    [
      "enclave_write",
      ["strict", "enclave-identifier", "expression", "perform-enclave-write", "node"],
      (strict, identifier, expression, perform, node) => Tree.WriteEnclaveExpression(strict, identifier, expression)],
    [
      "enclave_super_member",
      ["expression", "perform-enclave-super-member", "node"],
      (expression, perform, node) => Tree.SuperMemberEnclaveExpression(expression)],
    [
      "enclave_super_call",
      ["expression", "perform-enclave-super-call", "node"],
      (expression, perform, node) => Tree.SuperCallEnclaveExpression(expression)],
    [
      "eval",
      ["expression", "perform-eval", "node"],
      (expression, perform, node) => Tree.EvalExpression(expression)],
    [
      "require",
      ["expression", "perform-require", "node"],
      (expression, perform, node) => Tree.RequireExpression(expression)],
    [
      "object",
      ["expression", [["expression", "expression"]], "node"],
      (expression, properties, node) => Tree.ObjectExpression(expression, properties)],
    [
      "unary",
      ["operator", "expression", "node"],
      (operator, expression, node) => Tree.UnaryExpression(operator, expression)],
    [
      "binary",
      ["operator", "expression", "expression", "node"],
      (operator, expression1, expression2, node) => Tree.BinaryExpression(operator, expression1, expression2)],
    [
      "construct",
      ["expression", ["expression"], "node"],
      (expression, expressions) => Tree.ConstructExpression(expression, expressions)],
    [
      "apply",
      ["expression", "expression", ["expression"], "node"],
      (expression1, expression2, expressions) => Tree.ApplyExpression(expression1, expression2, expressions)]],
  (weave, {0:name, 1:types, 2:closure}) => (
    weave[name] = (...args) => (
      cut(name, args, types) ?
      trap(name, args, types) :
      global_Reflect_apply(closure, void 0, args)),
    weave),
  {__proto__:null});

const fetch = (context, type) => (
  context.type === type ?
  context :
  fetch(
    global_Reflect_getPrototypeOf(context),
    type));

// interface Options = {
//   source: "script" | "module" | "eval",
//   serials: Map(estree.Node -> Serial),
//   pointcut: null | boolean | function | array | object,
//   namespace: {"overwritten-callee": string},
//   unmangle: {
//     label: (string) -> string,
//     identifier: (string) -> string
//   }
// }
const visit_program = (program, options) => Tree.dispatch(
  {
    __proto__: null,
    type: "program",
    counter: 0,
    source: options.source,
    weave: make_weave(
      make_cut(
        options.unmangle,
        options.serials,
        (
          (
            options.pointcut === null ||
            options.pointcut === false) ?
          {__proto__:null} :
          (
            options.pointcut === true ?
            full_pointcut :
            (
              typeof options.pointcut === "function" ?
              {
                __proto__: closure_pointcut,
                __closure__: options.pointcut} :
              global_Array_isArray(options.pointcut) ?
              ArrayLite.reduce(
                options.pointcut,
                (pointcut, name) => (
                  pointcut[name] = true,
                  pointcut),
                {__proto__:null}) :
              options.pointcut)))),
      make_trap(options.unmangle, options.serials)),
    namespace: options.namespace,
    unmangle: options.unmangle},
  program,
  program_callback_object);

const visit_prelude = (prelude, context) => Tree.dispatch(
  {
    __proto__: fetch(context, "program"),
    type: "prelude"},
  prelude,
  prelude_callback_object);

const visit_block = (block, context, options) => Tree.dispatch(
  global_Object_assign(
    {
      __proto__: fetch(context, "program"),
      type: "block",
      sort: void 0,
      module: []},
    options),
  block,
  block_callback_object);

const visit_statement = (statement, context, options) => Tree.dispatch(
  global_Object_assign(
    {
      __proto__: fetch(context, "block"),
      type: "statement",
      identifiers: void 0},
    options),
  statement,
  statement_callback_object);

const visit_expression = (expression, context, options) => Tree.dispatch(
  global_Object_assign(
    {
      __proto__: fetch(context, "statement"),
      type: "expression",
      dropped: null},
    options),
  expression,
  expression_callback_object);

const program_callback_object = {
  __proto__: null,
  _program: (context, node, preludes, block) => Tree.Program(
    preludes,
    visit_block(
      block,
      context,
      {
        sort: context.source,
        module: ArrayLite.map(
          preludes,
          (prelude) => visit_prelude(prelude, context))}))};

const prelude_callback_object = {
  __proto__: null,
  ImportLink: (context, node, specifier, source) => ({
    __proto__: null,
    type: "import",
    ImportExpression: specifier,
    source: source}),
  ExportLink: (context, node, specifier) => ({
    __proto__: null,
    type: "export",
    ExportExpression: specifier}),
  AggregateLink: (context, node, specifier1, source, specifier2) => ({
    __proto__: null,
    type: "aggregate",
    ImportExpression: specifier1,
    source: source,
    ExportExpression: specifier2})};

const block_callback_object = {
  __proto__: null,
  Block: (context, node, labels, identifiers, statements, _identifiers, _statements, _expression1, _expression2, _expression3, _expression4) => (
    _identifiers = ArrayLite.concat(identifiers),
    _statements = [
      (
        _expression1 = context.weave.enter(
          context.sort,
          {
            __proto__: null,
            module: context.module,
            labels: labels,
            identifiers: identifiers},
          context.sort,
          node),
        (
          Tree.match(null, _expression1, read_input_matcher) ?
          Tree.BundleStatement([]) :
          Tree.ExpressionStatement(
            Tree.WriteExpression("input", _expression1)))),
      Tree.BundleStatement(
        ArrayLite.map(
          statements,
          (statement) => visit_statement(statement, context, {identifiers:_identifiers}))),
      inform(
        context.weave.completion(context.sort, node))],
    _expression2 = context.weave.failure(
      context.sort,
      Tree.ApplyExpression(
        Tree.IntrinsicExpression("Reflect.get"),
        Tree.PrimitiveExpression(void 0),
        [
          Tree.ReadExpression("input"),
          Tree.PrimitiveExpression("error")]),
      node),
    _expression3 = context.weave.leave(context.sort, node),
    (
      (
        Tree.match(null, _expression2, get_error_matcher) &&
        Tree.match(null, _expression3, primitive_undefined_matcher)) ?
      Tree.Block(labels, _identifiers, _statements) :
      Tree.Block(
        [],
        [],
        [
          Tree.TryStatement(
            Tree.Block(labels, _identifiers, _statements),
            Tree.Block(
              [],
              [],
              [
                Tree.ExpressionStatement(
                  Tree.ThrowExpression(_expression2))]),
            Tree.Block(
              [],
              [],
              [
                inform(_expression3)]))])))};

const inform = (expression) => (
  Tree.match(null, expression, primitive_undefined_matcher) ?
  Tree.BundleStatement([]) :
  Tree.ExpressionStatement(expression));

const statement_callback_object = {
  __proto__: null,
  DeclareEnclaveStatement: (context, node, kind, identifier, expression) => Tree.EnclaveDeclare(
    kind,
    identifier,
    context.weave.enclave_declare(
      kind,
      identifier,
      visit_expression(expression, context, null),
      node)),
  ExpressionStatement: (context, node, expression) => Tree.ExpressionStatement(
    visit_expression(expression, context, {dropped:node})),
  BreakStatement (context, node, label, _expression) => Tree.BundleStatement(
    [
      inform(
        context.weave.break(label, node)),
      Tree.BreakStatement(label)]),
  ReturnStatement (context, node, expression) => Tree.ReturnStatement(
    context.weave.return(
      visit_expression(expression, context, null),
      node)),
  DebuggerStatement (context, node) => Tree.BundleStatement(
    [
      inform(
        context.weave.debugger(node)),
      Tree.DebuggerStatement()]),
  ExpressionStatement: (context, node, block) => Tree.BlockStatement(
    visit_block(
      block,
      context,
      {sort: "lone"})),
  WhileStatement: (context, node, expression, block) => Tree.WhileStatement(
    context.weave.test(
      visit_expression(expression, context, null),
      node),
    visit_block(
      block,
      context,
      {sort: "do"})),
  IfStatement (context, node, expression, block1, block2) => Tree.IfStatement(
    context.weave.test(
      visit_expression(expression, context, null),
      node),
    visit_block(
      block1,
      context,
      {sort: "then"}),
    visit_block(
      block2,
      context,
      {sort: "else"},
      block2)),
  TryStatement: (context, node, block1, block2, block3) => Tree.TryStatement(
    visit_block(
      block1,
      context,
      {sort: "try"}),
    visit_block(
      block2,
      context,
      {sort: "catch"}),
    visit_block(
      block3,
      context,
      {sort: "finally"}))};

const check_dropped_1 = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const check_dropped_2 = (node, weave, dropped, expression) => (
  dropped === null ?
  weave.primitive(expression, node) :
  expression);

const update_callee_1 = (context, node, expression1, expression2, expressions) => Tree.ApplyExpression(
  expression1,
  expression2,
  [
    expressions[0],
    expressions[1],
    expressions[2],
    Tree.extract(context, expressions[3], "closure", update_callee_2),
    expressions[4]]);

const update_callee_2 = (context, node, sort, asynchronous, generator, block) => Tree.ClosureExpression(
  sort,
  asynchronous,
  generator,
  Tree.extract(context, block, "Block", update_callee_3));

const update_callee_3 = (context, node, labels, identifiers, statements) => Tree.Block(
  labels,
  identifiers,
  ArrayLite.concat(
    [
      Tree.ExpressionStatement(
        Tree.ApplyExpression(
          Tree.IntrinsicExpression("Reflect.set"),
          Tree.PrimitiveExpression(void 0),
          [
            Tree.ReadExpression("input"),
            Tree.PrimitiveExpression("callee"),
            Tree.ReadExpression(context)]))],
    statements));

const expression_callback_object = {
  __proto__: null,
  // Producer //
  PrimitiveExpression: (context, node, primitive) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.primitive(node, node)),
  ClosureExpression: (context, node, sort, asynchronous, generator, block, _expression, _identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    (
      _expression = context.weave.closure(
        sort,
        asynchronous,
        generator,
        Tree.ClosureExpression(
          sort,
          asynchronous,
          generator,
          visit_block(block, context, {sort})),
        node),
      (
        Tree.match(null, _expression, closure_matcher) ?
        _expression :
        (
          _identifier = `${context.namespace["overwritten-callee"]}_${global_String(fetch(context, "program").counter++)}`,
          context.identifiers[context.identifiers.length] = _identifier,
          Tree.SequenceExpression(
            Tree.WriteExpression(
              _identifier,
              Tree.extract(_identifier, _expression, "apply", update_callee_1)),
            Tree.ReadExpression(_identifier)))))),
  ImportExpression: (context, node, specifier, source) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.import(
      specifier,
      source,
      Tree.ImportExpression(specifier, source),
      node)),
  ReadExpression: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.read(
      identifier,
      Tree.ReadExpression(identifier),
      node)),
  IntrinsicExpression: (context, node, intrinsic) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.intrinsic(
      intrinsic,
      Tree.IntrinsicExpression(intrinsic),
      node)),
  // Consumer //
  AwaitExpression: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    Tree.AwaitExpression(
      context.weave.await(
        visit_expression(expression, context, null),
        node))),
  YieldExpression: (context, node, delegate, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    Tree.YieldExpression(
      delegate,
      context.weave.yield(
        delegate,
        visit_expression(expression, context, null),
        node))),
  ThrowExpression: (context, node, expression) => Tree.ThrowExpression(
    context.weave.throw(
      visit_expression(expression, context, null),
      node)),
  ExportExpression: (context, node, specifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    Tree.ExportExpression(
      specifier,
      context.weave.export(
        specifier,
        visit_expression(expression, context, null),
        node))),
  WriteExpression: (context, node, identifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    Tree.WriteExpression(
      identifier,
      context.weave.write(
        identifier,
        visit_expression(expression, context, null),
        node))),
  SequenceExpression: (context, node, expression1, expression2) => Tree.SequenceExpression(
    visit_expression(expression1, context, {dropped:node}),
    visit_expression(expression2, context, {dropped:context.dropped})),
  ConditionalExpression: (context, node, expression1, expression2, expression3) => Tree.ConditionalExpression(
    context.weave.test(
      visit_expression(expression1, context, null),
      node),
    visit_expression(expression2, context, {dropped:context.dropped}),
    visit_expression(expression3, context, {dropped:context.dropped})),
  // Combiner //
  EvalExpression: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.eval(
      visit_expression(expression, context, null),
      null,
      node)),
  RequireExpression: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.require(
      visit_expression(expression, context, null),
      null,
      node)),
  ReadEnclaveExpression: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_read(
      identifier,
      identifier,
      node)),
  TypeofEnclaveExpression: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_typeof(
      identifier,
      identifier,
      node)),
  WriteEnclaveExpression: (context, node, strict, identifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    context.weave.enclave_write(
      strict,
      identifier,
      visit_expression(expression, context, null),
      {strict, identifier},
      node)),
  SuperMemberEnclaveExpression: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_super_member(
      visit_expression(expression, context, null),
      null,
      node)),
  SuperCallEnclaveExpression: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_super_call(
      visit_expression(expression, context, null),
      null,
      node)),
  ObjectExpression: (context, node, expression, properties) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.object(
      visit_expression(expression, context, null),
      ArrayLite.map(
        properties,
        (property) => [
          visit_expression(property[0], context, null),
          visit_expression(property[1], context, null)]),
      node)),
  UnaryExpression: (context, node, operator, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      visit_expression(expression, context, null),
      node)),
  BinaryExpression: (context, node, operator, expression1, expression2) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      visit_expression(expression1, context, null),
      visit_expression(expression2, context, null),
      node)),
  ConstructExpression: (context, node, expression, expressions) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.construct(
      visit_expression(expression, context, null),
      ArrayLite.map(
        expressions,
        (expression) => visit_expression(expression, context, null)),
      node)),
  ApplyExpression: (context, node, expression1, expression2, expressions) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.apply(
      visit_expression(expression1, context, null),
      visit_expression(expression2, context, null),
      ArrayLite.map(
        expressions,
        (expression) => visit_expression(expression, context, null)),
      node))};

// interface Context = {Source, Show, Serials, Pointcut, Namespace, Callee}
// type Serials = Map aran.Node Serial
// type Serial = Natural
// type Pointcut = ...
// type Show = Either aran.Label aran.Identifier => String
// type Namespace = (CalleeIdentifier, AdviceIdentifier, ParametersIdentifier)
// type CalleeIdentifier = () => aran.Identifier
// type AdviceIdentifier = aran.Identifier
// type ParametersIdentifier = aran.Identifier
module.exports = visit_program;
