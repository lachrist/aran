"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parse = require("../../parse.js");
const Eval = require("./eval.js");

///////////////
// Statement //
///////////////

// FunctionDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`function f () { eval(x); }`).body), false);
// ClassDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`class f extends eval(x) { [eval(x)] () {} }`).body), false);
// DebuggerStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`debbugger;`).body), false);
// EmptyStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`;`).body), false);
// BreakStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a: while (true) break a;`).body), false);
// ContinueSatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a: while (true) continue a;`).body), false);
// ExpressionStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x);`).body), true);
// ThrowStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`throw eval(x);`).body), true);
// ReturnStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function () { return eval(x); });`).body[0].expression.body.body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function () { return; });`).body[0].expression.body.body), false);
// BlockStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`{ "foo"; eval(x); "bar"; }`).body), true);
// LabeledStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a : eval(x);`).body), true);
// WithStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`with (eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`with (x) eval(x);`).body), true);
// IfStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (x) eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (x) ; else eval(x);`).body), true);
// WhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`while (eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`while (x) eval(x);`).body), true);
// DoWhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`do eval(x); while (x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`do x; while (eval(x).body);`).body), true);
// ForStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x) ; ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var x = eval(x) ; ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; eval(x) ;) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; ; eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; ;) eval(x);`).body), true);
// ForInStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var [x=eval(x)] in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for ([x=eval(x)] in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x).k in x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x in eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x in x) eval(x);`).body), true);
// ForOfStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var [x=eval(x)] of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for ([x=eval(x)] of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x).k of x) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x of eval(x).body) ;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x of x) eval(x);`).body), true);
// TryStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try { eval(x); } catch {}`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} catch ([x = eval(x)]) {}`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} catch { eval(x); }`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} finally { eval(x); }`).body), true);
// VariableDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`var x = x, y = eval(y), z = z;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`var x = x, [y = eval(y)] = y, z = z;`).body), true);
// ExportDefaultDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default function f () {};`).body), false);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default class c {};`).body), false);
// ExportNamedDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export var x = eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export {foo} from "source";`).body), false);

////////////////
// Expression //
////////////////

// UpdateExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x++`).body), false);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k++`).body), true);
// AssignmentExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x = eval(x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x = eval(x)] = x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k = x;`).body), true);
// SequenceExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(x, eval(x), x);`).body), true);
// TemplateLiteral
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`\`\${eval(x)}\`;`).body), true);
// ConditionalExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) ? x : x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x ? eval(x) : x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x ? x : eval(x);`).body), true);
// LogicalExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) || x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x || eval(x);`).body), true);
// BinaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) + x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x + eval(x);`).body), true);
// YieldExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function * () { yield eval(x); });`).body[0].expression.body.body), true);
// AwaitExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(async function () { await eval(x); });`).body[0].expression.body.body), true);
// UnaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`!eval(x);`).body), true);
// MemberExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x[eval(x)];`).body), true);
// TaggedTemplateExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x)\`\`;`).body), true);
// ObjectExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({k:eval(x)});`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({[eval(x)]:x});`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({...eval(x)});`).body), true);
// ArrayExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, eval(x),, x];`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, ... eval(x),, x];`).body), true);
// NewExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new (eval(x).body)()`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new x(x, eval(x), x)`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new x(x, ... eval(x), x)`).body), true);
// CallExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(eval(x).body)()`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x(x, eval(x), x)`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x(x, ... eval(x), x)`).body), true);

/////////////
// Pattern //
/////////////

// AssignmentPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x = eval(x)] = x;`).body), true);
// ArrayPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, x = eval(x),, x] = x;`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, x, ... [x = eval(x)]] = x;`).body), true);
// ObjectPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, [eval(x)]:x, x} = x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, x:[x = eval(x)], x} = x);`).body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, x, ... x} = x);`).body), false); // it seems that the rest element of object pattern can only be identifier
