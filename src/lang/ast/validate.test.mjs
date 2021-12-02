import {assertThrow} from "../../__fixture__.mjs";
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
  const block = makeValidNode("Block", [], [], []);
  makeValidNode("ModuleProgram", [link], block);
  assertThrow(() => {
    makeValidNode("ModuleProgram", [link, link], block);
  });
}

// AggregateLink //
makeValidNode("AggregateLink", "source", null, null);
makeValidNode("AggregateLink", "source", null, "foo");
assertThrow(() => {
  makeValidNode("AggregateLink", "source", "foo", null);
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

// CompletionBlock //
{
  const block = makeValidNode("Block", [], [], []);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], block);
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
        "CompletionStatement",
        makeValidNode("PrimitiveExpression", "123"),
      ),
    ],
  ),
);

// Label //
{
  const block = makeValidNode("Block", ["label"], [], []);
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, block);
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
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
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "ReturnStatement",
        makeValidNode("PrimitiveExpression", '"return"'),
      ),
      makeValidNode(
        "CompletionStatement",
        makeValidNode("PrimitiveExpression", '"completion"'),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
  });
  makeValidNode(
    "ModuleProgram",
    [],
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "EffectStatement",
          makeValidNode(
            "ExpressionEffect",
            makeValidNode("ClosureExpression", "arrow", false, false, block),
          ),
        ),
      ],
    ),
  );
}

// AwaitExpression //
{
  const await_expression = makeValidNode(
    "AwaitExpression",
    makeValidNode("PrimitiveExpression", '"promise"'),
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("CompletionStatement", await_expression)],
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode("ExpressionEffect", await_expression),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ClosureExpression", "arrow", false, false, completion_block);
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", non_completion_block);
  });
  makeValidNode("ModuleProgram", [], non_completion_block);
  makeValidNode(
    "ScriptProgram",
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "CompletionStatement",
          makeValidNode(
            "ClosureExpression",
            "arrow",
            true,
            false,
            completion_block,
          ),
        ),
      ],
    ),
  );
}

// YieldExpression //
{
  const await_expression = makeValidNode(
    "YieldExpression",
    false,
    makeValidNode("PrimitiveExpression", "123"),
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [makeValidNode("CompletionStatement", await_expression)],
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode("ExpressionEffect", await_expression),
      ),
    ],
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
    makeValidNode("ScriptProgram", non_completion_block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], non_completion_block);
  });
  makeValidNode(
    "ScriptProgram",
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "CompletionStatement",
          makeValidNode(
            "ClosureExpression",
            "function",
            false,
            true,
            completion_block,
          ),
        ),
      ],
    ),
  );
}

// BreakStatement //
{
  const break_statement = makeValidNode("BreakStatement", "label");
  const labeled_block = makeValidNode(
    "Block",
    ["label"],
    [],
    [break_statement],
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      break_statement,
      makeValidNode(
        "CompletionStatement",
        makeValidNode("PrimitiveExpression", '"123"'),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", completion_block);
  });
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, completion_block);
  });
  makeValidNode(
    "ModuleProgram",
    [],
    makeValidNode(
      "Block",
      [],
      [],
      [makeValidNode("BlockStatement", labeled_block)],
    ),
  );
}

// RigidDeclareEnclaveStatement //
const testRigidDeclareEnclaveStatement = (kind) => {
  const declare_statement = makeValidNode(
    "DeclareEnclaveStatement",
    kind,
    "variable",
    makeValidNode("PrimitiveExpression", "123"),
  );
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      declare_statement,
      makeValidNode(
        "CompletionStatement",
        makeValidNode("PrimitiveExpression", '"completion"'),
      ),
    ],
  );
  const non_completion_block = makeValidNode(
    "Block",
    [],
    [],
    [declare_statement],
  );
  const expression = makeValidNode(
    "AwaitExpression",
    makeValidNode("PrimitiveExpression", "123"),
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
  makeValidNode("ScriptProgram", completion_block);
};
testRigidDeclareEnclaveStatement("let");
testRigidDeclareEnclaveStatement("const");

// LooseDeclareEnclaveStatement //
{
  const statement = makeValidNode(
    "DeclareEnclaveStatement",
    "var",
    "variable",
    makeValidNode("PrimitiveExpression", "123"),
  );
  const non_completion_block = makeValidNode("Block", [], [], [statement]);
  const completion_block = makeValidNode(
    "Block",
    [],
    [],
    [
      statement,
      makeValidNode(
        "CompletionStatement",
        makeValidNode("PrimitiveExpression", '"primitive"'),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, completion_block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], non_completion_block);
  });
  makeValidNode("ScriptProgram", completion_block);
  makeValidNode("EvalProgram", ["var"], [], completion_block);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], completion_block);
  });
}

// ReadExpression && WriteEffect //
const testVariable = (makeValidVariableEffect) => {
  const statement1 = makeValidNode(
    "EffectStatement",
    makeValidVariableEffect("variable"),
  );
  const statement2 = makeValidNode(
    "CompletionStatement",
    makeValidNode("PrimitiveExpression", '"completion"'),
  );
  const bound_block = makeValidNode(
    "Block",
    [],
    ["variable"],
    [statement1, statement2],
  );
  const unbound_block = makeValidNode(
    "Block",
    [],
    [],
    [statement1, statement2],
  );
  makeValidNode("ScriptProgram", bound_block);
  assertThrow(() => {
    makeValidNode("ScriptProgram", unbound_block);
  });
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
    "WriteEffect",
    variable,
    makeValidNode("PrimitiveExpression", "123"),
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
        [makeValidNode("CompletionStatement", expression2)],
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
        makeValidNode("PrimitiveExpression", "123"),
      ),
    );
  };
  testClosureEnclave(
    "super.call",
    makeValidNode(
      "CallSuperEnclaveExpression",
      makeValidNode("PrimitiveExpression", "123"),
    ),
  );
  testClosureEnclave(
    "super.get",
    makeValidNode(
      "GetSuperEnclaveExpression",
      makeValidNode("PrimitiveExpression", "123"),
    ),
  );
  testClosureEnclave(
    "super.set",
    makeValidNode(
      "SequenceExpression",
      makeValidNode(
        "SetSuperEnclaveEffect",
        makeValidNode("PrimitiveExpression", "123"),
        makeValidNode("PrimitiveExpression", "456"),
      ),
      makeValidNode("PrimitiveExpression", "789"),
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
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode("StaticImportExpression", "source"),
        ),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  makeValidNode(
    "ModuleProgram",
    [makeValidNode("ImportLink", "source")],
    block,
  );
}

// Export //
{
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode(
          "ExportEffect",
          "specifier",
          makeValidNode("PrimitiveExpression", "123"),
        ),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  makeValidNode(
    "ModuleProgram",
    [makeValidNode("ExportLink", "specifier")],
    block,
  );
}
