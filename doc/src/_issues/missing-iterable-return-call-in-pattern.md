---
layout: default
title: Missing Iterable Return Call in Pattern
---

When the iterator protocol is involved in syntax constructs, the `return` method is called upon exiting the construct even in the case of an error. This is important because it provides an opportunity for the iterator to perform cleanup actions. However, after Aran instrumentation, if an error is thrown during array destructuring, the `return` method will not be called. This is currently not addressed because of three reasons:

1. It is a bit of a technical challenge to surround patterns with a `try` statement because they live in an expression context and not in a statement context.
2. Surrounding every array destructuring with a `try` statement might cause a hard performance hit.
3. I suspect iterators used in array destructuring are less in need of cleanup operations in practice.

```js
const [
  foo = (() => {
    throw "boum";
  })(),
] = {
  [Symbol.iterator]: () => ({
    next: () => ({ done: false, value: undefined }),
    return: () => {
      console.log("cleanup");
      return { done: true, value: undefined };
    },
  }),
};
```

Normal output:

```
cleanup
Uncaught 'boum'
```

Aran output:

```
Uncaught 'boum'
```
