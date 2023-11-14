import { sanitizeVariable } from "./sanitize.mjs";
import { assertEqual, assertThrow } from "./test.fixture.mjs";

assertEqual(sanitizeVariable("$", "foo"), "foo");

assertThrow(() => sanitizeVariable("$", "123foo"), {
  name: "AranInputError",
});

assertEqual(sanitizeVariable("$", "foo123"), "foo123");

assertEqual(sanitizeVariable("$", "$"), "$");

assertEqual(sanitizeVariable("$", "_"), "_");
