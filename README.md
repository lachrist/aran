# Aran <img src="readme/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/aran) for instrumenting JavaScript code which enables amongst other things: objects and functions profiling, debugging, control-flow tracing and sandboxing.
Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and we are working toward supporting the latter ECMAScript specifications.
To install, run `npm install aran`.

Note than Aran does not deal with module systems.
Alone, it can only handle monolithic JavaScript programs.
Various module systems are supported in a separate module called [Otiluke](https://github.com/lachrist/otiluke).
Additionally, Aran does not offer an out-of-the-box interface for tracking primitive values which is crucial for data-flow centric dynamic analyses such as taint analysis and symbolic execution.
In our research, we track primitive values with a completmentary npm module: [Linvail](https://github.com/lachrist/linvail).

## Getting Started

In Aran, an analysis consists in a set of trap functions that will be triggered while the program under scrutiny is being executed.
For instance, the expression `x+y` may be transformed into `_traps_.binary('+',x,y)` which triggers the `binary` trap.
The best way to get familiar with Aran is by toying with its [demo page](http://rawgit.com/lachrist/aran/master/demo/index.html).

<img src="readme/demo.png" align="center" alt="demo-screenshot" title="Aran's demonstration page"/>

Usually, program instrumentation is understood as a pipeline technique: *first* instrument the source code *then* execute the instrumented code.
This process is referred as *offline* instrumentation.
By opposition, the term *online* instrumentation is used when the code instrumentation can be interleaved with the execution of the instrumented code.
We provide three usage example in this repository:

1. [Offline monolithic instrumentation](usage/offline-monolithic)
2. [Online monolithic instrumentation](usage/online-monolithic)
3. [Online modular instrumentation](usage/online-modular)

## API

Trap Category | # pops | # pushes
---------------------------------
Combiner      | x      | 1 (0 set)
Producer      | 0      | 1
Consumer      | 1      | 0
Informer      | 0      | 0

### `aran = Aran(namespace)`

* `namespace(string)`: the name of the global variable holding the traps. The default value is `"_traps_"`.
* `aran(object)`: a new Aran instance.

Note that if the program under analysis accesses the global variable holding the Aran's traps terrible things will happen.
First it could break the analysis by modifying the traps.
Second, it could change the behavior of the program under analysis and the conclusion drawn during the analysis may not hold for the original program.
An effective way to prevent this to happen is to pick a randomly generated name for this global variable.

```js
var namespace = "_traps_"+Math.random().toString(36).substring(2);
```

However it is not an exact solution because the program under analysis may still access it by listing the properties of the global object with a `for ... in` loop or with a call to `Object.getOwnPropertyNames` or `Reflect.ownKeys`.
This is an instance of transparency breakage which is further discussed in the section about transparency.

### `namespace = aran.namespace`

* `namespace(string)`: the name of the global variable holding the traps.

### `instrumented = aran.instrument(program, pointcut)`

* `program(object)`: an [ESTree](https://github.com/estree/estree) [program node](https://github.com/estree/estree/blob/master/es5.md#programs).
* `pointcut(array|function|object)`: specification of where to insert calls to trap.
  * If `pointcut` is an array it will be understood as the names of the trap to insert.
  * If `pointcut` is a function, it should accept a trap name and a node index and return boolean indicating whether a call to the trap of the given name should be inserted at the node of the given index.
    For instance, the pointcut below insert calls to the binary trap everywhere and calls to the apply trap only at line 666:
    ```js
    var poincut = function (name, index) {
      if (name === "binary")
        return true;
      if (name !== "apply")
        return false;
      var loc = aran.node(index).loc;
      return loc.start.line === 666 && loc.end.line === 666;
    };
    ```
  * If `pointcut` is an non null object, it is a combination of the two previous options.
    For instance, the pointcut below specifies the same trap insertion as the pointcut above:
    ```js
    var pointcut = {
      "apply": true,
      "binary": function (index) {
        var loc = aran.node(index).loc;
        return loc.start.line === 666 && loc.end.line === 666;
      }
    };
    ``` 
  * If `pointcut` is anything else no calls to trap will be inserted but Aran's sanitization will still occur. 
* `instrumented(string)`: the instrumented version of `program`.

### `node = aran.node(index)`

* `index(number)`: the index of an [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects).
* `node(object|undefined)`: the [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects) at the given index, if any.

### `program = aran.program(index)`

* `index(number)`: the index of an [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects).
* `program(object|undefined)`: the [ESTree](https://github.com/estree/estree) [program node](https://github.com/estree/estree/blob/master/es5.md#programs) incorporating the [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects) at the given index, if any.

## Traps

The below table introduces by example the set of traps Aran can insert.
Traps starting with a upper-case letter are simple observers and their return values are never used while the value returned by lower-case traps may be used inside expressions.
All traps are independently optional and they all receive as last argument an integer which is the index of the [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects) that triggered the trap.
In the table below, `123` is used as a dummy index.

 Traps                             | Target              | Instrumented
-----------------------------------|---------------------|-------------------------------------------------------
**General**                        |                     |
`Program(idx)`                     | `...`               | `_traps_.Program(123); ...`
`Strict(idx)`                      | `'use strict';`     | `'use strict';`<br>`_traps_.Strict(123);`
**Creation**                       |                     |
`primitive(val, idx)`              | `"foo"`             | `_traps_.primitive("foo", 123)`
`function(val, idx)`               | `function ...`      | `_traps_.function(function ..., 123)`
`object(val, idx)`                 | `{a:x}`             | `_traps_.object({a:x}, 123)`
`array(val, idx)`                  | `[x, y, z]`         | `_traps_.array([x, y, z], 123)`
`regexp(val, idx)`                 | `/abc/g`            | `_traps_.regexp(/abc/g, 123)`
**Environment**                    |                     |
`Declare(knd, tags, idx)`          | `var x = 1, y;`     | `_traps_.Declare('var', [x,y], 123);`<br>`var x = 1, y;`
`read(tag, val, idx)`              | `x`                 | `_traps_.read('x', x, 123)`
`write(tag, old, new, wrt, idx)`   | `x = y`             | `_traps_.write('x', x, y, (_traps_) => x=_traps_, 123)`
`Enter(idx)`<br>`Leave(idx)`       | `{ ... }`           | `{`<br>&nbsp;&nbsp;`_traps_.Enter(123);`<br>&nbsp;&nbsp;`...`<br>&nbsp;&nbsp;`_traps_.Leave(123);`<br>`}`
`with(env, idx)`                   | `with(o) { ... }`   | `with(_traps_.with(o)) { ... }`
**Apply**                          |                     |
`apply(fct, ths, args, idx)`       | `f(x,y)`            | `_traps_.apply(f, null, [x,y], 123)`
`construct(cst, args, idx)`        | `new F(x,y)`        | `_traps_.construct(F, [x,y], 123)`
`Arguments(args, idx)`             | `function ...`      | `... _traps_.Arguments(arguments, 123)... `
`return(val, idx)`                 | `return x;`         | `return _traps_.return(x, 123);`
`eval(args, idx)`                  | `eval(x, y)`        | `... eval(_traps_.eval([x,y], 123))... `
`unary(uop, arg, idx)`             | `!x`                | `_traps_.unary('!', x, 123)`
`binary(bop, arg1, arg2, idx)`     | `x + y`             | `_traps_.binary('+', x, y, 123)`
**Object**                         |                     |
`get(obj, key, idx)`               | `o.k`               | `_traps_.get(o, 'k', 123)` 
`set(obj, key, val, idx)`          | `o.k = x`           | `_traps_.set(o, 'k', x, 123)`
`delete(obj, key, idx)`            | `delete o.k`        | `_traps_.delete(o, 'k', 123)`
`enumerate(obj, idx)`              | `for (k in o) ...`  | `... _traps_.enumerate(o, 123) ...`
**Control**                        |                     |
`test(val, idx)`                   | `if (x) ...`        | `if (_traps_.test(x, 123)) ...`
`Label(lab, idx)`                  | `l: { ... };`       | `_traps_.Label('l', 123);`<br>`l: { ... };`
`Break(lab, idx)`                  | `break l;`          | `_traps_.Break('l', 123);`<br>`break l;`
`Continue(lab, idx)`               | `continue l;`       | `_traps_.Continue('l', 123);`<br>`continue l;`
`throw(err, idx)`                  | `throw x;`          | `throw _traps_.throw(x, 123);`
`Try(idx)`<br>`catch(err, idx)`<br>`Finally(idx)` | `try {`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`...`<br>`}` | `try { `<br>&nbsp;&nbsp;`_traps_.Try(123);`<br>&nbsp;&nbsp;`...`<br>`} catch (e) {`<br>&nbsp;&nbsp;`e = _traps_.catch(e, 123);`<br>&nbsp;&nbsp;`...`<br>`} finally {`<br>&nbsp;&nbsp;`_traps_.Finally(123);`<br>&nbsp;&nbsp;`..`<br>`}`
`sequence(vals, idx)`              | `(x, y, z)`         | `_traps_.sequence([x, y, z], 123)`
`expression(val, idx)`             | `x`                 | `_traps_.expression(x, 123)`

In the case of a direct apply, the `this` argument provided to the `apply` trap is `undefined` in strict mode and `null` in normal mode.
If one of the parameter is named `arguments`, the `arguments` trap is not triggered.
The `finally` trap is always triggered even if it its clause did not originally exist.
The below table depicts which traps are susceptible to be inserted for every [ESTree](https://github.com/estree/estree) [node types](https://github.com/estree/estree/blob/master/es5.md).
To further investigate how traps are inserted, try it out in Aran's [demo page](http://rawgit.com/lachrist/aran/master/demo.html).

X                        | `Program` | `Strict` | `primitive` | `function` | `object` | `array` | `regexp` | `Declare` | `read` | `write` | `Enter` | `Leave` | `with` | `apply` | `construct` | `Arguments` | `return` | `eval` | `unary` | `binary` | `get` | `set` | `delete` | `enumerate` | `test` | `Label` | `Break` | `throw` | `Try` | `catch` | `Finally` | `sequence` | `expression`
-------------------------|:---------:|:--------:|:-----------:|:----------:|:--------:|:-------:|:--------:|:---------:|:------:|:-------:|:-------:|:-------:|:------:|:-------:|:-----------:|:-----------:|:--------:|:------:|:-------:|:--------:|:-----:|:-----:|:--------:|:-----------:|:------:|:-------:|:-------:|:-------:|:-----:|:-------:|:---------:|:----------:|:------------:
`EmptyStatement`         |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`BlockStatement`         |           |          |             |            |          |         |          |           |        |         | X       | X       |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`ExpressionStatement`    |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            | X            
`IfStatement`            |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            | X            
`LabeledStatement`       |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        | X       |         |         |       |         |           |            |              
`BreakStatement`         |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         | X       |         |       |         |           |            |              
`ContinueStatement`      |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`WithStatement`          |           |          |             |            |          |         |          |           |        |         |         |         | X      |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`SwitchStatement`        |           |          |             |            |          |         |          |           |        |         | X       | X       |        |         |             |             |          |        |         | X        |       |       |          |             | X      |         |         |         |       |         |           |            |              
`ReturnStatement`        |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             | X        |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`ThrowStatement`         |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         | X       |       |         |           |            |              
`TryStatement`           |           |          | X           |            |          |         |          |           |        |         | X       | X       |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         | X     | X       | X         |            | X            
`WhileStatement`         |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            | X            
`DoWhileStatement`       |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            | X            
`ForStatement`           |           |          | X           |            |          |         |          | X         |        | X       | X       | X       |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            | X            
`ForInStatement`         |           |          | X           |            |          |         |          | X         |        | X       | X       | X       |        |         |             |             |          |        |         |          |       | X     |          | X           |        |         |         |         |       |         |           |            | X            
`DebuggerStatement`      |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`FunctionDeclaration`    |           |          |             |            |          |         |          | X         |        | X       |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`VariableDeclaration`    |           |          |             |            |          |         |          |           |        | X       |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            | X            
`ThisExpression`         |           |          |             |            |          |         |          |           | X      |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`ArrayExpression`        |           |          | X           |            |          | X       |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`ObjectExpression`       |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`FunctionExpression`     |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`SequenceExpression`     |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           | X          |              
`UnaryExpression`        |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        | X       |          |       |       | X        |             |        |         |         |         |       |         |           |            |              
`BinaryExpression`       |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         | X        |       |       |          |             |        |         |         |         |       |         |           |            |              
`AssignmentExpression`   |           |          | X           |            |          |         |          |           | X      | X       |         |         |        |         |             |             |          |        |         | X        | X     | X     |          |             |        |         |         |         |       |         |           |            |              
`UpdateExpression`       |           |          | X           |            |          |         |          |           | X      | X       |         |         |        |         |             |             |          |        |         | X        | X     | X     |          |             |        |         |         |         |       |         |           |            |              
`LogicalExpression`      |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            |              
`ConditionalExpression`  |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             | X      |         |         |         |       |         |           |            |              
`NewExpression`          |           |          |             |            |          |         |          |           |        |         |         |         |        |         | X           |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`CallExpression`         |           |          | X           |            |          |         |          |           | X      |         |         |         |        | X       |             |             |          | X      |         |          | X     |       |          |             |        |         |         |         |       |         |           |            |              
`MemberExpression`       |           |          | X           |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          | X     |       |          |             |        |         |         |         |       |         |           |            |              
`Identifier`             |           |          | X           |            |          |         |          |           | X      |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              
`Literal`                |           |          |             |            |          |         |          |           |        |         |         |         |        |         |             |             |          |        |         |          |       |       |          |             |        |         |         |         |       |         |           |            |              

## Transparency Concerns


* *Namespace access*:
  
  In the original version of the program `global[namespace]` should not be defined.


## Known Transparency Breakage

In the context of dynamic analysis, it is crucial to prevent the program under analysis from interacting with the analysis.
If such interaction happens, the conclusions drawn during the analysis may no longer hold for the original program.
In other words, the analysis (meta) layer should remain *transparent* from the program (base) layer.
There are several known transparency issues that Aran does not handle for you:

* *Code reificaton*:
  JavaScript offers means to have a view of the code.
  In that case the original (non-instrumented) code should be return.
  `Function.prototype.toString` is an instance of code reification.
  ```js
  var code = "function (x) { return x }";
  var identity = function (x) { return x }; 
  assert(identity.toString() === code);
  ```

* *`typeof` in the temporal deadzone*.
  Aran does not hoist `let` and `const` declaration so it cannot make the difference between an undeclared variable and undefined variable.
  This approximiation simplifies both aran and analyses modeling the environment.
  However it leads to transparency breakage when `typeof` is involved.
  Normally the code below should fail at the `typeof` line but it does not after aran compilation.
  ```js
  {
    typeof x;
    const x;
  }
  ```
  ```js
  {
    META.unary("typeof", (function () {
      try { return META.read(x) } catch (error) {}
      return META.primitive(void 0);
    } ()));
    const x;
  }
  ```

* The (evil) `with` construct.
Aran protect the following identifiers: `this`, `$this`, `arguments`, `$arguments`, `error`, `$error`.
Also, Aran consider that reading a variable from the environment is transparent.
This fair assumption can be broken when the object passed to the `with` construct is a proxy or contains getters.

* Global object:

```
var error = "foo";
if (error !== "foo")
  throw "This will not thrown!";
if (global.error !== "foo")
  throw "But this will...";
```

```
global.arguments = "foo";
var arrow = () => arguments;

```

## Known unsported ECMAScript features

* ES2015 modules: native JS modules arrived, we did not even to begin to think about their implication for Aran.

* ES2015 classes: they should be desugared and trigger pre-existing traps.

* Generator functions (i.e. the keywords: `function*`, `yield` and `yield*`).
Would be nice to desugar generator functions into regular function returning an explicit iterator.

* Asynchronous functions (i.e. the kewords: `async` and `await`).
Would be nice to desugar `await` into explicit promises nesting.

* `arguments`: as there is no dedicated language structure involved with the use of `arguments`, code using the arguments object can be instrumented.
However there is no support to account for the crazinest of this feature.
In the code below, the `write` trap should be triggered over `x` but we do not do it at the moment.

```js
function g (xs) {
  xs[0] = "foo";
}
function f (x,y,z) {
  g(arguments);
  return [x,y,z];
}
console.log(f(1,2,3))
```
```
{ '0': 'foo', '1': 2, '2': 3 }
```

* Template literals
