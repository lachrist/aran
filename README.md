# Aran <img align="right" src="https://github.com/lachrist/aran/blob/master/aran.png" alt="aran-logo" title="Aran Linvail"/>

Aran is a npm module for facilitating the development of JavaScript dynamic analysis tools. Aran is based on a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) and enable amongst other things: sandboxing, tracing and symbolic execution. To install it, simply run: `npm install aran`.

**Attention, Aran uses ECMAScript6 Harmony Proxies which is currently supported by Node (with the `--harmony` flag) and Firefox; this module will NOT work on Safari, Chrome and Internet Explorer!!!**

This module exposes a function that expects three arguments:

* `sandbox`: a value used as the global object for evaluating the code to be analyzed.
* `hooks`: a set of functions used for tracing purposes.
* `traps`: a set of functions for modifying most of JavaScript semantic.

And returns a function that will perform the dynamic analysis on any given code string.

```javascript
var Aran = require('aran');
(window||global).compiled = true; // Get the last compiled code
var sandbox = ...                   // An object to mock the global object
var hooks = ...                     // An object containings function for tracing purpose
var traps = ...                     // An object containings function for modifying JS semantic 
var run = Aran(sandbox, hooks, traps)
// You should use run to build sandbox.eval and sandbox.Function (e.g. sandbox.eval = run) //
var code = ...
var result = run(code)
console.log((window||global).compiled)
console.log(result)
```

Note that JavaScript features dynamic code evaluation through the infamous `eval` function and the `Function` constructor. Consequently, as shown in the above snippet, Aran has to be run along the code being analyzed to intercept and transform every bit of JavaScript code. Having application code evaluated without resorting to `Aran` will compromise the validity of the application's analysis. It is the responsibility of the user to make sure that dynamic code evaluation eventually resort to `Aran`.

## Demonstraction

See https://github.com/lachrist/aran-demo!

## Sandbox

As stated above, the sandbox parameter will act in all point as if it was the global object of the code being analyzed. The difficulty of coming up with a suitable sandbox for complex analysis such as dynamic symbolic execution is not to be underestimated. If the traps `get`, `set` and `binary` are implemented, the sandbox parameter can be of any type, otherwise should probably be a JavaScript object.

## Hooks

Hooks are functions that are called before executing statements and expressions. Hooks follow the AST types described in https://github.com/lachrist/esvisit and will recieved the corresponding syntactic information. All hooks are optional. 

## Traps

Unlike hooks, traps are designed to modify the semantic of the code being analyzed. They are useful for implementing shadow execution and, in general, any dynamic analysis that requires runtime values. Traps have been designed to provide a minimal interface for piloting JavaScript semantic. That is that many non-fundamental JavaScript statements / expressions of such as `x++` have been destructed to be expressed with simpler concepts. All traps are optional.

Trigger | Trap | Target | Transformed
:-------|:-----|:-------|:-----------
Primitive creation | `primitive(Value)` | `'foo'` | `aran.traps.primitive('foo')`
Object creation | `object(Object)` | `{a:x}` | `aran.traps.object({a:x})`
Array creation | `array(Array)` | `[x,y,z]` | `aran.traps.array([x,y,z])`
Arguments creation | `arguments(Arguments)` | `function () {}` | `aran.traps.function(function () { arguments = aran.traps.arguments(arguments) })`
Function creation | `function(Function)` | `function () {}` | `aran.traps.function(function () { arguments = aran.traps.arguments(arguments) })`
Regexp creation | `regexp(Regexp)` | `/abc/g` | `aran.traps.regexp(/abc/g)`
Conversion to boolean | `booleanize(value, Usage)` | `x?:y:z` | `aran.traps.booleanize(x, '?:')?y:z`
Conversion to string | `stringify(value)` | `eval(x)` | `eval(aran.compile(aran.traps.stringify(x)))`
Throw an exception | `throw(value)` | `throw x` | `throw aran.traps.throw(x)`
Catch an exception | `catch(value)` | `try {} catch (e) {}` | `try {} catch (e) { e = aran.traps.catch(e) }` 
Unary operation | `unary(Operator, argument)` | `!x` | `aran.traps.unary('!', x)`
Binary operation | `binary(Operator, left, right)` | `x+y` | `aran.traps.binary('+', x, y)`
Function application | `apply(function, this, Arguments)` | `f(x, y)` | `aran.traps.apply(f, undefined, [x,y])`
Instantiation | `new(function, Arguments)` | `new F(x, y)` | `aran.traps.new(F, [x,y])`
Property reading | `get(object, property)` | `o[k]` | `aran.traps.get(o, k)`
Property writing | `set(object, property)` | `o[k] = v` | `aran.traps.set(o, k, v)`
Property deletion | `delete(object, property)` | `delete o[k]` | `aran.traps.delete(o, k)`
Property enumeration | `enumerate(object)` | `for ... in` | Its complicated...
Binding existence | `exist(object, Identifier)` | Its complicated... | Its complicated...
Binding removal | `erase(Result, Identifier)` | `delete x` | `aran.traps.erase(delete x, 'x')`

Additional remarks:

* `primitive`: primitive creation arise on the following literals: `null`, `false`, `true`, numbers and strings.

* `object`: literal objects verify the below assertion:

    ```javascript
    assert(Object.getPrototypeOf({}) === Object.prototype);
    ```

    Note that ECMAScript5 enables accessor properties to be defined directly within object initializers ; see: defined http://www.ecma-international.org/ecma-262/5.1/#sec-11.1.5. In that case, accessors are unwrapped functions.

* `array`: literal arrays verify below assertions:

    ```javascript
    var xs = [];
    assert(Object.getPrototypeOf(xs) === Array.prototype);
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(xs, 'length')) === '{"value":0,"writable":true,"enumerable":false,"configurable":false}');
    ```

    Moreover the `length` property of JavaScript arrays has a special behavior described in http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.

* `function`: user-defined functions verify below assertions:

    ```javascript
    var f = function (@PARAMS) { @BODY };
    assert(Object.getPrototypeOf(f) === Function.prototype);
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f, 'length')) === '{"value":@#PARAMS, "writable":false,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f, 'prototype')) === '{"value":{},"writable":true,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f.prototype, 'constructor')) === '{"writable":true,"enumerable":false,"configurable":true}');
    assert(f.prototype.constructor === f);
    ```

    Where `@#PARAMS` is the number of formal parameters.

* `regexp`: literal regular expressions verify below assertions:

    ```javascript
    var r = /@PATTERN/@FLAGS;
    assert(Object.getPrototypeOf(r) === Regexp.prototype);
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(r, 'global')) === '{"value":@GFLAG,"writable":false,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(r, 'ignoreCase')) === '{"value":@IFLAG,"writable":false,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(r, 'multiline')) === '{"value":@MFLAG,"writable":false,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(r, 'lastIndex')) === '{"value":0,"writable":true,"enumerable":false,"configurable":false}');
    ```

    Where:
    * `@GFLAG` is a boolean indicating whether `@FLAGS` contains the character `g`;
    * `@IFLAG` is a boolean indicating whether `@FLAGS` contains the character `i`;
    * `@MFLAG` is a boolean indicating whether `@FLAGS` contains the character `m`;

* `booleanize`: valid `Usage` parameters are:
    * `'if'`
    * `'if-else'`
    * `'while'`
    * `'do-while'`
    * `'for'`
    * `'?:'`

* `stringify`: only call for performing direct call to `eval` as defined in http://www.ecma-international.org/ecma-262/5.1/#sec-15.1.2.1.1.

* `unary`: valid `Operator` are:
    * `'-'`
    * `'+'`
    * `'!'`
    * `'~'`
    * `'typeof'`
    * `'void'`

* `binary`: valid `Operator` are:
    * `'=='`
    * `'!='`
    * `'===`
    * `'!=='`
    * `'<'`
    * `'<='`
    * `'>'`
    * `'>='`
    * `'<<'`
    * `'>>'`
    * `'>>>'`
    * `'+'`
    * `'-'`
    * `'*'`
    * `'/'`
    * `'%'`
    * `'|'`
    * `'^'`
    * `'&'`
    * `'in'`
    * `'instanceof'`
    * `'..'`

* `get`, `set`, `delete`: The `property` parameter can either be: (i) a raw string if came from a static property access, (ii) a wrapped value if it came from a computed member expression.

* `exist`: triggered when the scope lookup hits a `with` statement or the global object. The value returned by this trap should indcate whether the identifier exists in the environment-object. In the case of a `with` statement, a false value will make the lookup propagate to the enclosing scope. In the case of the global object, a false value will trigger a reference error.


## ToDo

* Support strict mode.
* Support last valued expression e.g.: `eval('if (true) 1; else 2;')`.
* Figure out what to do with `undefined` (there so many place where it can appear that `undefined` is simply not caught).
  1. Unbound this argument
  2. No return statement
  3. Uninitialized variable
  4. Uninitialized property
  5. Null array element
* Add code location to hooks (first figure what a code location exactly is in JavaScript).
* Hoist variable declarations (for now, only functions are hoisted).
* Problaly, initialize top level variable declarations (`var x` is different from `var x = undefined`).
* Remove implicit assumptions made by compilation stages.
