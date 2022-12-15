import { assertDeepEqual } from "../../__fixture__.mjs";

import {
  BASE,
  META,
  layerVariable,
  layerShadowVariable,
  indexVariable,
  unmangleVariable,
} from "./variable.mjs";

assertDeepEqual(unmangleVariable(layerShadowVariable(BASE, "new.target")), {
  layer: "base",
  shadow: true,
  name: "new.target",
  index: null,
});

assertDeepEqual(
  unmangleVariable(layerVariable(META, indexVariable("foo_bar", 123))),
  {
    layer: "meta",
    shadow: false,
    name: "foo_bar",
    index: 123,
  },
);
