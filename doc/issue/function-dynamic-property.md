Sloppy function have two dynamic properties: `caller` and `arguments`. They are
not available in strict mode.

```js
function f() {
  console.log({
    arguments: f.arguments,
    caller: f.caller,
  });
}
console.log({
  arguments: f.arguments,
  caller: f.caller,
});
f();
console.log({
  arguments: f.arguments,
  caller: f.caller,
});
```
