import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";

import { createCounter } from "../../util/index.mjs";

import { ROOT_SCOPE } from "../scope/index.mjs";

import {
  createContext,
  saveContext,
  loadContext,
  setContextScope,
  getContextScoping,
  strictifyContext,
  isContextStrict,
  serializeContextNode,
} from "./context.mjs";

const { undefined } = globalThis;

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
  const root = { nodes: [], storage: {}, counter: createCounter() };
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
      createTestContext({ counter: createCounter(123) }),
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

//////////////////////////
// serializeContextNode //
//////////////////////////

{
  const nodes = [];
  assertEqual(
    serializeContextNode(createTestContext({ nodes }), { type: "type" }),
    0,
  );
  assertDeepEqual(nodes, [{ type: "type" }]);
}
