
// TODO protect aran variables and labels

var Esprima = require("esprima");
var Trap = require("./trap.js");

////////////
// Export //
////////////

function visit (ctx, ast) {
  ast.index = ++ctx.counter;
  var res = visitors[ast.type](ctx, ast);
  ast.maxIndex = ctx.counter;
  return res;
};

module.exports = function (options, code) {
  var ctx = {counter:options.offset||0, traps:Trap(options.traps||[])};
  ctx.closure = {temporals:[], label:null, before:"", block:null};
  var ast = Esprima.parse(code, {loc:options.loc, range:options.range});
  ast.index = ++ctx.counter;
  var strict = ast.body.length && isstrict(ast.body[0]);
  var xs = (strict ? ast.body.slice(1) : ast.body).map(visit.bind(null, ctx));
  ast.maxIndex = ctx.counter;
  return (strict ? "'use strict';" : "")
    + (ctx.traps.Ast({toString:function () {return JSON.stringify(ast)}}) || "")
    + (strict ? ctx.traps.Strict(ast.index) : "")
    + (ctx.closure.temporals.length ? "var "+ctx.closure.temporals.join(", ")+";" : "")
    + ctx.closure.before
    + xs.join("");
}

var visitors = {};

////////////////
// Statements //
////////////////

visitors.EmptyStatement = function (ctx, ast) { return "" };

visitors.BlockStatement = function (ctx, ast) {
  var save = ctx.closure.block;
  ctx.closure.block = {before:"", after:"", label:""};
  var x = ast.body.map(visit.bind(null, ctx)).join("");
  x = "{"+ctx.closure.block.before+x+ctx.closure.block.after+"}";
  ctx.closure.block = save;
  return x;
};

visitors.ExpressionStatement = function (ctx, ast) { return visit(ctx, ast.expression)+";" };

visitors.IfStatement = function (ctx, ast) {
  return "if("+ctx.traps.test(visit(ctx, ast.test), ast.index)+")"
    + body(ctx, ast.consequent)
    + (ast.alternate ? "else"+body(ctx, ast.alternate) : "")
};

visitors.LabeledStatement = function (ctx, ast) {
  var str = ctx.traps.Label(ast.label.name, ast.index)+ast.label.name+":";
  if (ctx.closure.block&&ctx.closure.block.label) {
    var save = ctx.closure.block.label;
    ctx.closure.block.label = null;
    str += visit(ctx, ast.body);
    ctx.closure.block.label = save;
    return str;
  }
  return str+visit(ctx, ast.body);
};

visitors.BreakStatement = function (ctx, ast) {
  var label = ast.label ? ast.label.name : (ctx.closure.block ? ctx.closure.block.label : "");
  return ctx.traps.Break(ast.label?ast.label.name:null, ast.index)+"break "+label+";"
};

visitors.ContinueStatement = function (ctx, ast) { return ast.label ? "continue "+ast.label.name+";" : "continue;" };

// TODO: figure out what to do with WithStatement...
visitors.WithStatement = function (ctx, ast) { return "with("+visit(ctx, ast.object)+")"+body(ctx,ast.body) };

visitors.SwitchStatement = function (ctx, ast) {
  var f = visit.bind(null, ctx);
  var tmp0 = temporal(ctx, ast.index, 0);
  var tmp1 = temporal(ctx, ast.index, 1);
  var label = "aran_switch_"+ast.index;
  var save = ctx.closure.block;
  ctx.closure.block = {before:"", after:"", label:label};
  var s = tmp0+"=false;"+tmp1+"="+visit(ctx, ast.discriminant)+";"+label+":{"+ast.cases.map(function (c) {
    return c.test
      ? "if("+tmp0+"||("+tmp0+"="+ctx.traps.test(ctx.traps.binary("===", tmp1, visit(ctx, c.test), ast.index), ast.index)+")){"+c.consequent.map(f).join("")+"}"
      : tmp0+"=true;"+c.consequent.map(f).join("");
  }).join("")+"}";
  s = ctx.closure.block.before+s+ctx.closure.block.after;
  ctx.closure.block = save;
  return s;
};

visitors.ReturnStatement = function (ctx, ast) { return "return "+ctx.traps.return(ast.argument ? visit(ctx, ast.argument) : "void null", ast.index)+";" };

visitors.ThrowStatement = function (ctx, ast) { return "throw "+ctx.traps.throw(visit(ctx, ast.argument), ast.index)+";" };

visitors.TryStatement = function (ctx, ast) {
  var v = visit.bind(null, ctx);
  var p = ast.handler && ast.handler.param.name;
  return "try{"+ctx.traps.Try(ast.index)+ast.block.body.map(v).join("")+"}"
    + (p ? "catch("+p+"){"+ctx.traps.Catch(p, ast.index)+ast.handler.body.body.map(v).join("")+"}" : "")
    + (ast.finalizer ? "finally{"+ctx.traps.Finally(ast.index)+ast.finalizer.body.map(v).join("")+"}" : "");
};

visitors.WhileStatement = function (ctx, ast) { return "while("+ctx.traps.test(visit(ctx, ast.test), ast.index)+")"+body(ctx, ast.body) };

visitors.DoWhileStatement = function (ctx, ast) { return "do"+body(ctx, ast.body)+"while("+ctx.traps.test(visit(ctx, ast.test), ast.index)+");" };

visitors.ForStatement = function (ctx, ast) {
  var block = {before:"", after:""};
  var x = ast.init
    ? ((ast.init.type === "VariableDeclaration")
      ? declare(ctx, ast.init, block, ast.index)
      : visit(ctx, ast.init))
    : "";
  var y = ast.test ? ctx.traps.test(visit(ctx, ast.test), ast.index) : "";
  var z = ast.update ? visit(ctx, ast.update) : "";
  return "{"+block.before+"for("+x+";"+y+";"+z+")"+body(ctx, ast.body)+block.after+"}";
};

visitors.ForInStatement = function (ctx, ast) {
  var tmp0 = temporal(ctx, ast.index, 0);
  var tmp1 = temporal(ctx, ast.index, 3);
  var b = tmp0+"="+ctx.traps.enumerate(visit(ctx, ast.right), ast.index)+";"+tmp1+"=0"+";";
  if (ast.left.type === "MemberExpression") {
    var tmp2 = temporal(ctx, ast.index, 1);
    b += tmp2+"="+visit(ctx, ast.left.object)+";";
    if (ast.left.computed) {
      var tmp3 = temporal(ctx, ast.index, 1)+";";
      b += tmp3+"="+visit(ctx, ast.left.property)+";";
    }
    var u = ctx.traps.set(ast.left.computed, tmp2, ast.left.computed?tmp3:ast.left.property.name, tmp0+"["+tmp1+"]", ast.index);
  } else if (ast.left.type === "VariableDeclaration") {
    var block = {before:"", after:""};
    var x = declare(ctx, ast.left, block, ast.index);
    b += block.before;
    var a = block.after;
    var u = ast.left.declarations[0].id.name+"="+ctx.traps.write(ast.left.declarations[0].id.name, tmp0+"["+tmp1+"]", ast.index);
  } else if (ast.left.type === "Identifier") {
    var u = ast.left.name+"="+ctx.traps.write(ast.left.name, tmp0+"["+tmp1+"]", ast.index);
  } else {
    throw new Error("Unexpected left hand side type of for-in statement: "+ast.left.type);
  }
  return "{"+b+"for("+(x||"")+";("+tmp1+"<"+tmp0+".length && ("+u+",true));"+tmp1+"++)"+body(ctx, ast.body)+(a||"")+"}";
};

visitors.DebuggerStatement = function (ctx, ast) { return "debugger;" };

visitors.FunctionDeclaration = function (ctx, ast) {
  ctx.closure.before += "var "+ast.id.name+";";
  ctx.closure.before += ctx.traps.Declare(ast.kind, [ast.id.name], ast.index);
  ctx.closure.before += ast.id.name+"="+ctx.traps.write(ast.id.name, closure(ctx, ast, ast.index), ast.index)+";"
  return "";
};

visitors.VariableDeclaration = function (ctx, ast) {
  var str = declare(ctx, ast, ctx.closure.block, ast.index);
  return str ? str+";" : ""
};

/////////////////
// Expressions //
/////////////////

visitors.ThisExpression = function (ctx, ast) { return ctx.traps.read("this", ast.index) };

visitors.ArrayExpression = function (ctx, ast) { return ctx.traps.literal("["+ast.elements.map(function (e) { return e ? visit(ctx, e) : "" }).join(",")+"]", ast.index) };

visitors.ObjectExpression = function (ctx, ast) {
  var data = true;
  ast.properties.forEach(function (p) { data = data && p.kind === "init" });
  if (data) {
    var ps = ast.properties.map(function (p) { return (p.key.name||p.key.raw)+":"+visit(ctx, p.value)  });
    return ctx.traps.literal("{"+ps.join(",")+"}", ast.index);
  }
  var xs = [];
  ast.properties.forEach(function (p) {
    xs.push(p.key.raw||JSON.stringify(p.key.name));
    xs.push(JSON.stringify(p.kind));
    xs.push(visit(ctx, p.value));
  });
  return ctx.traps.literal("aran.object(["+xs.join(",")+"])", ast.index);
};

visitors.FunctionExpression = function (ctx, ast) { return closure(ctx, ast, ast.index) };

visitors.SequenceExpression = function (ctx, ast) { return "("+ast.expressions.map(visit.bind(null, ctx)).join(",")+")" };

// TODO: figure out what to do with delete identifier.
visitors.UnaryExpression = function (ctx, ast) {
  if (ast.operator === "typeof" && ast.argument.type === "Identifier")
    return ctx.traps.unary("typeof", "(function () { try { return "+ast.argument.name+" } catch (_) {} } ())", ast.index);
  if (ast.operator === "delete" && ast.argument.type === "Identifier")
    return "delete "+ast.argument.name;
  if (ast.operator === "delete" && ast.argument.type === "MemberExpression")
    return ctx.traps.delete(ast.argument.computed, visit(ctx, ast.argument.object), ast.computed ? visit(ctx, ast.argument.property) : ast.argument.property.name, ast.index);
  return ctx.traps.unary(ast.operator, visit(ctx, ast.argument), ast.index);
};

visitors.BinaryExpression = function (ctx, ast) { return ctx.traps.binary(ast.operator, visit(ctx, ast.left), visit(ctx, ast.right), ast.index) };

visitors.AssignmentExpression = function (ctx, ast) {
  if (ast.left.type === "MemberExpression") {
    var tmp1 = temporal(ctx, ast.index, 1);
    if (ast.left.computed)
      var tmp2 = temporal(ctx, ast.index, 2);
  }
  if (ast.operator === "=")
    return ast.left.type === "Identifier"
      ? "("+ast.left.name+"="+ctx.traps.write(ast.left.name, visit(ctx, ast.right), ast.index)+")"
      : ctx.traps.set(ast.computed, visit(ctx, ast.left.object), ast.computed ? visit(ctx, ast.left.property) : ast.left.property.name, visit(ctx, ast.right), ast.index);
  var o = ast.operator.substring(0, ast.operator.length-1);
  var l = ast.left.type === "Identifier"
    ? ctx.traps.read(ast.left.name, ast.index)
    : ctx.traps.get(ast.computed, tmp1, ast.computed ? tmp2 : ast.left.property.name, ast.index);
  var b = ctx.traps.binary(o, l, visit(ctx, ast.right), ast.index);
  return ast.left.type === "Identifier"
    ? "("+ast.left.name+"="+ctx.traps.write(ast.left.name, b, ast.index)+")"
    : ctx.traps.set(ast.computed, "("+tmp1+"="+visit(ctx, ast.left.object)+")", ast.computed ? "("+tmp2+"="+visit(ctx, ast.left.property)+")" : ast.left.property.name, b, ast.index);
};

visitors.UpdateExpression = function (ctx, ast) {
  if (ast.argument.type === "MemberExpression") {
    var tmp1 = temporal(ctx, ast.index, 1);
    if (ast.argument.computed)
      var tmp2 = temporal(ctx, ast.index, 2);
  }
  var o = ast.operator[0];
  var l = ast.argument.type === "Identifier"
    ? ctx.traps.read(ast.argument.name, ast.index)
    : ctx.traps.get(ast.argument.computed, tmp1, ast.argument.computed ? tmp2 : ast.argument.property.name, ast.index);
  if (!ast.prefix) {
    var tmp0 = temporal(ctx, ast.index, 0);
    l = "("+tmp0+" = "+l+")";
  }
  var r = ctx.traps.literal("1", ast.index);
  var b = ctx.traps.binary(o, l, r, ast.index);
  var a = ast.argument.type === "Identifier"
    ? ast.argument.name+"="+ctx.traps.write(ast.argument.name, b, ast.index)
    : ctx.traps.set(ast.argument.computed, "("+tmp1+"="+visit(ctx, ast.argument.object)+")", ast.argument.computed ? "("+tmp2+"="+visit(ctx, ast.argument.property)+")" : ast.argument.property.name, b, ast.index)
  return ast.prefix ? a : "("+a+", "+tmp0+")";
};

visitors.LogicalExpression = function (ctx, ast) {
  var tmp0 = temporal(ctx, ast.index, 0);
  var t = "("+tmp0+" = "+ctx.traps.test(visit(ctx, ast.left), ast.index)+")";
  if (ast.operator === "||")
    return "("+t+" ? "+tmp0+" : "+visit(ctx, ast.right)+")";
  if (ast.operator === "&&")
    return "("+t+" ? "+visit(ctx, ast.right)+" : "+tmp0+")";
  throw new Error("Unknown logical operator "+ast.operator);
};

visitors.ConditionalExpression = function (ctx, ast) { return "("+ctx.traps.test(visit(ctx, ast.test), ast.index)+" ? "+visit(ctx, ast.consequent)+" : "+visit(ctx, ast.alternate)+")" };

visitors.NewExpression = function (ctx, ast) { return ctx.traps.construct(visit(ctx, ast.callee), ast.arguments.map(visit.bind(null, ctx)), ast.index) };

// o.f(x,y,z)
// get(push(o), "f").apply(pop(), [x,y,z]);
// apply(push(o).f, pop(), [x,y,z], 123)
// apply(get(push(o), "f"), pop(), [x,y,z], 123)
visitors.CallExpression = function (ctx, ast) {
  var xs = ast.arguments.map(visit.bind(null, ctx));
  if (ast.callee.type === "MemberExpression") {
    var tmp0 = temporal(ctx, ast.index, 0);
    return ctx.traps.apply(ctx.traps.get(ast.callee.computed, "("+tmp0+"="+visit(ctx, ast.callee.object)+")", ast.callee.computed ? visit(ctx, ast.callee.property) : ast.callee.property.name, ast.index), tmp0, xs, ast.index);
  }
  if (ast.callee.type === "Identifier" && ast.callee.name === "eval") {
    var tmp0 = temporal(ctx, ast.index, 0);
    return "((("+tmp0+" = "+ctx.traps.read("eval", ast.index)+") === aran.eval) ? "+ctx.traps.eval(xs, ast.index)+" : "+ctx.traps.apply(tmp0, null, xs, ast.index)+")";
  }
  return ctx.traps.apply(visit(ctx, ast.callee), null, ast.arguments.map(visit.bind(null, ctx)), ast.index);
}

visitors.MemberExpression = function (ctx, ast) { return ctx.traps.get(ast.computed, visit(ctx, ast.object), ast.computed ? visit(ctx, ast.property) : ast.property.name, ast.index) };

visitors.Identifier = function (ctx, ast) { return ctx.traps.read(ast.name, ast.index) };

visitors.Literal = function (ctx, ast) { return ctx.traps.literal(ast.raw, ast.index) };

/////////////
// Helpers //
/////////////

function temporal (ctx, idx1, idx2) {
  var tmp = "aran_"+idx1+"_"+idx2;
  ctx.closure.temporals.push(tmp);
  return tmp;
}

function isstrict (ast) {
  return ast.type === "ExpressionStatement"
    && ast.expression.type === "Literal"
    && ast.expression.value === "use strict";
}

function body (ctx, ast) { return (ast.type === "BlockStatement") ? visit(ctx, ast) : "{"+visit(ctx,ast)+"}" }

function declare (ctx, ast, blk, idx) {
  var xs = [];
  var vs = ast.declarations.map(function (d) {
    if (d.init)
      xs.push(d.id.name+"="+visit(ctx, d.init));
    return d.id.name;
  });
  if (ast.kind === "var") {
    ctx.closure.before += ctx.traps.Declare(ast.kind, vs, idx);
    ctx.closure.before += ast.kind+" "+vs.join(",")+";";
  } else {
    blk.before += ctx.traps.Declare(ast.kind, vs, idx);
    blk.before += ast.kind+" "+vs.join(",")+";";
    blk.after += ctx.traps.Undeclare(ast.kind, vs, idx);
  }
  return xs.length && (xs.length===1 ? xs[0] : "("+xs.join(",")+")");
}

function name (i) { return i.name }
function closure (ctx, ast, idx) {
  var strict = ast.body.body.length && isstrict(ast.body.body[0]);
  var save = ctx.closure;
  ctx.closure = {before:"", temporals:[], block:null};
  var xs = (strict ? ast.body.body.slice(1) : ast.body.body).map(visit.bind(null, ctx));
  var s = (strict ? "'use strict';"+ctx.traps.Strict(idx) : "")
    + (ctx.closure.temporals.length ? "var "+ctx.closure.temporals.join(",")+";" : "")
    + ctx.closure.before
    + xs.join("");
  ctx.closure = save;
  return ctx.traps.literal("function "+(ast.id?ast.id.name:"")+"("+ast.params.map(name).join(",")+"){"+s+"}", idx);
}
