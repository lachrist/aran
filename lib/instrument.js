
const ArrayLite = require("array-lite");
const Visit = require("./visit.js");
const Syntax = require("./syntax.js");
const Build = require("./build");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_toUpperCase = global.String.prototype.toUpperCase;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;

module.exports = (block, {eval, serials, pointcut, nodes, identifier}) => Visit(
  eval ? "block-eval" : "block-program",
  block,
  1 / 0,
  false,
  {
    __proto__: visitors,
    _serials: serials,
    _trap: mktrap(
      identifier,
      mkfork(pointcut, nodes),
      serials)});

const modify = ({0:expression}) => expression;

const inform = ({}) => []

const trapdata = {
  __proto__: null,
  // Informers //
  "enter": [inform, ["tag", "[label]", "[identifier]", "node"]],
  "leave": [inform, ["tag", "node"]],
  "continue": [inform, ["label", "node"]],
  "break": [inform, ["label", "node"]],
  "debugger": [inform, ["node"]],
  // Producers //
  "closure": [modify, ["expression", "node"]],
  "builtin": [modify, ["expression", "builtin-name", "node"]],
  "primitive": [modify, ["primitive", "node"]],
  "read": [modify, ["expression", "identifier", "node"]],
  "parameter": [modify, ["expression", "parameter-name", "node"]],
  // Consumer //
  "drop": [modify, ["expression", "node"]],
  "eval": [modify, ["expression", "node"]],
  "test": [modify, ["expression", "node"]],
  "write": [modify, ["expression", "identifier", "node"]],
  "return": [modify, ["expression", "node"]],
  "throw": [modify, ["expression", "node"]],
  // Combiners //
  "object": [
    ({0:expression, 1:expressions}) => Build.object(expression, expressions),
    ["expression", "[[expression]]", "node"]],
  "apply": [
    ({0:expression1, 1:expression2, 2:expressions}) => Build.apply(expression1, expression2, expressions),
    ["expression", "expression", "[expression]", "node"]],
  "construct": [
    ({0:expression, 1:expressions}) => Build.construct(expression, expressions),
    ["expression", "[expression]"]],
  "unary": [
    ({0:operator, 1:expression}) => Build.unary(operator, expression),
    ["unary-operator", "expression", "node"]],
  "binary": [
    ({0:operator, 1:expression1, 2:expression2}) => Build.binary(operator, expression1, expression2),
    ["binary-operator", "expression", "expression", "node"]]};

const pconvert = [
  (primitive) => primitive,
  (primitive) => Build.primitive(primitive)];

const converters = {
  __proto__: null,
   "identifier": [
     (identifier) => Identifier.Show(identifier),
     (identifier) => Build.primitive(
       Identifier.Show(identifier))],
  "[identifier]": [
    (identifiers) => ArrayLite.map(identifiers, Identifier.Show),
    (identifiers) => Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      ArrayLite.map(
        identifiers,
        (identifier) => Build.primitive(
          Identifier.Show(identifier))))],
  "expression": [
    (expression) => void 0,
    (expression) => expression],
  "[expression]": [
    (expressions) => expressions.length,
    (expressions) => Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      expressions)],
  "[[expression]]": [
    (expressionss) => expressionss.length,
    (expressionss) => Build.apply(
      Build.builtin("Array.of"),
      Build.primitive(void 0),
      ArrayLite.map(
        expressionss,
        (expressions) => Build.apply(
          Build.builtin("Array.of"),
          Build.primitive(void 0),
          expressions)))],
  "node": [
    (node, serials) => global_Reflect_apply(global_Map_prototype_get, serials, [node]),
    (node, serials) => Build.primitive(
      Reflect_apply(global_Map_prototype_get, serials, [node]))],
  "builtin-name": pconvert,
  "parameter-name": pconvert,
  "unary-operator": pconvert,
  "binary-operator": pconvert,
  "tag": pconvert,
  "label": pconvert};

const mktrap = (identifier, fork, serials) => ArrayLite.reduce(
  Reflect_ownKeys(trapdata),
  (traps, name) => (
    traps[name] = (...array) => (
      fork(
        name,
        ArrayLite.map(
          array,
          (arg, index) => converters[trapdata[name][1][index]][0](arg, serials))) ?
      Build.apply(
        Build.apply(
          Build.builtin("Reflect.get"),
          Build.primitive(void 0),
          [
            Build.read(identifier),
            Build.primitive(name)]),
        Build.read(identifier),
        ArrayLite.map(
          array,
          (arg, index) => converters[trapdata[name][1][index]][1](arg, serials))) :
        trapdata[name][0](array)),
    traps),
  {
    __proto__: null});

const mkfork = (nodes, pointcut) => (
  typeof pointcut === "function" ?
  (name, statics) => pointcut(name, nodes[statics[statics.length - 1]], statics) :
  (
    global_Array_isArray(pointcut) ?
    (name, statics) => ArrayLite.includes(pointcut, name) :
    (
      (
        typeof pointcut === "object" &&
        pointcut !== null) ?
      (name, statics) => (
        name in pointcut &&
        pointcut[name](nodes[statics[statics.length - 1]], statics)) :
      (name, statics) => global_Boolean(pointcut))));

const visitors = {
  __proto__: null,
  // BLOCK //
  BLOCK: function (tag, identifiers, labels, statementss, node) { return Build.BLOCK(
    [],
    [],
    Build.Try(
      Build.BLOCK(
        labels,
        identifiers,
        ArrayLite.concat(
          (
            Syntax.parameters[tag].length === 0 ?
            Build.Expression(
              this._traps.enter(
                tag,
                labels,
                Build.object(
                  Build.primitive(null),
                  []),
                identifiers,
                node)) :
            Build.Block(
              Build.BLOCK(
                [],
                [
                  Identifier.Meta1("parameters")],
                ArrayLite.concat(
                  Build.Expression(
                    Build.write(
                      Identifier.Meta1("parameters"),
                      Build.object(
                        Build.primitive(null),
                        ArrayLite.map(
                          Syntax.parameters[tag],
                          (parameter) => [
                            Build.primitive(parameter),
                            Build.read(
                              Identifier.Parameter(parameter))])))),
                  Build.Expression(
                    this._traps.enter(
                      tag,
                      labels,
                      Build.read(
                        Identifier.Meta1("parameters")),
                      identifiers,
                      node)),
                  ArrayLite.flatMap(
                    Syntax.parameters[tag],
                    (parameter) => Build.Expression(
                        Build.write(
                          Identifier.Parameter(parameter),
                          Build.apply(
                            Build.builtin("Reflect.get"),
                            Build.primitive(void 0),
                            [
                              Build.read(
                                Identifier.Meta1("parameters")),
                              Build.primitive(parameter)])))))))),
          ArrayLite.flat(statementss),
          Build.Expression(
            this._traps.completion(node)))),
      Build.BLOCK(
        [],
        [],
        Build.Expression(
          Build.Throw(
            this._traps.failure(
              Identifier.Parameter("error"),
              node)))),
      Build.BLOCK(
        [],
        [],
        Build.Expression(
          this._traps.leave(tag, node)))))},
  // Statement //
  _Expression_: function (expression, node) { return (
    expression[0] === "write" ?
    Build.Expression(
      Build.write(
        expression[1],
        this._traps.write(
          Visit("expression", expression[2], 1 / 0, false, this),
          expression[1],
          node))) :
    Build.Expression(
      this._traps.drop(
        Visit("expression", expression, 1 / 0, false, this),
        node)))},
  Break: function (label, node) { return ArrayLite.concat(
    Build.Expression(
      this._traps.break(label, node)),
    Build.Break(label))},
  Continue: function (label, node) {
    return ArrayLite.concat(
      Build.Expression(
        this._traps.continue(label, node)),
      Build.Continue(label))},
  Debugger: function (node) { return ArrayLite.concat(
      Build.Expression(
        this._traps.debugger(node)),
      Build.Debugger())},
  Return: function (expression, node) { return Build.Return(
    this._traps.return(expression, node)) },
  Block: function (block, node) { return Build.Block(block)},
  If: function (expression, block1, block2, node) { return Build.If(
    this._traps.test(expression, node),
    block1,
    block2)},
  Try: function (block1, block2, block3, node) { return Build.Try(
    block1,
    block2,
    block3)},
  While: function (expression, block, node) { return Build.While(
    this._traps.test(expression, node),
    block);
  },
  // Expression Producer //
  closure: function (block, node) { return this._traps.closure(
    Build.closure(block),
    node)},
  builtin: function (name, node) { return this._traps.builtin(
    Build.builtin(name),
    name,
    node)},
  primitive: function (primitive, node) { return this._traps.primitive(
    Build.primitive(primitive),
    node)},
  read: function (identifier, node) { return this._traps.read(
    Build.read(identifier),
    identifier,
    node)},
  // Expression Consumer //
  _sequence_: function (expression1, expression2, node) { return (
    expression1[0] === "write" ?
    Build.sequence(
      Build.write(
        expression1[1],
        this._traps.write(
          Visit("expression", expression1[2], 1 / 0, false, this),
          expression1[1],
          node)),
      Visit("expression", expression2, 1 / 0, false, this)) :
    Build.sequence(
      this._traps.drop(
        Visit("expression", expression1, 1 / 0, false, this),
        node),
      Visit("expression", expression2, 1 / 0, false, this)))},
  throw: function (expression, node) { return Build.throw(
    this._traps.throw(expression, node))},
  write: function (identifier, expression, node) { return Build.sequence(
    Build.write(
      identifier,
      this._traps.write(expression, identifier, node)),
    this._traps.primitive(
      Build.primitive(void 0),
      node))},
  eval: function (expression, node) { return Build.eval(
    this._traps.eval(expression, node))},
  conditional: function (expression1, expression2, expression3, node) { return Build.conditional(
    this._traps.test(expression1, node),
    expression2,
    expression3)},
  // Expression Combiner //
  // parameter: function (expression, node) { return Build.apply(
  //   Build.builtin("Reflect.get"),
  //   Build.primitive(void 0),
  //   [
  //     Build.read(
  //       Identifier.Parameters()),
  //     expression,
  //     node]) },
  apply: function (expression1, expression2, expressions, node) { return this._traps.apply(expression1, expression2, expressions, node) },
  construct: function (expression, expressions, node) { return this._traps.construct(expression, expressions, node) },
  unary: function (operator, expression, node) { return this._traps.unary(operator, expression, node) },
  binary: function (operator, expression1, expression2, node) { return this._traps.binary(operator, expression1, expression2, node) },
  object: function (expression, expressionss, node) { return this._traps.object(expression, expressionss, node) } 
};



