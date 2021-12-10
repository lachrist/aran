import {
  assertEqual,
  assertDeepEqual,
  generateAssertUnreachable,
} from "../../__fixture__.mjs";

import {
  makeNode,
  getNodeType,
  getNodeFieldArray,
  dispatchNode,
  extractNode,
  matchNode,
  allignNode,
} from "./accessor.mjs";

const {
  Reflect: {defineProperty},
} = globalThis;

//////////////////////////////////////
// getNodeType && getNodeFieldArray //
//////////////////////////////////////

assertEqual(
  getNodeType(makeNode("PrimitiveExpression", "123")),
  "PrimitiveExpression",
);

assertDeepEqual(getNodeFieldArray(makeNode("PrimitiveExpression", "123")), [
  "123",
]);

/////////////////////////////////
// extractNode && dispatchNode //
/////////////////////////////////

const changeAdvertisedArity = (closure, value) => {
  defineProperty(closure, "length", {__proto__: null, value});
  return closure;
};

// default_callback //
assertEqual(
  dispatchNode(
    "context",
    makeNode("DebuggerStatement"),
    {__proto__: null},
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, ["context", makeNode("DebuggerStatement")]);
      return "result";
    }, 2),
  ),
  "result",
);

// 0 //
assertEqual(
  extractNode(
    "context",
    makeNode("DebuggerStatement"),
    "DebuggerStatement",
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, ["context", makeNode("DebuggerStatement")]);
      return "result";
    }, 2),
  ),
  "result",
);
assertEqual(
  dispatchNode(
    "context",
    makeNode("DebuggerStatement"),
    {
      __proto__: null,
      DebuggerStatement: changeAdvertisedArity((...args) => {
        assertDeepEqual(args, ["context", makeNode("DebuggerStatement")]);
        return "result";
      }, 2),
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

// 1 //
assertEqual(
  extractNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    "PrimitiveExpression",
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, [
        "context",
        makeNode("PrimitiveExpression", "123"),
        "123",
      ]);
      return "result";
    }, 3),
  ),
  "result",
);
assertEqual(
  dispatchNode(
    "context",
    makeNode("PrimitiveExpression", "123"),
    {
      __proto__: null,
      PrimitiveExpression: changeAdvertisedArity((...args) => {
        assertDeepEqual(args, [
          "context",
          makeNode("PrimitiveExpression", "123"),
          "123",
        ]);
        return "result";
      }, 3),
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

// 2 //
assertEqual(
  extractNode(
    "context",
    makeNode("Block", ["foo"], [makeNode("DebuggerStatement")]),
    "Block",
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, [
        "context",
        makeNode("Block", ["foo"], [makeNode("DebuggerStatement")]),
        ["foo"],
        [makeNode("DebuggerStatement")],
      ]);
      return "result";
    }, 4),
  ),
  "result",
);
assertEqual(
  dispatchNode(
    "context",
    makeNode("Block", ["foo"], [makeNode("DebuggerStatement")]),
    {
      __proto__: null,
      Block: changeAdvertisedArity((...args) => {
        assertDeepEqual(args, [
          "context",
          makeNode("Block", ["foo"], [makeNode("DebuggerStatement")]),
          ["foo"],
          [makeNode("DebuggerStatement")],
        ]);
        return "result";
      }, 4),
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

// 3 //
assertEqual(
  extractNode(
    "context",
    makeNode(
      "ConditionalExpression",
      makeNode("PrimitiveExpression", "123"),
      makeNode("PrimitiveExpression", "456"),
      makeNode("PrimitiveExpression", "789"),
    ),
    "ConditionalExpression",
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, [
        "context",
        makeNode(
          "ConditionalExpression",
          makeNode("PrimitiveExpression", "123"),
          makeNode("PrimitiveExpression", "456"),
          makeNode("PrimitiveExpression", "789"),
        ),
        makeNode("PrimitiveExpression", "123"),
        makeNode("PrimitiveExpression", "456"),
        makeNode("PrimitiveExpression", "789"),
      ]);
      return "result";
    }, 5),
  ),
  "result",
);
assertEqual(
  dispatchNode(
    "context",
    makeNode(
      "ConditionalExpression",
      makeNode("PrimitiveExpression", "123"),
      makeNode("PrimitiveExpression", "456"),
      makeNode("PrimitiveExpression", "789"),
    ),
    {
      __proto__: null,
      ConditionalExpression: changeAdvertisedArity((...args) => {
        assertDeepEqual(args, [
          "context",
          makeNode(
            "ConditionalExpression",
            makeNode("PrimitiveExpression", "123"),
            makeNode("PrimitiveExpression", "456"),
            makeNode("PrimitiveExpression", "789"),
          ),
          makeNode("PrimitiveExpression", "123"),
          makeNode("PrimitiveExpression", "456"),
          makeNode("PrimitiveExpression", "789"),
        ]);
        return "result";
      }, 5),
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

// 4 //
assertEqual(
  extractNode(
    "context",
    makeNode(
      "TryStatement",
      ["label"],
      makeNode("Block", ["foo"], []),
      makeNode("Block", ["bar"], []),
      makeNode("Block", ["qux"], []),
    ),
    "TryStatement",
    changeAdvertisedArity((...args) => {
      assertDeepEqual(args, [
        "context",
        makeNode(
          "TryStatement",
          ["label"],
          makeNode("Block", ["foo"], []),
          makeNode("Block", ["bar"], []),
          makeNode("Block", ["qux"], []),
        ),
        ["label"],
        makeNode("Block", ["foo"], []),
        makeNode("Block", ["bar"], []),
        makeNode("Block", ["qux"], []),
      ]);
      return "result";
    }, 6),
  ),
  "result",
);
assertEqual(
  dispatchNode(
    "context",
    makeNode(
      "TryStatement",
      ["label"],
      makeNode("Block", ["foo"], []),
      makeNode("Block", ["bar"], []),
      makeNode("Block", ["qux"], []),
    ),
    {
      __proto__: null,
      TryStatement: changeAdvertisedArity((...args) => {
        assertDeepEqual(args, [
          "context",
          makeNode(
            "TryStatement",
            ["label"],
            makeNode("Block", ["foo"], []),
            makeNode("Block", ["bar"], []),
            makeNode("Block", ["qux"], []),
          ),
          ["label"],
          makeNode("Block", ["foo"], []),
          makeNode("Block", ["bar"], []),
          makeNode("Block", ["qux"], []),
        ]);
        return "result";
      }, 6),
    },
    generateAssertUnreachable("default callback should not be called"),
  ),
  "result",
);

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
