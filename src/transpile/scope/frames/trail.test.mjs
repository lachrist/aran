import { assertDeepEqual } from "../../../__fixture__.mjs";
import { makeLiteralExpression } from "../../../ast/index.mjs";
import { assertFrameLibrary } from "./__fixture_new__.mjs";
import * as Frame from "./trail.mjs";

const STRICT = true;
const { createFrame, declareFrame, makeFrameInitializeStatementArray } = Frame;

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
