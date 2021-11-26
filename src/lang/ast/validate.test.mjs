import {assertThrow} from "../../__fixture__.mjs";
import {generateMakeNodeSlow} from "./accessor.mjs";
import {validateNode} from "./validate.mjs";

const makeValidNode = (...args) => validateNode(makeNode(...args));

// Duplicate Variables //
makeValidNode("Block", ["foo", "bar", "qux"], []));
assertThrow(() => makeValidNode(makeNode("Block", ["foo", "bar", "qux", "bar"], [])));

// AwaitExpression //
{
  const block = makeValidNode(
    "Block",
    [],
    [
      makeValidNode(
        "ExpressionStatement",
        makeValidNode(
          "AwaitExpression",
          makeValidNode(
            "PrimitiveExpression",
            "123",
          ),
        ),
      ),
    ],
  );
  makeValidNode(
    "ScriptProgram",
    makeBlock(

      makeNode("Closure", "arrow", true, false, block));
  assertThrow(
    () => makeValidNode(makeNode("Closure", "arrow", false, false, block)),
  )
}

// YieldExpression //
{
  const block = makeValidNode(
    "Block",
    [],
    [
      makeValidNode(
        "ExpressionStatement",
        makeValidNode(
          "AwaitExpression",
          makeValidNode(
            "PrimitiveExpression",
            "123",
          ),
        ),
      ),
    ],
  );
  makeValidNode(makeNode("Closure", "arrow", true, false, block));
  assertThrow(
    () => makeValidNode(makeNode("Closure", "arrow", false, false, block)),
  )
}
