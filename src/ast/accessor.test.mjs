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
  // matchNode,
  getNodeAnnotation,
  allignNode,
} from "./accessor.mjs";

//////////////////////////////////////
// getNodeType && getNodeFieldArray //
//////////////////////////////////////

// makeAnnotatedNode //
assertEqual(
  getNodeType(makeAnnotatedNode("PrimitiveExpression", 123, "@")),
  "PrimitiveExpression",
);
assertDeepEqual(
  getNodeAnnotation(makeAnnotatedNode("PrimitiveExpression", 123, "@")),
  "@",
);
assertDeepEqual(
  getNodeFieldArray(makeAnnotatedNode("PrimitiveExpression", 123, "@")),
  [123],
);

// makeNode //
assertEqual(
  getNodeType(makeNode("PrimitiveExpression", 123)),
  "PrimitiveExpression",
);
assertDeepEqual(getNodeAnnotation(makeNode("PrimitiveExpression", 123)), null);
assertDeepEqual(getNodeFieldArray(makeNode("PrimitiveExpression", 123)), [123]);

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
  const node = makeAnnotatedNode("PrimitiveExpression", 123, "@");
  const callback = (context, primitive, annotation, ...rest) => {
    assertDeepEqual(
      [context, primitive, annotation, rest],
      ["context", 123, "@", []],
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
    makeAnnotatedNode("PrimitiveExpression", 123, "@"),
    makeAnnotatedNode("PrimitiveExpression", 456, "@"),
    makeAnnotatedNode("PrimitiveExpression", 789, "@"),
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
        makeAnnotatedNode("PrimitiveExpression", 123, "@"),
        makeAnnotatedNode("PrimitiveExpression", 456, "@"),
        makeAnnotatedNode("PrimitiveExpression", 789, "@"),
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

// assertEqual(
//   matchNode(
//     "context",
//     makeAnnotatedNode("PrimitiveExpression", "@", 123),
//     makeAnnotatedNode("PrimitiveExpression", "@", 456),
//   ),
//   false,
// );
//
// assertEqual(
//   matchNode(
//     "context",
//     makeAnnotatedNode("PrimitiveExpression", "@", 123),
//     makeAnnotatedNode("PrimitiveExpression", "@", 123),
//   ),
//   true,
// );
//
// const testMatch = (matched) => {
//   assertEqual(
//     matchNode(
//       "context",
//       makeAnnotatedNode("PrimitiveExpression", "@", 123),
//       makeAnnotatedNode("PrimitiveExpression", "@", (...args) => {
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
    makeAnnotatedNode("PrimitiveExpression", 123, "@1"),
    makeAnnotatedNode("PrimitiveExpression", 456, "@2"),
    {
      __proto__: null,
      PrimitiveExpression: (
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
    makeAnnotatedNode("PrimitiveExpression", 123, "@"),
    makeAnnotatedNode("PrimitiveExpression", 456, "@"),
    {__proto__: null},
    (context, node1, node2, ...rest) => {
      assertDeepEqual(
        [context, node1, node2, rest],
        [
          "context",
          makeAnnotatedNode("PrimitiveExpression", 123, "@"),
          makeAnnotatedNode("PrimitiveExpression", 456, "@"),
          [],
        ],
      );
      return "result";
    },
  ),
  "result",
);
