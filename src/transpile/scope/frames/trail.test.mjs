import { assertDeepEqual, assertSuccess } from "../../../__fixture__.mjs";
import { makeLiteralExpression } from "../../../ast/index.mjs";
import { allignExpression } from "../../../allign/index.mjs";
import { assertFrameLibrary } from "./__fixture_new__.mjs";
import * as Frame from "./trail.mjs";

const STRICT = true;
const ESCAPED = true;
const {
  createFrame,
  declareFrame,
  makeFrameReadExpression,
  makeFrameInitializeStatementArray,
} = Frame;

assertFrameLibrary(Frame);

const frame = createFrame({ key: "program" });

assertDeepEqual(
  declareFrame(
    STRICT,
    frame,
    { program: false, distant: false },
    "kind",
    "variable",
    {},
  ),
  { program: true, distant: false },
);

assertDeepEqual(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    { program: false, distant: false },
    "kind",
    "variable",
    makeLiteralExpression("right"),
  ),
  { program: true, distant: false },
);

assertSuccess(
  allignExpression(
    makeFrameReadExpression(
      (_strict, _scope, _escaped, _variable, _options) =>
        makeLiteralExpression("next"),
      frame,
      "scope",
      ESCAPED,
      "variable",
      {},
    ),
    `"next";`,
  ),
);
