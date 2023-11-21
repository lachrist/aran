import { runInThisContext } from "vm";
runInThisContext(`
  function f([]) {}
  console.log(Object.getOwnPropertyDescriptors(f));
`);
