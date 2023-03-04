import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import { makeLiteralExpression } from "../../ast/index.mjs";
import { allignExpression } from "../../allign/index.mjs";
import {
  annotateNodeArray,
  createInitialContext,
  saveContext,
  loadContext,
  visit,
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
      { type: "type" },
      {
        ...createInitialContext(),
        ...{
          visitors: {
            site: {
              __ANNOTATE__: annotateNodeArray,
              type: (node, _context, site) => {
                assertDeepEqual(node, { type: "type" });
                assertDeepEqual(site, { type: "site" });
                return [makeLiteralExpression("output")];
              },
            },
          },
        },
      },
      { type: "site" },
    )[0],
    `"output"`,
  ),
);
