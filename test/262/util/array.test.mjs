import { transpose } from "./array.mjs";
import {
  deepStrictEqual as assertEqualDeep,
  throws as assertThrow,
} from "node:assert";

assertEqualDeep(
  transpose([
    [1, 2, 3],
    [3, 4, 5],
  ]),
  [
    [1, 3],
    [2, 4],
    [3, 5],
  ],
);

assertEqualDeep(transpose([]), []);

assertThrow(() =>
  transpose([
    [1, 2, 3],
    [4, 5],
  ]),
);
