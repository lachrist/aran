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
  unmangleVariable(makeVariable(BASE, makeVariableBody("name"))),
  {
    layer: "base",
    shadow: false,
    name: "name",
  },
);

assertDeepEqual(
  unmangleVariable(makeShadowVariable(BASE, makeVariableBody("name"))),
  {
    layer: "base",
    shadow: true,
    name: "name",
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
