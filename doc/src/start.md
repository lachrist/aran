---
layout: default
title: Quick Start
---

# Quick Start

Aran can be installed with `npm install aran`. Since Aran exclusively manipulates [estree](https://github.com/estree/estree), it requires both a parser and a code generator to function. We recommend using [acorn](https://www.npmjs.com/package/acorn) as the parser and [astring](https://www.npmjs.com/package/astring) as the code generator. Below is a minimal working example demonstrating the use of `acorn.parse`, `aran.instrument`, and `astring.generate`:

```sh
npm install aran acorn astring
```

```js
import { generate } from "astring";
import { parse } from "acorn";
import { instrument } from "aran";
globalThis._ARAN_ADVICE_ = {
  "apply@around": (_state, callee, this_arg, args, location) => {
    console.dir({ callee, this_arg, args, location });
    return Reflect.apply(callee, this_arg, args);
  },
};
const file = {
  kind: "eval",
  path: "main",
  root: parse("console.log('Hello!');", { ecmaVersion: 2024 }),
};
const config = {
  mode: "standalone",
  advice_global_variable: "_ARAN_ADVICE_",
  pointcut: ["apply@around"],
};
globalThis.eval(generate(instrument(file, config)));
```

```
{
  callee: [Function: readGlobalVariable],
  this_arg: undefined,
  args: [ 'console' ],
  location: 'main#$.body.0.expression.callee.object'
}
{
  callee: [Function: getValueProperty],
  this_arg: undefined,
  args: [
    Object [console],
    'log'
  ],
  location: 'main#$.body.0.expression.callee'
}
{
  callee: [Function: log],
  this_arg: Object [console],
  args: [ 'Hello!' ],
  location: 'main#$.body.0.expression'
}
Hello!
```
