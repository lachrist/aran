
/////////////
// Generic //
/////////////

exports.nodify = function (x) {
  if (x === null) { return {type:"Literal", value:x} }
  if (x instanceof RegExp) { return {type:"Literal", value:x} }
  if (["boolean", "string", "number"].indexOf(typeof x) !== -1) { return {type:"Literal", value:x} }
  if (x instanceof Array) { return { type:"ArrayExpression", elements:x.map(nodify) } }
  if (typeof x !== "object") { throw new Error ("Unknown type for "+x) }
  var node = {type:"ObjectExpression", properties:[]}
  for (var k in x) {
    node.properties.push({
      type: "Property",
      key: {type:"Identifier", name:k},
      value: nodify(x[k]),
      kind: "init"
    })
  }
  return node
}

exports.empty = function () {
  return { type: "EmptyStatement" }
}

exports.identifier = function (name) {
  return {
    type: "Identifier",
    name: name
  }
}

exports.literal = function (value) {
  return {
    type: "Literal",
    value: value
  }
}

exports.member = function (object, k) {
  return {
    type: "MemberExpression",
    computed: (typeof k !== "string"),
    object:object,
    property: (typeof k === "string")?exports.identifier(k):k
  }
}

exports.block = function (body) {
  return {
    type: "BlockStatement",
    body: body
  }
}

exports.call = function (callee, arguments) {
  return {
    type: "CallExpression",
    callee: callee,
    arguments: arguments
  }
}

exports.array = function (elements) {
  return {
    type: "ArrayExpression",
    elements: elements
  }
}

exports.declaration = function (id, init) {
  if (typeof id === "string") { id = exports.identifier(id) }
  return {
    type: "VariableDeclaration",
    kind: "var",
    declarations: [{type:"VariableDeclarator", id:id, init:init}]
  }
}

exports.conditional = function (test, consequent, alternate) {
  return {
    type: "ConditionalExpression",
    test: test,
    consequent: consequent,
    alternate: alternate
  }
}

exports.sequence = function (expressions) {
  return {
    type: "SequenceExpression",
    expressions: expressions
  }
}

exports.assignment = function (left, right) {
  return {
    type: "AssignmentExpression",
    operator: "=",
    left: left,
    right: right
  }
}

exports.expr_stmt = function (expression) {
  return {
    type: "ExpressionStatement",
    expression: expression
  }
}

exports.try_stmt = function (try_stmts, catch_clause, finally_stmts) {
  return {
    type: "TryStatement",
    block: block(try_stmts),
    guardedHandlers: [],
    handlers: catch_clause?[catch_clause]:[],
    finalizer: finally_stmts?block(finally_stmts):null
  }
}

exports.binary = function (operator, left, right) {
  return {
    type: "BinaryExpression",
    operator: operator,
    left: left,
    right: right
  }
}

exports.for_stmt = function (init, test, update, body) {
  return {
    type: "ForStatement",
    init: init,
    test: test,
    update: update,
    body: body
  }
}

exports.data_descr = function (configurable, enumerable, writable, value) {
  return {
    type: "ObjectExpression",
    properties: [{
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"configurable"},
      value:{type:"literal", value:configurable}
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"enumerable"},
      value:{type:"literal", value:enumerable}
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"writable"},
      value:{type:"literal", value:writable}
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"value"},
      value:value
    }]
  }
}

exports.acce_descr = function (configurable, enumerable, get, set) {
    return {
    type: "ObjectExpression",
    properties: [{
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"configurable"},
      value:{type:"literal", value:configurable}
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"enumerable"},
      value:{type:"literal", value:enumerable}
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"get"},
      value:get
    }, {
      type:"property",
      kind:"init",
      name:{type:"identifier", name:"set"},
      value:set
    }]
  }
}

exports.trap = function (aran) {
  
  function trap (name, args) { return exports.call(exports.member(shadow("traps"), name), args) }

  var wrap =   aran.traps.wrap   ? function (x) { return trap("wrap", [x]) }   : function (x) { return x }
  var unwrap = aran.traps.unwrap ? function (x) { return trap("unwrap", [x]) } : function (x) { return x } 

  var o = {wrap:wrap, unwrap:unwrap}

  if (aran.traps.get) { o.get = function (o, k) { return trap("get", [o, k]) } }
  else { o.get = function (o, k) { return exports.member(unwrap(o), unwrap(k)) } }

  if (aran.traps.set) { o.set = function (o, k) { return trap("set", [o, k, v]) } }
  else { o.get = function (o, k) { return exports.assignment(exports.member(unwrap(o), unwrap(k)), v) } }

  if (aran.traps.unary) { o.unary = function (op, arg) { return trap("unary", [o, k, v]) } }
  else { o.unary = function (op, arg) { return wrap(exports.unary(op, unwrap(arg))) } }

  if (aran.traps.delete) { o.delete = function (o, k) { return trap("delete", [o, k])} }
  else { o.delete = function (o, k) { return wrap(exports.unary("delete", exports.member(unwrap(o), unwrap(k)))) } }

  if (aran.traps.binary) { o.binary = function (op, arg1, arg2) { return trap("binary", [op, arg1, arg2]) } }
  else { o.binary = function (op, arg1, arg2) { return wrap(exports.binary(op, unwrap(arg1), unwrap(arg2))) } }

  if (aran.traps.apply) { o.apply = function (fct, th, args) { return trap("apply", [fct, th, args] )}}
  else { o.apply = function (fct, th, args) { return exports.call(shadow("apply"), [fct, th, args]) } }

  return o
  
}

///////////////////
// Aran-Specific //
///////////////////

var shadow = function (name) { return member(exports.identifier("aran"), name) }

exports.shadow = shadow

//exports.shadow_prototype = function (name) { return exports.member(shadow("prototypes"), name) }

exports.with = function (x) { return exports.call(shadow("with"), [x]) }

exports.hook = function (name, args) { return exports.call(exports.member(shadow("hooks"), name), args) }

exports.mark = function () { return exports.call(shadow("mark"), []) }
exports.unmark = function () { return exports.call(shadow("unmark"), []) }

exports.push = function (x) { return exports.call(shadow("push"), [x]) }
exports.push1 = function (x) { return exports.call(shadow("push1"), [x]) }
exports.push2 = function (x) { return exports.call(shadow("push2"), [x]) }
exports.push3 = function (x) { return exports.call(shadow("push3"), [x]) }

exports.pop = function () { return exports.call(shadow("pop"), []) }
exports.pop1 = function () { return exports.call(shadow("pop1"), []) }
exports.pop2 = function () { return exports.call(shadow("pop2"), []) }
exports.pop3 = function () { return exports.call(shadow("pop3"), []) }

exports.get = function () { return exports.call(shadow("get"), []) }
exports.get1 = function () { return exports.call(shadow("get1"), []) }
exports.get2 = function () { return exports.call(shadow("get2"), []) }
exports.get3 = function () { return exports.call(shadow("get3"), []) }
