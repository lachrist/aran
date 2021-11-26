import {
  assertDeepEqual,
  assertEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";
import {makeNode} from "./accessor.mjs";
import {matchNode, allignNode} from "./test-accessor.mjs";

///////////////
// matchNode //
///////////////

assertEqual(
  matchNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    makeNode("PrimitiveExpression", "456"),
  ),
  false,
);

assertEqual(
  matchNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    makeNode("PrimitiveExpression", "123"),
  ),
  true,
);

const testMatch = (matched) => {
  assertEqual(
    matchNode(
      "context",
      makeNode("PrimitiveExpression", "123"),
      makeNode("PrimitiveExpression", (...args) => {
        assertDeepEqual(args, ["context", "123"]);
        return matched;
      }),
    ),
    matched,
  );
};
testMatch(true);
testMatch(false);

////////////////
// allignNode //
////////////////

assertEqual(
  allignNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    makeNode("PrimitiveExpression", "456"),
    {
      __proto__: null,
      PrimitiveExpression: (context, node1, node2, primitive1, primitive2) => {
        assertDeepEqual(
          [context, node1, node2, primitive1, primitive2],
          [
            "context",
            makeNode("PrimitiveExpression", "123"),
            makeNode("PrimitiveExpression", "456"),
            "123",
            "456",
          ],
        );
        return "result";
      },
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

assertEqual(
  allignNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    makeNode("PrimitiveExpression", "456"),
    {__proto__: null},
    (context, node1, node2) => {
      assertDeepEqual(
        [context, node1, node2],
        [
          "context",
          makeNode("PrimitiveExpression", "123"),
          makeNode("PrimitiveExpression", "456"),
        ],
      );
      return "result";
    },
  ),
  "result",
);
