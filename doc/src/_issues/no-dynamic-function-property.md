---
layout: default-title
title: No Dynamic Function Property
---

Sloppy functions have two own properties: `caller` and `arguments` which provide information about the last call of the function. This (crazy) behavior has been deprecated as it prevents optimizations but it is still part of the specification. Aran simply assigns these properties to null and never touches them again.

```js
function f() {
  console.log(2, {
    arguments: f.arguments,
    caller: f.caller,
  });
}
function g() {
  f();
}
console.log(1, {
  arguments: f.arguments,
  caller: f.caller,
});
g();
console.log(3, {
  arguments: f.arguments,
  caller: f.caller,
});
```

Normal output:

```
1 { arguments: null, caller: null }
2 { arguments: [Arguments] {}, caller: [Function: g] }
3 { arguments: null, caller: null }
```

Aran output:

```
1 { arguments: null, caller: null }
2 { arguments: null, caller: null }
3 { arguments: null, caller: null }
```
