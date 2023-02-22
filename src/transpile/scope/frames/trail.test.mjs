import { assertDeepEqual } from "../../../__fixture__.mjs";
import { makeLiteralExpression } from "../../../ast/index.mjs";
import { assertFrameLibrary } from "./__fixture_new__.mjs";
import * as Frame from "./trail.mjs";

const STRICT = true;
const { createFrame, declareFrame, makeFrameInitializeStatementArray } = Frame;

assertFrameLibrary(Frame);

const frame = createFrame({ key: "key" });

assertDeepEqual(declareFrame(STRICT, frame, {}, "kind", "variable", {}), {
  key: null,
});

assertDeepEqual(
  makeFrameInitializeStatementArray(
    STRICT,
    frame,
    {},
    "kind",
    "variable",
    makeLiteralExpression("right"),
  ),
  { key: null },
);
