import { guardVariable } from "./guard.mjs";
import { assertEqual, assertThrow } from "./test.fixture.mjs";

assertEqual(guardVariable("$", "foo"), "foo");

assertThrow(() => guardVariable("$", "123foo"), {
  name: "AranInputError",
});

assertEqual(guardVariable("$", "foo123"), "foo123");

assertEqual(guardVariable("$", "$"), "$");

assertEqual(guardVariable("$", "_"), "_");
