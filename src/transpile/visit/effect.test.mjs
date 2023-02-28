import { map } from "array-lite";
import { assertEqual } from "../../__fixture__.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { visitMany } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import EffectVisitor from "./effect.mjs";

const test = (input, output) => {
  testBlock(
    "Root",
    input,
    "body/0/expression",
    {
      visitors: {
        Root: {
          [DEFAULT_CLAUSE]: (node, context1, site) =>
            makeScopeTestBlock({ ...context1, strict: true }, (context2) =>
              map(
                visitMany("Effect", node, context2, site),
                makeEffectStatement,
              ),
            ),
        },
        Expression: {
          AssignmentExpression: (node, _context, site) =>
            makeLiteralExpression(`${node.left.type}|${site.name}`),
          Literal: (node, _context, site) =>
            makeLiteralExpression(`${node.value}|${site.name}`),
        },
        Pattern: {
          ArrayPattern: (_node, _context, site) => {
            assertEqual(site.kind, null);
            return [makeExpressionEffect(site.right)];
          },
        },
        ...EffectVisitor,
      },
    },
    null,
    output,
  );
};

test(`123;`, `{ void "123|null"; }`);

test(`(123)[456] = 789;`, `{ void "MemberExpression|null"; }`);

test(`x = 123;`, `{ [x] = "123|x"; }`);

test(`x **= 123;`, `{ [x] = intrinsic.aran.binary("**", [x], "123|null"); }`);

test(`[x] = 123`, `{ void "123|null"; }`);
