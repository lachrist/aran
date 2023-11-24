import { x as xx } from "./yo.mjs";

try {
  console.log(xx);
} catch (e) {
  console.log(e);
}

export const x = 123;

console.log(xx);
