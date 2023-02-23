import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import { createCounter } from "../../util/index.mjs";
import { makeLiteralExpression } from "../../ast/index.mjs";
import { allignExpression } from "../../allign/index.mjs";
import { ROOT_SCOPE } from "../scope/index.mjs";
import {
  createContext,
  saveContext,
  loadContext,
  setContextScope,
  getContextScope,
  strictifyContext,
  isContextStrict,
  visit,
  visitMultiple,
} from "./context.mjs";

const { undefined } = globalThis;

const createDefaultRoot = () => ({
  nodes: [],
  evals: {},
  counter: createCounter(0),
});

///////////
// Evals //
///////////

{
  const root = createDefaultRoot();
  const context = createContext({}, root);
  assertEqual(saveContext(context, 123), undefined);
  assertDeepEqual(loadContext(123, root, {}), context);
}

///////////
// Scope //
///////////

assertDeepEqual(
  getContextScope(
    setContextScope(
      createContext(
        {},
        {
          ...createDefaultRoot(),
          counter: createCounter(123),
        },
      ),
      ROOT_SCOPE,
    ),
  ),
  ROOT_SCOPE,
);

////////////
// Strict //
////////////

{
  const context = createContext({}, createDefaultRoot());
  assertEqual(isContextStrict(context), false);
  assertEqual(isContextStrict(strictifyContext(context)), true);
}

///////////
// visit //
///////////

assertSuccess(
  allignExpression(
    visit(
      "key",
      { type: "type" },
      createContext(
        {
          key: {
            type: (node, _context, site) => {
              assertDeepEqual(node, { type: "type" });
              assertEqual(site, "site");
              return makeLiteralExpression("output");
            },
          },
        },
        createDefaultRoot(),
      ),
      "site",
    ),
    `"output"`,
  ),
);

assertSuccess(
  allignExpression(
    visitMultiple(
      "key",
      { type: "type" },
      createContext(
        {
          key: {
            type: (node, _context, site) => {
              assertDeepEqual(node, { type: "type" });
              assertEqual(site, "site");
              return [makeLiteralExpression("output")];
            },
          },
        },
        createDefaultRoot(),
      ),
      "site",
    )[0],
    `"output"`,
  ),
);
