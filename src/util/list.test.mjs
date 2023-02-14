import { assertEqual, assertDeepEqual } from "../__fixture__.mjs";

import {
  cons,
  consFlip,
  car,
  cdr,
  convertArrayList,
  convertListArray,
} from "./list.mjs";

assertEqual(car(cons(123, 456)), 123);

assertEqual(cdr(cons(123, 456)), 456);

assertDeepEqual(cons(123, 456), consFlip(456, 123));

assertDeepEqual(convertArrayList([1, 2, 3]), cons(1, cons(2, cons(3, null))));

assertDeepEqual(convertListArray(cons(1, cons(2, cons(3, null)))), [1, 2, 3]);
