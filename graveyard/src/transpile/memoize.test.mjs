import { createCounter, reduceReverse } from "../util/index.mjs";
import {
  makeSequenceExpression,
  makeLiteralExpression,
  makeEffectStatement,
  makeExpressionEffect,
} from "../ast/index.mjs";
import { allignBlock } from "../allign/index.mjs";
import { makeScopeTestBlock, ROOT_SCOPE } from "./scope/index.mjs";
import { memoize, memoizeSelf } from "./memoize.mjs";

const toMemoExpression = ({ setup: effects, pure: expression }) =>
  reduceReverse(effects, makeSequenceExpression, expression);

allignBlock(
  makeScopeTestBlock(
    { strict: false, scope: ROOT_SCOPE, counter: createCounter(0) },
    (context) => [
      makeEffectStatement(
        makeExpressionEffect(
          toMemoExpression(
            memoize(context, "memo", makeLiteralExpression("value")),
          ),
        ),
      ),
    ],
  ),
  `
    {
      let memo;
      void (memo = "value", memo);
    }
  `,
);

allignBlock(
  makeScopeTestBlock(
    { strict: false, scope: ROOT_SCOPE, counter: createCounter(0) },
    (context) => [
      makeEffectStatement(
        makeExpressionEffect(
          toMemoExpression(memoizeSelf(context, "memo", (pure) => pure)),
        ),
      ),
    ],
  ),
  `
    {
      let memo;
      void (memo = memo, memo);
    }
  `,
);
