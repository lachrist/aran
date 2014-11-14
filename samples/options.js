
(function () {

  aran.traps = {}
  aran.traps.wrap = function (x) { return {counter:0, value:x} }
  aran.traps.unwrap = function (v) { return v.value }
  aran.traps.unary = function (op, v) {
    return {
      counter: v.counter+1,
      value: eval(op+JSON.stringify(v.value))
    }
  }
  aran.traps.binary = function (op, v1, v2) {
    return {
      counter: v1.counter+v2.counter+1,
      value: eval(JSON.stringify(v1.value)+op+JSON.stringify(v2.value))
    }
  }
  aran.traps.apply = function (f, vs) {
    f.counter++
    return f.value.apply(f, vs)
  }
  aran.traps.new = function (c, vs) {
    c.counter++
    return new c.value.apply(c, vs)
  }
  aran.traps.get = function (o, k) {
    o.counter++
    return o.value[k.value]
  }
  aran.traps.set = function (o, k, v) {
    o.counter++
    return o.value[k.value] = v
  }
  aran.traps.delete = function (o, k) {
    o.counter++
    return delete o.value[k.value]
  }

  aran.hooks = {}
  var types = [
    "Program",
    "EmptyStatement",
    "BlockStatement",
    "ExpressionStatement",
    "IfStatement",
    "LabeledStatement",
    "BreakStatement",
    "ContinueStatement",
    "WithStatement",
    "SwitchStatement",
    "ReturnStatement",
    "ThrowStatement",
    "TryStatement",
    "WhileStatement",
    "DoWhileStatement",
    "ForStatement",
    "ForInStatement",
    "FunctionDeclaration",
    "VariableDeclaration",
    "ThisExpression",
    "ArrayExpression",
    "ObjectExpression",
    "FunctionExpression",
    "SequenceExpression",
    "UnaryExpression",
    "BinaryExpression",
    "AssignmentExpression",
    "UpdateExpression",
    "LogicalExpression",
    "ConditionalExpression",
    "NewExpression",
    "CallExpression",
    "MemberExpression",
    "Identifier",
    "Literal"
  ]
  types.forEach(function (type) {
    aran.hooks[type] = function () {
      var args = []
      for (var i=0; i<arguments.length; i++) { args.push(arguments[i]) }
      console.log("Executing: "+type+" "+JSON.stringify(args))
    }
  })

  window.$alert = function (v) { alert(aran.traps.unwrap(c)) }
  window.$prompt = function () { return aran.traps.wrap(prompt()) }
  window.$undefined = undefined

} ());
