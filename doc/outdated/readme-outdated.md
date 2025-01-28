**Table of contents**:

1. [Getting Started](#getting-started)
2. [Demonstrators](#demonstrators)
3. [Limitations](#limitations)
4. [API](#api)
5. [Advice](#advice)
6. [Intrinsics](#intrinsics)
7. [Predefined Values](#predefined-values)
8. [Known Heisenbugs](#known-heisenbugs)
9. [Acknowledgements](#acknowledgments)

## Getting Started

```sh
npm install acorn aran astring
```

```js
import { parse } from "acorn";
import { generate } from "astring";
import { instrument } from "aran";
let depth = "";
global.ADVICE = {
  apply: (f, t, xs, serial) => {
    console.log(depth + f.name + "(" + xs.join(", ") + ")");
    depth += ".";
    const x = Reflect.apply(f, t, xs);
    depth = depth.substring(1);
    console.log(depth + x);
    return x;
  },
};
const pointcut = (name, node) =>
  name === "apply" && node.type === "CallExpression";
const aran = Aran({ namespace: "ADVICE" });
global.eval(Astring.generate(aran.setup()));
const estree1 = Acorn.parse(`
  const fac = (n) => n ? n * fac(n - 1) : 1;
  fac(6);
`);
const estree2 = aran.weave(estree1, pointcut);
global.eval(Astring.generate(estree2));
```

```txt
fac(6)
.fac(5)
..fac(4)
...fac(3)
....fac(2)
.....fac(1)
......fac(0)
......1
.....1
....2
...6
..24
.120
720
```

The code transformation performed by Aran essentially consists in inserting
calls to functions named _traps_ at [ESTree](https://github.com/estree/estree)
nodes specified by the user. For instance, the expression `x + y` may be
transformed into `META.binary("+", x, y, 123)`. The last argument passed to
traps is always a _serial_ number which uniquely identifies the node which
triggered the trap. The object that contains these trap functions is called the
_advice_ and the specification that characterises what trap should be triggered
on each node is called the _pointcut_. The process of inserting trap calls based
on a pointcut is called _weaving_. This terminology is borrowed from
[aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming).

![weaving](img/weaving.png)

When code weaving happens on the same process which evaluates the weaved code,
it is called _live weaving_. Live weaving enables direct communication between
an advice and its associated Aran instance. For instance, `aran.nodes[serial]`
can be invoked by the advice to retrieve the line index of the node that
triggered a trap. Another good reason for the advice to communicate with Aran
arises when the target program performs dynamic code evaluation -- e.g. by
calling the evil
[eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval)
function.

## Demonstrators

- [test/dead/apply/](https://lachrist.github.io/aran/dead-apply-factorial.html):
  The getting started example where weaving happens on the main thread and the
  evaluation of the weaved code on a webworker.
- [test/live/empty-estree.js](https://lachrist.github.io/aran/live-empty-estree-samples.html):
  Empty advice, do nothing aside from instrumenting the argument of direct eval
  calls. Can be used to inspect how Aran normalise JavaScript.
- [test/live/empty-script.js](https://lachrist.github.io/aran/live-empty-script-samples.html):
  Same as `empty-estree.js` but uses the `"script"` format option instead.
- [test/live/forward-estree.js](https://lachrist.github.io/aran/live-forward-estree-samples.html):
  Transparent implementation of all the traps. Can be used to inspect how Aran
  inserts traps.
- [test/live/forward-script.js](https://lachrist.github.io/aran/live-forward-script-samples.html):
  Same as `forward-estree.js` but uses the `"script"` format option instead.
- [test/live/logger.js](https://lachrist.github.io/aran/live-logger-delta.html):
  Same as `forward-script.js` but log the arguments and result of every trap.
- [test/live/shadow-value.js](https://lachrist.github.io/aran/live-shadow-value-delta.html):
  Track program values across the value stack, the call stack and the
  environment but not the store. The identity of values is conserved by wrapping
  them inside regular objects.
- [test/live/shadow-state.js](https://lachrist.github.io/aran/live-shadow-state-delta.html):
  Output the same log as `shadow-value` but by mirroring the value stack, the
  call stack and the environment rather than wrapping values. This analysis
  demonstrates the full capability of Aran and may serve documentation.
- [test/live/linvail-value.js](https://lachrist.github.io/aran/live-linvail-value-delta-object.html)
  Like `shadow-value`, this analysis wrap values into objects to conserve their
  identity. However this analysis can also track values through the store (a.k.a
  the objet graph) thanks to a separate npm module called
  [linvail](https://www.npmjs.com/package/linvail). Linvail uses
  [ECMAScript proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
  to implement an transitive access control system known as _membrane_.
- [test/live/linvail-taint.js](https://lachrist.github.io/aran/live-linvail-taint-taint.html)
  Simple taint analysis using [linvail](https://www.npmjs.com/package/linvail)
  which prevents information from meta variables `__ARAN_SOURCE__` to flow to
  meta variables `__ARAN_SINK__`.

## Limitations

1. Aran performs a source-to-source code transformation fully compatible with
   most of [ECMAScript2018](https://www.ecma-international.org/ecma-262/9.0).
   Known missing features are:
   - Native modules
     ([`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import),
     [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)).
   - [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
   - Generator functions
     ([`function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*),
     [`yield`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield),[`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)).
   - Asynchronous functions
     ([`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function),
     [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)).
2. There exists loopholes that will cause the target program to behave
   differentially when analysed. These bugs are often referred as
   [Heisenbugs](https://en.wikipedia.org/wiki/Heisenbug), and are discusses in
   [Known Heisenbugs](#known-heisenbugs).
3. Aran does not provide any facilities for instrumenting modularised JavaScript
   applications. To instrument server-side node applications and client-side
   browser applications we rely on a separate module called
   [Otiluke](https://github.com/lachrist/otiluke).
4. Aran does not offer an out-of-the-box interface for tracking primitive values
   through the object graph. This feature is crucial for data-centric analyses
   such as taint analysis and symbolic execution. In our research, we track
   primitive values through the object graph with
   [linvail](https://github.com/lachrist/linvail) which implements a transitive
   access control system known as
   [membrane](https://tvcutsem.github.io/membranes).

## API

- **`aran = require("aran")({namespace, format, roots})`**

  Create a new Aran instance.

  - `namespace :: string`, default `"_"`: The name of the variable holding the
    advice. It should not start by a dollar sign (`$`) and should not be be one
    of: `arguments`, `eval`, `callee`, `error`. This variable should be
    accessible from the instrumented code. For instance, this variable should be
    global if the instrumented code is evaluated globally. Aran performs
    identifier mangling in such a way that variables from the instrumented code
    never clash against this variable.
  - `format :: "estree" | "script"`, default `"estree"`: Defines the output
    format of `aran.weave(root, pointcut, scope)` and `aran.setup()`.
    - `"estree"`: Output an
      [ESTree program](https://github.com/estree/estree/blob/master/es2015.md#programs).
      This option requires a generator like
      [astring](https://www.npmjs.com/package/astring) to obtain executable
      JavaScript code.
    - `"script"`: Output a string which can directly be fed to `eval`. As Aran's
      instrumentation can be quite verbose, expressions are spanned in multiple
      lines.
  - `roots :: array`, default `[]`: Each ESTree program node passed to
    `aran.weave(root, pointcut, scope)` will be stored in this array. If this
    array is not empty it should probably come from another Aran instance.

  The state of an Aran instance essentially consists in the node it
  instrumented. Aran instances can be serialised using the standard
  `JSON.stringify` function. For instance, in the code below, `aran1` and
  `aran2` are in the exact same state:

  ```js
  const Aran = require("aran");
  const aran1 = Aran({...});
  const string = JSON.stringify(aran1);
  const options = JSON.parse(string);
  const aran2 = Aran(options);
  ```

- **`output = aran.setup()`**

  Generate the setup code which should be executed before any instrumented code.

  - `output :: estree.Program | string`: The setup code whose format depends on
    the `format` option.

  The setup code should be evaluated in an environment where `this` points to
  the global object and where the advice variable is accessible. If the setup
  code is evaluated twice for the same advice, it will throw an error.

- **`output = aran.weave(program, pointcut, serial)`**

  Normalise the input program and insert calls to trap functions at nodes
  specified by the pointcut.

  - `program :: estree.Program`: The
    [ESTree program](https://github.com/estree/estree/blob/master/es2015.md#programs)
    to instrument.
  - `pointcut :: array | function`: The specification that tells Aran where to
    insert trap calls. Two specification formats are supported:
    - `array`: An array containing the names of the traps to insert at every
      applicable cut point. For instance, the pointcut `["binary"]` indicates
      Aran to insert the `binary` traps whenever applicable.
    - `function`: A function that tells whether to insert a given trap at a
      given node. For instance, the pointcut below results in Aran inserting a
      call to the `binary` trap at every update expression:
      ```js
      const pointcut = (name, node) =>
        name === "binary" && node.type === "UpdateExpression";
      ```
  - `serial :: number | null`, default `null`: If the given ESTree program is
    going to be evaluated inside a direct eval call within some previously
    instrumented code, the `serial` argument should be the serial number of that
    direct eval call. If the instrumented code is going to be evaluated
    globally, this argument should be `null` or `undefined`.
  - `output :: estree.Program | string`: The weaved code whose format depends on
    the `format` option.

- **`result = aran.performUnaryOperation(operator, argument)`**

  Performs a unary operation as expected by the `unary` trap. This function can
  be implemented as easily as `eval(operator+" argument")` but we used a boring
  `switch` loop instead for performance reasons.

  - `operator :: string`
  - `arguments :: *`
  - `result :: primitive`

- **`result = aran.performBinaryOperation(operator, left, right)`**

  Performs a binary operation as expected by the `binary` trap. This function
  can be implemented as easily as `eval("left "+operator+" right")` but we used
  a boring `switch` loop instead for performance reasons.

  - `operator :: string`
  - `left :: *`
  - `right :: *`
  - `result :: primitive`

- **`aran.namespace`**

  The name of the variable holding the advice.

  ```js
  {
    value: string,
    enumerable: true,
    configurable: false,
    writable: false
  }
  ```

- **`aran.format`**

  The output format for `aran.weave(estree, scope)` and `aran.setup()`; either
  `"estree"` or `"script"`.

  ```js
  {
    value: string,
    enumerable: true,
    configurable: false,
    writable: false
  }
  ```

- **`aran.roots`**

  An array of all the program nodes weaved by the Aran instance.

  ```js
  {
    value: array,
    enumerable: true,
    configurable: false,
    writable: false
  }
  ```

- **`aran.nodes`**

  An array indexing all the AST node visited by the Aran instance. This field is
  useful to retrieve a node from its serial number: `aran.nodes[serial]`. It is
  not enumerable to reduces the size of stringifying Aran instances. Each node
  in this array contains two additional properties: `AranSerial` and
  `AranParentSerial` which respectively refer to the serial number of the node
  and the serial number of its parent.

  ```js
  {
    value: array,
    enumerable: false,
    configurable: false,
    writable: false
  }
  ```

## Advice

In Aran, an advice is a collection of functions that will be called during the
evaluation of weaved code. These functions are called traps. They are
independently optional and they all receive as last argument a number which is
the index of the ESTree node that triggered the them. Serial numbers can be seen
as program counters.

**Traps Categorisation:**

There exists 26 traps which we categorise based on their transparent
implementation:

- Informers (7): Do nothing.
- Modifiers (15): Return their first argument.
- Combiners (4): Compute a new value:
  - `unary = (operator, argument, serial) => eval(operator+" argument");`
  - `binary = (operator, left, right, serial) => eval("left "+operator+" right");`
  - `apply = (closure, context, arguments, serial) => Reflect.apply(closure, context, arguments);`
  - `construct = (constructor, arguments, serial) => Reflect.construct(constructor, arguments);`

**Traps Insertion:**

| Name        | Original                        | Instrumented                                                                                              |
| ----------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| _Informers_ |                                 |
| `arrival`   | `function () { ... }`           | `... function callee () { ... META.arrival(callee, new.target, this, arguments, @serial); ... } ...`      |
| `break`     | `break l;`                      | `META.break("l", @serial); break l;`                                                                      |
| `continue`  | `continue l;`                   | `META.continue("l", @serial); continue l;`                                                                |
| `debugger`  | `debugger;`                     | `META.debugger(@serial); debugger;`                                                                       |
| `enter`     | `l: { let x; ... }`             | `l : { META.enter("block", ["l"], ["x"], @serial); ... }`                                                 |
| `leave`     | `{ ... }`                       | `{ ... META.leave(@serial); }`                                                                            |
| `program`   | `...` (program)                 | `program(META.intrinsics.global, @serial); ...`                                                           |
| _Modifiers_ |                                 |
| `abrupt`    | `function () { ... }`           | `... function callee () { ... try { ... } catch (error) { throw META.abrupt(error, @serial); } ... } ...` |
| `argument`  | `function () { ... }`           | `... function callee () { ... META.argument(arguments.length, "length", @serial) ... } ...`               |
| `intrinsic` | `[x, y]`                        | `META.intrinsic(META.intrinsics["Array.of"], "Array.of", @serial)($x, $y)`                                |
| `closure`   | `function () { ... }`           | `META.closure(... function callee () { ... } ..., @serial)`                                               |
| `drop`      | `(x, y)`                        | `(META.drop($x, @serial), $y)`                                                                            |
| `error`     | `try { ... } catch (e) { ... }` | `try { ... } catch (error) { ... META.error(error, @serial) ... }`                                        |
| `eval`      | `eval(x)`                       | `... eval(META.eval($x, @serial)) ...`                                                                    |
| `failure`   | `...` (program)                 | `try { ... } catch (error) { throw META.failure(error, @serial); }`                                       |
| `primitive` | `"foo"`                         | `META.primitive("foo", @serial)`                                                                          |
| `read`      | `x`                             | `META.read($x, "x", @serial)`                                                                             |
| `return`    | `return x;`                     | `return META.return($x, @serial);`                                                                        |
| `success`   | `x;` (program)                  | `META.success($x, @serial);`                                                                              |
| `test`      | `x ? y : z`                     | `META.test($x, @serial) ? $y : $z`                                                                        |
| `throw`     | `throw e;`                      | `throw META.throw($e, @serial);`                                                                          |
| `write`     | `x = y;`                        | `$x = META.write($y, "x", @serial);`                                                                      |
| _Combiners_ |                                 |
| `apply`     | `f(x, y)`                       | `META.apply($f, undefined, [$x, $y], @serial)`                                                            |
| `binary`    | `x + y`                         | `META.binary("+", $x, $y, @serial)`                                                                       |
| `construct` | `new F(x, y)`                   | `META.construct($F, [$x, $y], @serial)`                                                                   |
| `unary`     | `!x`                            | `META.unary("!", $x, @serial)`                                                                            |

**Traps Signature:**

| Name        | arguments[0]                                                                                                                                                                                 | arguments[1]                                            | arguments[2]            | arguments[3]           | arguments[4]       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- | ---------------------- | ------------------ |
| _Informers_ |                                                                                                                                                                                              |                                                         |                         |                        |
| `arrival`   | `callee :: function`                                                                                                                                                                         | `new.target :: function`                                | `this :: value`         | `arguments :: [value]` | `serial :: number` |
| `break`     | `label :: string \| null`                                                                                                                                                                    | `serial :: number`                                      |                         |                        |
| `continue`  | `label :: string \| null`                                                                                                                                                                    | `serial :: number`                                      |                         |                        |
| `debugger`  | `serial :: number`                                                                                                                                                                           |                                                         |                         |                        |
| `enter`     | `tag :: "program" \| "block" \| "then" \| "else" \| "loop" \| "try" \| "catch" \| "finally" \| "switch"`                                                                                     | `labels :: [string]`                                    | `variables :: [string]` | `serial :: number`     |
| `leave`     | `serial :: number`                                                                                                                                                                           |                                                         |                         |                        |
| `program`   | `global :: object`                                                                                                                                                                           | `serial :: number`                                      |                         |                        |
| _Modifiers_ |                                                                                                                                                                                              |                                                         |                         |                        |
| `abrupt`    | `error :: value`                                                                                                                                                                             | `serial :: number`                                      |                         |                        |
| `argument`  | `produced :: value`                                                                                                                                                                          | `index :: number \| "new.target" \| "this" \| "length"` | `serial :: number`      |                        |
| `intrinsic` | `produced :: value`                                                                                                                                                                          | `name :: string`                                        | `serial :: number`      |                        |
| `closure`   | `produced :: function`                                                                                                                                                                       | `serial :: number`                                      |                         |                        |
| `drop`      | `consumed :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `error`     | `produced :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `failure`   | `error :: value`                                                                                                                                                                             | `serial :: number`                                      |                         |                        |
| `primitive` | `produced :: undefined \| null \| boolean \| number \| string`                                                                                                                               | `serial :: number`                                      |                         |                        |
| `read`      | `produced :: value`                                                                                                                                                                          | `variable :: string`                                    | `serial :: number`      |                        |
| `return`    | `consumed :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `success`   | `consumed :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `test`      | `consumed :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `throw`     | `consumed :: value`                                                                                                                                                                          | `serial :: number`                                      |                         |                        |
| `write`     | `consumed :: value`                                                                                                                                                                          | `variable :: string`                                    | `serial :: number`      |                        |
| _Combiners_ |                                                                                                                                                                                              |                                                         |                         |                        |
| `apply`     | `function :: value`                                                                                                                                                                          | `this :: value`                                         | `arguments :: [value]`  | `serial :: number`     |
| `binary`    | `operator :: "==" \| "!=" \| "===" \| "!==" \| "<" \| "<=" \| ">" \| ">=" \| "<<" \| ">>" \| ">>>" \| "+" \| "-" \| "*" \| "/" \| "%" \| "\|" \| "^" \| "&" \| "in" \| "instanceof" \| ".."` | `left :: value`                                         | `right :: value`        | `serial :: number`     |
| `construct` | `constructor :: value`                                                                                                                                                                       | `arguments :: [value]`                                  | `serial :: number`      |                        |
| `unary`     | `operator :: "-" \| "+" \| "!" \| "~" \| "typeof" \| "void"`                                                                                                                                 | `argument :: value`                                     | `serial :: number`      |                        |

**Traps Comments:**

Some groups of traps requires additional explanations:

- `enter`, `write`, `read`, `leave`: These (only) four traps describe the
  runtime interaction with the environment. We discuss how below:

  1. In the normalisation process, Aran often inserts new variables called
     _token_. Tokens appear to be numbers from traps perspective whereas
     variables present in the original code appear as strings.
  2. Aran only declares `let` variables:
     - `var` declarations at the top-level scope are normalised into property
       definition on the global object.
     - `var` declarations inside functions are hoisted and normalised into `let`
       declarations.
     - `const` declarations are normalised into `let` declarations and a static
       type error is throws upon rewrite attempt.
  3. Aran hoists its `let` declarations at the top of lexical blocks. This makes
     the temporal deadzone disappear. To restore the behaviour of the temporal
     deadzone, a token is associated to each variable. At runtime, these tokens
     will refer to a boolean value indicating whether their associated variable
     has already been initialised or not. Before accessing a variable in a
     dynamic portion of the deadzone, a runtime time check on its associated
     token is inserted. In many cases, the temporal deadzone of a variable can
     be statically determined and its associated token is entirely removed from
     the instrumented code. Not that `eval` kills this optimisation because we
     have to assume that any reachable variable may be accessed.

  ```js
  // Original //
  const a = () => x;
  let x = "foo";
  a();
  a = "bar";
  ```

  ```js
  // (pseudo) Instrumented //
  let $a, $x, $1;
  META.enter("program", [], ["a", "x", 123]);
  $1 = META.write(false, 1);
  $a = () =>
    META.read($1, 1)
      ? META.read($x, "x", 123)
      : (() => {
          throw new TypeError("x is not defined");
        })();
  $x = META.write("foo", "x");
  $1 = META.write(true, 1);
  $a();
  throw new TypeError("Assignment to a constant variable");
  META.leave();
  ```

- `program`, `success`, `failure`: These traps are inserted into programs that
  will _not_ be evaluated inside a direct eval call. The first trap invoked by a
  program is always `program(@serial)` and the last trap is either
  `success($1, @serial)` or `failure(error, @serial)`.

  ```js
  // Original //
  "foo";
  ```

  ```js
  // Instrumented //
  META.program();
  let $1 = undefined;
  try {
    $1 = "foo";
    META.success($1);
  } catch (error) {
    throw META.failure(error);
  }
  ```

- `arrival`, `argument`, `return`, `abrupt`: When applying an instrumented
  closure, these traps are invoked in the following order:

  1. `arrival(callee, new.target, this, arguments, @serial)`: Beware: `callee`
     refers to the function given as parameter to the `closure` trap and _not_
     its return value.
  2. `argument(new.target, "new.target", @serial)`: For arrows, this trap is
     used to check that it was not called as a constructor. For functions, this
     trap is used to initialise a sanitised version of the `new.target`
     variable. For functions, if its result is not `undefined`, it will be used
     to initialise a sanitised version of the `this` variable.
  3. `argument(this, "this", @serial)`: This trap is invoked only if the
     previous trap returned `undefined`. For arrows, the result of this trap is
     discarded. For functions, this trap is used to initialise a sanitised
     version of the `this` variable.
  4. `argument(arguments.length, "length", @serial)`: The value returned by this
     trap is used to define how many times the next trap should be called.
  5. `argument(arguments[argindex], argindex, @serial)`: This trap is used to
     initialise parameters. For functions reading the `arguments` variable it is
     also used to initialise the `arguments` object. The variable `argindex` is
     counter from `0` to the value returned by the previous trap.
  6. `return(<EXPR>, @serial)` or `abrupt(error, @serial)`: If the closure
     normally terminated, the `return` trap is invoked with its result. Else,
     the `abrupt` trap is called with the error that caused it to abruptly
     terminate. The serial number of the `return` trap may either points to a
     `return` statement in the original code or the closure if it terminated
     without hitting a `return` statement.

  ```js
  // Original //
  const f = function (x) => {
    console.log("Square = " x * x);
  }
  ```

  ```js
  // (pseudo) Instrumented //
  let $f;
  $f = function callee () {
    try {
      let $x, $0newtarget, $this, $1, $2;
      META.arrival(callee, new.target, this, arguments, @serial);
      $0newtarget = META.argument(new.target, "new.target", @serial);
      if ($0newtarget)
        $this = Object.create($0newtarget.prototype);
      else
        $this = META.argument(this, "this", @serial);
      $1 = META.argument(arguments.length, "length", @serial);
      $x = 0 < $1 ? META.argument(arguments[0], 0, @serial) : undefined;
      $2 = 1;
      while ($2 < $1) {
        META.argument(arguments[$2], $2, @serial);
        $2 = $2 + 1;
      }
      console.log("Square = " $x * $x);
      return META.return(undefined, @serial);
    } catch (error) {
      throw META.abrupt(error, @serial);
    }
  };
  ```

- `enter`, `break`, `continue`, `leave`: These traps describe runtime label
  jumps:

  ```js
  // Original //
  l: m: while (true) {
    continue l;
  }
  ```

  ```js
  // Instrumented //
  l: m: while (true) {
    META.enter("loop", ["l", "m"], [], @serial1);
    META.continue("l", @serial2);
    continue l;
    META.leave(@serial1);
  }
  ```

- `intrinsic`: In the normalisation process, Aran often uses pre-existing values
  from the global object (a.k.a: intrinsics, a.k.a: primordials). To render the
  instrumented code resilient to modification of the global object it is
  important to store these intrinsic values upfront. This is performed during
  the setup phase.

  ```js
  // Original //
  /abc/g;
  ```

  ```js
  // (pseudo) Instrumented //
  new META.intrinsic(META.intrinsics.RegExp, "RegExp")("abc", "g");
  ```

## Intrinsics

Below is a list of the all the intrinsics stored by the setup code along with
their utility:

- `global`: For declaring/writing/reading global variables and for assigning the
  initial value of `this`.
- `eval`: For detecting whether a syntactic direct eval call actually resolves
  to a direct eval call at runtime.
- `RegExp`: For normalising literal regular expressions.
- `ReferenceError`: Reference errors are thrown when a variable is not defined
  or is in the temporal deadzone.
- `TypeError`: Type errors are thrown at many places, e.g: when `Reflect.set`
  returns false in strict mode.
- `Reflect.get`: For normalising member expressions.
- `Reflect.set`: For normalising assignments on member expressions and building
  various objects.
- `Reflect.has`: Called when variable lookups hit a `with` statement.
- `Reflect.deleteProperty`: For normalising `delete` unary operations on member
  expressions.
- `Reflect.apply`: For normalising call expressions containing spread elements.
- `Reflect.construct`: For normalising new expressions containing spread
  elements.
- `Reflect.getOwnPropertyDescriptor`: For knowing whether a variable is globally
  defined.
- `Reflect.defineProperty`: For building various objects (e.g.: object literals,
  the `arguments` object, functions, functions prototype).
- `Reflect.getPrototypeOf`: For knowing whether a variable is defined in the
  global object and for collecting the enumerable keys of an object as
  enumerated by the `for .. in` statement.
- `Reflect.setPrototypeOf`: For building various objects (e.g.: object literals,
  the `arguments` object, functions prototype).
- `Object`: Often called before calling functions of the `Reflect` object to
  prevent type errors.
- `Object.prototype`: The `[[Prototype]]` field of various objects (e.g.: object
  literals, the `arguments` object, functions prototype).
- `Object.create`: For building various objects.
- `Object.freeze`: For building the first argument passed to the tag of template
  expressions and its `raw` property.
- `Object.keys`: For normalising `for ... in` statements.
- `Array.of`: For normalising array expressions and building the first argument
  passed to the tag of template expressions and its `raw` property.
- `Array.prototype.push`: For building the rest elements of array patterns,
  object patterns and argument patterns.
- `Array.prototype.concat`: For normalising expressions with spread elements
  (array expressions, call expressions, new expressions).
- `Array.prototype.values`: The `@@iterator` field of `arguments` objects.
- `Array.prototype.includes`: For building the `rest` value of object patterns.
- `Symbol.unscopables`: Used when variable lookups hit a `with` statement.
- `Symbol.iterator`: For normalising the iteration protocol.
- `Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get`: The
  `callee` fields of `arguments` objects in strict mode.
- `Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set`: The
  `callee` fields of `arguments` objects in strict mode.

## Predefined Values

Rather than defining a closure whenever statements are needed in an expression
context, Aran defines several functions at the beginning of programs. This help
reduce the size of the instrumented code. The other value that Aran predefines
is the completion value of the program. These predefined values are always
assigned to the same token in the order listed below:

1. `HelperThrowTypeError(message)`: Throws a type error; called when:
   - Assigning to a constant variable.
   - Reading/Assigning a property on `null` or `undefined`.
   - Calling an arrow as a constructor.
   - In strict mode, deleting a member expression and failing.
   - In strict mode, assigning a member expression and failing.
   - Passing `null` or `undefined` a `with` statement.
2. `HelperThrowReferenceError(message)`: Throws a reference error; called when:
   - Accessing a local variable in its temporal dead zone.
   - Reading a non existing global variable.
   - In Strict mode, writing to non existing global variable.
3. `boolean = HelperIsGlobal(name)`: Indicates whether an identifier is globally
   defined (non-enumerable properties also count). A call to this helper are
   inserted whenever a variable lookup reach the global scope in Aran's static
   scope analysis.
4. `array = HelperIteratorRest(iterator)`: Pushes the remaining elements of an
   iterator into an array. A call to this helper is inserted to compute the
   value of an array pattern's rest element.
5. `target = HelperObjectRest(source, keys)`: Create an object `target` that
   contains the own enumerable properties of `source` safe the ones listed in
   `keys`. A call to this helper is inserted to computed the value of an object
   pattern's rest element.
6. `HelperObjectAssign(target, source)`: Similar to `Object.assign` but uses
   `Reflect.defineProperty` rather than `Reflect.set` on the target object. A
   call to this helper is inserted whenever an object expression contain a
   spread element.
7. `Completion`: The completion value of the program, initially: `undefined`.

## Known Heisenbugs

When dynamically analysing a program, it is implicitly assumed that the analysis
will conserve the program's behaviour. If this is not the case, the analysis
might draw erroneous conclusions. Behavioural divergences caused by an analysis
over the target program are called
[Heisenbugs](https://en.wikipedia.org/wiki/Heisenbug). It is very easy to write
an analysis that is not transparent, for instance
`advice.primitive = () => "foo";` will drastically alter the behaviour of the
program under analysis. However, Aran introduce Heisenbugs by itself as well:

- _Performance Overhead_: A program being dynamically analysed will necessarily
  perform slower. Events might interleave in a different order or malicious code
  might detect the overhead. Unfortunately there seem to be no general solution
  to this problem.
- _Code Reification_: Whenever the target program can obtain a representation of
  itself (a.k.a. code reification), the original code should be returned rather
  than its instrumented version. In the code below, the assertion should pass
  but it does not after instrumentation:
  ```js
  function f() {}
  assert(f.toString() === "function f () {}");
  ```
  Solving this issue should probably involve (i) receiving indentation
  information along with the program AST (ii) maintaining at runtime a mapping
  from closures to their non-instrumented source code (iii) inserting runtime
  checks at every function call to transform the result. Not only this would
  make Aran's API uglier, it would also not completely solve the problem as
  `Function.prototype.toString` could be called on instrumented closures in
  non-instrumented code areas.
- _Dynamic Scoping_: Normally, in non-strict mode, direct eval calls should be
  able to declare variables to their calling environment. This is not the case
  for instrumented code because Aran performs a static scope analysis. To make
  JavaScript scope purely static, Aran simply transforms the top level `var`
  declarations into `let` declarations for programs being evaluated inside a
  direct eval call. In the code below, the assertion should pass but it does not
  after instrumentation:
  ```js
  function f() {
    eval("var x = 'foo';");
    assert(typeof x === "string");
  }
  f();
  ```
  This could be solved but it would render the scope analysis much more complex.
- _Aliasing Arguments' Properties_: In non strict mode,
  [`arguments` objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)
  are linked to their closure's environment. Modifications of the arguments
  object will be reflected to the binding of their corresponding parameter. This
  link is broken by Aran's instrumentation because instrumented closures don't
  have parameters and use the `arguments` object instead. In the code below,
  both assertions should pass but they are both failing after instrumentation:
  ```js
  function f(x) {
    arguments[0] = "bar";
    assert(x === "bar");
    x = "qux";
    assert(arguments[0] === "qux");
  }
  f("foo");
  ```
  The link between the `arguments` object and the environment could be
  re-established by using proxies and modifying the scope analysis performed by
  Aran.
- _Computed Methods' Name_: Normally, in an object literal, methods names should
  be assigned to their property key even if it is computed. This is not the case
  for instrumented code because Aran uses a simple static analysis to assign
  function's names. In the code below, the assertion should pass but it fails
  after instrumentation:
  ```js
  var x = "foo";
  var o = {
    [x]: function () {},
  };
  assert(o.foo.name === "foo");
  ```
  This issue could be solved in Aran.
- _Arrow's Prototype_: Normally, arrows should not define a `prototype`
  property. This is not the case for instrumented code because Aran transforms
  arrows into function which have a non-configurable `prototype` property. In
  the code below, both assertion should pass but the second one fails after
  instrumentation
  ```js
  var a = () => {};
  assert(a.prototype === undefined); // Success
  assert(Reflect.getOwnPropertyDescriptor(a, "prototype") === undefined);
  ```
  This issue could be solved by not transforming arrows to functions.
- _Constructing Arrow Proxies_: Normally, a proxy wrapping an arrow function
  should never call its `construct` handler. This is not the case for
  instrumented code because Aran transforms arrows into functions that throw a
  type error when the `new.target` is defined.
  ```js
  const a = () => {};
  const p = new Proxy(a, {
    construct: () => {
      throw new Error("This should never happen");
    },
  });
  new p();
  ```
  This issue could be solved by not transforming arrows to functions.

## Discussion

[Aran](https://github.com/lachrist/aran) and program transformation in general
is good for introspecting the control flow and pointers data flow. Things become
more difficult when reasoning about primitive value data flow is involved. For
instance, there is no way at the JavaScript language level to differentiate two
`null` values even though they have different origins. This restriction strikes
every JavaScript primitive values because they are inlined into different parts
of the program's state -- e.g the environment and the value stack. All of these
copying blur the concept of a primitive value's identity and lifetime. By
opposition, objects can be properly differentiated based on their address in the
store. Such situation happens in almost every mainstream programming languages.
We now discuss several strategies to provide an identity to primitive values:

- _Shadow States_: For low-level languages such as binary code, primitive values
  are often tracked by maintaining a so called "shadow state" that mirrors the
  concrete program state. This shadow state contains analysis-related
  information about the program values situated at the same location in the
  concrete state. [Valgrind](http://valgrind.org/) is a popular binary
  instrumentation framework which utilizes this technique to enables many
  data-flow analyses. The difficulty of this technique lies in maintaining the
  shadow state as non-instrumented functions are being executed. In JavaScript
  this problem typically arises when objects are passed to non instrumented
  functions such as intrinsics. Keeping the shadow store in sync during such
  operation requires to know the exact semantic of the non-instrumented
  function. Since they are so many different intrinsic functions in JavaScript,
  this is a very hard thing to do.
- _Record And Replay_: Record and replay systems such as
  [Jalangi](https://github.com/SRA-SiliconValley/jalangi) are an intelligent
  response to the challenge of keeping in sync the shadow state with its
  concrete state. Acknowledging that divergences between shadow and concrete
  states cannot be completely avoided, these systems allows divergences in the
  replay phase which can be recovered from by utilizing the trace gathered
  during the record phase. We propose two arguments against such technique:
  First, every time divergences are resolved in the replay phase, values with
  unknown origin are being introduced which necessarily diminish the precision
  of the resulting analysis. Second, the replay phase only provide information
  about partial execution which can be puzzling to reason about.
- _Wrappers_: Instead of providing an entire separated shadow state, wrappers
  constitute a finer grained solution. By wrapping primitive values inside
  objects we can simply let them propagate through the data flow of the base
  program. The challenge introduced by wrappers is to make them behave like
  their wrapped primitive value to non-transformed code. We explore three
  solutions to this challenge:
  - _Boxed Values_: JavaScript enables to box booleans, numbers and strings.
    Despite that symbols, `undefined` and `null` cannot be tracked by this
    method, boxed values do not always behave like their primitive counterpart
    within intrinsics.
    ```js
    // Strings cannot be differentiated based on their origin
    let string1 = "abc";
    let string2 = "abc";
    assert(string1 === string2);
    // Boxed strings can be differentiated based on their origin
    let boxed_string1 = new String("abc");
    let boxed_string2 = new String("abc");
    assert(boxed_string1 !== boxed_string2);
    // Boxed value behave as primitive in some intrinsics:
    assert(
      JSON.stringify({ a: string1 }) === JSON.stringify({ a: boxed_string1 }),
    );
    // In others, they don't...
    let error;
    try {
      Object.defineProperty(string1, "foo", { value: "bar" });
    } catch (e) {
      error = e;
    }
    assert(error);
    Object.defineProperty(boxed_string1, "foo", { value: "bar" });
    ```
  - _`valueOf` Method_: A similar mechanism to boxed value is to use the
    `valueOf` method. Many JavaScript intrinsics expecting a primitive value but
    receiving an object will try to convert this object into a primitive using
    its `valueOf` method. As for boxed values this solution is not bullet proof
    and there exists many cases where the `valueOf` method will not be invoked.
  - _Explicit Wrappers_: Finally a last option consists in using explicit
    wrappers which should be cleaned up before escaping to non-instrumented
    code. This requires to setup an access control system between instrumented
    code and non-instrumented code. This the solution this module directly
    enables.

1. **Debugging NaN appearances** In this first example, we want to provide an
   analysis which tracks the origin of `NaN` (not-a-number) values. The problem
   with `NaN` values is that they can easily propagate as the program is
   executed such that detecting the original cause of a `NaN` appearance is
   often tedious for large programs. Consider the program below which alerts
   "Your age is: NaN".

```js
var year = Number(document.getElementById("bdate").avlue);
// many lines with many unrelated NaNs appearances
alert("Your age is: " + (2016 - year));
```

Simply printing every appearance of `NaN` values runs under the risk of
overwhelming the programmer with unrelated `NaN` appearances. We would like to
know only of the `NaN` that caused the alert to display an buggy message. It is
therefore crucial to differentiate `NaN` values which cannot be done at the
JavaScript language level.

2. **Taint analysis** Taint analysis consists in marking -- or _tainting_ --
   values coming from predefined source of information and preventing them from
   flowing through predefined sinks of information. As tainted values are
   manipulated through the program, the taint should be properly propagated to
   dependent values.

```js
var password = document.getElementById("password"); // predefined source
var secret = password.value; // tainted string
var secrets = secret.split(""); // array of tainted characters
sendToShadyThirdPartyServer(secrets); // predefined sink
```

Lets suppose that the password was `"trustno1"`. N.B. strings are primitive
values in JavaScript. After splitting this string to characters we cannot simply
taint all string being `"t"`, `"r"`, `"u"`, `"s"`, `"t"`, "`n`", "`o`", `"1"`.
This would lead to serious over-tainting and diminish the precision and
usefulness of the analysis. As for the `Nan` debugger we crucially need to
differentiate primitive values based on their origin and not only their value.

3. **Concolic Testing** Concolic testing aims at automatically exploring all the
   control-flow paths a program can take for validation purpose. It involves
   gathering mathematic formula on a program's inputs as it is being executed.
   Later, these formula can be given to a constraint solver to steer the program
   into a unexplored execution path. Consider the program below which has two
   different outcomes based on the birthdate of the user. A successful concolic
   tester should be able to generate an birthdate input that leads the program
   to the consequent branch and an other birthdate input that leads the program
   to the alternate branch.

```js
var input = document.getElemenById("bdate").value;
var bdate = input.value; // new symbolic value [α]
var age = bdate - 2016; // new constraint [β = α - 2016]
var isminor = age > 17; // new constraint [γ = β > 17]
if (isminor) {
  // path condition [γ && γ = β > 17 && β = α - 2016]
  // do something
} else {
  // path condition [!γ && γ = β > 17 && β = α - 2016]
  // do something else
}
```

It should be clear that confusing two primitive values having different origin
would easily lead to erroneous path constraint.
