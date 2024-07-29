In sloppy mode, direct eval call can declare variables in the calling scope. A
feature often referred as dynamic declaration. When Aran is instrumenting code
for a direct eval call, it cannot dynamically declare variables that are
themselves declared inside a nested eval call. Instead, they will be declared in
the outer eval. That is because instrumented code is executed in strict mode and
cannot dynamically declare variables.

```js
let foo = 123;
eval("eval('var foo;');");
console.log("Missing syntax error");
```

Normal output and Aran output when instrumenting everything:

```
SyntaxError: Identifier 'foo' has already been declared
```

Aran output when instrumenting only `"eval('var foo;');"`:

```
Missing syntax error
```
