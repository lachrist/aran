import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  allignExpression,
  allignEffect,
  allignStatement,
} from "../../allign/index.mjs";
import {
  annotateNodeArray,
  createInitialContext,
  saveContext,
  loadContext,
  visit,
  liftEffect,
} from "./context.mjs";

const { undefined } = globalThis;

////////////////
// liftEffect //
////////////////

allignEffect(
  liftEffect(null, makeExpressionEffect(makeLiteralExpression(123))),
  `void 123`,
);

allignStatement(
  liftEffect("var", makeExpressionEffect(makeLiteralExpression(123))),
  `void 123;`,
);

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
