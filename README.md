# Aran <img src="readme/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/package/aran) for instrumenting JavaScript code.
To install, run `npm install aran`.
Aran was designed as an infra-structure to build development-time dynamic program analyses such as: objects and functions profiling, debugging, control-flow tracing, taint analysis and concolic testing.
Aran can be used at deployment-time but be mindful of performance overhead.
For instance, Aran can be used to carry out control access systems such as sandboxing.
Aran can also be used as a desugarizer much like [babel](https://babeljs.io).

## Getting Started

```sh
mkdir node_modules
npm install acorn aran astring
```

```js
const Acorn = require("acorn");
const Aran = require("aran");
const Astring = require("astring");
global.META = {};
META.primitive = (primitive, serial) => {
  console.log("["+serial+"]", primitive);
  return primitive;
};
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup()));
const script1 = "'Hello World!'";
const estree1 = Acorn.parse(script1);
const estree2 = aran.weave(estree1, ["primitive"], null);
const script2 = Astring.generate(estree2);
global.eval(script2);
```

The code transformation performed by Aran essentially consists in inserting calls to functions called *traps* at [ESTree](https://github.com/estree/estree) nodes specified by the user.
For instance, the expression `x + y` could be transformed into `META.binary("+", x, y, 123)`.
The last argument passed to traps is always a *serial* number which uniquely identifies the node which triggered the trap.
These traps functions are collectively called *advice* and the specification that characterizes which node should trigger a given trap is called *pointcut*.
The process of inserting trap calls based on a pointcut is called *weaving*.
This terminology is borrowed from [aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming).
[demo/remote/apply](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/remote-apply-factorial.html) demonstrates these concepts.
The instrumentation performed in this demonstrator is qualified as *remote* because it takes place on a process distinct from the one evaluating the instrumented code.

![remote instrumentation](readme/remote.svg)

As shown in [demo/local/apply](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-apply-factorial.html), Aran can also be used to perform *local* instrumentation -- i.e.: the instrumentation is performed on the process that also evaluates the instrumented code.
Compared to remote instrumentation, local instrumentation enable direct communication between an advice and its associated Aran's instance.
For instance, `aran.node(serial)` can invoked by the advice to retrieve the line index of the node that triggered a trap.
An other good reason for the advice to communicate with Aran arises when the target program performs dynamic code evaluation -- e.g. by calling the evil [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function.

## Demonstrators

* [demo/local/empty](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-empty-empty.html): Do nothing.
  Can be used to inspect how Aran desugars JavaScript.
* [demo/local/forward](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-forward-empty.html):
  Transparent implementation of all the traps.
  Can be used to inspect how Aran inserts traps.
  The last lines can be uncommented to turn this analysis into a tracer.
* [demo/local/sandbox](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-sandbox-global.html):
  Very restrictive sandboxing.
  See the API section on `aran.setup` to know which identifiers should be available from the scope.
* [demo/local/eval](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-eval-dynamic.html):
  How to to handle dynamic code evaluation, inserting [script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) is not handled.
* [demo/local/shadow-value](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-shadow-value-delta.html):
  Track program values across the value stack and the environment but not the store (the shadow value way).
* [demo/local/shadow-state](https://cdn.rawgit.com/lachrist/aran/1e6c3eaf/demo/output/local-shadow-state-delta.html):
  Track program values across the value stack and the environment but not the store (the shadow state way).
  This analysis provides the same output as the previous one but is more complex.

## Limitations

1) Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and most of [ECMAScript2017](https://www.ecma-international.org/ecma-262/8.0/).
   Known missing features are:
   * Native modules ([`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)).
   * [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
   * Generator functions ([`function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), [`yield`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield),[`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)).
   * Asynchronous functions ([`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)).
   * [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
2) There exists loopholes that will cause the target program to behave differentially when analyzed, this is discussed in [Known Heisenbugs](#known-heisenbugs).
3) Aran does not provide any facilities for instrumenting modularized JavaScript applications.
   To instrument server-side node applications and client-side browser applications we rely on a separate module called [Otiluke](https://github.com/lachrist/otiluke).
4) Aran does not offer an out-of-the-box interface for tracking primitive values through the object graph.
   This feature is crucial for data-flow centric dynamic analyses such as taint analysis and symbolic execution.
   In our research, we track primitive values through the object graph with a complementary npm module called [Linvail](https://github.com/lachrist/linvail).

## API

### Syntactic Nodes

Aran visits the *statement nodes* and *expression nodes* of a given ESTree.
Within an ESTree, a node is called statement node if it can be replaced by any other statement while conserving the syntactic validity of the program.
Same goes for expression nodes.
The only exception being [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) which are considered node expressions even though they cannot be replaced by non-function expressions.
When Aran instruments a program, all its statement nodes and all its expression nodes will be annotated with the following fields:

* `AranSerial :: number`:
  The node's serial number.
* `AranMaxSerial :: number`:
  The maximum serial number which can be found within the node's decedents.
  This is useful to speed up node search.
* `AranParent :: ESTree | *`:
  The node's parent.
  If the node is of type `"Program"`, then this field will be the third argument passed to `aran.weave`. 
  This field is not enumerable to prevent `JSON.stringify` from complaining about circularity.
* `AranParentSerial :: number | null`:
  The parent's serial number of the node (if any).
* `AranStrict :: boolean`:
  Indicates whether the node is in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) or not.

### `aran = require("aran")(options)`

Create a new Aran instance.
* `options.namespace :: string`, default `"META"`:
  The name of the global variable holding the advice.
  Code instrumented by this aran instance will not be able to read, write or shadow this variable.
* `options.output :: string | object`, default `"EstreeOptimized"`:
  The output format of `aran.weave` and `aran.setup`.
  If it is an object, it should be a builder ressembling the ones at [src/build](src/build).
  If it is a string, it should be one of:
  * `"ESTree"`:
    Regular ESTree.
  * `"ESTreeOptimized"`:
    An optimized and more compact ESTree.
    The performance cost of the optimization pass should barely be noticeable. 
  * `"ESTreeValid"`:
    Same as `"ESTree"` but performs various checks before constructing each node.
    This is useful to debug Aran itself.
  * `"String"`:
    Directly produces an unoptimized and compact code string.
    This should result in a slightly faster instrumentation than the other output options.
* `options.nocache :: boolean`, default `false`:
  A boolean indicating whether aran should keep an array of nodes indexed by serial number.
  A truthy options will result in a faster execution of `aran.node`.
* `options.sandbox :: boolean`, default `false`:
  A boolean indicating whether instrumented code should use a custom object as [global object](https://developer.mozilla.org/en-US/docs/Glossary/Global_object).
  If this options is truthy, code weaved without parent will contain a [with statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with) whose environment object is a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).
  This proxy will also solve a transparency breakage by restoring identifiers sanitized by Aran.
  This is expected to produce noticeable performance overhead.
* `aran :: aran.Aran`:
  The newly created aran instance.

### `output = aran.setup()`

Build the setup code that should be evaluated before any instrumented code.
* `aran :: aran.Aran`:
  An Aran instance.
* `output :: *`:
  The setup code whose format depends on `options.output`.

When evaluating the setup code, the following variables should present in the scope:
* `sandbox`: if sandboxing is enabled, this value will replace the global object.
* `eval`: direct [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) calls.
* `Proxy`: sandboxing and [with statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with).
* `Object.defineProperty`: [function.name](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name) and [function.length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length).
* `ReferenceError`: [assignment to undeclared variable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Undeclared_var) (sandboxing only).
* `global.global`: [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).
* `global.Reflect.apply`: [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).
* `global.TypeError`: [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
* `global.eval`: direct [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) calls.
* `global.Object.defineProperty`: [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set).
* `global.Symbol.iterator`: [iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).
* `global.Object.getPrototypeOf`: [for-in loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in).
* `global.Object.keys`: [for-in loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in).

### `output = aran.weave(estree, pointcut, parent)`

Insert calls to trap functions at nodes specified by the pointcut.
* `aran :: aran.Aran`
* `estree :: estree.Program`:
  The [ESTree Program](https://github.com/estree/estree/blob/master/es2015.md#programs) to instrument.
* `pointcut :: array | function | object | *`, default `false`:
  The specification that tells Aran where to insert trap calls.
  Four specification formats are supported:
  * `array`:
    An array containing the names of the traps to insert at every applicable cut point.
    For instance, the poincut `["binary"]` indicates aran to insert the `binary` traps whenever applicable.
  * `function`:
    A function that tells whether to insert a given trap at a given node.
    For instance, the pointcut below results in aran inserting a call to the `binary` trap at every update expression:
    ```js
    const pointcut = (name, node) => name === "binary" && node.type === "UpdateExpression" ;
    ```
  * `object`:
    An object whose keys are trap names and values are functions receiving nodes.
    As for the `function` format, these functions should return a boolean indicating whether to insert the call.
    For instance, the pointcut below has the same semantic as the one above:
    ```js
    const pointcut = { binary: (node) => node.type === "UpdateExpression" };
    ```
  * `*`:
    If truthy, all traps are to be inserted when applicable,
    If falsy, insert never insert any trap.
* `parent :: ESTree | null`, default `null`:
  In the event of instrumenting code before passing it to a direct eval call, this argument should refer to the node performing the call to the eval function.
  Otherwise it should be `null`.
* `output :: *`:
  The instrumented output whose format depends on `options.output`.

### `node = aran.node(serial)`

Retrieve a node from its serial number.
If `options.nocache` is truthy, this method will explore the ESTrees which has a complexity growing linearly with the depth of the trees.
If `options.nocache` is falsy, this methods resolves to a much quicker array access.
* `aran :: aran.Aran`
* `serial :: number`
* `node :: ESTree | undefined`

### `root = aran.root(serial)`

Retrieve the ESTree Program node that contains the node at the given serial number.
* `aran :: aran.Aran`
* `serial :: number`
* `root :: ESTree.Program | undefined`

## Traps

Traps are functions of the advice provided by the user.
All traps are independently optional and they all receive as last argument an integer which is the index of the ESTree node that triggered the trap.
We categorized traps depending on their insertion mechanism.

* *Combiners*: replacements for expression nodes.
  These traps are given several values from the target program which they can freely combine.
  Their transparent implementation is trap-dependent.
  For instance:
  ```js
  // o.k(x) >> META.invoke(o, "k", [x], 123);
  META.invoke = (object, key, values, serial) => Reflect.apply(object[key], object, values);
  ```
  Combiners pop some values from the value-stack and push exactly one value on top of it.
* *Modifiers*: surround expression nodes.
  These traps are given a single value from the target program which they can freely modify.
  Their transparent implementation consists in returning the second last argument.
  For instance:
  ```js
  // x >> META.read("x", x, 123)
  META.read = (identifier, value, serial) => value;
  ```
  Additionally most modifiers fall into the two subcategories based on their impact on the value stack:
  * *Producers*: produce a value on top of the value stack -- e.g.: `primitive`.
  * *Consumers*: consume the value on top of the value stack -- e.g.: `test`.
* *Informers*: result is discarded.
  These traps are only given static syntactic information.
  Their transparent implementation consists in doing nothing.
  For instance:
  ```js
  // break a; >> META.break(false, "a", 123); break a;
  META.break = (iscontinue, label, serial) => {};
  ```
  Informers don't have any effect on the value stack.

Name          | arguments[0]         | arguments[1]        | arguments[2]        | arguments[3]   
--------------|----------------------|---------------------|---------------------|----------------
**Combiners** |                      |                     |                     |                
`apply`       | `function:value`     | `this:value`        | `arguments:[value]` | `serial:number`
`invoke`      | `object:value`       | `key:value`         | `arguments:[value]` | `serial:number`
`construct`   | `constructor:value`  | `arguments:[value]` | `serial:number`     |                
`unary`       | `operator:string`    | `argument:value`    | `serial:number`     |                
`binary`      | `operator:string`    | `left:value`        | `right:value`       | `serial:number`
`get`         | `object:value`       | `key:value`         | `serial:number`     |                
`set`         | `object:value`       | `key:value`         | `value:value`       | `serial:number`
`delete`      | `object:value`       | `key:value`         | `serial:number`     |                
`object`      | `properties:`<br>`[{0:value,1:value}]` | `serial:number` |       |                
`array`       | `elements:[value]`   | `serial:number`     |                     |                
**Modifiers** |                      |                     |                     |                
`copy`        | `position:number`    | `forward:*`         | `serial:number`     |                
`drop`        | `forward:*`          | `serial:number`     |                     |                
`swap`        | `position1:number`   | `position2:number`  | `forward:*`         | `serial:number`
*Producers*   |                      |                     |                     |                
`read`        | `identifier:string`  | `produced:value`    | `serial:number`     |                
`discard`     | `identifier:string`  | `produced:value`    | `serial:number`     |                
`builtin`     | `name:string`        | `produced:value`    | `serial:number`     |                
`arrival`     | `strict:boolean`     | `produced:value`    | `serial:number`     |                
`catch`       | `produced:value`     | `serial:number`     |                     |                
`primitive`   | `produced:value`     | `serial:number`     |                     |                
`regexp`      | `produced:value`     | `serial:number`     |                     |                
`function`    | `produced:value`     | `serial:number`     |                     |                
*Consumers*   |                      |                     |                     |                
`declare`     | `kind:string`        | `identifier:string` | `consumed:value`    | `serial:number`
`write`       | `identifier:string`  | `consumed:value`    | `serial:number`     |                
`test`        | `consumed:value`     | `serial:number`     |                     |                
`with`        | `consumed:value`     | `serial:number`     |                     |                
`throw`       | `consumed:value`     | `serial:number`     |                     |                
`return`      | `consumed:value`     | `serial:number`     |                     |                
`eval`        | `consumed:value`     | `serial:number`     |                     |                
`completion`  | `consumed:value`     | `serial:number`     |                     |                
`success`     | `strict:boolean`     | `direct:boolean`    | `consumed:value`    | `serial:number`
`failure`     | `strict:boolean`     | `direct:boolean`    | `consumed:value`    | `serial:number`
**Informers** |                      |                     |                     |                
`begin`       | `strict:boolean`     | `direct:boolean`    | `serial:number`     |                
`end`         | `strict:boolean`     | `direct:boolean`    | `serial:number`     |                
`try`         | `serial:number`      |                     |                     |                
`finally`     | `serial:number`      |                     |                     |                
`block`       | `serial:number`      |                     |                     |                
`leave`       | `type:string`        | `serial:number`     |                     |                
`label`       | `continue:boolean`   | `label:string`      | `serial:number`     |                
`break`       | `continue:boolean`   | `label:string`      | `serial:number`     |                

## Known Heisenbugs

When dynamically analyzing a program it is implicitly assumed that the analysis will conserve its behavior.
If this is not the case, the analysis might draw erroneous conclusions.
Behavioral divergences caused by analyses over the target programs are called [heisenbugs](https://en.wikipedia.org/wiki/Heisenbug).
Here are the known heisenbugs that Aran may introduce by itself:

* *Performance Overhead*:
  A program being dynamically analyzed will necessarily perform slower.
  Events might interleave in a different order or malicious code might detect the overhead.
  Unfortunately there is no general solution to this problem. 
* *Code Reification*:
  Whenever the target program can obtain a representation of itself, the original code should be returned and not its instrumented version.
  [`Function.prototype.toString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString) and [`ScriptElement.textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) are both instance of code reification.
  Aran does not deal with code reification at the moment.
* *Modified Global Variables*:
  To prevent clashes, Aran sanitizes identifiers with a function similar to: 
  ```js
  function sanitize (identifier) {
    if (identifier === "new.target")
      return "$newtarget";
    if (/^\$*(completion|error|newtarget|this|arguments|eval)$/.test(identifier))
      return "$$" + identifier;
    if (/^\$*META/)
      return "$$" + identifier;
    return identifier;
  }
  ```
  If a modified identifier is actually a global variable, the global object will differ.
  Consider the code below, it will output `foo foo undefined` but will output `foo undefined foo` under an empty Aran analysis.
  ```js
  // Original //
  var error = "foo";
  console.log(error, global.error, global.$$error);
  ```
  ```js
  // Instrumented (pointcut = []) //
  var $$error = "foo";
  console.log($$error, global.error, global.$$error);
  ```
  This heisenbug can be alleviated by turning the sandbox option on.
* *Access to the Advice*:
  Consider the snippet below which makes the advice available as a global variable.
  If the `script` code accesses the `global.META`, havoc will ensue. 
  ```js
  global.META = {};
  const aran = Aran({namespace:"META"});
  global.eval(Astring.generate(aran.setup());
  global.eval(Astring.generate(aran.weave(script)));
  ```
  This heisenbug can be alleviated by locally defining the advice and using direct eval calls.
  ```js
  const META = {};
  cons aran = Aran({namespace:"META" /*sandbox:true*/});
  // const sandbox = global;
  eval(Astring.generate(aran.setup()));
  eval(Astring.generate(aran.weave(script)));
  ```
  However this is not a complete solution because although the `META` identifier is sanitized, `aran` is still accessible from the target program.
  A complete solution can be obtained by turning the sandbox option on.
  In that case, only the lookup of `META` will be able to reach to outside scope.
* *Typeof in the Temporal Deadzone*:
  Aran does not hoist `let` and `const` declarations so it cannot make the difference between an undeclared variable and an undefined variable.
  To the best of our knowledge, this distinction is only necessary when `typeof` is involved.
  This approximation simplifies both Aran's internal structure and analyses modeling the environment.
  Normally the code below should fail at the `typeof` line but it won't after inserting the `unary` trap:
  ```js
  // Original //
  {
    typeof x;
    const x;
  }
  ```
  ```js
  // Instrumented (pointcut = ["unary"]) //
  {
    META.unary("typeof", (function () {
      try { return x } catch (error) {}
      return void 0;
    } ()));
    const x;
  }
  ```
* *Arguments' Numerical Properties*:
  Some analyses like [`demo/local/analysis/shadow-value.js`](demo/local/analysis/shadow-value.js) threat values differently when they are get/set to object than when they are read/written to the environment.
  In non strict mode, the [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments) blurs this distinction which can lead to heisenbugs.
  In the code below, the `write` trap should be triggered with `"x"` and `"bar"` to account to for the sneaky variable assignment but it is not at the moment. 
  ```js
  function f (x) {
    arguments[0] = "bar";
    console.log(x); // prints "bar"
  }
  f("foo");
  ```

## Acknowledgments

I'm [Laurent Christophe](http://soft.vub.ac.be/soft/members/lachrist) a phd student at the Vrij Universiteit of Brussel (VUB).
I'm working at the SOFT language lab in close relation with my promoters [Coen De Roover](http://soft.vub.ac.be/soft/members/cderoove) and [Wolfgang De Meuter](http://soft.vub.ac.be/soft/members/wdmeuter).
I'm currently being employed on the [Tearless](http://soft.vub.ac.be/tearless/pages/index.html) project.

![tearless](readme/tearless.png)
![soft](readme/soft.png)
![vub](readme/vub.png)

