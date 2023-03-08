import { map } from "array-lite";
import { assertSuccess, assertEqual } from "../../../__fixture__.mjs";
import { createCounter, gaugeCounter } from "../../../util/index.mjs";
import {
  makeBlock,
  makeEffectStatement,
  makeLiteralExpression,
} from "../../../ast/index.mjs";
import {
  allignStatement,
  allignEffect,
  allignExpression,
  allignBlock,
} from "../../../allign/index.mjs";
import {
  makeConditionalEffectArray,
  makeExportStatement,
  makeExportUndefinedStatement,
  makeThrowDuplicateExpression,
  makeThrowDeadzoneEffectArray,
  makeThrowMissingExpression,
  makeThrowMissingEffectArray,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeThrowConstantEffectArray,
  makeThrowDiscardExpression,
  makeTypeofImportExpression,
  makeTypeofGetExpression,
  makeTypeofReadExpression,
  makeIncrementSetEffectArray,
  makeIncrementWriteEffectArray,
  makeExportIncrementWriteEffectArray,
  makeEmptyFrameLookupNode,
} from "./__common__.mjs";

const takeSingleton = (array) => {
  assertEqual(array.length, 1);
  return array[0];
};

assertSuccess(
  allignEffect(
    takeSingleton(
      makeConditionalEffectArray(makeLiteralExpression(123), [], []),
    ),
    `123 ? undefined : undefined`,
  ),
);

////////////////////
// Report Dynamic //
////////////////////

assertSuccess(
  allignExpression(
    makeThrowDuplicateExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.SyntaxError(
        "Variable \\"variable\\" has already been declared",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowMissingExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Variable \\"variable\\" is not defined",
      ),
    )`,
  ),
);

assertSuccess(
  allignEffect(
    takeSingleton(makeThrowMissingEffectArray("variable")),
    `void intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Variable \\"variable\\" is not defined",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDeadzoneExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Cannot access variable \\"variable\\" before initialization",
      ),
    )`,
  ),
);

assertSuccess(
  allignEffect(
    takeSingleton(makeThrowDeadzoneEffectArray("variable")),
    `void intrinsic.aran.throw(
      new intrinsic.ReferenceError(
        "Cannot access variable \\"variable\\" before initialization",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowDiscardExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot discard variable \\"variable\\" because it is static",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeThrowConstantExpression("variable"),
    `intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot assign variable \\"variable\\" because it is constant",
      ),
    )`,
  ),
);

assertSuccess(
  allignEffect(
    takeSingleton(makeThrowConstantEffectArray("variable")),
    `void intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot assign variable \\"variable\\" because it is constant",
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
      takeSingleton(
        makeIncrementWriteEffectArray("variable", {
          counter,
          expression: makeLiteralExpression(456),
        }),
      ),
      `variable = 456`,
    ),
  );
  assertEqual(gaugeCounter(counter), 1);
}

{
  const counter = createCounter(0);
  assertSuccess(
    allignBlock(
      makeBlock(
        [],
        [],
        map(
          makeExportIncrementWriteEffectArray(
            "variable",
            ["specifier1", "specifier2"],
            {
              counter,
              expression: makeLiteralExpression("right"),
            },
          ),
          makeEffectStatement,
        ),
      ),
      `
        {
          variable = "right";
          specifier1 << variable;
          specifier2 << variable;
        }
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
      takeSingleton(
        makeIncrementSetEffectArray(
          true,
          makeLiteralExpression(123),
          makeLiteralExpression(456),
          { counter, expression: makeLiteralExpression(789) },
        ),
        makeEffectStatement,
      ),
      `void intrinsic.aran.setStrict(123, 456, 789);`,
    ),
  );
  assertEqual(gaugeCounter(counter), 1);
}

/////////////
// Default //
/////////////

assertSuccess(
  allignExpression(
    makeEmptyFrameLookupNode(
      (strict, scope, escaped, variable, options) => {
        assertEqual(strict, true);
        assertEqual(scope, "scope");
        assertEqual(escaped, false);
        assertEqual(variable, "variable");
        assertEqual(options, "options");
        return makeLiteralExpression("next");
      },
      true,
      "frame",
      "scope",
      false,
      "variable",
      "options",
    ),
    `"next"`,
  ),
);
