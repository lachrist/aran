import {assertEqual} from "../../__fixture__.mjs";

import {
  isStrict,
  useStrict,
  incrementGlobalCounter,
  restoreGlobalCounter,
  createRoot,
} from "./property.mjs";

{
  const scope = createRoot(0);
  assertEqual(incrementGlobalCounter(scope), 1);
  assertEqual(incrementGlobalCounter(scope), 2);
  restoreGlobalCounter(scope, 10);
  assertEqual(incrementGlobalCounter(scope), 11);
  assertEqual(incrementGlobalCounter(scope), 12);
}

assertEqual(isStrict(createRoot()), false);

assertEqual(isStrict(useStrict(createRoot())), true);
