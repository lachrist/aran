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
makeValidNode(
  "ModuleProgram",
  [
    makeValidNode("ImportLink", "specifier", "source"),
    makeValidNode("ExportLink", "specifier"),
  ],
  makeValidNode("Block", [], [], []),
);
assertThrow(() => {
  makeValidNode(
    "ModuleProgram",
    [
      makeValidNode("ExportLink", "specifier"),
      makeValidNode("ExportLink", "specifier"),
    ],
    makeValidNode("Block", [], [], []),
  );
});

// AggregateLink //
makeValidNode("AggregateLink", null, null, "source");
makeValidNode("AggregateLink", null, "foo", "source");
assertThrow(() => {
  makeValidNode("AggregateLink", "foo", null, "source");
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

// CompletionBlock //
assertThrow(() => {
  makeValidNode("EvalProgram", [], [], makeValidNode("Block", [], [], []));
});
assertThrow(() => {
  makeValidNode(
    "EvalProgram",
    [],
    [],
    makeValidNode("Block", [], [], [makeValidNode("DebuggerStatement")]),
  );
});
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
        "ExpressionStatement",
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
        makeValidNode("PrimitiveExpression", "123"),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
  });
  makeValidNode(
    "ScriptProgram",
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "ExpressionStatement",
          makeValidNode("ClosureExpression", "arrow", false, false, block),
        ),
      ],
    ),
  );
}

// AwaitExpression //
{
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "ExpressionStatement",
        makeValidNode(
          "AwaitExpression",
          makeValidNode("PrimitiveExpression", "123"),
        ),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ClosureExpression", "arrow", false, false, block);
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
  });
  makeValidNode("ModuleProgram", [], block);
  makeValidNode(
    "ScriptProgram",
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "ExpressionStatement",
          makeValidNode("ClosureExpression", "arrow", true, false, block),
        ),
      ],
    ),
  );
}

// YieldExpression //
{
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "ExpressionStatement",
        makeValidNode(
          "YieldExpression",
          false,
          makeValidNode("PrimitiveExpression", "123"),
        ),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ClosureExpression", "function", false, false, block);
  });
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
  });
  makeValidNode(
    "ScriptProgram",
    makeValidNode(
      "Block",
      [],
      [],
      [
        makeValidNode(
          "ExpressionStatement",
          makeValidNode("ClosureExpression", "function", false, true, block),
        ),
      ],
    ),
  );
}

// BreakStatement //
{
  const statement = makeValidNode("BreakStatement", "label");
  const labeled_block = makeValidNode("Block", ["label"], [], [statement]);
  const block = makeValidNode("Block", [], [], [statement]);
  assertThrow(() => {
    makeValidNode("ScriptProgram", block);
  });
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, block);
  });
  makeValidNode(
    "ScriptProgram",
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
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "DeclareEnclaveStatement",
        kind,
        "variable",
        makeValidNode("PrimitiveExpression", "123"),
      ),
    ],
  );
  const expression = makeValidNode(
    "AwaitExpression",
    makeValidNode("PrimitiveExpression", "123"),
  );
  assertThrow(() => {
    makeValidNode("BlockStatement", block);
  });
  assertThrow(() => {
    makeValidNode("IfStatement", expression, block, block);
  });
  assertThrow(() => {
    makeValidNode("WhileStatement", expression, block);
  });
  assertThrow(() => {
    makeValidNode("TryStatement", block, block, block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], "completion", block);
  });
  makeValidNode("ScriptProgram", block);
};
testRigidDeclareEnclaveStatement("let");
testRigidDeclareEnclaveStatement("const");

// LooseDeclareEnclaveStatement //
{
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "DeclareEnclaveStatement",
        "var",
        "variable",
        makeValidNode("PrimitiveExpression", "123"),
      ),
      makeValidNode(
        "ExpressionStatement",
        makeValidNode("PrimitiveExpression", "123"),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("Closure", "arrow", false, false, block);
  });
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  makeValidNode("ScriptProgram", block);
  makeValidNode("EvalProgram", ["var"], [], block);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], block);
  });
}

// ReadExpression && WriteExpression //
const testVariable = (makeValidVariableExpression) => {
  const statement = makeValidNode(
    "ExpressionStatement",
    makeValidVariableExpression("variable"),
  );
  const bound_block = makeValidNode("Block", [], ["variable"], [statement]);
  const unbound_block = makeValidNode("Block", [], [], [statement]);
  makeValidNode("ScriptProgram", bound_block);
  assertThrow(() => {
    makeValidNode("ScriptProgram", unbound_block);
  });
  makeValidNode("EvalProgram", [], ["variable"], unbound_block);
  assertThrow(() => {
    makeValidNode("EvalProgram", [], [], unbound_block);
  });
};
testVariable((variable) => makeValidNode("ReadExpression", variable));
testVariable((variable) =>
  makeValidNode(
    "WriteExpression",
    variable,
    makeValidNode("PrimitiveExpression", "123"),
    makeValidNode("PrimitiveExpression", "456"),
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
        [makeValidNode("ExpressionStatement", expression2)],
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
    "super()",
    makeValidNode(
      "CallSuperEnclaveExpression",
      makeValidNode("PrimitiveExpression", "123"),
    ),
  );
  testClosureEnclave(
    "super",
    makeValidNode(
      "GetSuperEnclaveExpression",
      makeValidNode("PrimitiveExpression", "123"),
    ),
  );
  testClosureEnclave(
    "super",
    makeValidNode(
      "SetSuperEnclaveExpression",
      makeValidNode("PrimitiveExpression", "123"),
      makeValidNode("PrimitiveExpression", "123"),
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
        "ExpressionStatement",
        makeValidNode("LoadImportExpression", "specifier", "source"),
      ),
    ],
  );
  assertThrow(() => {
    makeValidNode("ModuleProgram", [], block);
  });
  makeValidNode(
    "ModuleProgram",
    [makeValidNode("ImportLink", "specifier", "source")],
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
        "ExpressionStatement",
        makeValidNode(
          "SaveExportExpression",
          "specifier",
          makeValidNode("PrimitiveExpression", "123"),
          makeValidNode("PrimitiveExpression", "456"),
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
