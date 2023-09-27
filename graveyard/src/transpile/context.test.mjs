import { forEach } from "array-lite";
import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../__fixture__.mjs";
import { makeExpressionEffect, makeLiteralExpression } from "../ast/index.mjs";
import {
  allignExpression,
  allignEffect,
  allignStatement,
} from "../allign/index.mjs";
import {
  createInitialContext,
  saveContext,
  loadContext,
  visit,
  liftEffect,
  serializeLocation,
} from "./context.mjs";

const { undefined } = globalThis;

///////////////////////
// serializeLocation //
///////////////////////

assertThrow(
  () =>
    serializeLocation({
      type: "Type",
      loc: { start: { line: 123, column: {} } },
    }),
  /^SyntaxAranError: loc\.start\.column should be a number in node \{ type:"Type", loc:\{ start:\{ line:123, column:<object> \} \} \}$/u,
);

assertEqual(
  serializeLocation({
    type: "Type",
  }),
  null,
);

assertEqual(
  serializeLocation({
    type: "Type",
    loc: null,
  }),
  null,
);

assertEqual(
  serializeLocation({
    type: "Type",
    loc: {
      start: { line: 123, column: 456 },
    },
  }),
  "123:456",
);

assertEqual(
  serializeLocation({
    type: "Type",
    loc: {
      filename: null,
      start: { line: 123, column: 456 },
    },
  }),
  "123:456",
);

assertEqual(
  serializeLocation({
    type: "Type",
    loc: {
      filename: "filename",
      start: { line: 123, column: 456 },
    },
  }),
  "filename:123:456",
);

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

forEach(["type", "__DEFAULT__"], (key) => {
  assertSuccess(
    allignExpression(
      visit(
        { type: "type" },
        {
          ...createInitialContext(),
          ...{
            visitors: {
              site: {
                __ANNOTATE__: (nodes, _serial) => nodes,
                [key]: (node, _context, site) => {
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
});
