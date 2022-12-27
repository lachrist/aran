import { forEach } from "array-lite";

import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";

import {
  makeMetaVariable,
  mangleDeadzoneVariable,
  mangleOriginalVariable,
  unmangleVariable,
  getVariableLayer,
} from "./variable.mjs";

assertThrow(() => {
  unmangleVariable("X3");
});

forEach(["this", "new.target", "import.meta"], (name) => {
  assertEqual(getVariableLayer(name), "spec");
  assertDeepEqual(unmangleVariable(mangleDeadzoneVariable(name)), {
    layer: "base",
    deadzone: true,
    name,
    index: null,
  });
});

{
  const variable = makeMetaVariable("name", 123);
  assertEqual(getVariableLayer(variable), "meta");
  assertDeepEqual(unmangleVariable(mangleOriginalVariable(variable)), {
    layer: "meta",
    deadzone: false,
    name: "name",
    index: 123,
  });
}

assertEqual(getVariableLayer("name"), "base");
assertDeepEqual(unmangleVariable(mangleOriginalVariable("name")), {
  layer: "base",
  deadzone: false,
  name: "name",
  index: null,
});
