# Aran

Aran is an extensive JavaScript instrumenter that aims to be complient to the entire ECMAScript5 specification (http://www.ecma-international.org/ecma-262/5.1/).
To install: `npm install aran -g`.
To instrument a HTML page `input.html` using the option file `linvail.hs`:

  ```aran /path/to/linvail.js < path/to/input.html > path/to/output.html```

This line will transform the specified HTML file so that any JavaScript code incoming to the web page is instrumented first.

## Interface

Below are the functions that might be defined within the `linvail.js` file.
In this part of the readme, arguments starting with a upper case character are expected to be raw values, while arguments starting with a lower case character are expected to be wrapped values.

  * `aran.hooks`: Hooks are functions that are called before executing statement/expression of a given mozilla-parser type (https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API). All hooks are optional.
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
  * `aran.traps`: Traps are designed to easily implement shadow execution. Unlike hooks, traps have a semantic impact on the program. Some traps are inserted into JavaScript code (e.g. `unary`) some others are used to build up the global object (e.g. `define`). Once `wrap` is defined and return a modified value, you probably want all other traps to be implemented as well.
    * `wrap(Value)`: should return a wrapper around the raw value `Value`. 
    * `unwrap(value)`: should return the raw value inside the wrapper `value`. 
    * `unary(Operator, argument)`: should return a wrapper around the result of the unary operation specified by the raw string `Operator`.

        ```Operator ::= "-" | "+" | "!" | "~" | "typeof" | "void"```

    * `binary(Operator, argument1, argument2)`: should return a wrapper around the result of the binary operation specified by the raw string `Operator`.
        
        ```Operator ::= "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%" | "|" | "^" | "&" | "in" | "instanceof" | ".."```

    * `apply(function, this, Arguments)`: function application, `Arguments` is raw array of wrapped values.
    * `get(object, property)`: access the field of an object.
    * `set(object, property, value)`: mutate the field of an object. 
    * `delete(object, property)`: remove the field of an object.
    * `enumerate(object)`: enumerate all the field of an object (including prototype's fields).
    * `create(prototype)`: create a new object with a given prototype.
    * `define(object, property, descriptor)`: define a new field for the given object.
    * `prevext(object)`: prevent new field from being added to the object.
    * `seal(object)`: prevent new field from being added to the object and mark all its property as non-configurable.
    * `freeze(object)`: set an object completely imutable.

## Demo

<!-- Proxy usage

* With statement (eg: with({a:1}) {var b=a})
* For-in loop with object as left part (eg: for (var o1.a in o2) {})
* Window object: if proxies are supported the window accessed by the client code is a proxy that automatically escape identifier ; if proxies are not supported the marker aran.swindow is given instead.

 -->