---
layout: default-title
title: Duplicate Super Prototype Access
---

Aran accesses the prototype of the parent class twice at initialization of the child class. The first time happens inside the intrinsic `aran.isConstructor` to ensure that the parent class is actually a class. The second time happens to reproduce the prototype chain. Solving this issue would require a mean to test if a value is a constructor without side effects which does not exist at the moment.

```js
{
  let access = 0;
  const parent = function () {}.bind();
  Object.defineProperty(parent, "prototype", {
    get: () => {
      access++;
      return null;
    },
  });
  (class extends parent {});
  console.log({ access });
}
```

Normal output:

```
{ access: 1 }
```

Aran output:

```
{ access: 2 }
```
