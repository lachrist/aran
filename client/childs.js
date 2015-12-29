
(function () {

  function strict (ast) {
    return ast.type === "ExpressionStatement"
      && ast.expression.type === "Literal"
      && ast.expression.value === "use strict";
  }

  aran.childs = {};

  aran.childs.Program = function (x) {
    var xs = [];
    for (var i=0; i<x.body.length; i++)
      xs[xs.length] = x.body[i];
    return xs;
  };

  aran.childs.EmptyStatement = function (x) { return [] };

  aran.childs.BlockStatement = function (x) {
    var xs = [];
    for (var i=0; i<x.body.length; i++)
      xs[xs.length] = x.body[i];
    return xs;
  };

  aran.childs.ExpressionStatement = function (x) { return [x.expression] };

  aran.childs.IfStatement = function (x) { return x.alternate ? [x.test, x.consequent, x.alternate] : [x.test, x.consequent] };

  aran.childs.LabeledStatement = function (x) { return [] };

  aran.childs.BreakStatement = function (x) { return [] };

  aran.childs.ContinueStatement = function (x) { return [] };

  aran.childs.WithStatement = function (x) { return [x.object, x.body] };

  aran.childs.SwitchStatement = function (x) {
    var xs = [x.discriminant];
    for (var i=0; i<x.cases.length; i++) {
      if (x.cases[i].test)
        xs[xs.length] = x.cases[i].test;
      for (var j=0; j<x.cases[i].consequent.length; j++)
        xs[xs.length] = x.cases[i].consequent[j];
    }
    return xs;
  };

  aran.childs.ReturnStatement = function (x) { return x.argument ? [x.argument] : [] };

  aran.childs.ThrowStatement = function (x) { return [x.argument] };

  aran.childs.TryStatement = function (x) {
    var xs = [];
    for (var i=0; i<x.block.body.length; i++)
      xs[xs.length] = x.block.body[i];
    if (x.handler)
      for (var i=0; i<x.handler.body.body.length; i++)
        xs[xs.length] = x.handler.body.body[i];
    if (x.finalizer)
      for (var i=0; i<x.finalizer.body.length; i++)
        xs[xs.length] = x.finalizer.body[i];
    return xs;
  };

  aran.childs.WhileStatement = function (x) { return [x.test, x.body] };

  aran.childs.DoWhileStatement = function (x) { return [x.body, x.test] };

  aran.childs.ForStatement = function (x) {
    var xs = [];
    if (x.init) {
      if (x.init.type === "VariableDeclaration") {
        for (var i=0; i<x.init.declarations.length; i++)
          if (x.init.declarations[i].init)
            xs[xs.length] = x.init.declarations[i].init;
      } else {
        xs[xs.length] = x.init;
      }
    }
    if (x.test)
      xs[xs.length] = x.test;
    if (x.update)
      xs[xs.length] = x.update;
    xs[xs.length] = x.body;
    return xs;
  };

  aran.childs.ForInStatement = function (x) {
    if (x.left.type === "VariableDeclaration")
      var xs = x.left.declarations[0].init ? [x.left.declarations[0].init] : [];
    else if (x.left.type === "Identifier")
      var xs = [];
    else if (x.left.type === "MemberExpression")
      var xs = x.left.computed ? [x.left.object, x.left.property] : [x.left.object];
    else
      throw new Error("Uexpected left type in for-in: "+x.left.type);
    xs[xs.length] = x.right;
    xs[xs.length] = x.body;
    return xs;
  };

  aran.childs.DebuggerStatement = function (x) { return [] };

  aran.childs.FunctionDeclaration = function (x) {
    var xs = [];
    if (x.body.body.length && !strict(x.body.body[0]))
      xs[xs.length] = x.body.body[0];
    for (var i=1; i<x.body.body.length; i++)
      xs[xs.length] = x.body.body[i];
    return xs;
  };

  aran.childs.VariableDeclaration = function (x) {
    var xs = [];
    for (var i=0; i<x.declarations.length; i++)
      if (x.declarations[i].init)
        xs[xs.length] = x.declarations[i].init;
    return xs;
  };

  aran.childs.ThisExpression = function (x) { return [] };

  aran.childs.ArrayExpression = function (x) {
    var xs = [];
    for (var i=0; i<x.elements.length; i++)
      if (x.elements[i])
        xs[xs.length] = x.elements[i];
    return xs;
  };

  aran.childs.ObjectExpression = function (x) {
    var xs = [];
    for (var i=0; i<x.properties.length; i++)
      xs[xs.length] = x.properties[i].value;
    return xs;
  };

  aran.childs.FunctionExpression = function (x) {
    var xs = [];
    if (x.body.body.length && !strict(x.body.body[0]))
      xs[xs.length] = x.body.body[0];
    for (var i=1; i<x.body.body.length; i++)
      xs[xs.length] = x.body.body[i];
    return xs;
  };

  aran.childs.SequenceExpression = function (x) {
    var xs = [];
    for (var i=0; i<x.expressions.length; i++)
      xs[xs.length] = x.expressions[i];
    return xs;
  }

  aran.childs.UnaryExpression = function (x) {
    if (x.operator === "typeof" && x.argument.type === "Identifier")
      return [];
    if (x.operator === "delete" && x.argument.type === "Identifier")
      return [];
    if (x.operator === "delete" && x.argument.type === "MemberExpression")
      return x.argument.computed ? [x.argument.object, x.argument.property] : [x.argument.object];
    return [x.argument];
  };

  aran.childs.BinaryExpression = function (x) { return [x.left, x.right] };

  aran.childs.AssignmentExpression = function (x) {
    return (x.left.type === "Identifier")
      ? [x.right]
      : (x.left.computed ? [x.left.object, x.left.property, x.right] : [x.left.object, x.right]);
  };

  aran.childs.UpdateExpression = function (x) {
    return (x.argument.type === "Identifier")
      ? []
      : (x.argument.computed ? [x.argument.object, x.argument.property] : [x.argument.object]);
  };

  aran.childs.LogicalExpression = function (x) { return [x.left, x.right] };

  aran.childs.ConditionalExpression = function (x) { return [x.test, x.consequent, x.alternate] };

  aran.childs.NewExpression = function (x) {
    var xs = [x.callee];
    for (var i=0; i<x.arguments.length; i++)
      xs[xs.length] = x.arguments[i];
    return xs;
  };

  aran.childs.CallExpression = function (x) {
    if (x.callee.type === "Identifier" && x.callee.name === "eval")
      var xs = [];
    else if (x.callee.type === "MemberExpression")
      var xs = x.callee.computed ? [x.callee.object, x.callee.property] : [x.callee.object];
    else
      var xs = [x.callee];
    for (var i=0; i<x.arguments.length; i++)
      xs[xs.length] = x.arguments[i];
    return xs;
  };

  aran.childs.MemberExpression = function (x) { return x.computed ? [x.object, x.property] : [x.object] };

  aran.childs.Identifier = function (x) { return [] };

} ());
