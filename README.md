# Aran <img src="aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution.
Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting [ECMAScript6](http://www.ecma-international.org/ecma-262/6.0/).
To install, run `npm install aran`.

## Demonstration

In Aran, an analysis consists in a set of syntactic traps that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x + y` may be transformed into `aran.binary('+', x, y)` which triggers the `binary` trap.
The best way to get familiar with Aran is by toying with its [demo page](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).
The target editor expects a JavaScript program to analyze while the master editor expects the analysis implementing the trap functions.
In the demo page, the global variable referencing traps has to be called `aran` but this constraint is released in the API.

<img src="demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>

## Usage

```javascript
function delta (a, b, c) { return  b * b - 4 * a * c }
function solve (a, b, c) {
  var s1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);
  var s2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);
  return [s1, s2];
}
solve(1, -5, 6);
```

To demonstrate how to use Aran we propose to log the function calls inside a program solving the polynomial equation: `x^2 - 5*x + 6 = 0`.
Because Aran is fully written in JavaScript, the instrumentation can happen on the same process as the JavaScript program being analyzed.
In that case we say that the instrumentation is online.
By opposition, we refer to offline instrumentation when the instrumentation happens on a separate process.
Three different use examples are provided in this repository:

1. [Offline monolithic instrumentation](usage/offline-monolithic)
2. [Online monolithic instrumentation](usage/online-monolithic)
3. [Online modular instrumentation](usage/online-modular)

<!-- 
## THE REST IS OUTDATED

This section details Aran's instrumentation API.
The top-level function exported by this node module expects the set of options below:

 Option     | Default                               | Value
------------|---------------------------------------|---------------------------------------------------------------------------------------------------------------------
`namespace` | `'aran'`                              | String, the name of the global value containing Aran's traps
`traps`     | `[]`                                  | Array, contains the names of the traps to be called later, during the execution phase
`analysis`  | `undefined`                           | String, JavaScript code implementing the traps named in the `traps` option
`filter`    | `function (url)`<br>`{ return true }` | Function, called with the url of a JavaScript resource to decide whether to instrument it
`port`      | `undefined`                           | Number, a port to setup an MITM HTTP proxy for intercepting and instrumenting traffic of JavaScript code
`main`      | `undefined`                           | String, a path to the main file of a node program, the bundled instrumented code is sent to the `stdout` 
`loc`       | `false`                               | Boolean, if true: ast node have line and column-based location info [cf esprima](http://esprima.org/doc/index.html)
`range`     | `false`                               | Boolean, if true: ast node have an index-based location range [cf esprima](http://esprima.org/doc/index.html)

If `analysis` is not defined, the top-level function returns an instrumentation function expecting two arguments: the code to instrument and an optional script locator that will be passed to the trap `Ast` -- as demonstrated above.
If `analysis` is defined, Aran will try to cope with one of the two module systems below.
For more information, please refer to [Otiluke's readme](https://github.com/lachrist/otiluke)

1. If `port` is defined, HTML pages: an MITM proxy will be deployed intercepting and instrumenting traffic of JavaScript code.
   Note that this requires to tell your browser to direct his requests to the corresponding local port and to trust the Otiluke's root certificate -- [cf Otiluke](https://github.com/lachrist/otiluke).

```javascript
var fs = require('fs');
var Aran = require('aran');
Aran({
  namespace: '__hidden__',
  traps: ['Ast', 'apply'],
  analysis: fs.readFileSync('./apply-analysis.js', {encoding:'utf8'}),
  filter: function (url) { return url.indexOf("my-host.com") !== -1 }, 
  port: null,
  main: 'absolute/path/to/main.js',
  loc: true,
  range: false
});
```

2. If `main` is defined, node requires: the bundled instrumented program is streamed into `stdout`.

```javascript
var fs = require('fs');
var Aran = require('aran');
Aran({
  namespace: '__hidden__',
  traps: ['Ast', 'apply'],
  analysis: fs.readFileSync('./apply-analysis.js', {encoding:'utf8'}),
  filter: function (url) { return url.indexOf("my-module") !== -1 },
  port: 8080,
  main: null,
  loc: true,
  range: false
});
```

## Traps

The below table introduces by example the set of traps Aran can insert.
Traps starting with a upper-case letter are simple observers and their return values are never used while the value returned by lower-case traps may be used inside expressions.
All traps are independently optional and they all receive as last argument an integer which is the index of the AST node that triggered the trap.
The only exception to this rule is the `Ast` trap which is always triggered first and receives instead an url locating the instrumented JavaScript resource.
The first argument given to the `Ast` trap is an [esprima](http://esprima.org) tree whose statement and expression nodes contain a `bounds` field.
`bounds[0]` is the node index; all of the node children have their index greater than `bounds[0]` and lesser or equal than `bounds[1]`.
This enables to search a node at a given index in `log(ast-size)` as shown in the demonstration section. 
In the table below, `123` is used as a dummy index.

 Traps                              | Target              | Instrumented
------------------------------------|---------------------|-------------------------------------------------------
**General**                         |                     |
`Ast(ast, url)`                     |                     |
`Strict(index)`                     | `'use strict';`     | `'use strict';`<br>`aran.Strict(123);`
`literal(value, index)`             | `'foo'`             | `aran.literal('foo', 123)`
`unary(op, value, index)`           | `!x`                | `aran.unary('!', x, 123)`
`binary(op, left, right, index)`    | `x + y`             | `aran.binary('+', x, y, 123)`
**Environment**                     |                     |
`Declare(kind, variables, index)`   | `var x = 1, y;`     | `aran.Declare('var', [x,y], 123);`<br>`var x = 1, y;`
`read(variable, value, index)`      | `x`                 | `aran.read('x', x, 123)` |
`write(variable, old, new, index)`  | `x = y`             | `aran.write('x', x, y, 123)`
`Enter(index)`<br>`Leave(index)`    | `{ ... }`           | `{`<br>&nbsp;&nbsp;`aran.Enter(123);`<br>&nbsp;&nbsp;`...`<br>&nbsp;&nbsp;`aran.Leave(123);`<br>`}`
**Apply**                           |                     |
`apply(fct, this, args, index)`     | `f(x,y)`            | `aran.apply(f, aran.g, [x,y], 123)`
`construct(fct, args, index)`       | `new F(x,y)`        | `aran.construct(F, [x,y], 123)`
`Arguments(value, index)`           | `function ...`      | `... aran.Arguments(arguments, 123)... `
`return(value, index)`              | `return x;`         | `return aran.return(x, 123);`
`eval(args, index)`                 | `eval(x, y)`        | `... eval(aran.eval([x,y], 123))... `
**Object**                          |                     |
`get(object, key, index)`           | `o.k`               | `aran.get(o, 'k', 123)` 
`set(object, key, value, index)`    | `o.k = x`           | `aran.set(o, 'k', x, 123)`
`delete(object, key, index)`        | `delete o.k`        | `aran.delete(o, 'k', 123)`
`enumerate(object, index)`          | `for (k in o) ...`  | `... aran.enumerate(o, 123) ...`
**Control**                         |                     |
`test(value, index)`                | `if (x) ...`        | `if (aran.test(x, 123)) ...`
`Label(label, index)`               | `l: { ... };`       | `aran.Label('l', 123);`<br>`l: { ... };`
`Break(label, index)`               | `break l;`          | `aran.Break('l', 123);`<br>`break l;`
`throw(error, index)`               | `throw x;`          | `throw aran.throw(x, 123);`
`Try(index)`<br>`catch(error, index)`<br>`Finally(index)` | `try {`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`...`<br>`}` | `try { `<br>&nbsp;&nbsp;`aran.Try(123);`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`e = aran.catch(e, 123);`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`aran.Finally(123);`<br>&nbsp;&nbsp;`..`<br>`}`

The below table depicts which traps are susceptible to be inserted for every [AST node type](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API).
To further investigate how traps are inserted, please try it out in Aran's [demo page](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).

                         |`Ast`|`Strict`|`literal`|`unary`|`binary`|`Declare`|`read`|`write`|`Enter`|`Leave`|`apply`|`construct`|`Arguments`|`return`|`eval`|`get`|`set`|`delete`|`enumerate`|`test`|`Label`|`Break`|`throw`|`Try`|`catch`|`Finally`
-------------------------|:---:|:------:|:-------:|:-----:|:------:|:-------:|:----:|:-----:|:-----:|:-----:|:-----:|:---------:|:---------:|:------:|:----:|:---:|:---:|:------:|:---------:|:----:|:-----:|:-----:|:-----:|:---:|:-----:|:-------:
`Program`                | X   | X      |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`EmptyStatement`         |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`BlockStatement`         |     |        |         |       |        |         |      |       | X     | X     |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`ExpressionStatement`    |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`IfStatement`            |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`LabeledStatement`       |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      | X     |       |       |     |       |         
`BreakStatement`         |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       | X     |       |     |       |         
`ContinueStatement`      |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`WithStatement`          |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`SwitchStatement`        |     |        |         |       | X      |         |      |       | X     | X     |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`ReturnStatement`        |     |        |         |       |        |         |      |       |       |       |       |           |           | X      |      |     |     |        |           |      |       |       |       |     |       |         
`ThrowStatement`         |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       | X     |     |       |         
`TryStatement`           |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       | X   | X     | X       
`WhileStatement`         |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`DoWhileStatement`       |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`ForStatement`           |     |        |         |       |        | X       |      |       | X     | X     |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`ForInStatement`         |     |        |         |       |        | X       |      | X     | X     | X     |       |           |           |        |      |     | X   |        | X         |      |       |       |       |     |       |         
`DebuggerStatement`      |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`FunctionDeclaration`    |     | X      |         |       |        | X       |      | X     |       |       |       |           | X         |        |      |     |     |        |           |      |       |       |       |     |       |         
`VariableDeclaration`    |     |        |         |       |        | X       |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`ThisExpression`         |     |        |         |       |        |         | X    |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`ArrayExpression`        |     |        | X       |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`ObjectExpression`       |     |        | X       |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`FunctionExpression`     |     | X      |         |       |        |         |      |       |       |       |       |           | X         |        |      |     |     |        |           |      |       |       |       |     |       |         
`SequenceExpression`     |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`UnaryExpression`        |     |        |         | X     |        |         |      |       |       |       |       |           |           |        |      |     |     | X      |           |      |       |       |       |     |       |         
`BinaryExpression`       |     |        |         |       | X      |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`AssignmentExpression`   |     |        |         |       | X      |         | X    | X     |       |       |       |           |           |        |      | X   | X   |        |           |      |       |       |       |     |       |         
`UpdateExpression`       |     |        | X       |       | X      |         | X    | X     |       |       |       |           |           |        |      | X   | X   |        |           |      |       |       |       |     |       |         
`LogicalExpression`      |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`ConditionalExpression`  |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           | X    |       |       |       |     |       |         
`NewExpression`          |     |        |         |       |        |         |      |       |       |       |       | X         |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`CallExpression`         |     |        |         |       |        |         | X    |       |       |       | X     |           |           |        | X    | X   |     |        |           |      |       |       |       |     |       |         
`MemberExpression`       |     |        |         |       |        |         |      |       |       |       |       |           |           |        |      | X   |     |        |           |      |       |       |       |     |       |         
`Identifier`             |     |        |         |       |        |         | X    |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         
`Literal`                |     |        | X       |       |        |         |      |       |       |       |       |           |           |        |      |     |     |        |           |      |       |       |       |     |       |         

We finish this section by discussing the global value holding traps during the execution/analysis phase.
It is the responsibility of the user to make sure that the target code does not interact with it by choosing an appropriate global name or by adding proper guards to traps such as `read`, `write` and `enumerate`.
Such interaction should be avoided because it would alter the original behavior of the target code and the conclusion drawn during the analysis might be falsified.

## Supported ECMAScript6 Features

* Block scoping [let && const](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/let)
 -->