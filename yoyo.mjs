import { createContext, runInContext } from "vm";
console.log(
  runInContext(
    `
      "use strict";
      ({
        hasOwn: Object.hasOwn(globalThis, "toLocaleString"),
        descriptor: Reflect.getOwnPropertyDescriptor(globalThis, "toLocaleString"),
      });
    `,
    createContext(),
  ),
);
