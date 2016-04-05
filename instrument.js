
// The visitors of this file either:
//   1) visit an expression node and return an expression string
//   2) visit a statement node and return a concatenated list of statement strings. 
// Replacing a statement by a list of statement is safe if control structures
// (if|while|do-while|for|for-in|label) have a statement block as body.
// If it is not aldeready the case, we put a block around the body of these structures.
// Since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// However, this transformation is safe because the body of the above structure cannot be a
// variable declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

var Esprima = require("esprima");
var Traps = require("./traps.js");

var nid = 0;
var vid = 0;

// TODO switch __apply__ to Reflect.apply when supported enough 
module.exports = function (namespace, traps) {
  var ctx = {
    traps: Traps(namespace, traps),
    hide: function () {
      var res = namespace + ++vid;
      this.hidden.push(res);
      return res;
    },
    eval: namespace + ".__eval__",
    accessor: ["function (arr) {",
      "var obj = {};",
      "for (var i=0; i<arr.length; i++) {",
        "if (!obj[arr[i].key])",
          "obj[arr[i].key] = {enumerate:true, configurable: true};",
        "if (arr[i].kind === 'init') {",
          "(delete obj[arr[i].key].get, delete obj[arr[i].key].set);",
          "(obj[arr[i].key].writable = true, obj[arr[i].key].value = arr[i].value);",
        "} else {",
          "(delete obj[arr[i].key].writable, delete obj[arr[i].key].value);",
          "obj[arr[i].key][arr[i].kind] = arr[i].value;",
        "}",
      "}",
      "return " + namespace + ".__defineProperties__({}, obj);",
    "}"].join("")
  };
  return function (ast) {
    (ctx.loop = "", ctx.hidden = [], ctx.hoisted = {closure:"", block:""});
    var bin = ast.body.length && strict(ast.body[0]);
    Object.defineProperty(ast, "parent", {value:null});
    Object.defineProperty(ast, "__min__", {value:++nid});
    var arr = (bin ? ast.body.slice(1) : ast.body).map(visit.bind(null, ctx, ast));
    Object.defineProperty(ast, "__max__", {value:nid});
    return (bin ? "'use strict';" : "")
      + namespace + ".__eval__=" + namespace + ".__eval__||eval;"
      + namespace + ".__apply__=" + namespace + ".__apply__||function(f,t,xs){return f.apply(t,xs)};"
      + namespace + ".__defineProperties__=" + namespace + ".__defineProperties__||Object.defineProperties;"
      + (bin ? ctx.traps.Strict(ast.__min__) : "")
      + (ctx.hidden.length ? "var "+ctx.hidden.join(",")+";" : "")
      + ctx.hoisted.closure
      + ctx.hoisted.block
      + arr.join("")
  };
};

function visit (ctx, src, ast) {
  Object.defineProperty(ast, "parent", {value:src});
  Object.defineProperty(ast, "__min__", {value:++nid});
  var res = visitors[ast.type](ctx, ast);
  Object.defineProperty(ast, "__max__", {value:nid});
  return res;
};

var visitors = {};

////////////////
// Statements //
////////////////

visitors.EmptyStatement = function (ctx, ast) { return "" };

visitors.BlockStatement = function (ctx, ast) {
  var tmp = ctx.hoisted.block;
  ctx.hoisted.block = "";
  var str = ast.body.map(visit.bind(null, ctx, ast)).join("");
  var res = "{"
    + ctx.traps.Enter(ast.__min__)
    + ctx.hoisted.block
    + str
    + ctx.traps.Leave(ast.__min__) + "}";
  ctx.hoisted.block = tmp;
  return res;
}

visitors.ExpressionStatement = function (ctx, ast) { return visit(ctx, ast, ast.expression)+";" };

visitors.IfStatement = function (ctx, ast) {
  return "if(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + ")" + body(ctx, ast, ast.consequent)
    + (ast.alternate ? "else" + body(ctx, ast, ast.alternate) : "")
};

visitors.LabeledStatement = function (ctx, ast) {
  return ctx.traps.Label(ast.label.name, ast.__min__)
    + ast.label.name + ":" + visit(ctx, ast, ast.body)
};

visitors.BreakStatement = function (ctx, ast) {
  return ctx.traps.Break(ast.label ? ast.label.name : null, ast.__min__)
    + "break " + (ast.label ? ast.label.name : ctx.loop) + ";"
};

visitors.ContinueStatement = function (ctx, ast) {
  return "continue " + (ast.label ? ast.label.name : "") + ";";
};

// TODO: figure out what to do with WithStatement...
visitors.WithStatement = function (ctx, ast) {
  return "with(" + visit(ctx, ast, ast.object) + ")" + body(ctx, ast, ast.body);
};

visitors.SwitchStatement = function (ctx, ast) {
  function fct1 (ast2) { return "if(" + str1 + ")" + visit(ctx, ast, ast2) }
  function fct2 (cse) {
    return str1 + "=" + (cse.test ? ctx.traps.test(
      ctx.traps.binary("===", str2, visit(ctx, ast, cse.test), ast.__min__),
      ast.__min__) : "true") + ";" + cse.consequent.map(fct1).join("");
  }
  var str1 = ctx.hide();
  var str2 = ctx.hide();
  var tmp1 = ctx.hoisted.block, tmp2 = ctx.loop;
  (ctx.hoisted.block = "", ctx.loop = ctx.hide());
  var str3 = str1 + "=false;"
    + str2 + "=" + visit(ctx, ast, ast.discriminant)+";"
    + ctx.loop + ":{" + ast.cases.map(fct2).join("") + "}";
  var res = ctx.traps.Enter(ast.__min__) + ctx.hoisted.block + str3 + ctx.traps.Leave(ast.__min__);
  (ctx.hoisted.block = tmp1, ctx.loop = tmp2);
  return res;
};

visitors.ReturnStatement = function (ctx, ast) {
  return "return " + ctx.traps.return(
    ast.argument ? visit(ctx, ast, ast.argument) : "void 0",
    ast.__min__) + ";";
};

visitors.ThrowStatement = function (ctx, ast) {
  return "throw " + ctx.traps.throw(visit(ctx, ast, ast.argument), ast.__min__) + ";";
};

visitors.TryStatement = function (ctx, ast) {
  var fct = visit.bind(null, ctx, ast);
  return "try{" + ctx.traps.Try(ast.__min__) + ast.block.body.map(fct).join("") + "}"
    + (ast.handler ? "catch(" + ast.handler.param.name + "){"
      + ast.handler.param.name + "=" + ctx.traps.catch(ast.handler.param.name, ast.__min__) + ";"
      + ast.handler.body.body.map(fct).join("") + "}" : "")
    + "finally{" + ctx.traps.Finally(ast.__min__)
      + (ast.finalizer ? ast.finalizer.body.map(fct).join("") : "") + "}";
};

visitors.WhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = "while(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + ")"
    + body(ctx, ast, ast.body);
  ctx.loop = tmp;
  return res;
};

visitors.DoWhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = "do" + body(ctx, ast, ast.body)
    + "while(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + ");";
  ctx.loop = tmp;
  return res;
};

visitors.ForStatement = function (ctx, ast) {
  if (ast.init && ast.init.type === "VariableDeclaration") {
    var tmp = ctx.hoisted.block;
    ctx.hoisted.block = "";
    var str1 = declare(ctx, ast, ast.init, ast.__min__);
    var str2 = ctx.hoisted.block;
    ctx.hoisted.block = tmp;
  } else {
    var str1 = ast.init ? visit(ctx, ast, ast.init) : "";
  }
  var str3 = ast.test ? ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) : "";
  var str4 = ast.update ? visit(ctx, ast, ast.update) : "";
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = ctx.traps.Enter(ast.__min__)
    + (str2 || "")
    + "for(" + str1 + ";" + str3 + ";" + str4 + ")"
    + body(ctx, ast, ast.body)
    + ctx.traps.Leave(ast.__min__);
  ctx.loop = tmp;
  return res;
};

visitors.ForInStatement = function (ctx, ast) {
  var obj = {enumerate: ctx.hide(), counter: ctx.hide()};
  var arr = [
    obj.enumerate + "=" + ctx.traps.enumerate(visit(ctx, ast, ast.right), ast.__min__) + ";",
    obj.counter + "=0;"
  ];
  if (ast.left.type !== "MemberExpression") {
    if (ast.left.type === "VariableDeclaration") {
      var tmp = ctx.hoisted.block;
      ctx.hoisted.block = "";
      var str1 = declare(ctx, ast, ast.left, ast.__min__);
      arr.unshift(ctx.hoisted.block);
      ctx.hoisted.block = tmp;
    }
    var str2 = ctx.traps.write(
      ast.left.type === "Identifier" ? ast.left.name : ast.left.declarations[0].id.name,
      obj.enumerate + "[" + obj.counter + "]",
      ast.__min__);
  } else {
    obj.object = ctx.hide();
    arr.push(obj.object + "=" + visit(ctx, ast, ast.left.object) + ";");
    if (ast.left.computed) {
      obj.property = ctx.hide();
      arr.push(obj.property + "=" + visit(ctx, ast, ast.left.property) + ";")
    }
    var str2 = ctx.traps.set(
      ast.left.computed,
      obj.object,
      ast.left.computed ? obj.property : ast.left.property.name,
      obj.enumerate + "[" + obj.counter + "]",
      ast.__min__);
  } 
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = ctx.traps.Enter(ast.__min__)
    + arr.join("")
    + "for(" + (str1 || "") + ";"
    + obj.counter + "<" + obj.enumerate + ".length&&(" + str2 + ",true);"
    + obj.counter + "++)"
    + body(ctx, ast, ast.body)
    + ctx.traps.Leave(ast.__min__);
  ctx.loop = tmp;
  return res;
};

visitors.DebuggerStatement = function (ctx, ast) { return "debugger;" };

visitors.FunctionDeclaration = function (ctx, ast) {
  ctx.hoisted.closure += ctx.traps.Declare("var", [ast.id.name], ast.__min__)
    + ctx.traps.write(ast.id.name, closure(ctx, ast), ast.__min__) + ";";
  return "var " + ast.id.name + ";";
};

visitors.VariableDeclaration = function (ctx, ast) { return declare(ctx, ast, ast, ast.__min__) + ";" };

/////////////////
// Expressions //
/////////////////

visitors.ThisExpression = function (ctx, ast) { return ctx.traps.read("this", ast.__min__) };

visitors.ArrayExpression = function (ctx, ast) {
  return ctx.traps.literal(
    "[" + ast.elements.map(function (elm) { return elm ? visit(ctx, ast, elm) : "" }).join(",") + "]",
    ast.__min__);
};

visitors.ObjectExpression = function (ctx, ast) {
  if (ast.properties.every(kindinit))
    return ctx.traps.literal("{" + ast.properties.map(function (ast) {
      return (ast.key.raw || ast.key.name) + ":" + visit(ctx, ast, ast.value)
    }).join(",") + "}", ast.__min__);
  return ctx.traps.literal("(" + ctx.accessor + "([" + ast.properties.map(function (prp) {
      return "{key:" + (prp.key.raw || JSON.stringify(prp.key.name)) + ","
        + "kind:" + JSON.stringify(prp.kind) + ","
        + "value:" + visit(ctx, ast, prp.value) + "}";
    }).join(",") + "]))", ast.__min__);
};

visitors.FunctionExpression = function (ctx, ast) { return closure(ctx, ast) };

visitors.SequenceExpression = function (ctx, ast) {
  return "(" + ast.expressions.map(visit.bind(null, ctx, ast)).join(",") + ")";
};

// TODO: figure out what to do with: ``delete identifier''.
visitors.UnaryExpression = function (ctx, ast) {
  if (ast.operator === "typeof" && ast.argument.type === "Identifier")
    return ctx.traps.unary(
      "typeof",
      "(function(){try{return " + ast.argument.name + "}catch(_){}}())",
      ast.__min__);
  if (ast.operator === "delete" && ast.argument.type === "Identifier")
    return "(delete " + ast.argument.name + ")";
  if (ast.operator === "delete" && ast.argument.type === "MemberExpression")
    return ctx.traps.delete(
      ast.argument.computed,
      visit(ctx, ast, ast.argument.object),
      ast.computed ? visit(ctx, ast, ast.argument.property) : ast.argument.property.name,
      ast.__min__);
  return ctx.traps.unary(ast.operator, visit(ctx, ast, ast.argument), ast.__min__);
};

visitors.BinaryExpression = function (ctx, ast) {
  return ctx.traps.binary(
    ast.operator,
    visit(ctx, ast, ast.left),
    visit(ctx, ast, ast.right),
    ast.__min__);
};

visitors.AssignmentExpression = function (ctx, ast) {
  var str1, str2, str3;
  if (ast.operator === "=")
    return ast.left.type === "Identifier"
      ? ctx.traps.write(ast.left.name, visit(ctx, ast, ast.right), ast.__min__)
      : ctx.traps.set(
        ast.left.computed,
        visit(ctx, ast, ast.left.object),
        ast.left.computed ? visit(ctx, ast, ast.left.property) : ast.left.property.name,
        visit(ctx, ast, ast.right), ast.__min__);
  str1 = ctx.traps.binary(
    ast.operator.substring(0, ast.operator.length-1),
    ast.left.type === "Identifier"
      ? ctx.traps.read(ast.left.name, ast.__min__)
      : ctx.traps.get(
        ast.left.computed,
        str2 = ctx.hide(),
        ast.left.computed ? str3 = ctx.hide() : ast.left.property.name,
        ast.__min__),
      visit(ctx, ast, ast.right),
      ast.__min__);
  return ast.left.type === "Identifier"
    ? ctx.traps.write(ast.left.name, str1, ast.__min__)
    : ctx.traps.set(
      ast.left.computed,
      "(" + str2 + "=" + visit(ctx, ast, ast.left.object) + ")",
      ast.left.computed
        ? "(" + str3 + "=" + visit(ctx, ast, ast.left.property) + ")"
        : ast.left.property.name,
      str1,
      ast.__min__);
};

visitors.UpdateExpression = function (ctx, ast) {
  var str1, str2, str3, str4, str5, str6;
  str1 = ast.argument.type === "Identifier"
    ? ctx.traps.read(ast.argument.name, ast.__min__)
    : ctx.traps.get(
      ast.argument.computed,
      str2 = ctx.hide(),
      ast.argument.computed ? str3 = ctx.hide() : ast.argument.property.name,
      ast.__min__);
  if (!ast.prefix)
    str1 = "(" + (str4 = ctx.hide()) + " = " + str1 + ")";
  str5 = ctx.traps.binary(ast.operator[0], str1, ctx.traps.literal("1", ast.__min__), ast.__min__);
  str6 = ast.argument.type === "Identifier"
    ? ctx.traps.write(ast.argument.name, str5, ast.__min__)
    : ctx.traps.set(
      ast.argument.computed,
      "(" + str2 + "=" + visit(ctx, ast, ast.argument.object) + ")",
      ast.argument.computed
        ? "(" + str3 + "=" + visit(ctx, ast, ast.argument.property) + ")"
        : ast.argument.property.name,
      str5,
      ast.__min__);
  return ast.prefix ? str6 : "(" + str6 + "," + str4 + ")";
};

visitors.LogicalExpression = function (ctx, ast) {
  var str1 = ctx.hide();
  var str2 = "(" + str1 + "=" + ctx.traps.test(visit(ctx, ast, ast.left), ast.__min__) + ")";
  if (ast.operator === "||")
    return "(" + str2 + "?" + str1 + ":" + visit(ctx, ast, ast.right) + ")";
  if (ast.operator === "&&")
    return "(" + str2 + "?" + visit(ctx, ast, ast.right) + ":" + str1 + ")";
  throw new Error("Unknown logical operator " + ast.operator);
};

visitors.ConditionalExpression = function (ctx, ast) {
  return "(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__)
    + "?" + visit(ctx, ast, ast.consequent)
    + ":" + visit(ctx, ast, ast.alternate) + ")";
};

visitors.NewExpression = function (ctx, ast) {
  return ctx.traps.construct(
    visit(ctx, ast, ast.callee),
    ast.arguments.map(visit.bind(null, ctx, ast)),
    ast.__min__);
};

function args (ctx, ast) { return ast.arguments.map(visit.bind(null, ctx, ast)) }
visitors.CallExpression = function (ctx, ast) {
  if (ast.callee.type === "Identifier" && ast.callee.name === "eval") {
    var arr = args(ctx, ast);
    return "(" + ctx.traps.read("eval", ast.__min__) + "==="+ctx.eval
      + "?" + ctx.traps.eval(arr, ast.__min__)
      + ":" + ctx.traps.apply("eval", null, arr, ast.__min__) + ")";
  }
  if (ast.callee.type !== "MemberExpression")
    return ctx.traps.apply(visit(ctx, ast, ast.callee), null, args(ctx, ast), ast.__min__);
  var str = ctx.hide();
  return ctx.traps.apply(
    ctx.traps.get(
      ast.callee.computed,
      "(" + str + "=" + visit(ctx, ast, ast.callee.object) +")",
      ast.callee.computed ? visit(ctx, ast, ast.callee.property) : ast.callee.property.name,
      ast.__min__),
    str,
    args(ctx, ast),
    ast.__min__); 
}

visitors.MemberExpression = function (ctx, ast) {
  return ctx.traps.get(
    ast.computed,
    visit(ctx, ast, ast.object),
    ast.computed ? visit(ctx, ast, ast.property) : ast.property.name,
    ast.__min__);
};

visitors.Identifier = function (ctx, ast) { return ctx.traps.read(ast.name, ast.__min__) };

visitors.Literal = function (ctx, ast) { return ctx.traps.literal(ast.raw, ast.__min__) };

/////////////
// Helpers //
/////////////

function kindinit (ast) { return ast.kind === "init" }

function name (ast) { return ast.name }

function idname (ast) { return ast.id.name }

function strict (ast) {
  return ast.type === "ExpressionStatement"
    && ast.expression.type === "Literal"
    && ast.expression.value === "use strict";
}

function body (ctx, src, ast) {
  return ast.type === "BlockStatement" ? visit(ctx, src, ast) : "{" + visit(ctx, src, ast) + "}";
}

function declare (ctx, src, ast, idx) {
  var res = ast.kind + " " + ast.declarations.map(function (dec) {
    return dec.id.name + (dec.init ? "=" + visit(ctx, src, dec.init) : "");
  }).join(",");
  ctx.hoisted[ast.kind === "var" ? "closure" : "block"] += ctx.traps.Declare(
    ast.kind,
    ast.declarations.map(idname),
    idx);
  return res;
}

function closure (ctx, ast) {
  var bin = ast.body.body.length && strict(ast.body.body[0]);
  var tmp1 = ctx.hoisted, tmp2 = ctx.loop, tmp3 = ctx.hidden;
  (ctx.hoisted = {closure:"", block: ""}, ctx.loop = "", ctx.hidden = []);
  var arr = (bin ? ast.body.body.slice(1) : ast.body.body).map(visit.bind(null, ctx, ast));
  var res = "function " + (ast.id ? ast.id.name : "")
    + "(" + ast.params.map(name).join(",") + "){"
    + (bin ? "'use strict';" + ctx.traps.Strict(ast.__min__) : "")
    + ctx.traps.Arguments(ast.__min__)
    + (ctx.hidden.length ? "var " + ctx.hidden.join(",") + ";" : "")
    + ctx.hoisted.closure
    + arr.join("") + "}";
  (ctx.hoisted = tmp1, ctx.loop = tmp2, ctx.hidden = tmp3);
  return ctx.traps.literal(res, ast.__min__);
}
