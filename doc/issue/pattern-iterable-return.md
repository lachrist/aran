When the iterator protocol is involved in syntax constructs, the `return` method
is called upon exiting the construct even in the case of an error. This is
important because it provides an opportunity for the iterator to perform cleanup
actions. In the case of array destructuring, the `return` method is not called
after Aran instrumentation in the case of an error. This is challenging to solve
because patterns cannot be surrounded by a `try` statement as they exists in an
expression context and not in a statement context.

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

Normal

```
cleanup
Uncaught 'boum'
```

Aran

```
Uncaught 'boum'
```
