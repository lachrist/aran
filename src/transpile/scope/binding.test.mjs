import {assertEqual} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {
  isStrictScope,
  useStrictScope,
  incrementScopeCounter,
  resetScopeCounter,
  createRootScope,
} from "./binding.mjs";

const {undefined} = globalThis;

{
  const scope = createRootScope(createCounter(0));
  assertEqual(incrementScopeCounter(scope), 1);
  assertEqual(incrementScopeCounter(scope), 2);
  assertEqual(resetScopeCounter(scope, createCounter(10)), undefined);
  assertEqual(incrementScopeCounter(scope), 11);
  assertEqual(incrementScopeCounter(scope), 12);
}

assertEqual(isStrictScope(createRootScope(createCounter(0))), false);

assertEqual(
  isStrictScope(useStrictScope(createRootScope(createCounter(0)))),
  true,
);
