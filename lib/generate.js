"use strict";

const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const global_Object_is = global.Object.is;

const make_builtin_expression = (convert, builtin_identifier, builtin) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "Identifier",
    name: convert(builtin_identifier)},
  property: {
    type: "Literal",
    value: builtin}});

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
  primitive: (context, node, primitive) => global_Object_is(context, primitive) };

const extract_throw_argument_expression_callback_object = {
  __proto__: null_expression_callback_object,
  throw: (context, node, expression) => expression};

const labelize = (labels, estree) => ArrayLite.reduce(
  ArrayLite.reverse(labels),
  (estree, label) => ({
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: estree}),
  estree);

const make_block_context = (context, tag, callee) => ({
  __proto__: global_Reflect_getPrototypeOf(context),
  tag: tag,
  callee: callee});

const make_statement_context = (block_context, identifiers) => ({
  __proto__: global_Reflect_getPrototypeOf(block_context),
  identifiers: identifiers});

const make_expression_context = (either_expression_context_statement_context, dropped) => (
  dropped === either_expression_context_statement_context.dropped ?
  either_expression_context_statement_context :
  {
    __proto__: global_Reflect_getPrototypeOf(either_expression_context_statement_context),
    identifiers: either_expression_context_statement_context.identifiers,
    dropped: dropped});

// type Block = aran.Block
// type Local = Boolean
// type Namespace = (Callee, Builtin)
// type Callee = () => aran.Identifiers
// type Builtin = aran.Identifier
// type Convert = aran.Identifier -> estree.Identifier
module.exports = (block, context, {local, namespace, convert, apply, construct}) => (
  context = {
    __proto__: {
      __proto__: null,
      convert,
      apply,
      construct,
      namespace},
    tag: context.mode,
    callee: null},
  {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: (
          context.tag === "local-eval" ?
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
              body: Tree._dispatch_block(block_callback_object, context, block)},
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
                name: convert(namespace.builtin)},
              {
                type: "Identifier",
                name: convert(namespace.apply)},
              {
                type: "Identifier",
                name: "eval"}],
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: convert(namespace.apply)},
                    right: {
                      type: "LogicalExpression",
                      operator: "||",
                      left: {
                        type: "Identifier",
                        name: convert(namespace.apply)},
                      right: make_builtin_expression(convert, namespace.builtin, "Reflect.apply")}}},
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: "eval"},
                    right: {
                      type: "LogicalExpression",
                      operator: "||",
                      left: {
                        type: "Identifier",
                        name: "eval"},
                      right: make_builtin_expression(convert, namespace.builtin, "eval")}}},
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
                      body: Tree._dispatch_block(block_callback_object, context, block)},
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
          (
            context.tag === "global-eval" ||
            context.tag === "script") ?
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
                    name: context.convert("callee")},
                  init: {
                    type: "Identifier",
                    name: context.convert(context.callee)}}]}]),
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
                    name: context.convert("new.target")},
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
                    name: context.convert("this")},
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
                    name: context.convert(identifier)},
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
          name: context.convert("error")},
        body: Tree._dispatch_block(
          block_callback_object,
          make_block_context(context, "catch", null),
          block2)},
      finalizer: Tree._dispatch_block(
        block_callback_object,
        make_block_context(context, "finally", null),
        block3)})};

const make_closure_callback = (tag) => (context, node, block, _identifier, _estree) => (
  _identifier = context.namespace.callee(),
  context.identifiers[context.identifiers.length] = _identifier,
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
          name: context.convert("arguments")}}],
    body: Tree._dispatch_block(
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
            name: context.convert(_identifier)},
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
          prefix: true,
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.convert(_identifier)},
            property: {
              type: "Identifier",
              name: "length"}}},
        {
          type: "UnaryExpression",
          prefix: true,
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.convert(_identifier)},
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
                name: context.convert(_identifier)},
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
          name: context.convert(_identifier)}])});

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => (
    primitive === void 0 ?
    {
      type: "UnaryExpression",
      prefix: true,
      operator: "void",
      argument: {
        type: "Literal",
        value: 0}} :
    {
      type: "Literal",
      value: primitive}),
  builtin: (context, node, builtin) => make_builtin_expression(context.convert, context.namespace.builtin, builtin),
  read: (context, node, identifier) => ({
    type: "Identifier",
    name: context.convert(identifier)}),
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
        name: context.convert(identifier)},
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
            prefix: true,
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
  unary: (context, node, operator, expression) => (
    context = make_expression_context(context, false),
    {
      type: "UnaryExpression",
      prefix: true,
      operator: operator,
      argument: Tree._dispatch_expression(expression_callback_object, context, expression)}),
  binary: (context, node, operator, expression1, expression2) => (
    context = make_expression_context(context, false),
    {
      type: "BinaryExpression",
      operator: operator,
      left: Tree._dispatch_expression(expression_callback_object, context, expression1),
      right: Tree._dispatch_expression(expression_callback_object, context, expression2)}),
  object: (context, node, expression, properties) => (
    context = make_expression_context(context, false),
    {
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
            value: Tree._dispatch_expression(expression_callback_object, context, expression)}],
        ArrayLite.map(
          properties,
          (property) => ({
            type: "Property",
            kind: "init",
            shorthand: false,
            computed: true,
            method: false,
            key: Tree._dispatch_expression(expression_callback_object, context, property[0]),
            value: Tree._dispatch_expression(expression_callback_object, context, property[1])})))}),
  construct: (context, node, expression, expressions, _visit) => (
    context = make_expression_context(context, false),
    _visit = (expression) => Tree._dispatch_expression(expression_callback_object, context, expression),
    (
      context.construct(_visit, expression, expressions) ||
      {
        type: "NewExpression",
        callee: _visit(expression),
        arguments: ArrayLite.map(expressions, _visit)})),
  apply: (context, node, expression1, expression2, expressions, _estree, _visit) => (
    context = make_expression_context(context, false),
    _visit = (expression) => Tree._dispatch_expression(expression_callback_object, context, expression),
    (
      context.apply(_visit, expression1, expression2, expressions) ||
      (
        Tree._dispatch_expression(
          is_primitive_expression_callback_object,
          void 0,
          expression2) ?
        {
          type: "CallExpression",
          optional: false,
          callee: (
            _estree = _visit(expression1),
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
          arguments: ArrayLite.map(expressions, _visit)} :
        {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Identifier",
            name: context.convert(context.namespace.apply)},
          arguments: [
            _visit(expression1),
            _visit(expression2),
            {
              type: "ArrayExpression",
              elements: ArrayLite.map(expressions, _visit)}]})))};
