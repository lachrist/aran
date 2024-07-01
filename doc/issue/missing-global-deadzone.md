```js
const { runInThisContext } = require("node:vm");
runInThisContext("x;");
let x = 123;
```
