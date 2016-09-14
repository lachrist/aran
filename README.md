# Aran <img src="readme/aran.png" align="right" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for instrumenting JavaScript code which enables amongst other things: profiling, tracing, sandboxing, and symbolic execution.
Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting [ECMAScript6](http://www.ecma-international.org/ecma-262/6.0/).
To install, run `npm install aran`.
Note than Aran does not deal with module systems; alone, it can only handle monolithic JavaScript programs.
Various module systems are supported in a separate module called [Otiluke](https://github.com/lachrist/otiluke).

## Demonstration

In Aran, an analysis consists in a set of syntactic traps that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x + y` may be transformed into `__hidden__.binary('+', x, y)` which triggers the `binary` trap.
The best way to get familiar with Aran is by toying with its [demo page](http://rawgit.com/lachrist/aran/master/demo/index.html) built with [Otiluke](https://github.com/lachrist/otiluke).
The 'transpile' editor expects a script exporting an instrumentation function.
The monolithic program to instrument can be typed into the 'main' editor.
Note that [Otiluke](https://github.com/lachrist/otiluke) provide a dedicated log channel into the option argument.

<img src="readme/demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>

## Usage

```javascript
var Aran = require("aran");
var aran = Aran({
  namespace: hiddenGlobalName,
  traps: trapNames,
  loc: isLoCNeeded,
  range: isRangeNeeded
});
var instrumentedCode = aran.instrument(script, source);
var maybeNode = aran.node(nodeIndex);
var maybeSource = aran.source(nodeIndex);
```

Aside from instrumenting, `aran.instrument` indexes every AST nodes and store them with the associated source.
Later, the indices of the node responsible of triggering the traps are systematically given as last argument.
From these indices, it is possible to retrieve the AST node with `aran.node` or the associated source with `aran.source`.
Here are the options recognized by the top-level function of this module:

 Option     | Default    | Value
------------|------------|---------------------------------------------------------------------------------------------------------------------
`namespace` | `"_meta_"` | String, the name of the global value containing Aran's traps
`traps`     | `[]`       | Array, contains the names of the traps to be called later, during the execution phase
`loc`       | `false`    | Boolean, if true: ast node have line and column-based location info [cf esprima](http://esprima.org/doc/index.html)
`range`     | `false`    | Boolean, if true: ast node have an index-based location range [cf esprima](http://esprima.org/doc/index.html)

To demonstrate how to use Aran we propose to log the function calls inside a program solving: `x^2 - 5*x + 6 = 0`.
Because Aran is fully written in JavaScript, the instrumentation can happen on the same process as the JavaScript program being analyzed.
In that case we say that the instrumentation is online.
By opposition, we refer to offline instrumentation when the instrumentation happens on a separate process.
Three different use examples are provided in this repository:

1. [Offline monolithic instrumentation](usage/offline-monolithic)
2. [Online monolithic instrumentation](usage/online-monolithic)
3. [Online modular instrumentation](usage/online-modular)

Note that if the program under analysis accesses the global variable holding the Aran's traps terrible things will happen.
First it could break the analysis by modifying the traps.
Second, more subtly, it would change the behavior of the program under analysis and the conclusion drawn during the analysis may not hold for the original program.
The most straight forward way to prevent this to happen is to pick an extravagant name for this global variable.
However it is not an exact solution because the program under analysis may still access it by listing the property of the global object.
If your are REALLY worry about this, you can always control the access to the global object with the traps `read`, `write`, `get`, `set`, `delete`, `enumerate` and `apply`.

## Traps

The below table introduces by example the set of traps Aran can insert.
Traps starting with a upper-case letter are simple observers and their return values are never used while the value returned by lower-case traps may be used inside expressions.
All traps are independently optional and they all receive as last argument an integer which is the index of the AST node that triggered the trap.
The AST node at a given index can be retrieved with `aran.node(index)`, the source at a given index can be retrieved with `aran.source(index)`.
In the table below, `123` is used as a dummy index.

 Traps                              | Target              | Instrumented
------------------------------------|---------------------|-------------------------------------------------------
**General**                         |                     |
`Program(index)`                    | `...`                 | `_meta_.Program(123); ...`
`Strict(index)`                     | `'use strict';`     | `'use strict';`<br>`_meta_.Strict(123);`
**Creation**                        |                     |
`primitive(value, index)`           | `null`              | `_meta_.primitive(null, 123)`
`closure(value, index)`             | `function ...`      | `_meta_.closure(function ..., 123)`
`object(properties, index)`         | `{a:x}`             | `_meta_.object([{`<br>&nbsp;&nbsp;`key:"a",`<br>&nbsp;&nbsp;`configurable:true,`<br>&nbsp;&nbsp;`enumerable:true`<br>&nbsp;&nbsp;`value:x`<br>`}]`
`array(elements, index)`            | `[x, y, z]`         | `_meta_.array([x, y, z], 123)`
`regexp(pattern, flags, index)`     | `/abc/g`            | `_meta_.regexp("abc", "g")`
**Environment**                     |                     |
`Declare(kind, variables, index)`   | `var x = 1, y;`     | `_meta_.Declare('var', [x,y], 123);`<br>`var x = 1, y;`
`read(variable, value, index)`      | `x`                 | `_meta_.read('x', x, 123)` |
`write(var, val, write, index)`     | `x = y`             | `_meta_.write(`<br>&nbsp;&nbsp;`'x',`<br>&nbsp;&nbsp;`x,`<br>&nbsp;&nbsp;`function (_meta_) {return x=_meta_},`<br>&nbsp;&nbsp;`123`<br>`)`
`Enter(index)`<br>`Leave(index)`    | `{ ... }`           | `{`<br>&nbsp;&nbsp;`_meta_.Enter(123);`<br>&nbsp;&nbsp;`...`<br>&nbsp;&nbsp;`_meta_.Leave(123);`<br>`}`
`with(environment, index)`          | `with(o) { ... }`   | `with(_meta_.with(o)) { ... }`
**Apply**                           |                     |
`apply(fct, this, args, index)`     | `f(x,y)`            | `_meta_.apply(f, null, [x,y], 123)`
`construct(fct, args, index)`       | `new F(x,y)`        | `_meta_.construct(F, [x,y], 123)`
`Arguments(args, index)`           | `function ...`      | `... _meta_.Arguments(arguments, 123)... `
`return(value, index)`              | `return x;`         | `return _meta_.return(x, 123);`
`eval(args, index)`                 | `eval(x, y)`        | `... eval(_meta_.eval([x,y], 123))... `
`unary(op, value, index)`           | `!x`                | `_meta_.unary('!', x, 123)`
`binary(op, left, right, index)`    | `x + y`             | `_meta_.binary('+', x, y, 123)`
**Object**                          |                     |
`get(object, key, index)`           | `o.k`               | `_meta_.get(o, 'k', 123)` 
`set(object, key, value, index)`    | `o.k = x`           | `_meta_.set(o, 'k', x, 123)`
`delete(object, key, index)`        | `delete o.k`        | `_meta_.delete(o, 'k', 123)`
`enumerate(object, index)`          | `for (k in o) ...`  | `... _meta_.enumerate(o, 123) ...`
**Control**                         |                     |
`test(value, index)`                | `if (x) ...`        | `if (_meta_.test(x, 123)) ...`
`Label(label, index)`               | `l: { ... };`       | `_meta_.Label('l', 123);`<br>`l: { ... };`
`Break(label, index)`               | `break l;`          | `_meta_.Break('l', 123);`<br>`break l;`
`throw(error, index)`               | `throw x;`          | `throw _meta_.throw(x, 123);`
`Try(index)`<br>`catch(error, index)`<br>`Finally(index)` | `try {`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`...`<br>`}` | `try { `<br>&nbsp;&nbsp;`_meta_.Try(123);`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`e = _meta_.catch(e, 123);`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`_meta_.Finally(123);`<br>&nbsp;&nbsp;`..`<br>`}`
`sequence(values, index)`           | `(x, y, z)`         | `_meta_.sequence([x, y, z], 123)`
`expression(value, index)`          | `x`                 | `_meta_.expression(x, 123)`


In the case of a direct apply, the `this` argument provided to the `apply` trap is `undefined` in strict mode and `null` in normal mode.
If one of the parameter is named `arguments`, the `arguments` trap is not triggered.
The `finally` trap is always triggered even if it its clause did not originally exist.
The below table depicts which traps are susceptible to be inserted for every [AST node type](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API).
To further investigate how traps are inserted, try it out in Aran's [demo page](http://rawgit.com/lachrist/aran/master/demo.html).


                         |`Program`|`Strict`|`primitive`|`closure`|`object`|`array`|`regexp`|`Declare`|`read`|`write`|`Enter`|`Leave`|`with`|`apply`|`construct`|`Arguments`|`return`|`eval`|`unary`|`binary`|`get`|`set`|`delete`|`enumerate`|`test`|`Label`|`Break`|`throw`|`Try`|`catch`|`Finally`|`sequence`|`expression`
-------------------------|:-------:|:------:|:---------:|:-------:|:------:|:-----:|:------:|:-------:|:----:|:-----:|:-----:|:-----:|:----:|:-----:|:---------:|:---------:|:------:|:----:|:-----:|:------:|:---:|:---:|:------:|:---------:|:----:|:-----:|:-----:|:-----:|:---:|:-----:|:-------:|:--------:|:----------:
`EmptyStatement`         |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`BlockStatement`         |         |        |           |         |        |       |        |         |      |       | X     | X     |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`ExpressionStatement`    |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          | X          
`IfStatement`            |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          | X          
`LabeledStatement`       |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      | X     |       |       |     |       |         |          |            
`BreakStatement`         |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       | X     |       |     |       |         |          |            
`ContinueStatement`      |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`WithStatement`          |         |        |           |         |        |       |        |         |      |       |       |       | X    |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`SwitchStatement`        |         |        |           |         |        |       |        |         |      |       | X     | X     |      |       |           |           |        |      |       | X      |     |     |        |           | X    |       |       |       |     |       |         |          |            
`ReturnStatement`        |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           | X      |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`ThrowStatement`         |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       | X     |     |       |         |          |            
`TryStatement`           |         |        | X         |         |        |       |        |         |      |       | X     | X     |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       | X   | X     | X       |          | X          
`WhileStatement`         |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          | X          
`DoWhileStatement`       |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          | X          
`ForStatement`           |         |        | X         |         |        |       |        | X       |      | X     | X     | X     |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          | X          
`ForInStatement`         |         |        | X         |         |        |       |        | X       |      | X     | X     | X     |      |       |           |           |        |      |       |        |     | X   |        | X         |      |       |       |       |     |       |         |          | X          
`DebuggerStatement`      |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`FunctionDeclaration`    |         |        |           |         |        |       |        | X       |      | X     |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`VariableDeclaration`    |         |        |           |         |        |       |        |         |      | X     |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          | X          
`ThisExpression`         |         |        |           |         |        |       |        |         | X    |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`ArrayExpression`        |         |        | X         |         |        | X     |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`ObjectExpression`       |         |        |           |         | X      |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`FunctionExpression`     |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`SequenceExpression`     |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         | X        |            
`UnaryExpression`        |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      | X     |        |     |     | X      |           |      |       |       |       |     |       |         |          |            
`BinaryExpression`       |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       | X      |     |     |        |           |      |       |       |       |     |       |         |          |            
`AssignmentExpression`   |         |        | X         |         |        |       |        |         | X    | X     |       |       |      |       |           |           |        |      |       | X      | X   | X   |        |           |      |       |       |       |     |       |         |          |            
`UpdateExpression`       |         |        | X         |         |        |       |        |         | X    | X     |       |       |      |       |           |           |        |      |       | X      | X   | X   |        |           |      |       |       |       |     |       |         |          |            
`LogicalExpression`      |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          |            
`ConditionalExpression`  |         |        |           |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           | X    |       |       |       |     |       |         |          |            
`NewExpression`          |         |        |           |         |        |       |        |         |      |       |       |       |      |       | X         |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`CallExpression`         |         |        | X         |         |        |       |        |         | X    |       |       |       |      | X     |           |           |        | X    |       |        | X   |     |        |           |      |       |       |       |     |       |         |          |            
`MemberExpression`       |         |        | X         |         |        |       |        |         |      |       |       |       |      |       |           |           |        |      |       |        | X   |     |        |           |      |       |       |       |     |       |         |          |            
`Identifier`             |         |        | X         |         |        |       |        |         | X    |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            
`Literal`                |         |        | X         |         |        |       | X      |         |      |       |       |       |      |       |           |           |        |      |       |        |     |     |        |           |      |       |       |       |     |       |         |          |            

## Supported ECMAScript6 Features

* Block scoping [let && const](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/let)

## To-Do

* Bug: duplicating statement is not always safe (thanks Michael):
```javascript
l = a.split('/');
c = l.length;
a: for (;0.0 < c;c -= 1.0){
    e = (l.slice(0.0,c)).join('/');
    if (k)for (d = k.length;0.0 < d;d -= 1.0)if (b = m(h,(k.slice(0.0,d)).join('/')))if (b = m(b,e)){
        f = b;
        g = c;
        break a;
    }
    (!i && (n && m(n,e))) && (i = m(n,e),p = c);
}
``` 
