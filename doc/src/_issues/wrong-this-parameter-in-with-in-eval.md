---
layout: default
title: Wrong This Parameter in With in Eval
---

```js
const obj = {
  foo: function () {
    return { this };
  },
};
with (obj) {
  console.log(eval("foo();"));
}
```

Normal output and Aran output when instrumenting everything:

```
{ this: { foo: [Function: foo] } }
```

Aran output when instrumenting only `"foo();"`:

```
{ this: undefined }
```
