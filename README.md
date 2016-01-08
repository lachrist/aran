# Aran <img src="aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution. Aran performs a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting ECMAScript6 (see http://www.ecma-international.org/ecma-262/6.0/). To install, run `npm install aran`.

## Demonstration

In Aran, an analysis consists in a set of syntactic traps that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x + y` may be transformed into `aran.traps.binary('+', x, y)` which triggers the `binary` trap.
Below we demonstrate how to analyze a monolithic (as opposed to modularized) JavaScript program using Aran.

1. The file `target.js` is a monolithic JavaScript program that is the target for our analysis:

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

2. The file `analysis.js` provides an implementation of the syntactic traps and write them into the predefined global variable `__hidden__`:

  ```javascript
  // analysis.js //
  var __hidden__ = {};
  (function () {
    var ast;
    __hidden__.Ast = function (x, i) { ast = x };
    __hidden__.apply = function (f, t, xs, i) {
      var line = aran.search(ast, i).loc.start.line;
      console.log("apply "+f.name+" at line "+line);
      return f.apply(t, xs);
    };
  } ());
  ```

3. The file `main.js` creates `__target__.js` as the concatenation of
     (*i*) `Aran.setup` which defines the global variable `aran`
     (*ii*) `analysis` which is the content of `analysis.js`
     (*iii*) `instrumented` which is the result of instrumenting `target.js`.
   Note that `Aran.instrument` expects an array of traps that should be inserted in the target code.

  ```javascript
  // main.js //
  var fs = require('fs');
  var Aran = require('aran');
  var target = fs.readFileSync(__dirname+'/target.js', {encoding:'utf8'});
  var instrumented = Aran({global: "__hidden__", loc:true, traps:['ast', 'apply']}, target);
  var analysis = fs.readFileSync(__dirname+'/analysis.js', {encoding:'utf8'});
  fs.writeFileSync(__dirname+'/__target__.js', [Aran.setup, analysis, instrumented].join('\n'));
  ```

In ECMAScript5-compatible environments, evaluating the content of `__target__.js` will produce the following log: 

```
apply solve at line 7
apply delta at line 3
apply sqrt at line 3
apply delta at line 4
apply sqrt at line 4
```

Monolithic JavaScript programs can also be analyzed through Aran's [demo page](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).

<img src="demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>

## Instrumentation Phase

This section details Aran's instrumentation API.
The object exported by this node module contains two fields:

1. `instrument(options, target)`: Function expecting the below set of options and some JavaScript code to instrument; it returns the instrumented JavaScript code.

   Option   | Default  | Value
  :---------|:---------|:----------------
  `global`  | `'aran'` | String, the name of the global variable to store Aran's data
  `nosetup` | `false`  | Boolean, indicate whether to initialize the global 
  `offset`  | `0`      | Integer, the value to start indexing [Esprima](http://esprima.org) AST nodes 
  `traps`   | `[]`     | Array, contains the names of the traps to be called during the execution phase
  `loc`     | `false`  | Boolean, if true: ast node have line and column-based location info [see](http://esprima.org/doc/index.html)
  `range`   | `false`  | Boolean, if true: ast node have an index-based location range [see](http://esprima.org/doc/index.html)

2. `setup`: JavaScript code for initializing the execution phase -- i.e.: globally defining the aran object of the execution/analysis phase.

The below table introduces by example the set of traps Aran may insert.
Traps starting with a upper-case letter are simple observers and their return values are discarded while the value returned by lower-case traps may be used inside expressions.
All traps are independently optional and they all receive as last argument an integer which is the index of the [Esprima](http://esprima.org) AST node that triggered the trap.
The very first trap to be triggered is always `Ast` which receives the indexed [Esprima](http://esprima.org) AST tree of the instrumented code. 
In the table below, `123` is used as a dummy index.

 Traps                                    | Target              | Instrumented
:-----------------------------------------|:--------------------|:------------------------------------------------------
`Ast(tree, index)`                        |                     |
`Strict(index)`                           | `'use strict';`     | `'use strict';`<br>`aran.Strict(123);`
`literal(value, index)`                   | `'foo'`             | `aran.literal('foo', 123)`
**Environment**                           |                     |
`Declare(kind, variables, index)`         | `var x = 1, y;`     | `aran.Declare('var', [x,y], 123);`<br>`var x = 1, y;`
`read(variable, value, index)`            | `x`                 | `aran.read('x', x, 123)` |
`write(variable, old, new, index)`        | `x = y`             | `aran.write('x', x, y, 123)`
`Enter(index)`                            | `{ ... }`           | `{ aran.Enter(123); ... }`
`Leave(index)`                            | `{ ... }`           | `{ ... aran.Leave(123); }`
**Object**                                |                     |
`get(object, key, index)`                 | `o.k`               | `aran.get(o, 'k', 123)` 
`set(object, key, value, index)`          | `o.k = x`           | `aran.set(o, 'k', x, 123)`
`delete(object, key, index)`              | `delete o.k`        | `aran.delete(o, 'k', 123)`
`enumerate(object, index)`                | `for (k in o) ...`  | `... aran.enumerate(o, 123) ...`
**Apply**                                 |                     |
`arguments(values, index)`                |                     | `arguments = aran.arguments(arguments, 123)`
`return(value, index)`                    | `return x;`         | `return aran.return(x, 123);`
`apply(function, context, args, index)`   | `f(x,y)`            | `aran.apply(f, aran.g, [x,y], 123)`
`construct(constructor, args, index)`     | `new F(x,y)`        | `aran.construct(F, [x,y], 123)`
`eval(args, index)`                       | `eval(x, y)`        | `... eval(aran.eval([x,y], 123))... `
`unary(operator, value, index)`           | `!x`                | `aran.unary('!', x, 123)`
`binary(operator, left, right, index)`    | `x + y`             | `aran.binary('+', x, y, 123)`
**Control**                               |                     |
`test(value, index)`                      | `if (x) ...`        | `if (aran.test(x, 123)) ...`
`throw(error, index)`                     | `throw x;`          | `throw aran.throw(x, 123);`
`Try(index)`                              | `try { ... }`       | `try { `<br>&nbsp;&nbsp;`aran.Try(123);`<br>&nbsp;&nbsp;`...`<br>`}`
`catch(error, index)`                     | `catch (e) { ... }` | `catch (e) { `<br>&nbsp;&nbsp;`e = aran.catch(e, 123);`<br>&nbsp;&nbsp;`...`<br>`}`
`Finally(index)`                          | `finally { ... }`   | `finally { `<br>&nbsp;&nbsp;`aran.Finally(123);`<br>&nbsp;&nbsp;`...`<br>`}`
`Label(label, index)`                     | `l: { ... };`       | `aran.Label('l', 123);`<br>`l: {...};`
`Break(label, index)`                     | `break l;`          | `aran.Break('l', 123);`<br>`break l;`

The below table depicts which traps are susceptible to be inserted for a given [Esprima](http://esprima.org/) AST node.
To further investigate how traps are inserted, please try it out in Aran's [demo page](http://rawgit.com/lachrist/aran/master/glitterdust/demo.html).

                         |`Ast`|`Strict`|`literal`|`Declare`|`Undeclare`|`read`|`write`|`get`|`set`|`delete`|`enumerate`|`arguments`|`return`|`apply`|`construct`|`eval`|`unary`|`binary`|`test`|`throw`|`Try`|`catch`|`Finally`|`Label`|`Break`
-------------------------|:---:|:------:|:-------:|:-------:|:---------:|:----:|:-----:|:---:|:---:|:------:|:---------:|:---------:|:------:|:-----:|:---------:|:----:|:-----:|:------:|:----:|:-----:|:---:|:-----:|:-------:|:-----:|:-----:
`Program`                | X   | X      |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`EmptyStatement`         |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`BlockStatement`         |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`ExpressionStatement`    |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`IfStatement`            |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`LabeledStatement`       |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         | X     |       
`BreakStatement`         |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       | X     
`ContinueStatement`      |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`WithStatement`          |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`SwitchStatement`        |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       | X      | X    |       |     |       |         |       |       
`ReturnStatement`        |     |        |         |         |           |      |       |     |     |        |           |           | X      |       |           |      |       |        |      |       |     |       |         |       |       
`ThrowStatement`         |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      | X     |     |       |         |       |       
`TryStatement`           |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       | X   |       | X       |       |       
`WhileStatement`         |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`DoWhileStatement`       |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`ForStatement`           |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`ForInStatement`         |     |        |         |         |           |      | X     |     | X   |        | X         |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`DebuggerStatement`      |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`FunctionDeclaration`    |     |        |         | X       |           |      | X     |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`VariableDeclaration`    |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`ThisExpression`         |     |        |         |         |           | X    |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`ArrayExpression`        |     |        | X       |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`ObjectExpression`       |     |        | X       |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`FunctionExpression`     |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`SequenceExpression`     |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`UnaryExpression`        |     |        |         |         |           |      |       |     |     | X      |           |           |        |       |           |      | X     |        |      |       |     |       |         |       |       
`BinaryExpression`       |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       | X      |      |       |     |       |         |       |       
`AssignmentExpression`   |     |        |         |         |           | X    | X     | X   | X   |        |           |           |        |       |           |      |       | X      |      |       |     |       |         |       |       
`UpdateExpression`       |     |        | X       |         |           | X    | X     | X   | X   |        |           |           |        |       |           |      |       | X      |      |       |     |       |         |       |       
`LogicalExpression`      |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`ConditionalExpression`  |     |        |         |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        | X    |       |     |       |         |       |       
`NewExpression`          |     |        |         |         |           |      |       |     |     |        |           |           |        |       | X         |      |       |        |      |       |     |       |         |       |       
`CallExpression`         |     |        |         |         |           | X    |       | X   |     |        |           |           |        | X     |           | X    |       |        |      |       |     |       |         |       |       
`MemberExpression`       |     |        |         |         |           |      |       | X   |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`Identifier`             |     |        |         |         |           | X    |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       
`Literal`                |     |        | X       |         |           |      |       |     |     |        |           |           |        |       |           |      |       |        |      |       |     |       |         |       |       

## Execution/Analysis Phase

We now discuss the second phase which consists in executing the target program along with the analysis instantiated by the traps. 
Before evaluating any output of `Aran.instrument`, two step are required:
  (*i*) evaluate `Aran.setup` which create the global `aran`
  (*ii*) provide a user-defined implementation of the traps in `aran.traps`.
Currently, the global `aran` only features one helper function: `aran.search(node, index)` which attempts to find a sub node at the given index; `undefined` is returned if the search failed.
The complexity of `aran.search` is of `O(log(n))` where `n` is the size of the given node.

Lets have a short word on Aran's transparency -- i.e.: its ability to not affect the behavior of the program under scrutiny.
The transparency of the analyses performed by Aran are primary reliant on the transparency of the traps defined by the user.
Less importantly, the global variables `aran` may be accessed from within target code.
For instance, the target code `aran = null` may preclude Aran from further performing the analysis.
In most cases, these transparency breakage can be prevented with proper guards in traps' implementation.

## JavaScript Modules

TODO
