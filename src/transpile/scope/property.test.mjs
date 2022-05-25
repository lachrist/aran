import {assertEqual} from "../../__fixture__.mjs";

import {
  isStrict,
  useStrict,
  incrementGlobalCounter,
  resetGlobalCounter,
  createRoot,
} from "./property.mjs";

const {undefined} = globalThis;

{
  const scope = createRoot(0);
  assertEqual(incrementGlobalCounter(scope), 1);
  assertEqual(incrementGlobalCounter(scope), 2);
  assertEqual(resetGlobalCounter(scope, 10), undefined);
  assertEqual(incrementGlobalCounter(scope), 11);
  assertEqual(incrementGlobalCounter(scope), 12);
}

assertEqual(isStrict(createRoot()), false);

assertEqual(isStrict(useStrict(createRoot())), true);
