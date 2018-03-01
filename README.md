# Aran <img src="readme/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/aran) for instrumenting JavaScript code.
To install, run `npm install aran`.
Aran was designed as an infra-structure to build development-time dynamic program analyses such as: objects and functions profiling, debugging, control-flow tracing, taint analysis and concolic testing.
However, aside from performance overhead, nothing prevents Aran to be used at deployment-time.
For instance, Aran could be used to implement control access systems such as sandboxing.
Aran could also be used as a desugarizer much like [babel](https://babeljs.io).

## Limitations

1) Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and most of [ECMAScript2017](https://www.ecma-international.org/ecma-262/8.0/).
   Notable missing features are:
   * Native modules ([`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)).
   * [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
   * Generator functions ([`function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), [`yield`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield),[`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)).
   * Asynchronous functions ([`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)).
   * [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
2) Aran does not provide any facilities for instrumenting modularized JavaScript applications.
   To instrument server-side node applications and client-side browser applications we rely on a separate module called [Otiluke](https://github.com/lachrist/otiluke).
3) Aran does not offer an out-of-the-box interface for tracking primitive values through the object graph.
   This feature is crucial for data-flow centric dynamic analyses such as taint analysis and symbolic execution.
   In our research, we track primitive values with a complementary npm module called [Linvail](https://github.com/lachrist/linvail).

## Getting Started

The code transformation performed by Aran essentially consists in inserting calls to global functions at ast nodes specified by the user.
For instance, the expression `x+y` may be transformed into `_META_.binary('+',x,y,123)`.
The last argument passed to these global functions is always a *serial* number which uniquely identifies the node responsible for triggering the call. 
These global functions are collectively called advice (or traps) and the specification that characterizes what part of the advice should be executed at which node is called pointcut.
The process calling parts of the advice at the program points defined by the pointcut is called joining. 
This terminology is borrowed from [aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming).
[offline/apply](...) is a simple Aran demonstrations that exemplifies these concepts.

<img src="readme/offline.pdf" align="center" alt="offline-instrumentation" title="Aran's offline instrumentation"/>

The analysis [offline/apply](...) is qualified as *offline* because the instrumentation performed by Aran takes place on a separate process.
As shown in [online/apply](...), Aran can also be used to perform *online* instrumentation -- i.e.: the instrumentation is performed on the process that *eval*uates the instrumented code.
The advantage  of online instrumentation over offline instrumentation is to enables direct communication between Aran and advices.
For instance, [online/apply](...) uses `aran.node(serial)` to retrieve the line index of the node that triggered the `apply` trap.
An other good reason for the advice and Aran to communicate arises when the instrumented code performs dynamic code evaluation -- e.g. by calling the evil [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function.

Below is a minimal working example of online analysis in node:

```sh
mkdir node_modules
npm install aran acorn astring
```

```js
const Aran = require("aran");
const Acorn = require("acorn");
const Astring = require("astring");
global.META = {};
META.primitive = (primitive, serial) => {
  console.log("["+serial+"]", primitive);
  return primitive;
};
const script = "'Hello World!'";
const aran = Aran({namespace:"META"});
eval(Astring.generate(aran.join(Acorn.parse(script, ["primitive"], null)));
```

## API

### Syntactic Nodes

Aran visits the *statement nodes* and *expression nodes* of an [ESTree](https://github.com/estree/estree).
Within an ESTree, a node is called statement node if it can be replaced by any other statement while conserving the syntactic validity of the program.
Same goes for expression node at the exception of syntactic [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) which are considered node expression even though they cannot be changed into non-function expressions.
For instance, in the program `for (var k = x in o) ...`, the variable declaration `var k = x` does not correspond to a statement node but `x` does correspond to an expression node.
When Aran instruments a program, *all* its statement nodes and *all* its expression nodes will be annotated with the following fields:

* `AranSerial :: number`.
  The node's serial number.
* `AranMaxSerial :: number`.
  The maximum serial number which can be found within the node's decedents.
* `AranParent :: ESTree | *`.
  The node's parent, in general this should be an ESTree.
  But, if the node's type is `"Program"`, then this field will be the third argument passed to `aran.join(program, pointcut, parent)`. 
  This field is not enumerable to prevent `JSON.stringify` from complaining about circularity.
* `AranParentSerial :: number | null`.
  The parent's serial number of the node (if any).
* `AranStrict :: boolean`
  Tells whether the node is in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

### `aran = require("aran")(options)`

Create a new Aran instance.
* `options.namespace :: string` default: `"META"`.
  The name of the global variable holding the advice.
  Code instrumented by this aran instance will not be able to read, write or shadow this variable.
* `options.nocache :: boolean` default: `false`.
  A boolean indicating whether aran should keep an array of node indexed by serial number.
  If this options is truthy, aran will have to explore the ast which is `O(log(n))` instead of array accessing which is `O(1)`.
* `options.nosetup :: boolean` default: `false`.
  A boolean indicating whether to prefix the short setup code before every instrumented programs.
  The setup code consists only in a few read and write operations so it is extremely lightweight.
  If this option is truthy, the setup code will have to be manually evaluated before executing any instrumented program.
* `options.output :: string | object` default: `"EstreeOptimized"`.
  The output format of the `aran.join` method.
  If it is an object, it should be a builder ressembling the ones at [src/build](src/build).
  If it is a string, it should be one of:
  * `"ESTree"`: regular [ESTree](https://github.com/estree/estree).
  * `"ESTreeOptimized"`: an optimized and more compact ESTree.
    The performance cost of the optimization pass should barely be noticeable. 
  * `"ESTreeValid"`: same as `"ESTree"` but performs various checks at every node construction.
    This is useful to debug Aran itself.
  * `"String"`: directly produces an unoptimized and compact code string.
    This should result in a slightly faster instrumentation than the other output options.

### `setup = aran.setup()`

Build the setup code that should be evaluated at least once before evaluating any instrumented code.
If the Aran instance was created with a falsy `options.nosetup`, this method is useless.
* `setup :: *`.
  The setup code whose format depends on `options.output`.

The setup code with the namespace option set to `"META"`:
```js
if (typeof META_ARAN_global === "undefined") {
  var META_ARAN_global = typeof self === "undefined" ? global : self;
  var META_ARAN_eval_substitute = eval;
  var META_ARAN_eval_authentic = typeof META_eval === "undefined" ? eval : META_ARAN_eval;
  var META_ARAN_TypeError = TypeError;
  var META_ARAN_Reflect_apply = Reflect.apply;
  var META_ARAN_Object_defineProperty = Object.defineProperty;
  var META_ARAN_Object_getPrototypeOf = Object.getPrototypeOf;
  var META_ARAN_Object_keys = Object.keys;
  var META_ARAN_Symbol_iterator = Symbol.iterator;
}
```

### `joined = aran.join(program, pointcut, parent)`

Instrument the given program.
* `program :: ESTree.Program`.
  The [ESTree Program](https://github.com/estree/estree/blob/master/es2015.md#programs) to instrument.
* `pointcut :: closure | object | array` default:  `[]`.
  The specification that tells aran where to insert calls to the advice.
  Aran support four specification formats:
  * `array`: an array containing the names of the traps to insert everywhere.
    For instance, the poincut below results in aran inserting the `binary` trap everywhere:
    ```js
    const pointcut = ["binary"]
    ```
  * `closure`: a function that receives the name of the trap to insert and the node where to insert it.
    It should returns a boolean value that indicate whether or not to insert the trap.
    For instance, the pointcut below results in aran inserting a call to the `binary` trap at every update expression:
    ```js
    const pointcut = (name, node) => node.type === "UpdateExpression" && name === "binary";
    ```
  * `object`: an object whose property keys are trap names and property values are functions recieving a node.
    As for the `closure`format, these functions should return a boolean indicating wether to insert the trap call.
    For instance, the pointcut below has the same semantic as the one above:
    ```js
    const pointcut = { binary: (node) => node.type === "UpdateExpression" };
    ```
  * `*`: if truthy, insert all the traps everywhere; if falsy, insert none of the trap nowhere.
* `parent :: ESTree | null` default : `null`.
  In the event of instrumenting code before passing it to a *direct* eval call, `parent` should refer the node calling the eval function.
  Otherwise it should be `null`.
  Aside from performing `program.AranParent = parent`, this argument is used to annotate nodes with `AranStrict`.
* `joined :: *`.
  The instrumented output whose format depends on `options.output`.

### `node = aran.node(serial)`

Retrieve a node from its serial number.
* `serial :: number`.
* `node :: ESTree | undefined`

### `root = aran.root(serial)`

Retrieve the program node that contains the node at the given serial number.
* `serial :: number`
* `root :: ESTree.Program | undefined`

## Traps (Advice)

Category | # pops | # pushes
----------------------------
Combiner | 1..n   | 1
Producer | 0      | 1
Consumer | 1      | 0
Informer | 0      | 0

The below table introduces by example the set of traps Aran can insert.
Traps starting with a upper-case letter are simple observers and their return values are never used while the value returned by lower-case traps may be used inside expressions.
All traps are independently optional and they all receive as last argument an integer which is the index of the [ESTree](https://github.com/estree/estree) [node](https://github.com/estree/estree/blob/master/es5.md#node-objects) that triggered the trap.
In the table below, `123` is used as a dummy index.

Name          | arguments[0]         | arguments[1]        | arguments[2]        | arguments[3]
--------------|----------------------|---------------------|---------------------|-----------------
**Informers** |                      |                     |                     |
`begin`       | `serial:number`      |                     |                     |
`end`         | `serial:number`      |                     |                     |
`try`         | `serial:number`      |                     |                     |
`finally`     | `serial:number`      |                     |                     |
`block`       | `serial:number`      |                     |                     |
`leave`       | `type:string`        | `serial:number`     |                     |
`label`       | `continue:boolean`   | `label:string`      | `serial:number`     |
`break`       | `continue:boolean`   | `label:string`      | `serial:number`     |
`callee`      | `closure:function`   | `serial:number`     |                     |
**Combiners** |                      |                     |                     |
`object`      | `properties:`<br>`[{0:value,1:value}]` | `serial:number` |       |
`array`       | `elements:[value]`   | `serial:number`     |                     |
`get`         | `object:value`       | `key:value`         | `serial:number`     |
`set`         | `object:value`       | `key:value`         | `value:value`       | `serial:number`
`delete`      | `object:value`       | `key:value`         | `serial:number`     |
`invoke`      | `object:value`       | `key:value`         | `arguments:[value]` | `serial:number`
`apply`       | `strict:boolean`     | `function:value`    | `arguments:[value]` | `serial:number`
`construct`   | `constructor:value`  | `arguments:[value]` | `serial:number`     |
`unary`       | `operator:string`    | `argument:value`    | `serial:number`     |
`binary`      | `operator:string`    | `left:value`        | `right:value`       | `serial:number`
**Modifiers** |                      |                     |                     |
*Stack*       |                      |                     |                     |
`copy`        | `position:number`    | `chain:*`           | `serial:number`     |
`drop`        | `chain:*`            | `serial:number`     |                     |
`swap`        | `position1:number`   | `position2:number`  | `chain:*`           | `serial:number`
*Producers*   |                      |                     |                     |
`read`        | `identifier:string`  | `produced:value`    | `serial:number`     |
`discard`     | `identifier:string`  | `produced:value`    | `serial:number`     |
`builtin`     | `name:string`        | `produced:value`    | `serial:number`     |
`newtarget`   | `produced:value`     | `serial:number`     |                     |
`this`        | `produced:value`     | `serial:number`     |                     |
`arguments`   | `produced:value`     | `serial:number`     |                     |
`catch`       | `produced:value`     | `serial:number`     |                     |
`primitive`   | `produced:value`     | `serial:number`     |                     |
`regexp`      | `produced:value`     | `serial:number`     |                     |
`closure`     | `produced:value`     | `serial:number`     |                     |
*Consumers*   |                      |                     |                     |
`declare`     | `kind:string`        | `identifier:string` | `consumed:value`    | `serial:number`
`write`       | `identifier:string`  | `consumed:value`    | `serial:number`
`test`        | `consumed:value`     | `serial:number`     |                     |
`with`        | `consumed:value`     | `serial:number`     |                     |
`throw`       | `consumed:value`     | `serial:number`     |                     |
`return`      | `consumed:value`     | `serial:number`     |                     |
`eval`        | `consumed:value`     | `serial:number`     |                     |
`completion`  | `consumed:value`     | `serial:number`     |                     |
`success`     | `consumed:value`     | `serial:number`     |                     |
`failure`     | `consumed:value`     | `serial:number`     |                     |

* `["begin", "completion", "success", "failure", "end"]`

  ```js
  "Hello!";
  ```

  ```js
  let completion;
  try {
    META.begin(2);
    completion = META.completion(void 0, 2);
    completion = META.completion("Hello!", 3);
    completion = META.success(completion, 2);
  } catch (error) {
    throw META.failure(error, 2);
  } finally {
    META.end(2);
  }
  completion;
  ```

* `["block", "leave", "break"]`

  ```js
  {"Hello!"}
  ```

  ```js
  let completion;
  completion = void 0;
  {
    META.block(3);
    completion = "Hello!";
    META.leave("block", 3);
  }
  completion;
  ```

* `["try", "catch", "finally", "leave", "throw"]`

  ```js
  try {
    throw "BOUM";
  } catch (e) {
    console.log("catch");
  } finally {
    console.log("finally");
  }
  ```

  ```js
  let completion;
  completion = void 0;
  try {
    META.try(3);
    throw META.throw("BOUM", 4);
    META.leave("try", 3);
  } catch (error) {
    error = META.catch(error, 3);
    let e = error;
    completion = postMessage("catch");
    META.leave("catch", 3);
  } finally {
    META.finally(3);
    postMessage("finally");
    META.leave("finally", 3);
  }
  completion;
  ```

* `["callee", "newtarget", "this", "arguments", "closure", "return"]`

  ```js
  function IdentityFunction (x) {
    return x;
  }
  let IdentityArrow = (x) => x;
  ```

  ```js
  let completion;
  completion = void 0;
  var id = METAObject_defineProperty(METAObject_defineProperty((function () {
    const callee = META.closure(function () {
      META.callee(callee, 3);
      const $this = META.this(this, 3);
      const $newtarget = META.newtarget(new.target, 3);
      arguments = META.arguments(arguments, 3);
      let $arguments = arguments;
      let x = arguments[0];
      return META.return(x, 4);
      return META.return(void 0, 3);
    }, 3);
    return callee;
  })(), "name", {
    value: "id",
    configurable: true
  }), "length", {
    value: 1,
    configurable: true
  });
  completion;
  ```

* `["label", "leave"]`
  ```js
  l : while (true) {
    break l;
    continue l;
  }
  ```
  ```js
  let completion;
  completion = void 0;
  bl: {
    META.label(true, "l", 3);
    B4: {
      META.label(true, null, 4);
      while (true) C4: {
        META.label(false, null, 4);
        cl: {
          META.label(false, "l", 4);
          META.break(true, "l", 6);
          break bl;
          META.break(false, "l", 7);
          break cl;
          META.leave("label", 4);
        }
        META.leave("label", 4);
      }
      META.leave("label", 4);
    }
    META.leave("label", 3);
  }
  completion;
  ```

* `["object"]`

  ```js
  ({
    key1: "value1",
    key2: "value2"
  })
  ```

  ```js
  let completion;
  completion = void 0;
  completion = META.object([["key1", "value1"], ["key2", "value2"]], 4);
  completion;
  ```

* `["eval"]`

  ```js
  eval("123");
  ```

  ```js
  let completion;
  completion = void 0;
  let META4_eval_arguments;
  let META4_eval_result;
  completion = (
    META4_eval_arguments = ["123"],
    (
      eval === METAeval_authentic ?
      eval(META.eval(META4_eval_arguments[0], 4)) :
      (
        eval === METAeval_substitute ?
        (
          eval = METAeval_authentic,
          META4_eval_result = eval(META.eval(META4_eval_arguments[0], 4)),
          eval = METAeval_substitute,
          META4_eval_result) :
        eval(META4_eval_arguments[0]));
  completion;
  ```

* `["test"]`

  ```js
  if (true) "foo";
  false ? "foo" : "bar";
  while (0) {}
  for (; null;) {}
  ```

  ```js
  let completion;
  completion = void 0;
  if (META.test(true, 3)) ;
  META.test(false, 8) ? "foo" : "bar";
  B12: while (META.test(0, 12)) C12: ;
  completion = void 0;
  B14: while (META.test(null, 14)) C14: ;
  completion;
  ```

 Pointcut                             | Target              | Instrumented
-----------------------------------|---------------------|-------------------------------------------------------
**Informers**                      |                     |
["begin", ]
`begin(serial)`<br>`success(completion, serial)`<br>`failure(error, serial)`<br>`end(serial)` | `...` | `try {`<br>&nbsp;&nbsp;`META.begin(123);`<br>&nbsp;&nbsp;`...`<br>&nbsp;&nbsp;`META.success(METAcompletion, 123);`<br>`} catch (error) {`<br>&nbsp;&nbsp;`META.failure(error, 123);`<br>`} finally {`<br>&nbsp;&nbsp;`META.end(123);`<br>`}`
`label(false, label, serial)`<br>`leave("label", serial)` | `l:{...}` | `l:{`<br>&nbsp;&nbsp;`label(false, "l", 123);`<br>&nbsp;&nbsp;`...`<br>&nbsp;&nbsp;`leave("label", 123);` |
`label(true, label, serial)`<br>`leave("label", serial)` | `l:while (...) {...}` | l:while() { label() }
`block(serial)`<br>`leave("block", serial)` |
`break(false, label, serial)`      |  
`break(true, label, serial)`       |

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

https://www.ecma-international.org/ecma-262/5.1/#sec-15.1.2.1.1
https://www.ecma-international.org/ecma-262/8.0/index.html#sec-function-calls-runtime-semantics-evaluation
https://www.ecma-international.org/ecma-262/8.0/index.html#sec-performeval


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

* Template literals

## Transparency concerns

* Function instances prototype.

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


