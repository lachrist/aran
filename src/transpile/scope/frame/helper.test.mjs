import { forEach } from "array-lite";

import {
  assertThrow,
  assertSuccess,
  assertEqual,
} from "../../../__fixture__.mjs";

import { createCounter, incrementCounter } from "../../../util/index.mjs";

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
  makeStaticLookupNode,
  testStatic,
  conflictStaticInternal,
  conflictStaticExternal,
  makeStaticReadExpression,
  makeStaticTypeofExpression,
  makeStaticDiscardExpression,
  makeStaticWriteEffect,
  makeDynamicLookupExpression,
  makeDynamicTestExpression,
  makeObservableDynamicTestExpression,
  makeDynamicReadExpression,
  makeDynamicTypeofExpression,
  makeDynamicDiscardExpression,
  makeDynamicLookupEffect,
  makeDynamicWriteEffect,
  makeExportStatement,
  makeExportUndefinedStatement,
  makeExportSequenceEffect,
  makeThrowDuplicateExpression,
  makeThrowMissingExpression,
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  makeThrowDiscardExpression,
} from "./helper.mjs";

const { Error, undefined } = globalThis;

////////////
// Report //
////////////

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

////////////////////////////////
// makeStaticLookupExpression //
////////////////////////////////

const STRICT = true;

const ESCAPED = true;

const next = () => {
  throw new Error("next");
};

forEach([conflictStaticInternal, conflictStaticExternal], (conflictStatic) => {
  assertEqual(
    conflictStatic(STRICT, { static: {} }, "kind", "variable"),
    undefined,
  );
  assertThrow(() =>
    conflictStatic(STRICT, { static: { variable: null } }, "kind", "variable"),
  );
});

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      testStatic,
      makeStaticReadExpression,
      () => makeLiteralExpression("next"),
      STRICT,
      ESCAPED,
      { static: {} },
      "variable",
      "options",
    ),
    "'next'",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      testStatic,
      makeStaticReadExpression,
      next,
      STRICT,
      ESCAPED,
      { static: { variable: null } },
      "variable",
      "options",
    ),
    "VARIABLE",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      testStatic,
      makeStaticTypeofExpression,
      next,
      STRICT,
      ESCAPED,
      { static: { variable: null } },
      "variable",
      "options",
    ),
    "intrinsic.aran.unary('typeof', VARIABLE)",
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      testStatic,
      makeStaticDiscardExpression,
      next,
      true,
      ESCAPED,
      { static: { variable: null } },
      "variable",
      "options",
    ),
    `intrinsic.aran.throw(
      new intrinsic.TypeError(
        "Cannot discard variable 'variable' because it is static",
      ),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeStaticLookupNode(
      testStatic,
      makeStaticDiscardExpression,
      next,
      false,
      ESCAPED,
      { static: { variable: null } },
      "variable",
      "options",
    ),
    "false",
  ),
);

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeStaticLookupNode(
        testStatic,
        makeStaticWriteEffect,
        next,
        STRICT,
        ESCAPED,
        { static: { variable: null } },
        "variable",
        { expression: makeLiteralExpression("right"), counter },
      ),
      "VARIABLE = 'right'",
    ),
  );
  assertEqual(incrementCounter(counter), 2);
}

////////////////////////////////
// makeDynamicLookupExpression //
////////////////////////////////

const OBSERVABLE = true;

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      testStatic,
      makeDynamicTestExpression,
      makeDynamicReadExpression,
      () => makeLiteralExpression("next"),
      STRICT,
      ESCAPED,
      {
        observable: OBSERVABLE,
        dynamic: makeLiteralExpression("dynamic"),
        static: {},
      },
      "variable",
      "options",
    ),
    `
      intrinsic.aran.binary('in', 'variable', 'dynamic') ?
      intrinsic.aran.get('dynamic', 'variable') :
      'next'
    `,
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      testStatic,
      makeDynamicTestExpression,
      makeDynamicReadExpression,
      next,
      STRICT,
      ESCAPED,
      {
        observable: OBSERVABLE,
        dynamic: makeLiteralExpression("dynamic"),
        static: { variable: null },
      },
      "variable",
      "options",
    ),
    "intrinsic.aran.get('dynamic', 'variable')",
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      testStatic,
      makeDynamicTestExpression,
      makeDynamicTypeofExpression,
      next,
      STRICT,
      ESCAPED,
      {
        observable: OBSERVABLE,
        dynamic: makeLiteralExpression("dynamic"),
        static: { variable: null },
      },
      "variable",
      "options",
    ),
    `intrinsic.aran.unary(
      'typeof',
      intrinsic.aran.get('dynamic', 'variable'),
    )`,
  ),
);

assertSuccess(
  allignExpression(
    makeDynamicLookupExpression(
      testStatic,
      makeDynamicTestExpression,
      makeDynamicDiscardExpression,
      next,
      true,
      ESCAPED,
      {
        observable: OBSERVABLE,
        dynamic: makeLiteralExpression("dynamic"),
        static: { variable: null },
      },
      "variable",
      "options",
    ),
    "intrinsic.aran.deleteStrict('dynamic', 'variable')",
  ),
);

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeDynamicLookupEffect(
        testStatic,
        makeObservableDynamicTestExpression,
        makeDynamicWriteEffect,
        next,
        false,
        ESCAPED,
        {
          observable: true,
          dynamic: makeLiteralExpression("dynamic"),
          static: { variable: null },
        },
        "variable",
        { expression: makeLiteralExpression("right"), counter },
      ),
      `void intrinsic.aran.setSloppy('dynamic', 'variable', 'right')`,
    ),
  );
  assertEqual(incrementCounter(counter), 2);
}

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeDynamicLookupEffect(
        testStatic,
        makeObservableDynamicTestExpression,
        makeDynamicWriteEffect,
        () => makeExpressionEffect(makeLiteralExpression("next")),
        false,
        ESCAPED,
        {
          observable: true,
          dynamic: makeLiteralExpression("dynamic"),
          static: {},
        },
        "variable",
        { expression: makeLiteralExpression("right"), counter },
      ),
      `
        intrinsic.aran.binary("in", "variable", "dynamic") ?
        void intrinsic.aran.setSloppy('dynamic', 'variable', 'right') :
        void "next"
      `,
    ),
  );
  assertEqual(incrementCounter(counter), 4);
}
