# Aran <img src="readme/aran.png" align="right" alt="aran-logo" title="Aran Linvail the shadow master"/>

Aran is a [npm module](https://www.npmjs.com/aran) for instrumenting JavaScript code.
To install, run `npm install aran`.
Aran was designed as an infra-structure to build development-time dynamic program analyses such as: objects and functions profiling, debugging, control-flow tracing, taint analysis and concolic testing.
Aran can be used at deployment-time but be mindfull of performance overhead.
For instance, Aran can be used to carry out control access systems such as sandboxing.
Aran can also be used as a desugarizer much like [babel](https://babeljs.io).

## Limitations

1) Aran performs a source-to-source code transformation fully compatible with [ECMAScript5](http://www.ecma-international.org/ecma-262/5.1/) and most of [ECMAScript2017](https://www.ecma-international.org/ecma-262/8.0/).
   Known missing features are:
   * Native modules ([`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import), [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)).
   * [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
   * Generator functions ([`function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), [`yield`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield),[`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)).
   * Asynchronous functions ([`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)).
   * [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
2) There exists loopholes that will cause the target program to behave differentially when analyzed, this is discussed in [Heisenbugs](heisenbugs).
3) Aran does not provide any facilities for instrumenting modularized JavaScript applications.
   To instrument server-side node applications and client-side browser applications we rely on a separate module called [Otiluke](https://github.com/lachrist/otiluke).
4) Aran does not offer an out-of-the-box interface for tracking primitive values through the object graph.
   This feature is crucial for data-flow centric dynamic analyses such as taint analysis and symbolic execution.
   In our research, we track primitive values through the object graph with a complementary npm module called [Linvail](https://github.com/lachrist/linvail).

## Getting Started

The code transformation performed by Aran essentially consists in inserting calls to functions called *traps* at [ESTree](https://github.com/estree/estree) nodes specified by the user.
For instance, the expression `x + y` could be transformed into `META.binary("+", x, y, 123)`.
The last argument passed to traps is always a *serial* number which uniquely identifies the node which triggered the trap.
These traps functions are collectively called *advice* and the specification that characterizes what part of the advice should be executed at which node is called pointcut.
The process of inserting calls to parts of the advice at the program points defined by the pointcut is called weaving.
This terminology is borrowed from [aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming).
[demo/remote/apply](TODO) demonstrates these concepts.
The instrumentation performed in this demonstrator is qualified as *remote* because it takes place on a process distinct from the one evaluating the instrumented code.

<img src="readme/remote.pdf" align="center" alt="remote-instrumentation" title="Aran's remote instrumentation"/>

As shown in [demo/local/apply](TODO), Aran can also be used to perform *local* instrumentation -- i.e.: the instrumentation is performed on the process that evaluates the instrumented code.
The advantage of local instrumentation over remote instrumentation is to enables direct communication between Aran's instances and advices.
For instance, the advice can use `aran.node(serial)` to retrieve the line index of the node that triggered a trap.
An other good reason for the advice to communicate with Aran arises when the target program performs dynamic code evaluation -- e.g. by calling the evil [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function.
Below is a minimal working example of local instrumentation in node:

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
const aran = Aran({namespace:"META"});
global.eval(Astring.generate(aran.setup()));
const script1 = "'Hello World!'";
const estree1 = Acorn.parse(script1);
const parent = null;
const pointcut = ["primitive"];
const estree2 = aran.weave(estree1, pointcut, parent);
const script2 = Astring.generate(estree2);
global.eval(script2);
```

## Demonstrators

* [demo/local/empty](TODO): Do nothing.
  Can be used to inspect how Aran desugars JavaScript.
* [demo/local/forward](TODO):
  Transparent implementation of all the traps.
  Can be used to inspect how Aran inserts traps.
  The last lines can be uncommented to turn this analysis into a tracer.
* [demo/local/sandbox](TODO):
  Very restrictive sandboxing.
  See the section on `aran.setup` to know which identifiers should be available.
* [demo/local/eval](TODO):
  How to to handle dynamic code evaluation, [script element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) are not handled.
* [demo/local/shadow-Value](TODO):
  Track programs values across the value stack and the environment but not the store, the shadow value way.
* [demo/local/shadow-State](TODO):
  Track programs values across the value stack and the environment but not the store, the shadow state way.

## API

### Syntactic Nodes

Aran visits the *statement nodes* and *expression nodes* of an [ESTree](https://github.com/estree/estree).
Within an ESTree, a node is called statement node if it can be replaced by any other statement while conserving the syntactic validity of the program.
Same goes for expression node at the exception of syntactic [getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set) which are considered node expression even though they cannot be replaced by non-function expressions.
For instance, in the program `for (var k = x in o) ...`, the variable declaration `var k = x` does not correspond to a statement node but `x` does correspond to an expression node.
When Aran instruments a program, all its statement nodes and all its expression nodes will be annotated with the following fields:

* `AranSerial :: number`.
  The node's serial number.
* `AranMaxSerial :: number`.
  The maximum serial number which can be found within the node's decedents.
  This is useful to speed up serial number lookups.
* `AranParent :: ESTree | *`.
  The node's parent.
  If the node is of type `"Program"`, then this field will be the third argument passed to `aran.join(program, pointcut, parent)`. 
  This field is not enumerable to prevent `JSON.stringify` from complaining about circularity.
* `AranParentSerial :: number | null`.
  The parent's serial number of the node (if any).
* `AranStrict :: boolean`
  Indicates whether the node is in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) or not.

### `aran = require("aran")(options)`

Create a new Aran instance.
* `options.namespace :: string` default: `"META"`.
  The name of the global variable holding the advice.
  Code instrumented by this aran instance will not be able to read, write or shadow this variable.
* `options.output :: string | object` default: `"EstreeOptimized"`.
  The output format of the `aran.weave` method.
  If it is an object, it should be a builder ressembling the ones at [src/build](src/build).
  If it is a string, it should be one of:
  * `"ESTree"`: regular [ESTree](https://github.com/estree/estree).
  * `"ESTreeOptimized"`: an optimized and more compact ESTree.
    The performance cost of the optimization pass should barely be noticeable. 
  * `"ESTreeValid"`: same as `"ESTree"` but performs various checks before constructing each node.
    This is useful to debug Aran itself.
  * `"String"`: directly produces an unoptimized and compact code string.
    This should result in a slightly faster instrumentation than the other output options.
* `options.nocache :: boolean` default: `false`.
  A boolean indicating whether aran should keep an array of node indexed by serial number.
  If this options is truthy, `aran.node(serial)` will explores the ast which is `O(log(n))` rather than accessing the cache which is `O(1)`.
* `options.sandbox :: boolean` default: `false`.
  A boolean indicating whether instrumented code should a use a custom object as [global object](https://developer.mozilla.org/en-US/docs/Glossary/Global_object).
  If this options is truthy, code weaved without parent will contain a [with statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with) whose environment object is a [proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).
  This proxy will also solve a transparency breakage by restoring identifiers sanitized by Aran.

### `output = aran.setup()`

Build the setup code that should be evaluated before any instrumented code.
* `output :: *`.
  The setup code whose format depends on `options.output`.

The code simply populate the advice with the couple of properties summarized below.

Key                            |  Value                                                            | Usage 
-------------------------------|-------------------------------------------------------------------|------------------
`EVAL`                         | `eval`                                                            | direct [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) calls
`PROXY`                        | `Proxy`                                                           | sandboxing and [with statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with)
`WHANDLERS`                    | `{ has, get, set, deleteProperty }`                               | [with statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with)
`DEFINE`                       | `Object.defineProperty`                                           | [arguments.callee](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments/callee), [function.name](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name), [function.length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) and sandbox declaration
`GLOBAL` (sandbox falsy)       | `("indirect", eval)("this")`                                      | sandboxing and getting globals 
`GLOBAL` (sandbox truthy)      | `sandbox`                                                         | getting globals
`DECLARATION` (sandbox truthy) | `true`                                                            | sandbox declaration/assignment
`RERROR` (sandbox truthy)      | `ReferenceError`                                                  | sandbox assignment/read
`GLOBAL_global`                | `META.GLOBAL.global`                                              | [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
`GLOBAL_TypeError`             | `META.GLOBAL.TypeError`                                           | [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
`GLOBAL_eval`                  | `META.GLOBAL.eval`                                                | direct [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) calls
`GLOBAL_Reflect_apply`         | `META.GLOBAL.Reflect ? META.GLOBAL.Reflect.apply : void 0`        | [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
`GLOBAL_Object_defineProperty` | `META.GLOBAL.Object ? META.GLOBAL.Object.defineProperty : void 0` | [object getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) and [object setter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set)
`GLOBAL_Object_getPrototypeOf` | `META.GLOBAL.Object ? META.GLOBAL.Object.getPrototypeOf : void 0` | [for-in loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)
`GLOBAL_Object_keys`           | `META.GLOBAL.Object ? META.GLOBAL.Object.keys : void 0`           | [for-in loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)   
`GLOBAL_Symbol_iterator`       | `META.GLOBAL.Symbol ? META.GLOBAL.Symbol.iterator : void 0`       | [iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

### `output = aran.weave(estree, pointcut, parent)`

Insert calls to trap functions at nodes specified by the pointcut.
* `estree :: ESTree.Program`.
  The [ESTree Program](https://github.com/estree/estree/blob/master/es2015.md#programs) to instrument.
* `pointcut :: function | object | array` default:  `[]`.
  The specification that tells aran where to insert calls to the advice.
  Aran support four specification formats:
  * `array`: an array containing the names of the traps to insert everywhere.
    For instance, the poincut below results in aran inserting the `binary` trap everywhere:
  * `function`: a function that receives the name of the trap to insert and the node where to insert it.
    It should returns a boolean value that indicate whether or not to insert the trap.
    For instance, the pointcut below results in aran inserting a call to the `binary` trap at every update expression:
    ```js
    const pointcut = (name, node) => node.type === "UpdateExpression" && name === "binary";
    ```
  * `object`: an object whose property keys are trap names and property values are functions recieving a node.
    As for the `function` format, these functions should return a boolean indicating wether to insert the trap call.
    For instance, the pointcut below has the same semantic as the one above:
    ```js
    const pointcut = { binary: (node) => node.type === "UpdateExpression" };
    ```
  * `*`: if truthy, insert all the traps everywhere; if falsy, insert none of the trap nowhere.
* `parent :: ESTree | null` default : `null`.
  In the event of instrumenting code before passing it to a *direct* eval call, `parent` should refer the node performing the call to the eval function.
  Otherwise it should be `null`; in which case, their will be no with statements inserted for sandboxing.
* `output :: *`.
  The instrumented output whose format depends on `options.output`.

### `node = aran.node(serial)`

Retrieve a node from its serial number.
If `options.nocache` is truthy, this method will explore the ESTree (`O(log(n))`), else it will access the cache (`O(1)`).
* `serial :: number`.
* `node :: ESTree | undefined`

### `root = aran.root(serial)`

Retrieve the program node that contains the node at the given serial number.
* `serial :: number`
* `root :: ESTree.Program | undefined`

## Traps

Traps are functions of the advice provided by the user.
All traps are independently optional and they all receive as last argument an integer which is the index of the ESTree node that triggered the trap.
In this readme, `123` is used as a dummy serial number.
We categorized traps depending on their insertion mechanism.

* *Combiners*: replacements for some expression nodes.
  These traps are given several values from the target program which they can freely combine.
  Their transparent implementation is trap-dependent.
  For instance:
  ```js
  // x + y >> META.binary("+", x, y, 123)
  META.binary = (operator, left, right, serial) => eval("left "+operator+" right");
  ```
  Combiners pop some values from the value stack and push exactly one value on top of it.
* *Modifiers*: surround some expression nodes.
  These traps are given a single value from the target program which they can freely modify.
  Their transparent implementation consists in returning the second last argument.
  For instance:
  ```js
  // x ? y : z >> META.test(x, 123) : y : z
  META.test = (value, serial) => value;
  ```
  Additionally most modifiers fall into the two subcategories based on their impact on the value stack:
  * *Producers*: produce a value on top of the value stack -- e.g.: `primitive`.
  * *Consumers*: consume the value on top of the value stack -- e.g.: `test`.
* *Informers*: wrapped into an expression statement.
  These traps are only given static syntactic information.
  Their transparent implementation consists in doing nothing.
  For instance:
  ```js
  // break a; >> META.break(false, "a", 123); break a;
  META.break = (iscontinue, label, serial) => {};
  ```
  Informers don't have any effect on the value stack.

The below table list all the traps Aran can insert.
[This demonstrator](TODO) can be use to experiment how traps are inserted.

Name          | arguments[0]         | arguments[1]        | arguments[2]        | arguments[3]      
--------------|----------------------|---------------------|---------------------|-------------------
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
`copy`        | `position:number`    | `forward:*`         | `serial:number`     |                   
`drop`        | `forward:*`          | `serial:number`     |                     |                   
`swap`        | `position1:number`   | `position2:number`  | `forward:*`         | `serial:number`   
*Producers*   |                      |                     |                     |                   
`read`        | `identifier:string`  | `produced:value`    | `serial:number`     |                   
`discard`     | `identifier:string`  | `produced:value`    | `serial:number`     |                   
`builtin`     | `name:string`        | `produced:value`    | `serial:number`     |                   
`arrival`     | `produced:value`     | `serial:number`     |                     |                   
`callee`      | `produced:value`     | `serial:number`     |                     |                   
`this`        | `produced:value`     | `serial:number`     |                     |                   
`arguments`   | `produced:value`     | `serial:number`     |                     |                   
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
`success`     | `consumed:value`     | `serial:number`     |                     |                   
`failure`     | `consumed:value`     | `serial:number`     |                     |                   
**Informers** |                      |                     |                     |                   
`begin`       | `serial:number`      |                     |                     |                   
`end`         | `serial:number`      |                     |                     |                   
`try`         | `serial:number`      |                     |                     |                   
`finally`     | `serial:number`      |                     |                     |                   
`block`       | `serial:number`      |                     |                     |                   
`leave`       | `type:string`        | `serial:number`     |                     |                   
`label`       | `iscontinue:boolean` | `label:string`      | `serial:number`     |                   
`break`       | `iscontinue:boolean` | `label:string`      | `serial:number`     |                   

## Known Heisenbugs

When dynamically analyzing a program it is implicitly assumed that the analysis will conserve its behavior.
Behavioral divergences are called [heisenbugs](https://en.wikipedia.org/wiki/Heisenbug).
Heisenbugs are undesirables because they compromise the conclusion drawn by the analysis.
Here are the known heisenbugs that Aran may introduce by itself:

* *Performance Overhead*
  A program being dynamically analyzed will necessarily perform slower.
  Events might interleave in a differently or malicious code might detect the overhead.
  Unfortunately there is no general solution to this problem. 
* *Code Reification*
  Whenever the target program can obtain a representation of itself, the original code should be returned and not its instrumented version.
  [`Function.prototype.toString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString) and `[ScriptElement.textContent]`(https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) are both instance
  Aran does not deal with code reification at the moment.
* *Modified Global Variables*
  Aran sanitize identifiers to prevent clashes with a function similar to: 
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
  If a modified identifier is actually global variables, the global object will differ.
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
* *Advice Access*
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
  However this is not a complete solution because although the `META` is sanitized, `aran` is not.
  A complete solution can be obtained by turning the sandbox option on.
  Only the lookup of `META` will be able to reach to outside scope.
* *Temporal Deadzone (`typeof`)*
  Aran does not hoist `let` and `const` declaration so it cannot make the difference between an undeclared variable and an undefined variable.
  To the best of our knowledge, this distinction is only necessary when `typeof` is involved.
  This approximation simplifies both Aran's internal structure and analyses modeling the environment.
  Normally the code below should fail at the `typeof` line but it might not under Aran analysis.
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
* [`arguments`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)
  Some analyses like [`demo/local/shadow-value.js`](demo/local/shadow-value.js) threat values differently when they are get/set to object than when they are read/written to the environment.
  In non strict mode, the [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments) blurs this distinction which can lead to heisenbugs.
  In the code below, the `write` trap should be triggered with `"x"` and `"bar"` to account to for the sneaky variable assignment but it is not at the moment. 
  ```js
  function f (x) {
    arguments[0] = "bar";
    console.log(x);
  }
  f("foo");
  ```
