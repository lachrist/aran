import {
  assertEqual,
  assertDeepEqual,
  generateAssertUnreachable,
} from "../__fixture__.mjs";

import {
  makeNode,
  getNodeType,
  getNodeFieldArray,
  dispatchNode,
  extractNode,
  // matchNode,
  getNodeAnnotation,
  allignNode,
} from "./accessor.mjs";

//////////////////////////////////////
// getNodeType && getNodeFieldArray //
//////////////////////////////////////

assertEqual(
  getNodeType(makeNode("PrimitiveExpression", "@", 123)),
  "PrimitiveExpression",
);

assertDeepEqual(
  getNodeAnnotation(makeNode("PrimitiveExpression", "@", 123)),
  "@",
);

assertDeepEqual(getNodeFieldArray(makeNode("PrimitiveExpression", "@", 123)), [
  123,
]);

/////////////////////////////////
// extractNode && dispatchNode //
/////////////////////////////////

// default_callback //
assertEqual(
  dispatchNode(
    "context",
    makeNode("DebuggerStatement", "@"),
    {__proto__: null},
    (context, node, ...rest) => {
      assertDeepEqual(
        [context, node, rest],
        ["context", makeNode("DebuggerStatement", "@"), []],
      );
      return "result";
    },
  ),
  "result",
);

// 0 //
{
  const node = makeNode("DebuggerStatement", "@");
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
  const node = makeNode("PrimitiveExpression", "@", 123);
  const callback = (context, annotation, primitive, ...rest) => {
    assertDeepEqual(
      [context, annotation, primitive, rest],
      ["context", "@", 123, []],
    );
    return "result";
  };
  assertEqual(
    extractNode("context", node, "PrimitiveExpression", callback),
    "result",
  );
  assertEqual(
    dispatchNode(
      "context",
      node,
      {
        __proto__: null,
        PrimitiveExpression: callback,
      },
      generateAssertUnreachable("default callback should not be called"),
    ),
    "result",
  );
}

// 2 //
{
  const node = makeNode("ImportLink", "@", "specifier", "source");
  const callback = (context, annotation, specifier, source, ...rest) => {
    assertDeepEqual(
      [context, annotation, specifier, source, rest],
      ["context", "@", "specifier", "source", []],
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
  const node = makeNode(
    "ConditionalExpression",
    "@",
    makeNode("PrimitiveExpression", "@", 123),
    makeNode("PrimitiveExpression", "@", 456),
    makeNode("PrimitiveExpression", "@", 789),
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
        "@",
        makeNode("PrimitiveExpression", "@", 123),
        makeNode("PrimitiveExpression", "@", 456),
        makeNode("PrimitiveExpression", "@", 789),
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
  const node = makeNode(
    "ClosureExpression",
    "@",
    "arrow",
    true,
    false,
    makeNode("Block", "@", [], [], []),
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
        "@",
        "arrow",
        true,
        false,
        makeNode("Block", "@", [], [], []),
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

// assertEqual(
//   matchNode(
//     "context",
//     makeNode("PrimitiveExpression", "@", 123),
//     makeNode("PrimitiveExpression", "@", 456),
//   ),
//   false,
// );
//
// assertEqual(
//   matchNode(
//     "context",
//     makeNode("PrimitiveExpression", "@", 123),
//     makeNode("PrimitiveExpression", "@", 123),
//   ),
//   true,
// );
//
// const testMatch = (matched) => {
//   assertEqual(
//     matchNode(
//       "context",
//       makeNode("PrimitiveExpression", "@", 123),
//       makeNode("PrimitiveExpression", "@", (...args) => {
//         assertDeepEqual(args, ["context", "@", 123]);
//         return matched;
//       }),
//     ),
//     matched,
//   );
// };
// testMatch(true);
// testMatch(false);

////////////////
// allignNode //
////////////////

assertEqual(
  allignNode(
    "context",
    makeNode("PrimitiveExpression", "@1", 123),
    makeNode("PrimitiveExpression", "@2", 456),
    {
      __proto__: null,
      PrimitiveExpression: (context, node1, node2, primitive1, primitive2) => {
        assertDeepEqual(
          [context, node1, node2, primitive1, primitive2],
          ["context", "@1", 123, "@2", 456],
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
    makeNode("PrimitiveExpression", "@", 123),
    makeNode("PrimitiveExpression", "@", 456),
    {__proto__: null},
    (context, node1, node2, ...rest) => {
      assertDeepEqual(
        [context, node1, node2, rest],
        [
          "context",
          makeNode("PrimitiveExpression", "@", 123),
          makeNode("PrimitiveExpression", "@", 456),
          [],
        ],
      );
      return "result";
    },
  ),
  "result",
);
