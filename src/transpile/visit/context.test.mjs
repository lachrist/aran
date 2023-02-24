import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import {
  makeLiteralExpression,
  makeBlock,
  makeDebuggerStatement,
} from "../../ast/index.mjs";
import { allignBlock, allignExpression } from "../../allign/index.mjs";
import {
  createInitialContext,
  saveContext,
  loadContext,
  visit,
  visitMany,
} from "./context.mjs";

const { undefined } = globalThis;

///////////
// Evals //
///////////

{
  const context = createInitialContext();
  assertEqual(saveContext(context, 123), undefined);
  assertDeepEqual(loadContext(context, 123), context);
}

///////////
// visit //
///////////

assertSuccess(
  allignExpression(
    visit(
      "key",
      { type: "type" },
      {
        ...createInitialContext(),
        ...{
          visitors: {
            key: {
              type: (node, _context, site) => {
                assertDeepEqual(node, { type: "type" });
                assertEqual(site, "site");
                return makeLiteralExpression("output");
              },
            },
          },
        },
      },
      "site",
    ),
    `"output"`,
  ),
);

assertSuccess(
  allignBlock(
    makeBlock(
      [],
      [],
      visitMany(
        "key",
        { type: "type" },
        {
          ...createInitialContext(),
          ...{
            visitors: {
              key: {
                type: (node, _context, site) => {
                  assertDeepEqual(node, { type: "type" });
                  assertEqual(site, "site");
                  return [makeDebuggerStatement()];
                },
              },
            },
          },
        },
        "site",
      ),
    ),
    `{ debugger; }`,
  ),
);
