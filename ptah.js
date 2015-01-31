
function nodify (x) {
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

exports.nodify = nodify

exports.empty = function () {
  return { type: "EmptyStatement" }
}

exports.identifier = function (name) {
  return {
    type: "Identifier",
    name: name
  }
}

exports.new = function (fct, args) {
  return {
    type: "NewExpression",
    callee: fct,
    arguments: args
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

exports.function = function (params, body) {
  return {
    type: "FunctionExpression",
    id: null,
    params: params.map(function (p) { return {type:"Identifier", name:p} }),
    body: {type:"BlockStatement", body:body},
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

exports.exprstmt = function (expression) {
  return {
    type: "ExpressionStatement",
    expression: expression
  }
}

exports.try = function (try_stmts, catch_param, catch_stmts, finally_stmts) {
  return {
    type: "TryStatement",
    block: {type:"BlockStatement", body:try_stmts},
    guardedHandlers: [],
    handlers: catch_param?[{type:"CatchClause", param:{type:"Identifier", name:catch_param}, body:{type:"BlockStatement", body:catch_stmts}}]:[],
    finalizer: finally_stmts?{type:"BlockStatement", body:finally_stmts}:null
  }
}

exports.unary = function (operator, argument) {
  return {
    type: "UnaryExpression",
    operator: operator,
    argument: argument
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

exports.for = function (init, test, update, body) {
  return {
    type: "ForStatement",
    init: init,
    test: test,
    update: update,
    body: body
  }
}

exports.if = function (test, consequent, alternate) {
  return {
    type: "IfStatement",
    test: test,
    consequent: consequent,
    alternate: alternate
  }
}

exports.return = function (argument) {
  return {
    type: "ReturnStatement",
    argument: argument
  }
}

exports.label = function (label, body) {
  if (typeof label === "string") { label = {type:"Identifier", name:label} }
  return {
    type: "LabeledStatement",
    label: label,
    body: body
  }
}

// exports.data_descr = function (configurable, enumerable, writable, value) {
//   return {
//     type: "ObjectExpression",
//     properties: [{
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"configurable"},
//       value:{type:"literal", value:configurable}
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"enumerable"},
//       value:{type:"literal", value:enumerable}
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"writable"},
//       value:{type:"literal", value:writable}
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"value"},
//       value:value
//     }]
//   }
// }

// exports.acce_descr = function (configurable, enumerable, get, set) {
//     return {
//     type: "ObjectExpression",
//     properties: [{
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"configurable"},
//       value:{type:"literal", value:configurable}
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"enumerable"},
//       value:{type:"literal", value:enumerable}
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"get"},
//       value:get
//     }, {
//       type:"property",
//       kind:"init",
//       name:{type:"identifier", name:"set"},
//       value:set
//     }]
//   }
// }



