import { map } from "array-lite";
import { assertEqual, assertSuccess } from "../../__fixture__.mjs";
import { createCounter, gaugeCounter } from "../../util/index.mjs";
import {
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { makeFrameBlock, assertFrameLibrary } from "./__fixture_new__.mjs";
import * as Frame from "./observable.mjs";

const STRICT = true;
const ESCAPED = true;
const { makeFrameWriteEffectArray } = Frame;

{
  const counter = createCounter(0);
  assertFrameLibrary(Frame);
  assertSuccess(
    allignBlock(
      makeFrameBlock(Frame, {}, (frame) =>
        map(
          makeFrameWriteEffectArray(
            (_strict, _scope, _variable, _escape, _options) => [
              makeExpressionEffect(makeLiteralExpression("next")),
            ],
            STRICT,
            frame,
            "scope",
            "variable",
            ESCAPED,
            { counter },
          ),
          makeEffectStatement,
        ),
      ),
      `{ void "next"; }`,
    ),
  );
  assertEqual(gaugeCounter(counter) > 1, true);
}
