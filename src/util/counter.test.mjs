import {assertEqual} from "../__fixture__.mjs";

import {
  incrementCounter,
  createCounter,
  gaugeCounter,
  resetCounter,
} from "./counter.mjs";

const {undefined} = globalThis;

{
  const counter = createCounter(123);
  assertEqual(incrementCounter(counter), 124);
  assertEqual(incrementCounter(counter), 125);
}

{
  const counter = createCounter(0);
  assertEqual(resetCounter(counter, 123), undefined);
  assertEqual(gaugeCounter(counter), 123);
}
