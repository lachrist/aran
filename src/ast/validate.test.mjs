import {assertThrow} from "../__fixture__.mjs";
import {makeNode} from "./accessor.mjs";
import {validateNode} from "./validate.mjs";

const makeValidNode = (...args) => validateNode(makeNode(...args));

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

// Block //
{
  const statement = makeValidNode(
    "EffectStatement",
    makeValidNode("ExpressionEffect", makeValidNode("InputExpression")),
  );
  assertThrow(() => {
    makeValidNode("Block", [], [], [statement, statement]);
  });
}

// Completion //
assertThrow(() => {
  makeValidNode("ScriptProgram", []);
});
{
  const statement = makeValidNode(
    "EffectStatement",
    makeValidNode(
      "WriteEnclaveEffect",
      "foo",
      makeValidNode("LiteralExpression", 123),
    ),
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", [statement]);
  });
}
{
  const statements = [
    makeValidNode("ReturnStatement", makeValidNode("LiteralExpression", 123)),
    makeValidNode("DebuggerStatement"),
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
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode("LiteralExpression", 123),
        ),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], block);
  });
}
makeValidNode(
  "EvalProgram",
  [],
  [],
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
                    "EffectStatement",
                    makeValidNode(
                      "ExpressionEffect",
                      makeValidNode(
                        "ThrowExpression",
                        makeValidNode("LiteralExpression", 123),
                      ),
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
                    "ReturnStatement",
                    makeValidNode("LiteralExpression", 123),
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
    makeValidNode("EvalProgram", [], [], block);
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

// RigidDeclareEnclaveStatement //
const testRigidDeclareEnclaveStatement = (kind) => {
  const declare_statement = makeValidNode(
    "DeclareEnclaveStatement",
    kind,
    "variable",
    makeValidNode("LiteralExpression", 123),
  );
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", "completion"),
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [declare_statement, return_statement],
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [declare_statement],
  );
  const expression = makeValidNode(
    "AwaitExpression",
    makeValidNode("LiteralExpression", 123),
  );
  assertThrow(() => {
    makeValidNode("BlockStatement", non_completion_block);
  });
  assertThrow(() => {
    makeValidNode(
      "IfStatement",
      expression,
      non_completion_block,
      non_completion_block,
    );
  });
  assertThrow(() => {
    makeValidNode("WhileStatement", expression, non_completion_block);
  });
  assertThrow(() => {
    makeValidNode(
      "TryStatement",
      non_completion_block,
      non_completion_block,
      non_completion_block,
    );
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], non_completion_block);
  });
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], "completion", completion_block);
  });
  makeValidNode("ScriptProgram", [declare_statement, return_statement]);
};
testRigidDeclareEnclaveStatement("let");
testRigidDeclareEnclaveStatement("const");

// LooseDeclareEnclaveStatement //
{
  const declare_statement = makeValidNode(
    "DeclareEnclaveStatement",
    "var",
    "variable",
    makeValidNode("LiteralExpression", 123),
  );
  const return_statement = makeValidNode(
    "ReturnStatement",
    makeValidNode("LiteralExpression", "literal"),
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [declare_statement],
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [declare_statement, return_statement],
  );
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, completion_block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], non_completion_block);
  });
  makeValidNode("ScriptProgram", [declare_statement, return_statement]);
  makeValidNode("EvalProgram", ["var"], [], completion_block);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], completion_block);
  });
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
  makeValidNode("EvalProgram", [], [], bound_block);
  makeValidNode("EvalProgram", [], ["variable"], unbound_block);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], unbound_block);
  });
};
testVariable((variable) =>
  makeValidNode("ExpressionEffect", makeValidNode("ReadExpression", variable)),
);
testVariable((variable) =>
  makeValidNode(
    "ExpressionEffect",
    makeValidNode(
      "EvalExpression",
      [],
      [variable],
      makeValidNode("LiteralExpression", 123),
    ),
  ),
);
testVariable((variable) =>
  makeValidNode(
    "WriteEffect",
    variable,
    makeValidNode("LiteralExpression", 123),
  ),
);

// ClosureEnclave //
{
  const testClosureEnclave = (enclave, expression1) => {
    const run = (expression2) => {
      const block = makeValidNode(
        "Block",
        [],
        [],
        [makeValidNode("ReturnStatement", expression2)],
      );
      makeValidNode("EvalProgram", [enclave], [], block);
      assertThrow(() => {
        makeValidNode("EvalProgram", [], [], block);
      });
      makeValidNode("ClosureExpression", "arrow", false, false, block);
      assertThrow(() => {
        makeValidNode("ClosureExpression", "function", false, false, block);
      });
    };
    run(expression1);
    run(
      makeValidNode(
        "EvalExpression",
        [enclave],
        [],
        makeValidNode("LiteralExpression", 123),
      ),
    );
  };
  testClosureEnclave(
    "super.call",
    makeValidNode(
      "CallSuperEnclaveExpression",
      makeValidNode("LiteralExpression", 123),
    ),
  );
  testClosureEnclave(
    "super.get",
    makeValidNode(
      "GetSuperEnclaveExpression",
      makeValidNode("LiteralExpression", 123),
    ),
  );
  testClosureEnclave(
    "super.set",
    makeValidNode(
      "SequenceExpression",
      makeValidNode(
        "SetSuperEnclaveEffect",
        makeValidNode("LiteralExpression", 123),
        makeValidNode("LiteralExpression", 456),
      ),
      makeValidNode("LiteralExpression", 789),
    ),
  );
  testClosureEnclave("this", makeValidNode("ReadEnclaveExpression", "this"));
  testClosureEnclave(
    "arguments",
    makeValidNode("ReadEnclaveExpression", "arguments"),
  );
  testClosureEnclave(
    "new.target",
    makeValidNode("ReadEnclaveExpression", "new.target"),
  );
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
        makeValidNode("StaticImportExpression", "'source'", "specifier"),
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
          "StaticExportEffect",
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
