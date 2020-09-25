"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Eval = require("./eval.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

//////////////////////////
// _is_direct_eval_call //
//////////////////////////

Assert.deepEqual(Eval._is_direct_eval_call(parse(`eval(x, y, z);`).body[0].expression), true);
Assert.deepEqual(Eval._is_direct_eval_call(parse(`eval();`).body[0].expression), false);
Assert.deepEqual(Eval._is_direct_eval_call(parse(`eval(x, ...xs);`).body[0].expression), false);
Assert.deepEqual(Eval._is_direct_eval_call(parse(`f(x, y, z);`).body[0].expression), false);
Assert.deepEqual(Eval._is_direct_eval_call(parse(`o.m(x, y, z);`).body[0].expression), false);
Assert.deepEqual(Eval._is_direct_eval_call(parse(`123;`).body[0].expression), false);

///////////////////////////////
// _has_direct_eval_call //
///////////////////////////////

// Statement //

// FunctionDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`function f () { eval(x); }`).body), false);
// ClassDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`class f extends eval(x) { [eval(x)] () {} }`).body), false);
// DebuggerStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`debbugger;`).body), false);
// EmptyStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`;`).body), false);
// BreakStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a: while (true) break a;`).body), false);
// ContinueSatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a: while (true) continue a;`).body), false);
// ExpressionStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x);`).body), true);
// ThrowStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`throw eval(x);`).body), true);
// ReturnStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function () { return eval(x); });`).body[0].expression.body.body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function () { return; });`).body[0].expression.body.body), false);
// BlockStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`{ "foo"; eval(x); "bar"; }`).body), true);
// LabeledStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`a : eval(x);`).body), true);
// WithStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`with (eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`with (x) eval(x);`).body), true);
// IfStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (x) eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`if (x) ; else eval(x);`).body), true);
// WhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`while (eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`while (x) eval(x);`).body), true);
// DoWhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`do eval(x); while (x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`do x; while (eval(x));`).body), true);
// ForStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x) ; ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var x = eval(x) ; ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; eval(x) ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; ; eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (; ;) eval(x);`).body), true);
// ForInStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var [x=eval(x)] in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for ([x=eval(x)] in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x).k in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x in eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x in x) eval(x);`).body), true);
// ForOfStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (var [x=eval(x)] of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for ([x=eval(x)] of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (eval(x).k of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x of eval(x)) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`for (x of x) eval(x);`).body), true);
// TryStatement
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try { eval(x); } catch {}`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} catch ([x = eval(x)]) {}`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} catch { eval(x); }`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`try {} finally { eval(x); }`).body), true);
// VariableDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(parse(`var x = x, y = eval(y), z = z;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`var x = x, [y = eval(y)] = y, z = z;`).body), true);

// Expression //

// UpdateExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x++`).body), false);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k++`).body), true);
// AssignmentExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x = eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x = eval(x)] = x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k = x;`).body), true);
// SequenceExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(x, eval(x), x);`).body), true);
// TemplateLiteral
Assert.deepEqual(Eval._has_direct_eval_call(parse(`\`\${eval(x)}\`;`).body), true);
// ConditionalExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) ? x : x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x ? eval(x) : x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x ? x : eval(x);`).body), true);
// LogicalExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) || x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x || eval(x);`).body), true);
// BinaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x) + x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x + eval(x);`).body), true);
// YieldExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(function * () { yield eval(x); });`).body[0].expression.body.body), true);
// AwaitExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(async function () { await eval(x); });`).body[0].expression.body.body), true);
// UnaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`!eval(x);`).body), true);
// MemberExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x).k;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x[eval(x)];`).body), true);
// TaggedTemplateExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`eval(x)\`\`;`).body), true);
// ObjectExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({k:eval(x)});`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({[eval(x)]:x});`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({...eval(x)});`).body), true);
// ArrayExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, eval(x),, x];`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, ... eval(x),, x];`).body), true);
// NewExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new (eval(x))()`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new x(x, eval(x), x)`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`new x(x, ... eval(x), x)`).body), true);
// CallExpression
Assert.deepEqual(Eval._has_direct_eval_call(parse(`(eval(x))()`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x(x, eval(x), x)`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`x(x, ... eval(x), x)`).body), true);

// Pattern //

// AssignmentPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x = eval(x)] = x;`).body), true);
// ArrayPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, x = eval(x),, x] = x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`[x, x, ... [x = eval(x)]] = x;`).body), true);
// ObjectPattern
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, [eval(x)]:x, x} = x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, x:[x = eval(x)], x} = x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(parse(`({x, x, ... x} = x);`).body), false); // it seems that the rest element of object pattern can only be identifier
