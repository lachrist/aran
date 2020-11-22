"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Eval = require("./eval.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020}).body;

///////////////
// Statement //
///////////////

// FunctionDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`function f () { eval(x); }`)), false);
// ClassDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`class f extends eval(x) { [eval(x)] () {} }`)), false);
// DebuggerStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`debbugger;`)), false);
// EmptyStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`;`)), false);
// BreakStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a: while (true) break a;`)), false);
// ContinueSatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a: while (true) continue a;`)), false);
// ExpressionStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x);`)), true);
// ThrowStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`throw eval(x);`)), true);
// ReturnStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function () { return eval(x); });`)[0].expression.body.body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function () { return; });`)[0].expression.body.body), false);
// BlockStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`{ "foo"; eval(x); "bar"; }`)), true);
// LabeledStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a : eval(x);`)), true);
// WithStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`with (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`with (x) eval(x);`)), true);
// IfStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (x) eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (x) ; else eval(x);`)), true);
// WhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`while (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`while (x) eval(x);`)), true);
// DoWhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`do eval(x); while (x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`do x; while (eval(x));`)), true);
// ForStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var x = eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; eval(x) ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; ; eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; ;) eval(x);`)), true);
// ForInStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var [x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for ([x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x).k in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x in eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x in x) eval(x);`)), true);
// ForOfStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var [x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for ([x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x).k of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x of eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x of x) eval(x);`)), true);
// TryStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try { eval(x); } catch {}`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} catch ([x = eval(x)]) {}`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} catch { eval(x); }`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} finally { eval(x); }`)), true);
// VariableDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`var x = x, y = eval(y), z = z;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`var x = x, [y = eval(y)] = y, z = z;`)), true);

////////////////
// Expression //
////////////////

// UpdateExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x++`)), false);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k++`)), true);
// AssignmentExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x = eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x = eval(x)] = x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k = x;`)), true);
// SequenceExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(x, eval(x), x);`)), true);
// TemplateLiteral
Assert.deepEqual(Eval._has_direct_eval_call(parse(`\`\${eval(x)}\`;`)), true);
// ConditionalExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) ? x : x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x ? eval(x) : x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x ? x : eval(x);`)), true);
// LogicalExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) || x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x || eval(x);`)), true);
// BinaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) + x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x + eval(x);`)), true);
// YieldExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function * () { yield eval(x); });`)[0].expression.body.body), true);
// AwaitExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(async function () { await eval(x); });`)[0].expression.body.body), true);
// UnaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`!eval(x);`)), true);
// MemberExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x[eval(x)];`)), true);
// TaggedTemplateExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x)\`\`;`)), true);
// ObjectExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({k:eval(x)});`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({[eval(x)]:x});`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({...eval(x)});`)), true);
// ArrayExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, eval(x),, x];`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, ... eval(x),, x];`)), true);
// NewExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new (eval(x))()`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new x(x, ... eval(x), x)`)), true);
// CallExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(eval(x))()`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x(x, ... eval(x), x)`)), true);

/////////////
// Pattern //
/////////////

// AssignmentPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x = eval(x)] = x;`)), true);
// ArrayPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, x = eval(x),, x] = x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, x, ... [x = eval(x)]] = x;`)), true);
// ObjectPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, [eval(x)]:x, x} = x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, x:[x = eval(x)], x} = x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, x, ... x} = x);`)), false); // it seems that the rest element of object pattern can only be identifier
