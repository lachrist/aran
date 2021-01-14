"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ParseExternal = require("../../parse-external.js");
const Eval = require("./eval.js");

///////////////
// Statement //
///////////////

// FunctionDeclaration
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`function f () { eval(x); }`)), false);
// ClassDeclaration
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`class f extends eval(x) { [eval(x)] () {} }`)), false);
// DebuggerStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`debbugger;`)), false);
// EmptyStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`;`)), false);
// BreakStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`a: while (true) break a;`)), false);
// ContinueSatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`a: while (true) continue a;`)), false);
// ExpressionStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x);`)), true);
// ThrowStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`throw eval(x);`)), true);
// ReturnStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(function () { return eval(x); });`).body[0].expression.body), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(function () { return; });`).body[0].expression.body), false);
// BlockStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`{ "foo"; eval(x); "bar"; }`)), true);
// LabeledStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`a : eval(x);`)), true);
// WithStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`with (eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`with (x) eval(x);`)), true);
// IfStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`if (eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`if (x) eval(x);`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`if (x) ; else eval(x);`)), true);
// WhileStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`while (eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`while (x) eval(x);`)), true);
// DoWhileStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`do eval(x); while (x);`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`do x; while (eval(x));`)), true);
// ForStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (var x = eval(x) ; ;) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (; eval(x) ;) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (; ; eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (; ;) eval(x);`)), true);
// ForInStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (var [x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for ([x=eval(x)] in x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (eval(x).k in x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (x in eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (x in x) eval(x);`)), true);
// ForOfStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (var [x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for ([x=eval(x)] of x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (eval(x).k of x) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (x of eval(x)) ;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`for (x of x) eval(x);`)), true);
// TryStatement
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`try { eval(x); } catch {}`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`try {} catch ([x = eval(x)]) {}`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`try {} catch { eval(x); }`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`try {} finally { eval(x); }`)), true);
// VariableDeclaration
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`var x = x, y = eval(y), z = z;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`var x = x, [y = eval(y)] = y, z = z;`)), true);
// ExportDefaultDeclaration
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`export default eval(x);`, {source:"module"})), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`export default function f () {};`, {source:"module"})), false);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`export default class c {};`, {source:"module"})), false);
// ExportNamedDeclaration
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`export var x = eval(x);`, {source:"module"})), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`export {foo} from "source";`, {source:"module"})), false);

////////////////
// Expression //
////////////////

// UpdateExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x++`)), false);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x).k++`)), true);
// AssignmentExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x = eval(x);`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x = eval(x)] = x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x).k = x;`)), true);
// SequenceExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(x, eval(x), x);`)), true);
// TemplateLiteral
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`\`\${eval(x)}\`;`)), true);
// ConditionalExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x) ? x : x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x ? eval(x) : x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x ? x : eval(x);`)), true);
// LogicalExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x) || x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x || eval(x);`)), true);
// BinaryExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x) + x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x + eval(x);`)), true);
// YieldExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(function * () { yield eval(x); });`).body[0].expression.body), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(function * () { yield; });`).body[0].expression.body), false);
// AwaitExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(async function () { await eval(x); });`).body[0].expression.body), true);
// UnaryExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`!eval(x);`)), true);
// MemberExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x).k;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x[eval(x)];`)), true);
// TaggedTemplateExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`eval(x)\`\`;`)), true);
// ObjectExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({k:eval(x)});`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({[eval(x)]:x});`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({...eval(x)});`)), true);
// ArrayExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x, eval(x),, x];`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x, ... eval(x),, x];`)), true);
// NewExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`new (eval(x))()`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`new x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`new x(x, ... eval(x), x)`)), true);
// CallExpression
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`(eval(x))()`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x(x, eval(x), x)`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`x(x, ... eval(x), x)`)), true);

/////////////
// Pattern //
/////////////

// AssignmentPattern
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x = eval(x)] = x;`)), true);
// ArrayPattern
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x, x = eval(x),, x] = x;`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`[x, x, ... [x = eval(x)]] = x;`)), true);
// ObjectPattern
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({x, [eval(x)]:x, x} = x);`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({x, x:[x = eval(x)], x} = x);`)), true);
Assert.deepEqual(Eval.hasDirectEvalCall(ParseExternal(`({x, x, ... x} = x);`)), false); // it seems that the rest element of object pattern can only be identifier
