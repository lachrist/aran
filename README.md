# Aran <img src="aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution. Aran performs a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting ECMAScript6 (see http://www.ecma-international.org/ecma-262/6.0/). To install, run `npm install aran`.

## Demonstration

In Aran, an analysis consists in a set of syntactic traps that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x + y` may be transformed into `aran.traps.binary('+', x, y)` which triggers the `binary` trap.
Below we demonstrate how to analyze a monolithic (as opposed to modularized) JavaScript program using Aran.

1. The file `target.js` is a monolithic JavaScript program that we want to analyze:

  ```javascript
  // target.js //
  function delta (a, b, c) { return  b * b - 4 * a * c}
  function solve (a, b, c) {
    var sol1 = ((-b) + Math.sqrt(delta(a, b, c))) / (2 * a);
    var sol2 = ((-b) - Math.sqrt(delta(a, b, c))) / (2 * a);
    return [sol1, sol2];
  }
  solve(1, -5, 6);
  ```

2. The file `analysis.js` provides an implementation of the syntactic traps to the predefined global variable `aran`:

  ```javascript
  // analysis.js //
  (function () {
    var ast;
    aran.traps = {};
    aran.traps.ast = function (x, i) { ast = x };
    aran.traps.apply = function (f, t, xs, i) {
      var line = aran.fetch(ast, i).loc.start.line;
      console.log("apply "+f.name+" at line "+line);
      return f.apply(t, xs);
    };
  } ());
  ```

3. The file `main.js` creates `__target__.js` as the concatenation of (*i*) `Aran.setup` which defines the global variable `aran` (*ii*) `analysis` which is the content of `analysis.js` (*iii*) `instrumented` which is the result of instrumenting `target.js`. Note that `Aran.instrument` expects an array of traps that should be inserted in the target code.

  ```javascript
  // main.js //
  var fs = require('fs');
  var Aran = require('aran');
  var target = fs.readFileSync(__dirname+'/target.js', {encoding:'utf8'});
  var instrumented = Aran.instrument({loc:true, traps:['ast', 'apply']}, target);
  var analysis = fs.readFileSync(__dirname+'/master.js', {encoding:'utf8'});
  fs.writeFileSync(__dirname+'/__target__.js', [Aran.setup, analysis, instrumented].join('\n'));
  ```

In ECMAScript5-compatible JavaScript environments, evaluating the code in `__target__.js` will produce the following log: 

```
apply solve at line 7
apply delta at line 3
apply sqrt at line 3
apply delta at line 4
apply sqrt at line 4
```

Monolithic JavaScript programs can also be analyzed through Aran's [demo page](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).

<img src="demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>

## API

The top-level function of aran expects an option object wich may contain the following fields:

Option  | Value
:-------|:----------------
`traps` | Object, may contain the syntactic traps detailled below
`loc`   | Boolean, if true: ast node have line and column-based location info (see http://esprima.org/doc/index.html)
`range` | Boolean, if true: ast node have an index-based location range (see http://esprima.org/doc/index.html)

Traps                                        | Target              | Instrumented
:--------------------------------------------|:--------------------|:------------------------------------------------------
`Ast(tree, index)`                           |                     |
`Strict(index)`                              | `'use strict';`     | `'use strict';`<br>`aran.trap.Strict(123);`
`literal(value, index)`                      | `'foo'`             | `aran.traps.literal('foo', 123)`
**Environment**                              |                     |
`Declare(kind, variables, index)`            | `var x = 1, y;`     | `aran.traps.Declare('var', [x,y], 123);`<br>`var x = 1, y;`
`Undeclare(kind, variables, index)`          |                     |
`read(variable, value, index)`               | `x`                 | `aran.traps.read('x', x, 123)` |
`write(variable, old, new, index)`           | `x = y`             | `aran.traps.write('x', x, y, 123)`
**Object**                                   |                     |
`get(object, key, index)`                    | `o.k`               | `aran.traps.get(o, 'k', 123)` 
`set(object, key, value, index)`             | `o.k = x`           | `aran.traps.set(o, 'k', x, 123)`
`delete(object, key, index)`                 | `delete o.k`        | `aran.traps.delete(o, 'k', 123)`
`enumerate(object, index)`                   | `for (k in o) ...`  | `... aran.traps.enumerate(o, 123) ...`
**Apply**                                    |                     |
`arguments(values, index)`                   |                     |
`return(value, index)`                       | `return x;`         | `return aran.traps.return(x, 123);`
`apply(function, context, args, index)`      | `f(x,y)`            | `aran.traps.apply(f, aran.g, [x,y], 123)`
`construct(constructor, args, index)`        | `new F(x,y)`        | `aran.traps.construct(F, [x,y], 123)`
`eval(args, index)`                          | `eval(x, y)`        | `eval(aran.traps.eval([x,y], 123))`
`unary(operator, value, index)`              | `!x`                | `aran.traps.unary('!', x, 123)`
`binary(operator, left, right, index)`       | `x + y`             | `aran.traps.binary('+', x, y, 123)`
**Control**                                  |                     |
`test(value, index)`                         | `if (x) ...`        | `if (aran.traps.test(x, 123)) ...`
`throw(error, index)`                        | `throw x;`          | `throw aran.traps.throw(x, 123);`
`Try(index)`                                 | `try { ... }`       | `try { `<br>&nbsp;&nbsp;`aran.traps.Try(123);`<br>&nbsp;&nbsp;`...`<br>`}`
`catch(error, index)`                        | `catch (e) { ... }` | `catch (e) { `<br>&nbsp;&nbsp;`e = aran.traps.catch(e, 123);`<br>&nbsp;&nbsp;`...`<br>`}`
`Finally(index)`                             | `finally { ... }`   | `finally { `<br>&nbsp;&nbsp;`aran.traps.Finally(123);`<br>&nbsp;&nbsp;`...`<br>`}`
`Label(label, index)`                        | `l: { ... };`       | `aran.traps.Label('l', 123);`<br>`l: {...};`
`Break(label, index)`                        | `break l;`          | `aran.traps.Break('l', 123);`<br>`break l;`

The below table is the cross product of esprima's node type and Aran's traps.
An `X`

                         |`Ast`|`Strict`|`literal`|`Declare`|`Undeclare`|`read`|`write`|`get`|`set`|`delete`|`enumerate`|`arguments`|`return`|`apply`|`construct`|`eval`|`unary`|`binary`|`test`|`throw`|`Try`|`catch`|`Finally`|`Label`|`Break`
-------------------------|-----|--------|---------|---------|-----------|------|-------|-----|-----|--------|-----------|-----------|--------|-------|-----------|------|-------|--------|------|-------|-----|-------|---------|-------|-------
`Program`                |X|X| | | | | | | | | | | | | | | | | | | | | | | 
`EmptyStatement`         | | | | | | | | | | | | | | | | | | | | | | | | | 
`BlockStatement`         | | | | | | | | | | | | | | | | | | | | | | | | | 
`ExpressionStatement`    | | | | | | | | | | | | | | | | | | | | | | | | | 
`IfStatement`            | | | | | | | | | | | | | | | | | | |X| | | | | | 
`LabeledStatement`       | | | | | | | | | | | | | | | | | | | | | | | |X| 
`BreakStatement`         | | | | | | | | | | | | | | | | | | | | | | | | |X
`ContinueStatement`      | | | | | | | | | | | | | | | | | | | | | | | | | 
`WithStatement`          | | | | | | | | | | | | | | | | | | | | | | | | | 
`SwitchStatement`        | | | | | | | | | | | | | | | | | |X|X| | | | | | 
`ReturnStatement`        | | | | | | | | | | | | |X| | | | | | | | | | | | 
`ThrowStatement`         | | | | | | | | | | | | | | | | | | | |X| | | | | 
`TryStatement`           | | | | | | | | | | | | | | | | | | | | |X| |X| | 
`WhileStatement`         | | | | | | | | | | | | | | | | | | |X| | | | | | 
`DoWhileStatement`       | | | | | | | | | | | | | | | | | | |X| | | | | | 
`ForStatement`           | | | | | | | | | | | | | | | | | | |X| | | | | | 
`ForInStatement`         | | | | | | |X| |X| |X| | | | | | | | | | | | | | 
`DebuggerStatement`      | | | | | | | | | | | | | | | | | | | | | | | | | 
`FunctionDeclaration`    | | | |X| | |X| | | | | | | | | | | | | | | | | | 
`VariableDeclaration`    | | | | | | | | | | | | | | | | | | | | | | | | | 
`ThisExpression`         | | | | | |X| | | | | | | | | | | | | | | | | | | 
`ArrayExpression`        | | |X| | | | | | | | | | | | | | | | | | | | | | 
`ObjectExpression`       | | |X| | | | | | | | | | | | | | | | | | | | | | 
`FunctionExpression`     | | | | | | | | | | | | | | | | | | | | | | | | | 
`SequenceExpression`     | | | | | | | | | | | | | | | | | | | | | | | | | 
`UnaryExpression`        | | | | | | | | | |X| | | | | | |X| | | | | | | | 
`BinaryExpression`       | | | | | | | | | | | | | | | | | |X| | | | | | | 
`AssignmentExpression`   | | | | | |X|X|X|X| | | | | | | | |X| | | | | | | 
`UpdateExpression`       | | |X| | |X|X|X|X| | | | | | | | |X| | | | | | | 
`LogicalExpression`      | | | | | | | | | | | | | | | | | | |X| | | | | | 
`ConditionalExpression`  | | | | | | | | | | | | | | | | | | |X| | | | | | 
`NewExpression`          | | | | | | | | | | | | | | |X| | | | | | | | | | 
`CallExpression`         | | | | | |X| |X| | | | | |X| |X| | | | | | | | | 
`MemberExpression`       | | | | | | | |X| | | | | | | | | | | | | | | | | 
`Identifier`             | | | | | |X| | | | | | | | | | | | | | | | | | | 
`Literal`                | | |X| | | | | | | | | | | | | | | | | | | | | | 

## JavaScript Modules



## TODO List