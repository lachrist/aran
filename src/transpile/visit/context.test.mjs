import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {
  createRootContext,
  setContextEvalScope,
  getContextCounter,
  setContextScope,
  getContextScope,
  strictifyContext,
  isContextStrict,
  getContextSubfield,
  applyVisitor,
  visit0,
  visit1,
  visit2,
} from "./context.mjs";

const {undefined} = globalThis;

const createTestContext = ({
  scope = "scope",
  nodes = [],
  evals = {},
  counter = createCounter(0),
}) =>
  createRootContext(scope, {
    nodes,
    evals,
    counter,
  });

//////////
// Eval //
//////////

{
  const evals = {};
  assertEqual(
    setContextEvalScope(createTestContext({evals}), 123, "eval-scope"),
    undefined,
  );
  assertDeepEqual(evals, {123: "eval-scope"});
}

///////////
// Scope //
///////////

assertEqual(getContextScope(createTestContext({scope: "scope"})), "scope");

assertEqual(
  getContextScope(
    setContextScope(createTestContext({scope: "scope"}), "SCOPE"),
  ),
  "SCOPE",
);

////////////
// Strict //
////////////

assertEqual(isContextStrict(createTestContext({})), false);

assertEqual(isContextStrict(strictifyContext(createTestContext({}))), true);

/////////////
// Counter //
/////////////

{
  const counter = createCounter(0);
  assertEqual(getContextCounter(createTestContext({counter})), counter);
}

//////////////////
// applyVisitor //
//////////////////

assertEqual(
  applyVisitor(
    {
      type: (node, serial, _context) => {
        assertDeepEqual(node, {type: "type"});
        assertEqual(serial, 123);
        return "result";
      },
    },
    {type: "type"},
    123,
    createRootContext({}),
  ),
  "result",
);

////////////
// visit0 //
////////////

{
  const nodes = [];
  assertEqual(
    visit0(
      (node, serial, _context) => {
        assertEqual(node, "node");
        assertEqual(serial, 0);
        return "result";
      },
      "node",
      createTestContext({nodes}),
    ),
    "result",
  );
  assertDeepEqual(nodes, ["node"]);
}

{
  const nodes = [];
  assertEqual(
    visit1(
      (node, serial, context) => {
        assertEqual(node, "node");
        assertEqual(serial, 0);
        assertEqual(getContextSubfield(context, "type", "key"), "value");
        return "result";
      },
      "node",
      createTestContext({nodes}),
      "type",
      "key",
      "value",
    ),
    "result",
  );
  assertDeepEqual(nodes, ["node"]);
}

{
  const nodes = [];
  assertEqual(
    visit2(
      (node, serial, context) => {
        assertEqual(node, "node");
        assertEqual(serial, 0);
        assertEqual(getContextSubfield(context, "type", "key1"), "value1");
        assertEqual(getContextSubfield(context, "type", "key2"), "value2");
        return "result";
      },
      "node",
      createTestContext({nodes}),
      "type",
      "key1",
      "value1",
      "key2",
      "value2",
    ),
    "result",
  );
  assertDeepEqual(nodes, ["node"]);
}
