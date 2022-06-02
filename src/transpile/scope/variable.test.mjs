import {assertThrow, assertDeepEqual} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {
  BASE,
  META,
  makeVariable,
  makeShadowVariable,
  makeVariableBody,
  makeIndexedVariableBody,
  unmangleVariable,
} from "./variable.mjs";

assertThrow(() => unmangleVariable("foo"), {
  name: "Error",
  message: "invalid variable layer",
});

assertDeepEqual(
  unmangleVariable(makeVariable(BASE, makeVariableBody("new.target"))),
  {
    layer: "base",
    shadow: false,
    name: "new.target",
  },
);

assertDeepEqual(
  unmangleVariable(makeShadowVariable(BASE, makeVariableBody("import.meta"))),
  {
    layer: "base",
    shadow: true,
    name: "import.meta",
  },
);

assertDeepEqual(
  unmangleVariable(
    makeVariable(
      META,
      makeIndexedVariableBody("description", createCounter(123)),
    ),
  ),
  {
    layer: "meta",
    index: 124,
    description: "description",
  },
);
