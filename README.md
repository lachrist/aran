# Aran

Aran is an extensive JavaScript instrumenter that aims to be complient to the entire ECMAScript5 specification (http://www.ecma-international.org/ecma-262/5.1/).
To install: `npm install aran -g`.
To instrument a HTML page `input.html` using the option file `linvail.hs`:

  ```aran /path/to/linvail.js < path/to/input.html > path/to/output.html```

This line will transform the specified HTML file so that any JavaScript code incoming to the web page is instrumented first.

## Interface

Below are the functions that might be defined within the `linvail.js` file.
All hooks are optional ; if you plan to build up a shadow interpreter then pretty much all the traps and the object-related functions should be defined.
In this part of the readme, arguments starting with a upper case character are expected to be raw values, while arguments starting with a lower case character are expected to be wrapped values.

  * `aran.hooks`
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
  * `aran.traps`
    * `wrap(Value)`: should return a wrapper around the raw value `Value`. 
    * `unwrap(value)`: should return the raw value inside the wrapper `value`. 
    * `unary(Operator, argument)`: should return a wrapper around the result of the unary operation specified by the raw string `Operator`.

        ```Operator ::= "-" | "+" | "!" | "~" | "typeof" | "void"```

    * `binary(Operator, argument1, argument2)`: should return a wrapper around the result of the binary operation specified by the raw string `Operator`.
        
        ```Operator ::= "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | ">>>" | "+" | "-" | "*" | "/" | "%" | "|" | "^" | "&" | "in" | "instanceof" | ".."```

    * `apply(function, this, Arguments)`: function application, `Arguments` is raw array of wrapped values.
  * `aran.object`
    * `get(object, property)`:
    * `set(object, property, value)`: 
    * `delete(object, property)`: 
    * `enumerate(object)`:
    * `create(prototype)`:
    * `define(object, property, descriptor)`:
    * `freeze(object)`:
    * `seal(object)`:
    * `prevext(object)`:

## Demo

<!-- Proxy usage

* With statement (eg: with({a:1}) {var b=a})
* For-in loop with object as left part (eg: for (var o1.a in o2) {})
* Window object: if proxies are supported the window accessed by the client code is a proxy that automatically escape identifier ; if proxies are not supported the marker aran.swindow is given instead.

 -->