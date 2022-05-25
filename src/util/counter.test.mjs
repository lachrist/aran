import {assertEqual} from "../__fixture__.mjs";

import {
  incrementCounter,
  createCounter,
  getCounter,
  setCounter,
} from "./counter.mjs";

const {undefined} = globalThis;

{
  const counter = createCounter(123);
  assertEqual(incrementCounter(counter), 124);
  assertEqual(incrementCounter(counter), 125);
}

{
  const counter = createCounter(0);
  assertEqual(setCounter(counter, 123), undefined);
  assertEqual(getCounter(counter), 123);
}
