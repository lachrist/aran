Sloppy functions have two own properties: `caller` and `arguments` which provide
information about the last call of the function. This (crazy) behavior has been
deprecated as it prevent optimizations but it is still part of the
specification. Aran simply assigns these properties to null and never touches
them again.

```js
function f() {
  console.log({
    arguments: f.arguments,
    caller: f.caller,
  });
}
function g() {
  f();
}
console.log({
  arguments: f.arguments,
  caller: f.caller,
});
g();
console.log({
  arguments: f.arguments,
  caller: f.caller,
});
```

Normal:

```
{ arguments: null, caller: null }
{ arguments: [Arguments] {}, caller: [Function: g] }
{ arguments: null, caller: null }
```

Aran:

```
{ arguments: null, caller: null }
{ arguments: null, caller: null }
{ arguments: null, caller: null }
```
