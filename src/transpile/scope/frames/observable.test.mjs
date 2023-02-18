import { assertEqual, assertSuccess } from "../../../__fixture__.mjs";
import { createCounter, gaugeCounter } from "../../../util/index.mjs";
import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../../ast/index.mjs";
import { allignEffect, allignExpression } from "../../../allign/index.mjs";
import { assertFrameLibrary } from "./__fixture_new__.mjs";
import * as Frame from "./observable.mjs";

const STRICT = true;
const ESCAPED = true;
const { createFrame, makeFrameReadExpression, makeFrameWriteEffect } = Frame;

assertFrameLibrary(Frame);

assertSuccess(
  allignExpression(
    makeFrameReadExpression(
      (_strict, _scope, _variable, _escape, _options) =>
        makeLiteralExpression("next"),
      STRICT,
      createFrame({}),
      "scope",
      "variable",
      ESCAPED,
      "options",
    ),
    `"next"`,
  ),
);

{
  const counter = createCounter(0);
  assertSuccess(
    allignEffect(
      makeFrameWriteEffect(
        (_strict, _scope, _variable, _escape, _options) =>
          makeExpressionEffect(makeLiteralExpression("next")),
        STRICT,
        createFrame({}),
        "scope",
        "variable",
        ESCAPED,
        { counter },
      ),
      `void "next"`,
    ),
  );
  assertEqual(gaugeCounter(counter) > 1, true);
}
