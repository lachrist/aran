import { assertSuccess, assertEqual } from "../../../__fixture__.mjs";

import { createCounter, gaugeCounter } from "../../../util/index.mjs";

import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";

import {
  allignStatement,
  allignEffect,
  allignExpression,
} from "../../../allign/index.mjs";

import {
  makeExportStatement,
  makeExportUndefinedStatement,
  makeExportSequenceEffect,
  makeThrowDuplicateExpression,
  makeThrowDeadzoneEffect,
  makeThrowMissingExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeThrowConstantEffect,
  makeThrowDiscardExpression,
  makeTypeofImportExpression,
  makeTypeofGetExpression,
  makeTypeofReadExpression,
  makeIncrementSetEffect,
  makeIncrementWriteEffect,
  makeExportIncrementWriteEffect,
} from "./helper.mjs";

////////////////////
// Report Dynamic //
////////////////////

assertSuccess(
  allignExpression(
    makeThrowDuplicateExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.SyntaxError(
        "Variable 'variable' has already been declared",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowMissingExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Variable 'variable' is not defined",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDeadzoneExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Cannot access variable 'variable' before initialization",
      ),
    )`,
  ),
);

assertSuccess(
  allignEffect(
    makeThrowDeadzoneEffect("variable"),
    `void intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Cannot access variable 'variable' before initialization",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDiscardExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot discard variable 'variable' because it is static",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowConstantExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot assign variable 'variable' because it is constant",
      ),
    )`,
  ),
);

assertSuccess(
  allignEffect(
    makeThrowConstantEffect("variable"),
    `void intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot assign variable 'variable' because it is constant",
      ),
    )`,
  ),
);

////////////
// Export //
////////////

assertSuccess(
  allignStatement(
    makeExportStatement("specifier", makeLiteralExpression(123)),
    `specifier << 123;`,
  ),
);

assertSuccess(
  allignStatement(
    makeExportUndefinedStatement("specifier"),
    `specifier << undefined;`,
  ),
);

assertSuccess(
  allignEffect(
    makeExportSequenceEffect(
      makeExpressionEffect(makeLiteralExpression(123)),
      "specifier",
      makeLiteralExpression(456),
    ),
    `(void 123, specifier << 456)`,
  ),
);

///////////////////
// Lookup Static //
///////////////////

assertSuccess(
  allignExpression(
    makeTypeofReadExpression("variable"),
    `intrinsic.aran.unary("typeof", variable)`,
  ),
);

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeIncrementWriteEffect("variable", {
        counter,
        expression: makeLiteralExpression(456),
      }),
      `variable = 456`,
    ),
  );
  assertEqual(gaugeCounter(counter), 1);
}

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeExportIncrementWriteEffect("variable", ["specifier1", "specifier2"], {
        counter,
        expression: makeLiteralExpression("right"),
      }),
      `
        (
          (
            variable = "right",
            specifier1 << variable
          ),
          specifier2 << variable
        )
      `,
    ),
  );
  assertEqual(gaugeCounter(counter), 1);
}

assertSuccess(
  allignExpression(
    makeTypeofImportExpression("source", "specifier"),
    `intrinsic.aran.unary("typeof", "source" >> specifier)`,
  ),
);

////////////////////
// Lookup Dynamic //
////////////////////

assertSuccess(
  allignExpression(
    makeTypeofGetExpression(
      makeLiteralExpression(123),
      makeLiteralExpression(456),
    ),
    `intrinsic.aran.unary("typeof", intrinsic.aran.get(123, 456))`,
  ),
);

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeIncrementSetEffect(
        true,
        makeLiteralExpression(123),
        makeLiteralExpression(456),
        { counter, expression: makeLiteralExpression(789) },
      ),
      `void intrinsic.aran.setStrict(123, 456, 789)`,
    ),
  );
  assertEqual(gaugeCounter(counter), 1);
}
