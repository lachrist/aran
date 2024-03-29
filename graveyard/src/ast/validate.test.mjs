import { assertThrow } from "../__fixture__.mjs";

import { validateNode } from "./validate.mjs";

const makeValidNode = (...args) => validateNode([...args, "annotation"]);

assertThrow(() => makeValidNode(123));

assertThrow(() => makeValidNode("MissingType"));

assertThrow(() => makeValidNode("LiteralExpression", []));

{
  const circular = { circular: null };
  circular.circular = circular;
  assertThrow(() => makeValidNode("LiteralExpression", circular));
}

// Nested unvalidated node
validateNode(["ExpressionEffect", ["LiteralExpression", 123, null], null]);

///////////
// Local //
///////////

// Duplicate Variables //
makeValidNode("Block", [], ["foo", "bar", "qux"], []);
assertThrow(() => {
  makeValidNode("Block", [], ["foo", "bar", "qux", "bar"], []);
});

// Duplicate Export Link //
{
  const link = makeValidNode("ExportLink", "specifier");
  const block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 123))],
  );
  makeValidNode("ModuleProgram", [link], block);
  assertThrow(() => {
    makeValidNode("ModuleProgram", [link, link], block);
  });
}

// AggregateLink //
makeValidNode("AggregateLink", "'source'", null, null);
makeValidNode("AggregateLink", "'source'", null, "foo");
assertThrow(() => {
  makeValidNode("AggregateLink", "'source'", "foo", null);
});

// Generator Arrow //
assertThrow(() => {
  makeValidNode(
    "Closure",
    "arrow",
    false,
    true,
    makeValidNode("Block", [], [], []),
  );
});

// Generator Constructor //
assertThrow(() => {
  makeValidNode(
    "Closure",
    "constructor",
    false,
    true,
    makeValidNode("Block", [], [], []),
  );
});

// Asynchronous Constructor //
assertThrow(() => {
  makeValidNode(
    "Closure",
    "constructor",
    true,
    false,
    makeValidNode("Block", [], [], []),
  );
});

// Completion //
assertThrow(() => {
  makeValidNode("ScriptProgram", []);
});
{
  const block = makeValidNode("Block", [], [], []);
  assertThrow(() => {
    makeValidNode("EvalProgram", block);
  });
}
{
  const statements = [
    makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 123)),
    makeValidNode("DebuggerStatement"),
    makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 456)),
  ];
  assertThrow(() => {
    makeValidNode("ScriptProgram", statements);
  });
}
{
  const block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("DebuggerStatement")],
  );
  assertThrow(() => {
    makeValidNode("EvalProgram", block);
  });
}
makeValidNode(
  "EvalProgram",
  makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "IfStatement",
        makeValidNode("LiteralExpression", 123),
        makeValidNode(
          "Block",
          [],
          [],
          [
            makeValidNode(
              "BlockStatement",
              makeValidNode(
                "Block",
                [],
                [],
                [
                  makeValidNode(
                    "ReturnStatement",
                    makeValidNode("LiteralExpression", 123),
                  ),
                ],
              ),
            ),
          ],
        ),
        makeValidNode(
          "Block",
          [],
          [],
          [
            makeValidNode(
              "TryStatement",
              makeValidNode(
                "Block",
                [],
                [],
                [
                  makeValidNode(
                    "ReturnStatement",
                    makeValidNode("LiteralExpression", 456),
                  ),
                ],
              ),
              makeValidNode(
                "Block",
                [],
                [],
                [
                  makeValidNode(
                    "ReturnStatement",
                    makeValidNode("LiteralExpression", 789),
                  ),
                ],
              ),
              makeValidNode("Block", [], [], []),
            ),
          ],
        ),
      ),
    ],
  ),
);

// Label //
{
  const block = makeValidNode(
    "Block",
    ["label"],
    [],
    [makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 123))],
  );
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  assertThrow(() => {
    makeValidNode("EvalProgram", block);
  });
}

/////////////
// Distant //
/////////////

// ReturnStatement //
{
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", "return"),
  );
  const completion_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", "completion"),
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", [return_statement, completion_statement]);
  });
  makeValidNode("ScriptProgram", [
    makeValidNode(
      "ReturnStatement",
      makeValidNode(
        "ClosureExpression",
        "arrow",
        false,
        false,
        makeValidNode(
          "Block",
          [],
          [],
          [return_statement, completion_statement],
        ),
      ),
    ),
  ]);
}

// AwaitExpression //
{
  const await_expression = makeValidNode(
    "AwaitExpression",
    makeValidNode("LiteralExpression", "promise"),
  );
  const completion_statement = makeValidNode(
    "ReturnStatement",
    await_expression,
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [completion_statement],
  );
  assertThrow(() => {
    makeValidNode("ClosureExpression", "arrow", false, false, completion_block);
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", [completion_statement]);
  });
  makeValidNode("ModuleProgram", [], completion_block);
  makeValidNode("ScriptProgram", [
    makeValidNode(
      "ReturnStatement",
      makeValidNode(
        "ClosureExpression",
        "arrow",
        true,
        false,
        completion_block,
      ),
    ),
  ]);
}

// YieldExpression //
{
  const yield_expression = makeValidNode(
    "YieldExpression",
    false,
    makeValidNode("LiteralExpression", 123),
  );
  const completion_statement = makeValidNode(
    "ReturnStatement",
    yield_expression,
  );
  const expression_statement = makeValidNode(
    "EffectStatement",
    makeValidNode("ExpressionEffect", yield_expression),
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [completion_statement],
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [expression_statement],
  );
  assertThrow(() => {
    makeValidNode(
      "ClosureExpression",
      "function",
      false,
      false,
      completion_block,
    );
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", [completion_statement]);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], non_completion_block);
  });
  makeValidNode("ScriptProgram", [
    makeValidNode(
      "ReturnStatement",
      makeValidNode(
        "ClosureExpression",
        "function",
        false,
        true,
        completion_block,
      ),
    ),
  ]);
}

// BreakStatement //
{
  const break_statement = makeValidNode("BreakStatement", "label");
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", 123),
  );
  const free_block = makeValidNode("Block", [], [], [break_statement]);
  const bound_block = makeValidNode("Block", ["label"], [], [break_statement]);
  const bound_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("BlockStatement", bound_block), return_statement],
  );
  const free_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("BlockStatement", free_block), return_statement],
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", [break_statement]);
  });
  assertThrow(() => {
    makeValidNode(
      "ClosureExpression",
      "arrow",
      false,
      false,
      free_completion_block,
    );
  });
  makeValidNode(
    "ClosureExpression",
    "arrow",
    false,
    false,
    bound_completion_block,
  );
}

// ParameterExpression //
{
  const statements = [
    makeValidNode(
      "ReturnStatement",
      makeValidNode("ParameterExpression", "error"),
    ),
  ];
  assertThrow(() => makeValidNode("ScriptProgram", statements));
  makeValidNode("ScriptProgram", [
    makeValidNode(
      "TryStatement",
      makeValidNode(
        "Block",
        [],
        [],
        [
          makeValidNode(
            "ReturnStatement",
            makeValidNode("LiteralExpression", 123),
          ),
        ],
      ),
      makeValidNode("Block", [], [], statements),
      makeValidNode("Block", [], [], []),
    ),
  ]);
}

// ReadExpression && WriteEffect //
const testVariable = (makeValidVariableEffect) => {
  const variable_statement = makeValidNode(
    "EffectStatement",
    makeValidVariableEffect("variable"),
  );
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", "completion"),
  );
  const bound_block = makeValidNode(
    "Block",
    [],
    ["variable"],
    [variable_statement, return_statement],
  );
  const unbound_block = makeValidNode(
    "Block",
    [],
    [],
    [variable_statement, return_statement],
  );
  makeValidNode("ModuleProgram", [], bound_block);
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], unbound_block);
  });
};
testVariable((variable) =>
  makeValidNode("ExpressionEffect", makeValidNode("ReadExpression", variable)),
);
testVariable((variable) =>
  makeValidNode(
    "WriteEffect",
    variable,
    makeValidNode("LiteralExpression", 123),
  ),
);

// DeclareStatement //
{
  const makeDeclareStatement = (kind) =>
    makeValidNode(
      "DeclareExternalStatement",
      kind,
      "variable",
      makeValidNode("LiteralExpression", 123),
    );
  const rigid_declare_statement = makeDeclareStatement("let");
  const loose_declare_statement = makeDeclareStatement("var");
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", 123),
  );
  const debugger_statement = makeValidNode("DebuggerStatement");
  // ScriptProgram //
  const makeScriptProgram = (statement) =>
    makeValidNode("ScriptProgram", [statement, return_statement]);
  makeScriptProgram(rigid_declare_statement);
  makeScriptProgram(loose_declare_statement);
  // Block //
  const makeBlock = (statement) =>
    makeValidNode("Block", [], [], [statement, return_statement]);
  makeBlock(loose_declare_statement);
  assertThrow(() => makeBlock(rigid_declare_statement));
  // ClosureExpression //
  const makeClosureExpression = (statement) =>
    makeValidNode(
      "ClosureExpression",
      "arrow",
      false,
      false,
      makeBlock(statement),
    );
  makeClosureExpression(debugger_statement);
  assertThrow(() => makeClosureExpression(loose_declare_statement));
}

// Import //
{
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "ReturnStatement",
        makeValidNode("ImportExpression", "'source'", "specifier"),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], completion_block);
  });
  makeValidNode(
    "ModuleProgram",
    [makeValidNode("ImportLink", "'source'", "specifier")],
    completion_block,
  );
}

// Export //
{
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode(
          "ExportEffect",
          "specifier",
          makeValidNode("LiteralExpression", 123),
        ),
      ),
      makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 123)),
    ],
  );
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], completion_block);
  });
  makeValidNode(
    "ModuleProgram",
    [makeValidNode("ExportLink", "specifier")],
    completion_block,
  );
}
