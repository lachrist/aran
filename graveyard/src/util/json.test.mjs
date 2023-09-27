import { assertEqual } from "../__fixture__.mjs";
import { matchJSON } from "./json.mjs";

const { Symbol } = globalThis;

assertEqual(
  matchJSON(123, (x) => x === 123),
  true,
);
assertEqual(
  matchJSON(123, (x) => x !== 123),
  false,
);

assertEqual(matchJSON(123, /^123$/u), true);
assertEqual(matchJSON(123, /^456$/u), false);

assertEqual(matchJSON(123, 123), true);
assertEqual(matchJSON(123, 456), false);

assertEqual(matchJSON([123, 456], [123, 456]), true);
assertEqual(matchJSON([123, 456], [123, 789]), false);
assertEqual(matchJSON([123], [123, 456]), false);

assertEqual(
  matchJSON(
    { foo: 123, bar: 456 },
    { bar: 456, foo: 123, [Symbol("qux")]: 789 },
  ),
  true,
);
assertEqual(matchJSON({ foo: 123, bar: 456 }, { foo: 123, bar: 789 }), false);
assertEqual(matchJSON({ foo: 123, bar: 456 }, { foo: 123, qux: 456 }), false);
assertEqual(matchJSON({ foo: 123, bar: 456 }, { foo: 123 }), false);
