import { assertDeepEqual } from "../../__fixture__.mjs";

import { VALUED, UNVALUED } from "./valuation.mjs";

import { makeFreeCompletion, makeBoundedCompletion } from "./completion.mjs";

import {
  makeResult,
  generateReleaseResult,
  prefaceResult,
  chainResult,
  getFirstResultValuation,
} from "./result.mjs";

const node1 = { type: "DebbuggerStatement" };

const node2 = { type: "EmptyStatement" };

///////////////////////////
// generateReleaseResult //
///////////////////////////

assertDeepEqual(
  generateReleaseResult("label")(
    makeResult("label", [makeBoundedCompletion(node1, "label")]),
  ),
  makeResult(UNVALUED, [makeFreeCompletion(node1)]),
);

assertDeepEqual(
  generateReleaseResult("label1")(
    makeResult(VALUED, [makeBoundedCompletion(node1, "label2")]),
  ),
  makeResult(VALUED, [makeBoundedCompletion(node1, "label2")]),
);

///////////////////
// prefaceResult //
///////////////////

assertDeepEqual(
  prefaceResult(makeResult(VALUED, [makeFreeCompletion(node2)]), node1),
  [makeFreeCompletion(node2)],
);

assertDeepEqual(
  prefaceResult(makeResult(UNVALUED, [makeFreeCompletion(node2)]), node1),
  [makeFreeCompletion(node1), makeFreeCompletion(node2)],
);

assertDeepEqual(
  prefaceResult(makeResult("label", [makeFreeCompletion(node2)]), node1),
  [makeBoundedCompletion(node1, "label"), makeFreeCompletion(node2)],
);

/////////////////
// chainResult //
/////////////////

assertDeepEqual(
  chainResult(
    makeResult("noop", [
      makeBoundedCompletion("label", node1),
      makeFreeCompletion(node2),
    ]),
    UNVALUED,
  ),
  [makeBoundedCompletion("label", node1), makeFreeCompletion(node2)],
);

assertDeepEqual(
  chainResult(
    makeResult("noop", [
      makeBoundedCompletion("label", node1),
      makeFreeCompletion(node2),
    ]),
    VALUED,
  ),
  [makeBoundedCompletion("label", node1)],
);

assertDeepEqual(
  chainResult(
    makeResult("noop", [
      makeBoundedCompletion(node1, "label1"),
      makeFreeCompletion(node2),
    ]),
    "label2",
  ),
  [
    makeBoundedCompletion(node1, "label1"),
    makeBoundedCompletion(node2, "label2"),
  ],
);

/////////////////////////////
// getFirstResultValuation //
/////////////////////////////

assertDeepEqual(getFirstResultValuation([], 0), UNVALUED);

assertDeepEqual(
  getFirstResultValuation([makeResult(UNVALUED, node1)], 0),
  UNVALUED,
);

assertDeepEqual(
  getFirstResultValuation([makeResult(VALUED, node1)], 0),
  VALUED,
);

assertDeepEqual(
  getFirstResultValuation([makeResult("label", node1)], 0),
  "label",
);
