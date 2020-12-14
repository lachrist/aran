"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parse = require("../../parse.js");
const Eval = require("./eval.js");

///////////////
// Statement //
///////////////

// FunctionDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`function f () { eval(x); }`)), false);
// ClassDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`class f extends eval(x) { [eval(x)] () {} }`)), false);
// DebuggerStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`debbugger;`)), false);
// EmptyStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`;`)), false);
// BreakStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a: while (true) break a;`)), false);
// ContinueSatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a: while (true) continue a;`)), false);
// ExpressionStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x);`)), true);
// ThrowStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`throw eval(x);`)), true);
// ReturnStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function () { return eval(x); });`).body[0].expression.body), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function () { return; });`).body[0].expression.body), false);
// BlockStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`{ "foo"; eval(x); "bar"; }`)), true);
// LabeledStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`a : eval(x);`)), true);
// WithStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`with (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`with (x) eval(x);`)), true);
// IfStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (x) eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`if (x) ; else eval(x);`)), true);
// WhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`while (eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`while (x) eval(x);`)), true);
// DoWhileStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`do eval(x); while (x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`do x; while (eval(x));`)), true);
// ForStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var x = eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; eval(x) ;) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; ; eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (; ;) eval(x);`)), true);
// ForInStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var [x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for ([x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x).k in x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x in eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x in x) eval(x);`)), true);
// ForOfStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (var [x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for ([x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (eval(x).k of x) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x of eval(x)) ;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`for (x of x) eval(x);`)), true);
// TryStatement
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try { eval(x); } catch {}`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} catch ([x = eval(x)]) {}`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} catch { eval(x); }`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`try {} finally { eval(x); }`)), true);
// VariableDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`var x = x, y = eval(y), z = z;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`var x = x, [y = eval(y)] = y, z = z;`)), true);
// ExportDefaultDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default function f () {};`)), false);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export default class c {};`)), false);
// ExportNamedDeclaration
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export var x = eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.module(`export {foo} from "source";`)), false);

////////////////
// Expression //
////////////////

// UpdateExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x++`)), false);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k++`)), true);
// AssignmentExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x = eval(x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x = eval(x)] = x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k = x;`)), true);
// SequenceExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(x, eval(x), x);`)), true);
// TemplateLiteral
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`\`\${eval(x)}\`;`)), true);
// ConditionalExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) ? x : x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x ? eval(x) : x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x ? x : eval(x);`)), true);
// LogicalExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) || x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x || eval(x);`)), true);
// BinaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x) + x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x + eval(x);`)), true);
// YieldExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(function * () { yield eval(x); });`).body[0].expression.body), true);
// AwaitExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(async function () { await eval(x); });`).body[0].expression.body), true);
// UnaryExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`!eval(x);`)), true);
// MemberExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x).k;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x[eval(x)];`)), true);
// TaggedTemplateExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`eval(x)\`\`;`)), true);
// ObjectExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({k:eval(x)});`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({[eval(x)]:x});`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({...eval(x)});`)), true);
// ArrayExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, eval(x),, x];`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, ... eval(x),, x];`)), true);
// NewExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new (eval(x))()`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`new x(x, ... eval(x), x)`)), true);
// CallExpression
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`(eval(x))()`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`x(x, ... eval(x), x)`)), true);

/////////////
// Pattern //
/////////////

// AssignmentPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x = eval(x)] = x;`)), true);
// ArrayPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, x = eval(x),, x] = x;`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`[x, x, ... [x = eval(x)]] = x;`)), true);
// ObjectPattern
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, [eval(x)]:x, x} = x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, x:[x = eval(x)], x} = x);`)), true);
Assert.deepEqual(Eval._has_direct_eval_call(Parse.script(`({x, x, ... x} = x);`)), false); // it seems that the rest element of object pattern can only be identifier
