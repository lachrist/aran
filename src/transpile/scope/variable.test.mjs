import {assertThrow, assertDeepEqual} from "../../__fixture__.mjs";

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
    identifier: "BO_new_target",
  },
);

assertDeepEqual(
  unmangleVariable(makeShadowVariable(BASE, makeVariableBody("import_meta"))),
  {
    layer: "base",
    shadow: true,
    name: "import_meta",
    identifier: "BS_import__meta",
  },
);

assertDeepEqual(
  unmangleVariable(
    makeVariable(META, makeIndexedVariableBody("description", 123)),
  ),
  {
    layer: "meta",
    index: 123,
    description: "description",
    identifier: "MO3f_description",
  },
);
