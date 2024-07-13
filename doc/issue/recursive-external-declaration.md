In sloppy mode, direct eval call can declare variables in the calling scope. A
feature often referred as dynamic declaration. Aran cannot dynamically declare
variables inside code meant to be executed in a local scope not controlled by
Aran. That is because instrumented code is strict and cannot dynamically declare
variables. For instance, suppose the code below is meant to be executed in a
direct eval call within a scope with a `let foo` declaration:

```js
eval("var foo = 456");
console.log("success");
```

Normal:

```
SyntaxError: Identifier 'foo' has already been declared
```

Aran:

```
success
```
