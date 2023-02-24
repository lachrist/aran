import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeExpressionEffect,
  makeEffectStatement,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { visit } from "./context.mjs";
import { testBlock } from "./__fixture__.mjs";
import PropertyVisitor from "./property.mjs";

const testProperty = (input, output, computed) =>
  testBlock(
    "root",
    input,
    "body/0/expression",
    {
      visitors: {
        root: {
          [DEFAULT_CLAUSE]: (node, context1, site) =>
            makeScopeTestBlock(context1, (context2) => [
              makeEffectStatement(
                makeExpressionEffect(visit("property", node, context2, site)),
              ),
            ]),
        },
        property: PropertyVisitor,
        expression: {
          ThisExpression: (_node, _context, _site) =>
            makeLiteralExpression("this"),
        },
      },
    },
    { computed },
    output,
  );

testProperty(`"key";`, `{ void "key"; }`, false);
testProperty(`"key";`, `{ void "key"; }`, true);

testProperty(`key;`, `{ void "key"; }`, false);
testProperty(`key;`, `{ void [key]; }`, true);

testProperty(`this;`, `{ void "this"; }`, true);
