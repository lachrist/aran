"use strict";

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

const make_builtin = (namespace, show) => (name) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "Identifier",
    name: show(namespace)},
  property: {
    type: "Literal",
    value: name}});

const null_const = () => null;
const false_const = () => false;
const null_expression_callback_object = {__proto__:null};
const false_expression_callback_object = {__proto__:null};
ArrayLite.forEach(
  [
    // Producer //
    "primitive",
    "builtin",
    "read",
    "arrow",
    "constructor",
    "function",
    "method",
    // Consumers //
    "eval",
    "write",
    "sequence",
    "conditional",
    "throw",
    // Combiners //
    "unary",
    "binary",
    "object",
    "construct",
    "apply"],
  (type) => {
    null_expression_callback_object[type] = null_const;
    false_expression_callback_object[type] = false_const});

const is_primitive_expression_callback_object = {
  __proto__: false_expression_callback_object,
  primitive: (context, node, primitive) => Object.is(context, primitive) };

const extract_throw_argument_expression_callback_object = {
  __proto__: null_expression_callback_object,
  throw: (context, node, expression) => expression};

const extract_builtin_name_expression_callback_object = {
  __proto__: null_expression_callback_object,
  builtin: (context, node, builtin) => builtin};

const labelize = (labels, estree) => ArrayLite.reduce(
  ArrayLite.reverse(labels),
  (estree, label) => ({
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: estree}),
  estree);

const make_fresh = (namespace, _counter) => (
  _counter = 0,
  (identifiers) => identifiers[identifiers.length] = namespace + (++_counter));

const make_block_context = (context, tag, callee) => ({
  __proto__: global_Reflect_getPrototypeOf(context),
  tag: tag,
  callee: callee
});

const make_statement_context = (block_context, identifiers) => ({
  __proto__: global_Reflect_getPrototypeOf(block_context),
  identifiers: identifiers
});

const make_expression_context = (either_expression_context_statement_context, dropped) => (
  dropped === either_expression_context_statement_context.dropped ?
  either_expression_context_statement_context :
  {
    __proto__: global_Reflect_getPrototypeOf(either_expression_context_statement_context),
    identifiers: either_expression_context_statement_context.identifiers,
    dropped: dropped});

module.exports = (block, {local, namespaces, show}, _context) => (
  _context = {
    __proto__: {
      __proto__: null,
      show: show,
      fresh: make_fresh(namespaces.callee),
      builtin: make_builtin(namespaces.builtin, show)},
    tag: local ? "eval" : "program",
    callee: null},
  {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: (
          local ?
          {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              id: null,
              async: false,
              generator: false,
              expression: false,
              params: [],
              body: Tree._dispatch_block(block_callback_object, _context, block)},
            arguments: []} :
          {
            type: "ArrowFunctionExpression",
            id: null,
            async: false,
            generator: false,
            expression: false,
            params: [
              {
                type: "Identifier",
                name: show(namespaces.builtin)}],
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "VariableDeclaration",
                  kind: "const",
                  declarations: [
                    {
                      type: "VariableDeclarator",
                      id: {
                        type: "Identifier",
                        name: "eval"},
                      init: _context.builtin("eval")}]},
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    callee: {
                      type: "ArrowFunctionExpression",
                      id: null,
                      async: false,
                      generator: false,
                      expression: false,
                      params: [],
                      body: Tree._dispatch_block(block_callback_object, _context, block)},
                    arguments: []}}]}})}]});

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _identifiers, _estree) => (
    _identifiers = ArrayLite.concat(identifiers),
    _estree = ArrayLite.map(
      statements,
      (statement) => Tree._dispatch_statement(
        statement_callback_object,
        make_statement_context(context, _identifiers),
        statement)),
    {
      type: "BlockStatement",
      body: ArrayLite.concat(
        (
          context.tag === "program" ?
          [
            {
              type: "ExpressionStatement",
              expression: {
                type: "Literal",
                value: "use strict"}}] :
          []),
        (
          context.callee === null ?
          [] :
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: context.show("callee")},
                  init: {
                    type: "Identifier",
                    name: context.show(context.callee)}}]}]),
        (
          (
            context.tag === "constructor" ||
            context.tag === "function") ?
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: context.show("new.target")},
                  init: {
                    type: "MetaProperty",
                    meta: {
                      type: "Identifier",
                      name: "new"},
                    property: {
                      type: "Identifier",
                      name: "target"}}}]}] :
          []),
        (
          (
            context.tag === "function" ||
            context.tag === "method") ?
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: context.show("this")},
                  init: {
                    type: "ThisExpression"}}]}] :
          []),
        (
          _identifiers.length === 0 ?
          [] :
          [
            {
              type: "VariableDeclaration",
              kind: "let",
              declarations: ArrayLite.map(
                _identifiers,
                (identifier) => ({
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: context.show(identifier)},
                  init: null}))}]),
        _estree)})};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression, _nullable_expression) => (
    _nullable_expression = Tree._dispatch_expression(
      extract_throw_argument_expression_callback_object,
      null,
      expression),
    (
      _nullable_expression === null ?
      {
        type: "ExpressionStatement",
        expression: Tree._dispatch_expression(
          expression_callback_object,
          make_expression_context(context, true),
          expression)} :
      {
        type: "ThrowStatement",
        argument: Tree._dispatch_expression(
          expression_callback_object,
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            identifiers: context.identifiers,
            dropped: false},
          _nullable_expression)})),
  Return: (context, node, expression) => ({
    type: "ReturnStatement",
    argument: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression)}),
  Break: (context, node, label) => ({
    type: "BreakStatement",
    label: {
      type: "Identifier",
      name: label}}),
  Continue: (context, node, label) => ({
    type: "ContinueStatement",
    label: {
      type: "Identifier",
      name: label}}),
  Debugger: (context, node) => ({
    type: "DebuggerStatement"}),
  // BlockFull //
  Lone: (context, node, labels, block) => labelize(
    labels,
    Tree._dispatch_block(
      block_callback_object,
      make_block_context(context, "lone", null),
      block)),
  If: (context, node, labels, expression, block1, block2) => labelize(
    labels,
    {
      type: "IfStatement",
      test: Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression),
      consequent: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "then", null),
        block1),
      alternate: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "else", null),
        block2)}),
  While: (context, node, labels, expression, block) => labelize(
    labels,
    {
      type: "WhileStatement",
      test: Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression),
      body: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "do", null),
        block)}),
  Try: (context, node, labels, block1, block2, block3, _statements) => labelize(
    labels,
    {
      type: "TryStatement",
      block: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "try", null),
        block1),
      handler: {
        type: "CatchClause",
        param: {
          type: "Identifier",
          name: context.show("error")},
        body: Tree._dispatch_block(
          block_callback_object,
          make_block_context(context, "catch", null),
          block2)},
      finalizer: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "finally", null),
        block3)})};

const make_closure_callback = (tag) => (context, node, block, _identifier, _estree) => (
  _identifier = context.fresh(context.identifiers),
  _estree = {
    type: (
      tag === "arrow" ?
      "ArrowFunctionExpression" :
      "FunctionExpression"),
    id: null,
    async: false,
    generator: false,
    expression: false,
    params: [
      {
        type: "RestElement",
        argument: {
          type: "Identifier",
          name: context.show("arguments")}}],
    body: Tree._dispatch(
      block_callback_object,
      make_block_context(context, tag, _identifier),
      block)},
  {
    type: "SequenceExpression",
    expressions: ArrayLite.concat(
      [
        {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "Identifier",
            name: context.show(_identifier)},
          right: (
            tag === "method" ?
            {
              type: "MemberExpression",
              optional: false,
              computed: true,
              object: {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    computed: true,
                    shorthand: false,
                    kind: "init",
                    method: true,
                    key: {
                      type: "Literal",
                      value: 0},
                    value: _estree}]},
              property: {
                type: "Literal",
                value: 0}} :
            _estree)},
        {
          type: "UnaryExpression",
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.show(_identifier)},
            property: {
              type: "Identifier",
              name: "length"}}},
        {
          type: "UnaryExpression",
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.show(_identifier)},
            property: {
              type: "Identifier",
              name: "name"}}}],
      (
        (
          tag === "constructor" ||
          tag === "function") ?
        [
          {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "MemberExpression",
              computed: false,
              optional: false,
              object: {
                type: "Identifier",
                name: context.show(_identifier)},
              property: {
                type: "Identifier",
                name: "prototype"}},
            right: {
              type: "Literal",
              value: null}}] :
        []),
      [
        {
          type: "Identifier",
          name: context.show(_identifier)}])});

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => (
    primitive === void 0 ?
    {
      type: "UnaryExpression",
      operator: "void",
      argument: {
        type: "Literal",
        value: 0}} :
    {
      type: "Literal",
      value: primitive}),
  builtin: (context, node, builtin) => context.builtin(builtin),
  read: (context, node, identifier) => ({
    type: "Identifier",
    name: context.show(identifier)}),
  arrow: make_closure_callback("arrow"),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  // Consumers //
  eval: (context, node, expression) => ({
    type: "CallExpression",
    optional: false,
    callee: {
      type: "Identifier",
      name: "eval"},
    arguments: [
      Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression)]}),
  write: (context, node, identifier, expression, _estree) => (
    _estree = {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: context.show(identifier)},
      right: Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression)},
    (
      context.dropped ?
      _estree :
      {
        type: "SequenceExpression",
        expressions: [
          _estree,
          {
            type: "UnaryExpression",
            operator: "void",
            argument: {
              type: "Literal",
              value: 0}}]})),
  conditional: (context, node, expression1, expression2, expression3) => ({
    type: "ConditionalExpression",
    test: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression1),
    consequent: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression2),
    alternate: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression3)}),
  sequence: (context, node, expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, true),
        expression1),
      Tree._dispatch_expression(
        expression_callback_object,
        context,
        expression2)]}),
  throw: (context, node, expression) => ({
    type: "CallExpression",
    optional: false,
    callee: {
      type: "ArrowFunctionExpression",
      id: null,
      async: false,
      generator: false,
      expression: false,
      params: [],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ThrowStatement",
            argument: Tree._dispatch_expression(
              expression_callback_object,
              make_expression_context(context, false),
              expression)}]}},
    arguments: []}),
  // Combiner //
  unary: (context, node, operator, expression) => ({
    type: "UnaryExpression",
    operator: operator,
    argument: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression)}),
  binary: (context, node, operator, expression1, expression2) => ({
    type: "BinaryExpression",
    operator: operator,
    left: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression1),
    right: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression2)}),
  object: (context, node, expression, properties) => ({
    type: "ObjectExpression",
    properties: ArrayLite.concat(
      [
        {
          type: "Property",
          kind: "init",
          shorthand: false,
          computed: false,
          method: false,
          key: {
            type: "Identifier",
            name: "__proto__"},
          value: Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            expression)}],
      ArrayLite.map(
        properties,
        (property) => ({
          type: "Property",
          kind: "init",
          shorthand: false,
          computed: true,
          method: false,
          key: Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            property[0]),
          value: Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            property[1])})))}),
  construct: (context, node, expression, expressions) => ({
    type: "NewExpression",
    callee: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression),
    arguments: ArrayLite.map(
      expressions,
      (expression) => Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression))}),
  apply: (context, node, expression1, expression2, expressions, _estree) => (
    Tree._dispatch(
      is_primitive_expression_callback_object,
      void 0,
      expression2) ?
    (
      (
        Tree._dispatch_expression(
          extract_builtin_name_expression_callback_object,
          null,
          expression1) ===
        "Array.of") ?
      {
        type: "ArrayExpression",
        elements: ArrayLite.map(
          expressions,
          (expression) => Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            expression))} :
      {
        type: "CallExpression",
        optional: false,
        callee: (
          _estree = Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            expression1),
          (
            _estree.type === "MemberExpression" ?
            {
              type: "SequenceExpression",
              expressions: [
                {
                  type: "Literal",
                  value: 0},
                _estree]} :
            _estree)),
        arguments: ArrayLite.map(
          expressions,
          (expression) => Tree._dispatch_expression(
            expression_callback_object,
            make_expression_context(context, false),
            expression))}) :
    {
      type: "CallExpression",
      optional: false,
      callee: context.builtin("Reflect.apply"),
      arguments: [
        Tree._dispatch_expression(
          expression_callback_object,
          make_expression_context(context, false),
          expression1),
        Tree._dispatch_expression(
          expression_callback_object,
          make_expression_context(context, false),
          expression2),
        {
          type: "ArrayExpression",
          elements: ArrayLite.map(
            expressions,
            (expression) => Tree._dispatch_expression(
              expression_callback_object,
              make_expression_context(context, false),
              expression))}]})};
