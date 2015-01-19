# Aran

Aran is a npm module for facilitating the development of JavaScript dynamic analysis tools. Aran is based on a source-to-source code transformation fully compatible with ECMAScript5 specification (see http://www.ecma-international.org/ecma-262/5.1/) to enable amongst other things: sandboxing, tracing and symbolic execution. To install it simply run: "npm install aran".

**Attention, Aran uses ECMAScript6 Harmony Proxies which is currently supported by Node (with the `--harmony` flag) and Firefox; so this module will NOT work on Safari, Chrome and Internet Explorer!!!**

This module exposes a function that expects three arguments:
    * `sandbox`: a value used as the global object for evaluating the code to be analyzed.
    * `hooks`: a set of functions used for tracing purposes.
    * `traps`: a set of functions for modifying most of JavaScript semantic.
And returns a function that will perform the dynamic analysis on any given code string.

```javascript
var Aran = require('aran');
var sandbox = ...
var hooks = ...
var traps = ...
var run = Aran(sandbox, hooks, traps)
// use run to build sandbox.eval and sandbox.Function
var code = ...
var result = run(code)
```

Note that JavaScript features dynamic code evaluation through the infamous `eval` function and the `Function` constructor. Consequently, as shown in the above snippet, Aran has to be run along the code being analyzed to intercept and transform every bit of JavaScript code. Having application code evaluated without resorting to `Aran` will compromise the validity of the application's analysis. It is the responsibility of the user to make sure that dynamic code evaluation finally resort to the `Aran` evaluating function.

## Interface

In this section are listed the functions for piloting the analysis ; arguments starting with an upper case character are expected to be raw values, while arguments starting with a lower case character are expected to be wrapped values.

### Sandbox

As stated above, the sandbox parameter will act in all point as if it was the global object of the code being analyzed. The difficulty of coming up with a suitable sandbox for complex analysis such as dynamic symbolic execution is not to be underestimated. If the traps `get`, `set` and `binary` are implemented, the sandbox parameter can be of any type, otherwise it is expected to be a JavaScript object.

### Hooks

Hooks are functions that are called before executing statement / expression of a given Mozilla-Parser type (https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API). Hooks only receive static information and their return value is never used. All hooks are optional.

* `Program(StmtCounter)`
* `EmptyStatement()`
* `BlockStatement(StmtCounter)`
* `ExpressionStatement()`
* `IfStatement(HasAlternate)`
* `LabeledStatement(Label)`
* `BreakStatement(Label)`
* `ContinueStatement(Label)`
* `WithStatement()`
* `SwitchStatement`
* `ReturnStatement(HasValue)`
* `ThrowStatement()`
* `TryStatement`
* `WhileStatement()`
* `DoWhileStatement()`
* `ForStatement(HasInit, HasTest, HasUpdate, Declarations)`
* `ForInStatement`
* `FunctionDeclaration(Name, Parameters, BodyLength)`
* `VariableDeclaration(Declarations)`
* `ThisExpression()`
* `ArrayExpression`
* `ObjectExpression`
* `FunctionExpression(Name, Parameters, BodyLength)`
* `SequenceExpression(ExprCounter)`
* `UnaryExpression(Operator, MaybeIdentifier)`
* `BinaryExpression(Operator)`
* `AssignmentExpression(MaybeIdentifier)`
* `UpdateExpression(MaybeIdentifier)`
* `LogicalExpression(Operator)`
* `ConditionalExpression()`
* `NewExpression(ArgumentCounter)`
* `CallExpression(ArgumentCounter)`
* `MemberExpression(MaybeProperty)`
* `Identifier(Name)`
* `Literal(Value)`

### Traps

Unlike hooks, traps may modify the semantic of the targeted code. They are useful for implementing shadow execution and in general, any dynamic analysis that requires runtime values. Traps have been designed to provide a minimal interface to pilot JavaScript semantic ; that is that many non-fundamental statements / expressions of JavaScript such as `x++` have been destructed to be expressed with simpler concepts. All traps are optional.


Trigger | Trap | Target | Transformed
:-------|:-----|:-------|:-----------
Primitive creation | `wrap(Primitive)` | `'foo'` | `aran.traps.wrap('foo')`
* Empty object creation | `object()` | `{}`| `aran.traps.object()`
* Empty array creation | `array()` | `[]` | `aran.traps.array()`
Function creation | `function(Function)` | `function f () {}` | `aran.traps.function(function () {})`
* Regexp creation | `regexp(Regexp)` | `/bar/` | `aran.traps.regex(/bar/)`
Conversion to string | `stringify(value)` | `eval(x)` | `eval(aran.compile(aran.traps.stringify(x)))`
Conversion to boolean | `booleanize(value)` | `x?:y:z` | `aran.traps.booleanize(x)?y:z`
Unary operation | `unary(Operator, argument)` | `!x` | `aran.traps.unary('!', x)`
Binary operation | `binary(Operator, left, right)` | `x+y` | `aran.traps.binary('+', x, y)`
* Function application | `apply(function, this, Arguments)` | `f(x, y)` | `aran.traps.apply(f, undefined, [x,y])`
Construction | `construct(function, Arguments)` | `new F(x, y)` | `aran.traps.construct(F, [x,y])`
Property reading | `get(object, property)` | `o[k]` | `aran.traps.get(o, k)`
Property writing | `set(object, property)` | `o[k] = v` | `aran.traps.set(o, k, v)`
Accessor property definition | `accessor(object, property, setter, getter)` | `{x: get () {} }` | Its complicated...
Property deletion | `delete(object, property)` | `delete o[k]` | `aran.traps.delete(o, k)`
* Property enumeration | `enumerate(object)` | `for ... in` | Its complicated...


Additional remarks:

* Primitive creation: concerns `null`, `false`, `true`, numbers and strings.

* Empty object creation should satisfy the following assertion:

    ```javascript
    assert(Object.getPrototypeOf({}) === Object.prototype);
    ```

* Empty array creation should satisfy the following assertions:

    ```javascript
    var xs = [];
    assert(Object.getPrototypeOf(xs) === Array.prototype);
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(xs, 'length')) === '{"value":0,"writable":true,"enumerable":false,"configurable":false}');
    ```

    Moreover the `length` property of JavaScript arrays have a special behavior described in http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.

* Function creation should satisfy the following assertions:

    ```javascript
    var f = function (@PARAMS) { @BODY };
    assert(Object.getPrototypeOf(f) === Function.prototype);
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f, 'length')) === '{"value":@#PARAMS, "writable":false,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f, 'prototype')) === '{"value":{},"writable":true,"enumerable":false,"configurable":false}');
    assert(JSON.stringify(Object.getOwnPropertyDescriptor(f.prototype, 'constructor')) === '{"writable":true,"enumerable":false,"configurable":true}');
    assert(f.prototype.constructor === f);
    ```

    Where `@#PARAMS` is the number of formal parameters.

* Regexp creation should statisfy the following assertions:

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

* Conversion to string: only used for direct call to `eval` (cf http://www.ecma-international.org/ecma-262/5.1/#sec-15.1.2.1.1).

* Valid unary operators: 
  
    ```Operator ::= "-" | "+" | "!" | "~" | "typeof" | "void"```

* Valid binary operators:

    ```Operator ::= "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%" | "|" | "^" | "&" | "in" | "instanceof" | ".."```
