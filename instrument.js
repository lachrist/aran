
// The visitors of this file either:
//   1) visit an expression node and return an expression string
//   2) visit a statement node and return a concatenated list of statement strings. 
// Replacing a statement by a list of statement is safe if control structures
// (if|while|do-while|for|for-in|label) have a statement block as body.
// If it is not aldeready the case, we put a block around the body of these structures.
// Since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// However, this transformation is safe because the body of the above structure cannot be a
// variable declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

// Code generation guide line:
// 1) The beginning of a statement may directly be a letter

var Esprima = require("esprima");
var Trap = require("./trap.js");

module.exports = function (options, code) {
  var ctx = {
    counter: options.offset || 0,
    global: options.global || "aran",
    traps: Trap(options.traps || []),
    loop: "",
    temporals: [],
    hoisted: {closure:"", block:""}
  };
  var ast = Esprima.parse(code, {loc:options.loc, range:options.range});
  return visit(ctx, ast);
};

function visit (ctx, ast) {
  ast.index = ++ctx.counter;
  var res = visitors[ast.type](ctx, ast);
  ast.maxIndex = ctx.counter;
  return res;
};

var visitors = {};

////////////////
// Statements //
////////////////

visitors.Program = function (ctx, ast) {
  var bin = ast.body.length && strict(ast.body[0]);
  var arr = (bin ? ast.body.slice(1) : ast.body).map(visit.bind(null, ctx));
  ast.maxIndex = ctx.counter; // edgy to put here
  return (bin ? "'use strict';" : "")
    + ctx.traps.Ast(JSON.stringify(ast), ctx.index)
    + (bin ? ctx.traps.Strict(ast.index) : "")
    + (ctx.temporals.length ? "var "+ctx.temporals.join(", ")+";" : "")
    + ctx.hoisted.closure
    + ctx.hoisted.block
    + arr.join("");
};

visitors.EmptyStatement = function (ctx, ast) { return "" };

visitors.BlockStatement = function (ctx, ast) {
  var tmp = ctx.hoisted.block;
  ctx.hoisted.block = "";
  var str = ast.body.map(visit.bind(null, ctx)).join("");
  var res = "{"
    + ctx.traps.Enter(ast.index)
    + ctx.hoisted.block
    + str
    + ctx.traps.Leave(ast.index) + "}";
  ctx.hoisted.block = tmp;
  return res;
}

visitors.ExpressionStatement = function (ctx, ast) { return visit(ctx, ast.expression)+";" };

visitors.IfStatement = function (ctx, ast) {
  return "if(" + ctx.traps.test(visit(ctx, ast.test), ast.index) + ")" + body(ctx, ast.consequent)
    + (ast.alternate ? "else" + body(ctx, ast.alternate) : "")
};

visitors.LabeledStatement = function (ctx, ast) {
  return ctx.traps.Label(ast.label.name, ast.index)
    + ast.label.name + ":" + visit(ctx, ast.body)
};

visitors.BreakStatement = function (ctx, ast) {
  return ctx.traps.Break(ast.label ? ast.label.name : null, ast.index)
    + "break " + (ast.label ? ast.label.name : ctx.loop) + ";"
};

visitors.ContinueStatement = function (ctx, ast) {
  return "continue "+(ast.label?ast.label.name:"")+";";
};

// TODO: figure out what to do with WithStatement...
visitors.WithStatement = function (ctx, ast) {
  return "with("+visit(ctx, ast.object)+")"+body(ctx,ast.body);
};

visitors.SwitchStatement = function (ctx, ast) {
  function fct1 (ast) { return "if("+str1+")"+visit(ctx, ast) }
  function fct2 (cse) {
    return str1 + "=" + (cse.test ? ctx.traps.test(
      ctx.traps.binary("===", str2, visit(ctx, cse.test), ast.index),
      ast.index) : "true") + ";" + cse.consequent.map(fct1).join("");
  }
  var str1 = temporal(ctx, ast.index, 1);
  var str2 = temporal(ctx, ast.index, 2);
  var tmp1 = ctx.hoisted.block, tmp2 = ctx.loop;
  (ctx.hoisted.block = "", ctx.loop = ctx.global+"_switch_"+ast.index);
  var str3 = str1 + "=false;"
    + str2 + "=" + visit(ctx, ast.discriminant)+";"
    + ctx.loop + ":{" + ast.cases.map(fct2).join("")+"}";
  var res = ctx.traps.Enter(ast.index) + ctx.hoisted.block + str3 + ctx.traps.Leave(ast.index);
  (ctx.hoisted.block = tmp1, ctx.loop = tmp2);
  return res;
};

visitors.ReturnStatement = function (ctx, ast) {
  return "return " + ctx.traps.return(
    ast.argument ? visit(ctx, ast.argument) : "void 0",
    ast.index) + ";";
};

visitors.ThrowStatement = function (ctx, ast) {
  return "throw " + ctx.traps.throw(visit(ctx, ast.argument), ast.index) + ";";
};

visitors.TryStatement = function (ctx, ast) {
  var fct = visit.bind(null, ctx);
  return "try{" + ctx.traps.Try(ast.index) + ast.block.body.map(fct).join("") + "}"
    + (ast.handler ? "catch(" + ast.handler.param.name + "){"
      + ast.handler.param.name + "=" + ctx.traps.catch(ast.handler.param.name, ast.index) + ";"
      + ast.handler.body.body.map(fct).join("") + "}" : "")
    + (ast.finalizer ? "finally{" + ctx.traps.Finally(ast.index)
      + ast.finalizer.body.map(fct).join("") + "}" : "");
};

visitors.WhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = "while(" + ctx.traps.test(visit(ctx, ast.test), ast.index) + ")"
    + body(ctx, ast.body);
  ctx.loop = tmp;
  return res;
};

visitors.DoWhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = "do" + body(ctx, ast.body)
    + "while(" + ctx.traps.test(visit(ctx, ast.test), ast.index) + ");";
  ctx.loop = tmp;
  return res;
};

visitors.ForStatement = function (ctx, ast) {
  if (ast.init && ast.init.type === "VariableDeclaration") {
    var tmp = ctx.hoisted.block;
    ctx.hoisted.block = "";
    var str1 = declare(ctx, ast.init, ast.index);
    var str2 = ctx.hoisted.block;
    ctx.hoisted.block = tmp;
  } else {
    var str1 = ast.init ? visit(ctx, ast.init) : "";
  }
  var str3 = ast.test ? ctx.traps.test(visit(ctx, ast.test), ast.index) : "";
  var str4 = ast.update ? visit(ctx, ast.update) : "";
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = ctx.traps.Enter(ast.index)
    + (str2 || "")
    + "for(" + str1 + ";" + str3 + ";" + str4 + ")"
    + body(ctx, ast.body)
    + ctx.traps.Leave(ast.index);
  ctx.loop = tmp;
  return res;
};

visitors.ForInStatement = function (ctx, ast) {
  var obj = {
    enumerate: temporal(ctx, ast.index, 1),
    counter: temporal(ctx, ast.index, 2)
  };
  var arr = [
    obj.enumerate + "=" + ctx.traps.enumerate(visit(ctx, ast.right), ast.index) + ";",
    obj.counter + "=0;"
  ];
  if (ast.left.type !== "MemberExpression") {
    if (ast.left.type === "VariableDeclaration") {
      var tmp = ctx.hoisted.block;
      ctx.hoisted.block = "";
      var str1 = declare(ctx, ast.left, ast.index);
      arr.unshift(ctx.hoisted.block);
      ctx.hoisted.block = tmp;
    }
    var str2 = ctx.traps.write(
      ast.left.type === "Identifier" ? ast.left.name : ast.left.declarations[0].id.name,
      obj.enumerate + "[" + obj.counter + "]",
      ast.index);
  } else {
    obj.object = temporal(ctx, ast.index, 3);
    arr.push(obj.object + "=" + visit(ctx, ast.left.object) + ";");
    if (ast.left.computed) {
      obj.property = temporal(ctx, ast.index, 4);
      arr.push(obj.property + "=" + visit(ctx, ast.left.property) + ";")
    }
    var str2 = ctx.traps.set(
      ast.left.computed,
      obj.object,
      ast.left.computed ? obj.property : ast.left.property.name,
      obj.enumerate + "[" + obj.counter + "]",
      ast.index);
  } 
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = ctx.traps.Enter(ast.index)
    + arr.join("")
    + "for(" + (str1 || "") + ";"
    + obj.counter + "<" + obj.enumerate + ".length&&(" + str2 + ",true);"
    + obj.counter + "++)"
    + body(ctx, ast.body)
    + ctx.traps.Leave(ast.index);
  ctx.loop = tmp;
  return res;
};

visitors.DebuggerStatement = function (ctx, ast) { return "debugger;" };

visitors.FunctionDeclaration = function (ctx, ast) {
  ctx.hoisted.closure += ctx.traps.Declare("var", [ast.id.name], ast.index)
    + ctx.traps.write(ast.id.name, closure(ctx, ast), ast.index) + ";";
  return "var " + ast.id.name + ";";
};

visitors.VariableDeclaration = function (ctx, ast) { return declare(ctx, ast, ast.index) + ";" };

/////////////////
// Expressions //
/////////////////

visitors.ThisExpression = function (ctx, ast) { return ctx.traps.read("this", ast.index) };

visitors.ArrayExpression = function (ctx, ast) {
  return ctx.traps.literal(
    "[" + ast.elements.map(function (elm) { return elm ? visit(ctx, elm) : "" }).join(",") + "]",
    ast.index);
};

function kindinit (ast) { return ast.kind === "init" }
visitors.ObjectExpression = function (ctx, ast) {
  if (ast.properties.every(kindinit))
    return ctx.traps.literal("{" + ast.properties.map(function (ast) {
      return (ast.key.raw || ast.key.name) + ":" + visit(ctx, ast.value)
    }).join(",") + "}", ast.index);
  return ctx.traps.literal("aran.__object__([" + ast.properties.map(function (prp) {
    return "[" + (prp.key.raw || JSON.stringify(prp.key.name)) + ","
      + JSON.stringify(prp.kind) + ","
      + visit(ctx, prp.value) + "]";
  }).join(",") + "])", ast.index);
};

visitors.FunctionExpression = function (ctx, ast) { return closure(ctx, ast) };

visitors.SequenceExpression = function (ctx, ast) {
  return "(" + ast.expressions.map(visit.bind(null, ctx)).join(",") + ")";
};

// TODO: figure out what to do with: ``delete identifier''.
visitors.UnaryExpression = function (ctx, ast) {
  if (ast.operator === "typeof" && ast.argument.type === "Identifier")
    return ctx.traps.unary(
      "typeof",
      "(function(){try{return " + ast.argument.name + "}catch(_){}}())",
      ast.index);
  if (ast.operator === "delete" && ast.argument.type === "Identifier")
    return "(delete " + ast.argument.name + ")";
  if (ast.operator === "delete" && ast.argument.type === "MemberExpression")
    return ctx.traps.delete(
      ast.argument.computed,
      visit(ctx, ast.argument.object),
      ast.computed ? visit(ctx, ast.argument.property) : ast.argument.property.name,
      ast.index);
  return ctx.traps.unary(ast.operator, visit(ctx, ast.argument), ast.index);
};

visitors.BinaryExpression = function (ctx, ast) {
  return ctx.traps.binary(
    ast.operator,
    visit(ctx, ast.left),
    visit(ctx, ast.right),
    ast.index);
};

visitors.AssignmentExpression = function (ctx, ast) {
  var str1, str2, str3;
  if (ast.operator === "=")
    return ast.left.type === "Identifier"
      ? ctx.traps.write(ast.left.name, visit(ctx, ast.right), ast.index)
      : ctx.traps.set(
        ast.computed,
        visit(ctx, ast.left.object),
        ast.computed ? visit(ctx, ast.left.property) : ast.left.property.name,
        visit(ctx, ast.right), ast.index);
  str1 = ctx.traps.binary(
    ast.operator.substring(0, ast.operator.length-1),
    ast.left.type === "Identifier"
      ? ctx.traps.read(ast.left.name, ast.index)
      : ctx.traps.get(
        ast.computed,
        str2 = temporal(ctx, ast.index, 1),
        ast.computed ? str3 = temporal(ctx, ast.index, 2) : ast.left.property.name,
        ast.index),
      visit(ctx, ast.right),
      ast.index);
  return ast.left.type === "Identifier"
    ? ctx.traps.write(ast.left.name, str1, ast.index)
    : ctx.traps.set(
      ast.computed,
      "(" + str2 + "=" + visit(ctx, ast.left.object) + ")",
      ast.computed
        ? "(" + str3 + "=" + visit(ctx, ast.left.property) + ")"
        : ast.left.property.name,
      str1,
      ast.index);
};

visitors.UpdateExpression = function (ctx, ast) {
  var str1, str2, str3, str4, str5, str6;
  str1 = ast.argument.type === "Identifier"
    ? ctx.traps.read(ast.argument.name, ast.index)
    : ctx.traps.get(
      ast.argument.computed,
      str2 = temporal(ctx, ast.index, 1),
      ast.argument.computed ? str3 = temporal(ctx, ast.index, 2) : ast.argument.property.name,
      ast.index);
  if (!ast.prefix)
    str1 = "(" + (str4 = temporal(ctx, ast.index, 0)) + " = " + str1 + ")";
  str5 = ctx.traps.binary(ast.operator[0], str1, ctx.traps.literal("1", ast.index), ast.index);
  str6 = ast.argument.type === "Identifier"
    ? ctx.traps.write(ast.argument.name, str5, ast.index)
    : ctx.traps.set(
      ast.argument.computed,
      "(" + str2 + "=" + visit(ctx, ast.argument.object) + ")",
      ast.argument.computed
        ? "(" + str3 + "=" + visit(ctx, ast.argument.property) + ")"
        : ast.argument.property.name,
      str5,
      ast.index);
  return ast.prefix ? str6 : "(" + str6 + "," + str4 + ")";
};

visitors.LogicalExpression = function (ctx, ast) {
  var str1 = temporal(ctx, ast.index, 0);
  var str2 = "(" + str1 + "=" + ctx.traps.test(visit(ctx, ast.left), ast.index) + ")";
  if (ast.operator === "||")
    return "(" + str2 + "?" + str1 + ":" + visit(ctx, ast.right) + ")";
  if (ast.operator === "&&")
    return "(" + str2 + "?" + visit(ctx, ast.right) + ":" + str1 + ")";
  throw new Error("Unknown logical operator " + ast.operator);
};

visitors.ConditionalExpression = function (ctx, ast) {
  return "(" + ctx.traps.test(visit(ctx, ast.test), ast.index)
    + "?" + visit(ctx, ast.consequent)
    + ":" + visit(ctx, ast.alternate) + ")";
};

visitors.NewExpression = function (ctx, ast) {
  return ctx.traps.construct(
    visit(ctx, ast.callee),
    ast.arguments.map(visit.bind(null, ctx)),
    ast.index);
};

function args (ctx, ast) { return ast.arguments.map(visit.bind(null, ctx)) }
visitors.CallExpression = function (ctx, ast) {
  if (ast.callee.type === "Identifier" && ast.callee.name === "eval") {
    var arr = args(ctx, ast);
    return "(" + ctx.traps.read("eval", ast.index) + "===aran.__eval__"
      + "?" + ctx.traps.eval(arr, ast.index)
      + ":" + ctx.traps.apply("eval", null, arr, ast.index) + ")";
  }
  if (ast.callee.type !== "MemberExpression")
    return ctx.traps.apply(visit(ctx, ast.callee), null, args(ctx, ast), ast.index);
  var str = temporal(ctx, ast.index, 0);
  return ctx.traps.apply(
    ctx.traps.get(
      ast.callee.computed,
      "(" + str + "=" + visit(ctx, ast.callee.object) +")",
      ast.callee.computed ? visit(ctx, ast.callee.property) : ast.callee.property.name,
      ast.index),
    str,
    args(ctx, ast),
    ast.index); 
}

visitors.MemberExpression = function (ctx, ast) {
  return ctx.traps.get(
    ast.computed,
    visit(ctx, ast.object),
    ast.computed ? visit(ctx, ast.property) : ast.property.name,
    ast.index);
};

visitors.Identifier = function (ctx, ast) { return ctx.traps.read(ast.name, ast.index) };

visitors.Literal = function (ctx, ast) { return ctx.traps.literal(ast.raw, ast.index) };

/////////////
// Helpers //
/////////////

function temporal (ctx, idx1, idx2) {
  var res = ctx.global + "_" + idx1 + "_" + idx2;
  ctx.temporals.push(res);
  return res;
}

function strict (ast) {
  return ast.type === "ExpressionStatement"
    && ast.expression.type === "Literal"
    && ast.expression.value === "use strict";
}

function body (ctx, ast) {
  return ast.type === "BlockStatement" ? visit(ctx, ast) : "{" + visit(ctx,ast) + "}";
}

function idname (ast) { return ast.id.name }
function declare (ctx, ast, idx) {
  var res = ast.kind + " " + ast.declarations.map(function (dec) {
    return dec.id.name + (dec.init ? "=" + visit(ctx, dec.init) : "");
  }).join(",");
  ctx.hoisted[ast.kind === "var" ? "closure" : "block"] += ctx.traps.Declare(
    ast.kind,
    ast.declarations.map(idname),
    idx);
  return res;
}

function name (ast) { return ast.name }
function closure (ctx, ast) {
  var bin = ast.body.body.length && strict(ast.body.body[0]);
  var tmp1 = ctx.hoisted, tmp2 = ctx.loop, tmp3 = ctx.temporals;
  (ctx.hoisted = {closure:"", block: ""}, ctx.loop = "", ctx.temporals = []);
  var arr = (bin ? ast.body.body.slice(1) : ast.body.body).map(visit.bind(null, ctx));
  var str = "function " + (ast.id ? ast.id.name : "")
    + "(" + ast.params.map(name).join(",") + "){"
    + (bin ? "'use strict';" + ctx.traps.Strict(ast.index) : "")
    + ctx.traps.Arguments(ast.index)
    + (ctx.temporals.length ? "var " + ctx.temporals.join(",") + ";" : "")
    + ctx.hoisted.closure
    + arr.join("") + "}";
  (ctx.hoisted = tmp1, ctx.loop = tmp2, ctx.temporals = tmp3);
  return str;
}
