
// The visitors of this file either:
//   1) visit an expression node and return an expression string
//   2) visit a statement node and return a concatenated list of statement strings. 
// Replacing a statement by a list of statement is safe if control structures
// (if|while|do-while|for|for-in|label) have a statement block as body.
// If it is not aldeready the case, we put a block around the body of these structures.
// Since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// However, this transformation is safe because the body of the above structure cannot be a
// variable declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

var Traps = require("./traps.js");
var Last = require("./last.js");

var nid = 0;
var vid = 0;

module.exports = function (namespace, traps) {
  var ctx = {
    eval: namespace + ".__eval__",
    traps: Traps(namespace, traps),
    hide: function fct () {
      var res = namespace + ++vid;
      this.hidden.push(res);
      return res;
    }
  };
  return function (ast) {
    ctx.strict = strict(ast.body[0]);
    ctx.loop = "";
    ctx.hidden = [];
    ctx.hoisted = {closure:"", block:""};
    Object.defineProperty(ast, "__min__", {value:++nid});
    var str1 = Last(ast) ? "" : ctx.traps.Last("void 0", ast.__min__);
    var str2 = ast.body.map(visit.bind(null, ctx, ast)).join("");
    Object.defineProperty(ast, "__max__", {value:nid});
    return (ctx.strict ? "'use-strict';" : "")
         + namespace + ".__global__=" + namespace + ".__global__||(function () { return this } ());"
         + namespace + ".__eval__=" + namespace + ".__eval__||eval;"
         + namespace + ".__apply__=" + namespace + ".__apply__||(typeof Reflect === 'object' ? Reflect.apply : function(f,t,xs){return f.apply(t,xs)});"
         + namespace + ".__defineProperty__=" + namespace + ".__defineProperty__||Object.defineProperty;";
         + ctx.hoisted.closure
         + ctx.hoisted.block
         + str2
         + str1;
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
};

visitors.ExpressionStatement = function (ctx, ast) {
  return ctx.traps[ast.__last__ ? "Last" : "Expression"](visit(ctx, ast, ast.expression), ast.__min__);
};

visitors.IfStatement = function (ctx, ast) {
  return "if(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + "){"
      + visit(ctx, ast, ast.consequent)
      + (ast.__last__ && !ast.__last__.consequent ? ctx.traps.Last("void 0", ast.__min__) : "")
    + "}else{"
      + (ast.alternate ? visit(ctx, ast, ast.alternate) : "")
      + (ast.__last__ && !ast.__last__.alternate ? ctx.traps.Last("void 0", ast.__min__) : "") 
    + "}";
};

visitors.LabeledStatement = function (ctx, ast) {
  return ctx.traps.Label(ast.label.name, ast.__min__) + ast.label.name
    + ":" + visit(ctx, ast, ast.body);
};

visitors.BreakStatement = function (ctx, ast) {
  return ctx.traps.Break(ast.label ? ast.label.name : null, ast.__min__)
    + "break " + (ast.label ? ast.label.name : ctx.loop) + ";";
};

visitors.ContinueStatement = function (ctx, ast) {
  return "continue " + (ast.label ? ast.label.name : "") + ";";
};

visitors.WithStatement = function (ctx, ast) {
  return "with(" + ctx.traps.with(visit(ctx, ast, ast.object), ast.__min__) + "){" + visit(ctx, ast, ast.body) + "}";
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
  return " return " + ctx.traps.return(
    ast.argument ? visit(ctx, ast, ast.argument) : " void 0",
    ast.__min__) + ";";
};

visitors.ThrowStatement = function (ctx, ast) {
  return "throw " + ctx.traps.throw(visit(ctx, ast, ast.argument), ast.__min__) + ";";
};

visitors.TryStatement = function (ctx, ast) {
  var fct = visit.bind(null, ctx, ast);
  return "try{" + ctx.traps.Enter(ast.__min__)
      + ctx.traps.Try(ast.__min__)
      + ast.block.body.map(fct).join("")
      + (ast.__last__ && !ast.__last__.body ? ctx.traps.Last("void 0", ast.__min__) : "")
      + ctx.traps.Leave(ast.__min__) + "}"
    + (ast.handler ? "catch(" + ast.handler.param.name + "){"
      + ctx.traps.Enter(ast.__min__)
      + ast.handler.param.name + "=" + ctx.traps.catch(ast.handler.param.name, ast.__min__) + ";"
      + ast.handler.body.body.map(fct).join("") +
      + (ast.__last__ && !ast.__last__.handler ? ctx.traps.Last("void 0", ast.__min__) : "")
      + ctx.traps.Leave(ast.__min__) + "}" : "")
    + "finally{" + ctx.traps.Enter(ast.__min__)
      + ctx.traps.Finally(ast.__min__)
      + (ast.finalizer ? ast.finalizer.body.map(fct).join("") : "")
      + ctx.traps.Leave(ast.__min__) + "}";
};

visitors.WhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = (ast.__last__ ? ctx.traps.Last("void 0", ast.__min__) : "")
    + "while(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + "){"
    + visit(ctx, ast, ast.body) + "}";
  ctx.loop = tmp;
  return res;
};

visitors.DoWhileStatement = function (ctx, ast) {
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = (ast.__last__ ? ctx.traps.Last("void 0", ast.__min__) : "")
    + "do{" + visit(ctx, ast, ast.body)
    + "}while(" + ctx.traps.test(visit(ctx, ast, ast.test), ast.__min__) + ");";
  ctx.loop = tmp;
  return res;
};

visitors.ForStatement = function (ctx, ast) {
  var str1 = "", str2 = "", str3 = "", str4 = "";
  if (ast.init && ast.init.type === "VariableDeclaration") {
    str1 = ctx.traps.Declare(ast.init.kind, ast.init.declarations.map(idname), ast.__min__);
    (ast.init.kind === "var") && (ctx.hoisted.closure += str1, str1 = "");
    str2 = declare(ctx, ast, ast.init);
  } else if (ast.init) {
    str2 = visit(ctx, ast, ast.init) + ";" + ctx.traps.Expression(ast.__min__); 
  }
  str3 = ctx.traps.test(ast.test ? visit(ctx, ast, ast.test) : "true", ast.__min__);
  ast.update && (str4 = visit(ctx, ast, ast.update) + ";" + ctx.traps.Expression(ast.__min__));
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = (ast.__last__ ? ctx.traps.Last("void 0", ast.__min__) : "")
    + "{" + ctx.traps.Enter(ast.__min__) + str1 + str2
    + "while(" + str3 + "){"
    + (ast.body.type === "BlockStatement"
      ? ast.body.body.map(visit.bind(null, ctx, ast)).join("")
      : visit(ctx, ast, ast.body))
    + str4 + "}" + ctx.traps.Leave(ast.__min__) + "}";
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
      (function (str) {
        (ast.left.kind === "var") ? (ctx.hoisted.closure += str) : arr.push(str);
      } (ctx.traps.Declare(ast.left.kind, ast.left.declarations.map(idname), ast.__min__)));
      arr.push(declare(ctx, ast, ast.left));
    }
    var str = ctx.traps.write(
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
    var str = ctx.traps.set(
      obj.object,
      ast.left.computed
        ? obj.property
        : ctx.traps.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
      obj.enumerate + "[" + obj.counter + "]",
      ast.__min__);
  } 
  var tmp = ctx.loop;
  ctx.loop = "";
  var res = (ast.__last__ ? ctx.traps.Last("void 0", ast.__min__) : "")
    + "{" + ctx.traps.Enter(ast.__min__) + arr.join("")
    + "while(" + obj.counter + "<" + obj.enumerate + ".length){"
    + (ast.body.type === "BlockStatement"
      ? ast.body.body.map(visit.bind(null, ctx, ast)).join("")
      : visit(ctx, ast, ast.body))
    + str + ";" + ctx.traps.Expression(ast.__min__) + obj.counter +"++;}"
    + ctx.traps.Leave(ast.__min__) + "}";
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
  return ctx.traps.array(ast.elements.map(function (elm) {
    return elm ? visit(ctx, ast, elm) : ctx.traps.primitive("void 0", ast.__min__);
  }), ast.__min__);
};

visitors.ObjectExpression = function (ctx, ast) {
  return ctx.traps.object(ast.properties.map(function (prp) {
    return {
      kind: prp.kind,
      key: prp.key.type === "Identifier" ? JSON.stringify(prp.key.name) : prp.key.raw,
      value: visit(ctx, ast, prp.value)
    };
  }), ast.__min__);
};

visitors.FunctionExpression = function (ctx, ast) { return closure(ctx, ast) };

visitors.SequenceExpression = function (ctx, ast) {
  return ctx.traps.sequence(ast.expressions.map(visit.bind(null, ctx, ast)), ast.__min__);
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
      visit(ctx, ast, ast.argument.object),
      ast.computed
        ? visit(ctx, ast, ast.argument.property)
        : ctx.traps.primitive(JSON.stringify(ast.argument.property.name), ast.__min__),
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
        visit(ctx, ast, ast.left.object),
        ast.left.computed
          ? visit(ctx, ast, ast.left.property)
          : ctx.traps.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
        visit(ctx, ast, ast.right), ast.__min__);
  str1 = ctx.traps.binary(
    ast.operator.substring(0, ast.operator.length-1),
    ast.left.type === "Identifier"
      ? ctx.traps.read(ast.left.name, ast.__min__)
      : ctx.traps.get(
        str2 = ctx.hide(),
        ast.left.computed
          ? str3 = ctx.hide()
          : ctx.traps.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
        ast.__min__),
      visit(ctx, ast, ast.right),
      ast.__min__);
  return ast.left.type === "Identifier"
    ? ctx.traps.write(ast.left.name, str1, ast.__min__)
    : ctx.traps.set(
      "(" + str2 + "=" + visit(ctx, ast, ast.left.object) + ")",
      ast.left.computed
        ? "(" + str3 + "=" + visit(ctx, ast, ast.left.property) + ")"
        : ctx.traps.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
      str1,
      ast.__min__);
};

visitors.UpdateExpression = function (ctx, ast) {
  var str1, str2, str3, str4, str5, str6;
  str1 = ast.argument.type === "Identifier"
    ? ctx.traps.read(ast.argument.name, ast.__min__)
    : ctx.traps.get(
      str2 = ctx.hide(),
      ast.argument.computed
        ? str3 = ctx.hide()
        : ctx.traps.primitive(JSON.stringify(ast.argument.property.name), ast.__min__),
      ast.__min__);
  if (!ast.prefix)
    str1 = "(" + (str4 = ctx.hide()) + " = " + str1 + ")";
  str5 = ctx.traps.binary(ast.operator[0], str1, ctx.traps.primitive("1", ast.__min__), ast.__min__);
  str6 = ast.argument.type === "Identifier"
    ? ctx.traps.write(ast.argument.name, str5, ast.__min__)
    : ctx.traps.set(
      "(" + str2 + "=" + visit(ctx, ast, ast.argument.object) + ")",
      ast.argument.computed
        ? "(" + str3 + "=" + visit(ctx, ast, ast.argument.property) + ")"
        : ctx.traps.primitive(JSON.stringify(ast.argument.property.name), ast.__min__),
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
      + ":" + ctx.traps.apply("eval", ctx.strict ? "void 0" : "null", arr, ast.__min__) + ")";
  }
  if (ast.callee.type !== "MemberExpression")
    return ctx.traps.apply(visit(ctx, ast, ast.callee), ctx.strict ? "void 0" : "null", args(ctx, ast), ast.__min__);
  var str = ctx.hide();
  return ctx.traps.apply(
    ctx.traps.get(
      "(" + str + "=" + visit(ctx, ast, ast.callee.object) +")",
      ast.callee.computed
        ? visit(ctx, ast, ast.callee.property)
        : ctx.traps.primitive(JSON.stringify(ast.callee.property.name), ast.__min__),
      ast.__min__),
    str,
    args(ctx, ast),
    ast.__min__); 
}

visitors.MemberExpression = function (ctx, ast) {
  return ctx.traps.get(
    visit(ctx, ast, ast.object),
    ast.computed
      ? visit(ctx, ast, ast.property)
      : ctx.traps.primitive(JSON.stringify(ast.property.name), ast.__min__),
    ast.__min__);
};

visitors.Identifier = function (ctx, ast) { return ctx.traps.read(ast.name, ast.__min__) };

visitors.Literal = function (ctx, ast) {
  return "regex" in ast
    ? ctx.traps.regexp(ast.regex.pattern, ast.regex.flags, ast.__min__)
    : ctx.traps.primitive(ast.raw, ast.__min__);
};

/////////////
// Helpers //
/////////////

function strict (ast) {
  return ast.type === "ExpressionStatement"
    && ast.expression.type === "Literal"
    && ast.expression.value === "use strict";
}

// function body (ctx, src, ast) {
//   var str = ("__last__" in src && !src.body)
//     ? ctx.traps.Last("void 0", src.__min__);
//     :
//   return "{" + visit(ctx, src, ast) + "}"
//   return ast.type === "BlockStatement"
//     ? visit(ctx, src, ast)
//     : "{" + visit(ctx, src, ast) +  + "}";
// }

function idname (ast) { return ast.id.name }

function declare (ctx, src, ast) {
  return ast.kind + " " + ast.declarations.map(idname).join(",") + ";" + ast.declarations.map(function (dec) {
    return dec.init ? ctx.traps.write(dec.id.name, visit(ctx, src, dec.init), src.__min__) + ";" + ctx.traps.Expression(src.__min__) : "";
  }).join("");
}

var closure = (function () {
  function name (ast) { return ast.name }
  function nonarguments (p) { p.name !== "arguments" }
  return function (ctx, ast) {
    var tmp1 = ctx.hoisted, tmp2 = ctx.loop, tmp3 = ctx.hidden, tmp4 = ctx.strict;
    (ctx.hoisted = {closure:"", block: ""}, ctx.loop = "", ctx.hidden = []);
    ctx.strict = ast.body.body.length && strict(ast.body.body[0]);
    var arr = (ctx.strict ? ast.body.body.slice(1) : ast.body.body).map(visit.bind(null, ctx, ast));
    var res = "function " + (ast.id ? ast.id.name : "")
      + "(" + ast.params.map(name).join(",") + "){"
      + (ctx.strict ? "'use strict';" + ctx.traps.Strict(ast.__min__) : "")
      + (ast.params.every(nonarguments) ? ctx.traps.Arguments(ast.__min__) : "")
      + (ctx.hidden.length ? "var " + ctx.hidden.join(",") + ";" : "")
      + ctx.hoisted.closure
      + arr.join("")
      + " return " + ctx.traps.return(ctx.traps.primitive(" void 0", ast.__min__), ast.__min__)
      + "}";
    (ctx.hoisted = tmp1, ctx.loop = tmp2, ctx.hidden = tmp3, ctx.strict = tmp4);
    return ctx.traps.closure(res, ast.__min__);
  };
} ());
