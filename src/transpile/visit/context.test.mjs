import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {createCounter} from "../../util/index.mjs";

import {ROOT_SCOPE} from "../scope/index.mjs";

import {
  createContext,
  saveContext,
  loadContext,
  setContextScope,
  getContextScoping,
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
  nodes = [],
  storage = {},
  counter = createCounter(0),
}) =>
  createContext({
    nodes,
    storage,
    counter,
  });

/////////////
// Storage //
/////////////

{
  const root = {nodes: [], storage: {}, counter: createCounter()};
  const context = createContext(root);
  assertEqual(saveContext(context, 123), undefined);
  assertDeepEqual(loadContext(root, 123), context);
}

///////////
// Scope //
///////////

assertDeepEqual(
  getContextScoping(
    setContextScope(
      createTestContext({counter: createCounter(123)}),
      ROOT_SCOPE,
    ),
  ),
  {
    strict: false,
    scope: ROOT_SCOPE,
    counter: createCounter(123),
  },
);

////////////
// Strict //
////////////

assertEqual(isContextStrict(createTestContext({})), false);

assertEqual(isContextStrict(strictifyContext(createTestContext({}))), true);

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
    createTestContext({}),
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
