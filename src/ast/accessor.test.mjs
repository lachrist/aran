import {
  assertEqual,
  assertDeepEqual,
  generateAssertUnreachable,
} from "../__fixture__.mjs";

import {
  makeAnnotatedNode,
  makeNode,
  getNodeType,
  getNodeFieldArray,
  dispatchNode,
  extractNode,
  annotateNode,
  matchNode,
  getNodeAnnotation,
  allignNode,
} from "./accessor.mjs";

//////////////////////////////////////
// getNodeType && getNodeFieldArray //
//////////////////////////////////////

// makeAnnotatedNode //
assertEqual(
  getNodeType(makeAnnotatedNode("LiteralExpression", 123, "@")),
  "LiteralExpression",
);
assertDeepEqual(
  getNodeAnnotation(makeAnnotatedNode("LiteralExpression", 123, "@")),
  "@",
);
assertDeepEqual(
  getNodeFieldArray(makeAnnotatedNode("LiteralExpression", 123, "@")),
  [123],
);

// makeNode //
assertEqual(
  getNodeType(makeNode("LiteralExpression", 123)),
  "LiteralExpression",
);
assertDeepEqual(getNodeAnnotation(makeNode("LiteralExpression", 123)), null);
assertDeepEqual(getNodeFieldArray(makeNode("LiteralExpression", 123)), [123]);

assertDeepEqual(
  annotateNode(makeNode("LiteralExpression", 123), "@"),
  makeAnnotatedNode("LiteralExpression", 123, "@"),
);

/////////////////////////////////
// extractNode && dispatchNode //
/////////////////////////////////

// default_callback //
assertEqual(
  dispatchNode(
    "context",
    makeAnnotatedNode("DebuggerStatement", "@"),
    {__proto__: null},
    (context, node, ...rest) => {
      assertDeepEqual(
        [context, node, rest],
        ["context", makeAnnotatedNode("DebuggerStatement", "@"), []],
      );
      return "result";
    },
  ),
  "result",
);

// 0 //
{
  const node = makeAnnotatedNode("DebuggerStatement", "@");
  const callback = (context, annotation, ...rest) => {
    assertDeepEqual([context, annotation, rest], ["context", "@", []]);
    return "result";
  };
  assertEqual(
    extractNode("context", node, "DebuggerStatement", callback),
    "result",
  );
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        DebuggerStatement: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

// 1 //
{
  const node = makeAnnotatedNode("LiteralExpression", 123, "@");
  const callback = (context, primitive, annotation, ...rest) => {
    assertDeepEqual(
      [context, primitive, annotation, rest],
      ["context", 123, "@", []],
    );
    return "result";
  };
  assertEqual(
    extractNode("context", node, "LiteralExpression", callback),
    "result",
  );
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        LiteralExpression: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

// 2 //
{
  const node = makeAnnotatedNode("ImportLink", "specifier", "source", "@");
  const callback = (context, specifier, source, annotation, ...rest) => {
    assertDeepEqual(
      [context, specifier, source, annotation, rest],
      ["context", "specifier", "source", "@", []],
    );
    return "result";
  };
  assertEqual(extractNode("context", node, "ImportLink", callback), "result");
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        ImportLink: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

// 3 //
{
  const node = makeAnnotatedNode(
    "ConditionalExpression",
    makeAnnotatedNode("LiteralExpression", 123, "@"),
    makeAnnotatedNode("LiteralExpression", 456, "@"),
    makeAnnotatedNode("LiteralExpression", 789, "@"),
    "@",
  );
  const callback = (
    context,
    annotation,
    expression1,
    expression2,
    expression3,
    ...rest
  ) => {
    assertDeepEqual(
      [context, annotation, expression1, expression2, expression3, rest],
      [
        "context",
        makeAnnotatedNode("LiteralExpression", 123, "@"),
        makeAnnotatedNode("LiteralExpression", 456, "@"),
        makeAnnotatedNode("LiteralExpression", 789, "@"),
        "@",
        [],
      ],
    );
    return "result";
  };
  assertEqual(
    extractNode("context", node, "ConditionalExpression", callback),
    "result",
  );
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        ConditionalExpression: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

// 4 //
{
  const node = makeAnnotatedNode(
    "ClosureExpression",
    "arrow",
    true,
    false,
    makeAnnotatedNode("Block", [], [], [], "@"),
    "@",
  );
  const callback = (
    context,
    annotation,
    kind,
    asynchronous,
    generator,
    block,
    ...rest
  ) => {
    assertDeepEqual(
      [context, annotation, kind, asynchronous, generator, block, rest],
      [
        "context",
        "arrow",
        true,
        false,
        makeAnnotatedNode("Block", [], [], [], "@"),
        "@",
        [],
      ],
    );
    return "result";
  };
  assertEqual(
    extractNode("context", node, "ClosureExpression", callback),
    "result",
  );
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        ClosureExpression: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

///////////////
// matchNode //
///////////////

assertEqual(
  matchNode("context", makeAnnotatedNode("LiteralExpression", 123, "@"), [
    "LiteralExpression",
    456,
    "@",
  ]),
  false,
);

assertEqual(
  matchNode("context", makeAnnotatedNode("LiteralExpression", 123, "@"), [
    "LiteralExpression",
    123,
    "@",
  ]),
  true,
);

assertEqual(
  matchNode(
    "context",
    makeAnnotatedNode("LiteralExpression", {bigint: "123"}, "@"),
    ["LiteralExpression", 456n, "@"],
  ),
  false,
);
assertEqual(
  matchNode(
    "context",
    makeAnnotatedNode("LiteralExpression", {bigint: "123"}, "@"),
    ["LiteralExpression", 123n, "@"],
  ),
  true,
);

const testMatch = (matched) => {
  assertEqual(
    matchNode("context", makeAnnotatedNode("LiteralExpression", 123, "@"), [
      "LiteralExpression",
      (...args) => {
        assertDeepEqual(args, ["context", 123]);
        return matched;
      },
      "@",
    ]),
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
    makeAnnotatedNode("LiteralExpression", 123, "@1"),
    makeAnnotatedNode("LiteralExpression", 456, "@2"),
    {
      __proto__: null,
      LiteralExpression: (
        context,
        node1,
        node2,
        primitive1,
        primitive2,
        ...rest
      ) => {
        assertDeepEqual(
          [context, node1, node2, primitive1, primitive2, rest],
          ["context", 123, "@1", 456, "@2", []],
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
    makeAnnotatedNode("LiteralExpression", 123, "@"),
    makeAnnotatedNode("LiteralExpression", 456, "@"),
    {__proto__: null},
    (context, node1, node2, ...rest) => {
      assertDeepEqual(
        [context, node1, node2, rest],
        [
          "context",
          makeAnnotatedNode("LiteralExpression", 123, "@"),
          makeAnnotatedNode("LiteralExpression", 456, "@"),
          [],
        ],
      );
      return "result";
    },
  ),
  "result",
);
