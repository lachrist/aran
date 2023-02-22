import { flatMap } from "array-lite";
import {
  assertEqual,
  assertDeepEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import { createCounter, partial_xx } from "../../util/index.mjs";
import {
  makeBlock,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { ROOT_SCOPE } from "../scope/index.mjs";
import {
  createContext,
  saveContext,
  loadContext,
  setContextScope,
  getContextScoping,
  strictifyContext,
  isContextStrict,
  visitBlock,
  visitStatement,
  visitExpression,
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
  const context = createContext(root, {});
  assertEqual(saveContext(context, 123), undefined);
  assertDeepEqual(loadContext(123, root, {}), context);
}

///////////
// Scope //
///////////

assertDeepEqual(
  getContextScoping(
    setContextScope(
      createContext(
        {
          ...createDefaultRoot(),
          counter: createCounter(123),
        },
        {},
      ),
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

{
  const context = createContext(createDefaultRoot(), {});
  assertEqual(isContextStrict(context), false);
  assertEqual(isContextStrict(strictifyContext(context)), true);
}

///////////
// visit //
///////////

assertSuccess(
  allignBlock(
    visitBlock(
      {
        type: "BlockStatement",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value: 123,
            },
          },
        ],
      },
      createContext(createDefaultRoot(), {
        Block: {
          BlockStatement: (node, context, specific) =>
            makeBlock(
              [],
              [],
              flatMap(node.body, partial_xx(visitStatement, context, specific)),
            ),
        },
        Statement: {
          ExpressionStatement: (node, context, specific) => [
            makeEffectStatement(
              makeExpressionEffect(
                visitExpression(node.expression, context, specific),
              ),
            ),
          ],
        },
        Expression: {
          Literal: (node, _context, _specific) =>
            makeLiteralExpression(node.value),
        },
      }),
    ),
    `{ void 123; }`,
  ),
);
