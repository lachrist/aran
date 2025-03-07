---
layout: default-title
title: Early Module Declaration
---

In case of cycles, modules may have export fields in deadzone which throw upon access. Because Aran hoists module declarations at the beginning of modules, these deadzones are no longer honored.

```js
import * as self from "./self.mjs";
console.log({ foo: self.foo });
export const foo = 123;
```

Normal output:

```
ReferenceError: Cannot access 'foo' before initialization
```

Aran output:

```
{ foo: undefined }
```
