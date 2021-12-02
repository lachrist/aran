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
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode("PrimitiveExpression", "123"),
        ),
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
  const block = makeValidNode(
    "Block",
    [],
    [],
    [
      makeValidNode(
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode(
            "AwaitExpression",
            makeValidNode("PrimitiveExpression", "123"),
          ),
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
          "EffectStatement",
          makeValidNode(
            "ExpressionEffect",
            makeValidNode("ClosureExpression", "arrow", true, false, block),
          ),
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
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode(
            "YieldExpression",
            false,
            makeValidNode("PrimitiveExpression", "123"),
          ),
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
          "EffectStatement",
          makeValidNode(
            "ExpressionEffect",
            makeValidNode("ClosureExpression", "function", false, true, block),
          ),
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
        "EffectStatement",
        makeValidNode(
          "ExpressionEffect",
          makeValidNode("PrimitiveExpression", "123"),
        ),
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

// ReadExpression && WriteEffect //
const testVariable = (makeValidVariableEffect) => {
  const statement1 = makeValidNode(
    "EffectStatement",
    makeValidVariableEffect("variable"),
  );
  const statement2 = makeValidNode(
    "EffectStatement",
    makeValidNode(
      "ExpressionEffect",
      makeValidNode("PrimitiveExpression", '"completion"'),
    ),
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
        [
          makeValidNode(
            "EffectStatement",
            makeValidNode("ExpressionEffect", expression2),
          ),
        ],
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
