import {assertEqual} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {
  isStrict,
  useStrict,
  incrementGlobalCounter,
  resetGlobalCounter,
  createRoot,
} from "./binding.mjs";

const {undefined} = globalThis;

{
  const scope = createRoot(createCounter(0));
  assertEqual(incrementGlobalCounter(scope), 1);
  assertEqual(incrementGlobalCounter(scope), 2);
  assertEqual(resetGlobalCounter(scope, createCounter(10)), undefined);
  assertEqual(incrementGlobalCounter(scope), 11);
  assertEqual(incrementGlobalCounter(scope), 12);
}

assertEqual(isStrict(createRoot()), false);

assertEqual(isStrict(useStrict(createRoot())), true);
