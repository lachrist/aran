Checks are performed by the engines upon returning from a constructor. In Aran,
these checks happens in the return statement. This does not hold if the If the
return statement is surrounded by a `try` statement, divergences

Missing `super` call becomes catchable:

```js
console.log(
  new (class extends Object {
    constructor() {
      try {
        return;
      } catch (error) {
        console.log("caught", error);
      }
    }
  })(),
);
```

Normal:

```
{}
```

Aran:

```
super constructor must be called before returning from derived class
```
