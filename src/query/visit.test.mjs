import {
  assertDeepEqual,
  assertEqual,
  generateAssertUnreachable,
} from "../__fixture__.mjs";

import { applyVisitor } from "./visit.mjs";

assertEqual(
  applyVisitor(
    {
      type: (node) => {
        assertDeepEqual(node, { type: "type" });
        return "result";
      },
    },
    { type: "type" },
    generateAssertUnreachable("missing"),
  ),
  "result",
);

assertEqual(
  applyVisitor({}, { type: "type" }, (node) => {
    assertDeepEqual(node, { type: "type" });
    return "result";
  }),
  "result",
);
