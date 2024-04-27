import { createContext, runInContext } from "vm";
console.log(
  runInContext(
    `
      "use strict";
      ({
        hasOwn: Object.prototype.hasOwnProperty.call(globalThis, "toString"),
        descriptor: Reflect.getOwnPropertyDescriptor(globalThis, "toString"),
      });
    `,
    createContext(),
  ),
);
