import { runInThisContext } from "node:vm";

runInThisContext(`
  with (null) {
    x = 123;
  }`);
