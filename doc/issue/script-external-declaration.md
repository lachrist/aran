Script can declared block-scoped variables (ie: `let`, `const`, and `class`) in
the global declarative record. If it is not reified (ie: the option
`global_declarative_record` set to `native`), Aran hoist these declarations at
the beginning of the file as simple `let`. Although the current program will
honor the deadzone and immutability of these variables, other programs will not.

```js
try {
  foo;
  console.log("deadzone NOT honored in current program");
} catch {
  console.log("deadzone honored in current program");
}

try {
  globalThis.eval("foo;");
  console.log("deadzone NOT honored in other programs");
} catch {
  console.log("deadzone honored in other programs");
}

const foo = 123;

try {
  foo = 456;
  console.log("immutability NOT honored in current program");
} catch {
  console.log("immutability honored in current program");
}

try {
  globalThis.eval("foo = 456;");
  console.log("immutability NOT honored in other programs");
} catch {
  console.log("immutability honored in other programs");
}
```

Normal

```
deadzone honored in current program
deadzone honored in other programs
immutability honored in current program
immutability honored in other programs
```

Aran

```
deadzone honored in current program
deadzone NOT honored in other programs
immutability honored in current program
immutability NOT honored in other programs
```
