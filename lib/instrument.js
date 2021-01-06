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
        import: _convert("specifier", trade.import),
        source: _convert("source", trade.source)} :
      (
        trade.type === "export" ?
        {
          __proto__: null,
          type: "export",
          export: _convert("specifier", trade.export)} :
        // console.assert(trade.type === "aggregate")
        {
          __proto__: null,
          type: "aggregate",
          import: _convert("specifier", trade.import),
          source: _convert("source", trade.source),
          export: _convert("specifier", trade.export)})),
    "input": (sort) => ArrayLite.reduce(
      parameter_array_object[sort],
      (object, key) => (
        object[key] = null,
        object),
      {__proto__:null}),
    "enclave-identifier": (identifier) => identifier,
    "strict": (strict) => strict,
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
      Tree._match(null, expression, primitive_matcher) ?
      Tree._extract(null, expression, "primitive", primitive_extractor) :
      void 0),
    "intrinsic": (intrinsic) => intrinsic,
    "sort": (sort) => sort,
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
    "trade": (trade) => Tree.object(
      Tree.primitive(null),
      ArrayLite.concat(
        [
          [
            Tree.primitive("type"),
            Tree.primitive(trade.type)]],
        (
          trade.type === "export" ?
          [] :
          [
            [
              Tree.primitive("import"),
              _convert("specifier", trade.import)],
            [
              Tree.primitive("source"),
              _convert("source", trade.source)]]),
        (
          trade.type === "import" ?
          [] :
          [
            [
              Tree.primitive("export"),
              _convert("specifier", trade.export)]]))),
    "frame": (frame) => Tree.object(
      Tree.primitive(null),
      [
        [
          Tree.primitive("module"),
          _convert(["trade"], frame.module)],
        [
          Tree.primitive("labels"),
          _convert(["label"], frame.labels)],
        [
          Tree.primitive("identifiers"),
          _convert(["identifier"], frame.identifiers)]]),
    "perform-eval": () => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.eval(
              Tree.apply(
                Tree.intrinsic("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.intrinsic("Reflect.get"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("arguments")]),
                  Tree.primitive(0)])))])),
    "perform-require": () => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.require(
              Tree.apply(
                Tree.intrinsic("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.intrinsic("Reflect.get"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("arguments")]),
                  Tree.primitive(0)])))])),
    "enclave-identifier": (identifier) => Tree.primitive(identifier),
    "strict": (strict) => Tree.primitive(strict),
    "perform-enclave-read": (identifier) => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.enclave_read(identifier))])),
    "perform-enclave-typeof": (identifier) => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.enclave_typeof(identifier))])),
    "perform-enclave-write": ({strict, identifier}) => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.enclave_write(
              strict,
              identifier,
              Tree.apply(
                Tree.intrinsic("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.intrinsic("Reflect.get"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("arguments")]),
                  Tree.primitive(0)])))])),
    "perform-enclave-super-member": (unit) => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.enclave_super_member(
              Tree.apply(
                Tree.intrinsic("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.intrinsic("Reflect.get"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("arguments")]),
                  Tree.primitive(0)])))])),
    "perform-enclave-super-call": (unit) => Tree.arrow(
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Return(
            Tree.enclave_super_call(
              Tree.apply(
                Tree.intrinsic("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.apply(
                    Tree.intrinsic("Reflect.get"),
                    Tree.primitive(void 0),
                    [
                      Tree.read("input"),
                      Tree.primitive("arguments")]),
                  Tree.primitive(0)])))])),
    "input": (input) => Tree.read("input"),
    "node": (node) => Tree.primitive(
      global_Reflect_apply(global_Map_prototype_get, serials, [node])),
    "expression": (expression) => expression,
    "source": (source) => Tree.primitive(source),
    "specifier": (specifier) => Tree.primitive(specifier),
    "primitive": (primitive) => primitive,
    "intrinsic": (intrinsic) => Tree.primitive(intrinsic),
    "sort": (sort) => Tree.primitive(sort),
    "label": (label, _object) => (
      _object = unmangle.label(label),
      Tree.object(
        Tree.primitive(null),
          ArrayLite.map(
            global_Reflect_ownKeys(_object),
            (string) => [
              Tree.primitive(string),
              Tree.primitive(_object[string])]))),
    "identifier": (identifier, _object) => (
      _object = unmangle.identifier(identifier),
      Tree.object(
        Tree.primitive(null),
          ArrayLite.map(
            global_Reflect_ownKeys(_object),
            (string) => [
              Tree.primitive(string),
              Tree.primitive(_object[string])]))),
    "operator": (operator) => Tree.primitive(operator)},
  _convert = (type, value) => (
    typeof type === "string" ?
    _converters[type](value) :
    // console.assert(global_Array_isArray(type))
    Tree.apply(
      Tree.intrinsic("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(
        value,
        (
          type.length === 1 ?
          (value) => _convert(type[0], value) :
          (value, index) => _convert(type[index], value))))),
  (name, args, types) => Tree.apply(
    Tree.apply(
      Tree.intrinsic("Reflect.get"),
      Tree.primitive(void 0),
      [
        Tree.intrinsic("aran.advice"),
        Tree.primitive(name)]),
    Tree.intrinsic("aran.advice"),
    ArrayLite.map(
      args,
      (arg, index) => _convert(types[index], arg))));

const pass = () => Tree.primitive(void 0);
const forward_first = (arg1) => arg1;
const forward_second = (arg1, arg2) => arg2;
const forward_third = (arg1, arg2, arg3) => arg3;

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
      (sort, frame, input, node) => Tree.read("input")],
    ["primitive", ["primitive", "node"], forward_first],
    ["closure", ["sort", "expression", "node"], forward_second],
    ["intrinsic", ["intrinsic", "expression", "node"], forward_second],
    ["import", ["specifier", "source", "expression", "node"], forward_third],
    ["read", ["identifier", "expression", "node"], forward_second],
    // Consumers //
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
      (identifier, perform, node) => Tree.enclave_read(identifier)],
    [
      "enclave_typeof",
      ["enclave-identifier", "perform-enclave-typeof", "node"],
      (identifier, perform, node) => Tree.enclave_typeof(identifier)],
    [
      "enclave_write",
      ["strict", "enclave-identifier", "expression", "perform-enclave-write", "node"],
      (strict, identifier, expression, perform, node) => Tree.enclave_write(strict, identifier, expression)],
    [
      "enclave_super_member",
      ["expression", "perform-enclave-super-member", "node"],
      (expression, perform, node) => Tree.enclave_super_member(expression)],
    [
      "enclave_super_call",
      ["expression", "perform-enclave-super-call", "node"],
      (expression, perform, node) => Tree.enclave_super_call(expression)],
    [
      "eval",
      ["expression", "perform-eval", "node"],
      (expression, perform, node) => Tree.eval(expression)],
    [
      "require",
      ["expression", "perform-require", "node"],
      (expression, perform, node) => Tree.require(expression)],
    [
      "object",
      ["expression", [["expression", "expression"]], "node"],
      (expression, properties, node) => Tree.object(expression, properties)],
    [
      "unary",
      ["operator", "expression", "node"],
      (operator, expression, node) => Tree.unary(operator, expression)],
    [
      "binary",
      ["operator", "expression", "expression", "node"],
      (operator, expression1, expression2, node) => Tree.binary(operator, expression1, expression2)],
    [
      "construct",
      ["expression", ["expression"], "node"],
      (expression, expressions) => Tree.construct(expression, expressions)],
    [
      "apply",
      ["expression", "expression", ["expression"], "node"],
      (expression1, expression2, expressions) => Tree.apply(expression1, expression2, expressions)]],
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
const visit_program = (program, options) => Tree._dispatch(
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

const visit_prelude = (prelude, context) => Tree._dispatch(
  {
    __proto__: fetch(context, "program"),
    type: "prelude"},
  prelude,
  prelude_callback_object);

const visit_block = (block, context, options) => Tree._dispatch(
  global_Object_assign(
    {
      __proto__: fetch(context, "program"),
      type: "block",
      sort: void 0,
      module: []},
    options),
  block,
  block_callback_object);

const visit_statement = (statement, context, options) => Tree._dispatch(
  global_Object_assign(
    {
      __proto__: fetch(context, "block"),
      type: "statement",
      identifiers: void 0},
    options),
  statement,
  statement_callback_object);

const visit_expression = (expression, context, options) => Tree._dispatch(
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
  _program: (context, node, preludes, block) => Tree._program(
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
  _import: (context, node, specifier, source) => ({
    __proto__: null,
    type: "import",
    import: specifier,
    source: source}),
  _export: (context, node, specifier) => ({
    __proto__: null,
    type: "export",
    export: specifier}),
  _aggregate: (context, node, specifier1, source, specifier2) => ({
    __proto__: null,
    type: "aggregate",
    import: specifier1,
    source: source,
    export: specifier2})};

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, labels, identifiers, statements, _identifiers, _statements, _expression1, _expression2, _expression3, _expression4) => (
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
          Tree._match(null, _expression1, read_input_matcher) ?
          Tree.Bundle([]) :
          Tree.Lift(
            Tree.write("input", _expression1)))),
      Tree.Bundle(
        ArrayLite.map(
          statements,
          (statement) => visit_statement(statement, context, {identifiers:_identifiers}))),
      inform(
        context.weave.completion(context.sort, node))],
    _expression2 = context.weave.failure(
      context.sort,
      Tree.apply(
        Tree.intrinsic("Reflect.get"),
        Tree.primitive(void 0),
        [
          Tree.read("input"),
          Tree.primitive("error")]),
      node),
    _expression3 = context.weave.leave(context.sort, node),
    (
      (
        Tree._match(null, _expression2, get_error_matcher) &&
        Tree._match(null, _expression3, primitive_undefined_matcher)) ?
      Tree.BLOCK(labels, _identifiers, _statements) :
      Tree.BLOCK(
        [],
        [],
        [
          Tree.Try(
            Tree.BLOCK(labels, _identifiers, _statements),
            Tree.BLOCK(
              [],
              [],
              [
                Tree.Lift(
                  Tree.throw(_expression2))]),
            Tree.BLOCK(
              [],
              [],
              [
                inform(_expression3)]))])))};

const inform = (expression) => (
  Tree._match(null, expression, primitive_undefined_matcher) ?
  Tree.Bundle([]) :
  Tree.Lift(expression));

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression) => Tree.Lift(
    visit_expression(expression, context, {dropped:node})),
  Break: (context, node, label, _expression) => Tree.Bundle(
    [
      inform(
        context.weave.break(label, node)),
      Tree.Break(label)]),
  Return: (context, node, expression) => Tree.Return(
    context.weave.return(
      visit_expression(expression, context, null),
      node)),
  Debugger: (context, node) => Tree.Bundle(
    [
      inform(
        context.weave.debugger(node)),
      Tree.Debugger()]),
  Lone: (context, node, block) => Tree.Lone(
    visit_block(
      block,
      context,
      {sort: "lone"})),
  While: (context, node, expression, block) => Tree.While(
    context.weave.test(
      visit_expression(expression, context, null),
      node),
    visit_block(
      block,
      context,
      {sort: "do"})),
  If: (context, node, expression, block1, block2) => Tree.If(
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
  Try: (context, node, block1, block2, block3) => Tree.Try(
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

const update_callee_1 = (context, node, expression1, expression2, expressions) => Tree.apply(
  expression1,
  expression2,
  [
    expressions[0],
    Tree._extract(context, expressions[1], context.sort, update_callee_2),
    expressions[2]]);

const update_callee_2 = (context, node, block) => Tree[context.sort](
  Tree._extract(context, block, "BLOCK", update_callee_3));

const update_callee_3 = (context, node, labels, identifiers, statements) => Tree.BLOCK(
  labels,
  identifiers,
  ArrayLite.concat(
    [
      Tree.Lift(
        Tree.apply(
          Tree.intrinsic("Reflect.set"),
          Tree.primitive(void 0),
          [
            Tree.read("input"),
            Tree.primitive("callee"),
            Tree.read(context.identifier)]))],
    statements));

const make_closure_callback = (sort, _matcher) => (
  _matcher = [sort, (context, block) => true],
  (context, node, block, _expression, _identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    (
      _expression = context.weave.closure(
        sort,
        Tree[sort](
          visit_block(block, context, {sort})),
        node),
      (
        Tree._match(null, _expression, _matcher) ?
        _expression :
        (
          _identifier = `${context.namespace["overwritten-callee"]}_${global_String(fetch(context, "program").counter++)}`,
          context.identifiers[context.identifiers.length] = _identifier,
          Tree.sequence(
            Tree.write(
              _identifier,
              Tree._extract(
                {
                  sort,
                  identifier: _identifier},
                _expression,
                "apply",
                update_callee_1)),
            Tree.read(_identifier)))))));

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.primitive(node, node)),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  arrow: make_closure_callback("arrow"),
  import: (context, node, specifier, source) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.import(
      specifier,
      source,
      Tree.import(specifier, source),
      node)),
  read: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.read(
      identifier,
      Tree.read(identifier),
      node)),
  intrinsic: (context, node, intrinsic) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.intrinsic(
      intrinsic,
      Tree.intrinsic(intrinsic),
      node)),
  // Consumer //
  throw: (context, node, expression) => Tree.throw(
    context.weave.throw(
      visit_expression(expression, context, null),
      node)),
  export: (context, node, specifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    Tree.export(
      specifier,
      context.weave.export(
        specifier,
        visit_expression(expression, context, null),
        node))),
  write: (context, node, identifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    Tree.write(
      identifier,
      context.weave.write(
        identifier,
        visit_expression(expression, context, null),
        node))),
  sequence: (context, node, expression1, expression2) => Tree.sequence(
    visit_expression(expression1, context, {dropped:node}),
    visit_expression(expression2, context, {dropped:context.dropped})),
  conditional: (context, node, expression1, expression2, expression3) => Tree.conditional(
    context.weave.test(
      visit_expression(expression1, context, null),
      node),
    visit_expression(expression2, context, {dropped:context.dropped}),
    visit_expression(expression3, context, {dropped:context.dropped})),
  // Combiner //
  eval: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.eval(
      visit_expression(expression, context, null),
      null,
      node)),
  require: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.require(
      visit_expression(expression, context, null),
      null,
      node)),
  enclave_read: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_read(
      identifier,
      identifier,
      node)),
  enclave_typeof: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_typeof(
      identifier,
      identifier,
      node)),
  enclave_write: (context, node, strict, identifier, expression) => check_dropped_2(
    node,
    context.weave,
    context.dropped,
    context.weave.enclave_write(
      strict,
      identifier,
      visit_expression(expression, context, null),
      {strict, identifier},
      node)),
  enclave_super_member: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_super_member(
      visit_expression(expression, context, null),
      null,
      node)),
  enclave_super_call: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.enclave_super_call(
      visit_expression(expression, context, null),
      null,
      node)),
  object: (context, node, expression, properties) => check_dropped_1(
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
  unary: (context, node, operator, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      visit_expression(expression, context, null),
      node)),
  binary: (context, node, operator, expression1, expression2) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      visit_expression(expression1, context, null),
      visit_expression(expression2, context, null),
      node)),
  construct: (context, node, expression, expressions) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.construct(
      visit_expression(expression, context, null),
      ArrayLite.map(
        expressions,
        (expression) => visit_expression(expression, context, null)),
      node)),
  apply: (context, node, expression1, expression2, expressions) => check_dropped_1(
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
