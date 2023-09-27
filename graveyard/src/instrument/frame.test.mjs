import { assertEqual, assertSuccess } from "../__fixture__.mjs";
import { makeLiteralExpression } from "../ast/index.mjs";
import { allignEffect, allignExpression } from "../allign/index.mjs";
import {
  makeExternalFrame,
  makeInternalFrame,
  hasFrame,
  getFrame,
  makeFrameReadExpression,
  makeFrameWriteEffect,
} from "./frame.mjs";

assertEqual(hasFrame(makeInternalFrame([["variable", 123]]), "variable"), true);

assertEqual(hasFrame(makeInternalFrame([["variable", 123]]), "other"), false);

assertEqual(getFrame(makeInternalFrame([["variable", 123]]), "variable"), 123);

// makeFrameReadExpression //

assertSuccess(
  allignExpression(
    makeFrameReadExpression(makeInternalFrame([["variable", 123]]), "variable"),
    `variable`,
  ),
);

assertSuccess(
  allignExpression(
    makeFrameReadExpression(
      makeExternalFrame([["variable", 123]], "prefix_"),
      "variable",
    ),
    `[prefix_variable]`,
  ),
);

// makeFrameWriteEffect //

assertSuccess(
  allignEffect(
    makeFrameWriteEffect(
      makeInternalFrame([["variable", 123]]),
      "variable",
      makeLiteralExpression(123),
    ),
    `variable = 123`,
  ),
);

assertSuccess(
  allignEffect(
    makeFrameWriteEffect(
      makeExternalFrame([["variable", 123]], "prefix_"),
      "variable",
      makeLiteralExpression(123),
    ),
    `[prefix_variable] = 123`,
  ),
);
