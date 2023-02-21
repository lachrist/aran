import { concat, filter } from "array-lite";
import { assertDeepEqual, assertEqual } from "../../../__fixture__.mjs";
import { partialx__ } from "../../../util/index.mjs";

import { makeBlock, makeScriptProgram } from "../../../ast/index.mjs";

const {
  Reflect: { apply, ownKeys },
  Array: {
    prototype: { sort },
  },
} = globalThis;

const isString = (any) => typeof any === "string";

const arities = {
  createFrame: 1,
  harvestFramePrelude: 1,
  harvestFrameHeader: 1,
  declareFrame: 6,
  makeFrameInitializeStatementArray: 6,
  lookupFrameAll: 3,
  makeFrameReadExpression: 7,
  makeFrameTypeofExpression: 7,
  makeFrameDiscardExpression: 7,
  makeFrameWriteEffect: 7,
};

const names = apply(sort, ownKeys(arities), []);
const { length } = names;

export const assertFrameLibrary = (Frame) => {
  assertDeepEqual(apply(sort, filter(ownKeys(Frame), isString), []), names);
  for (let index = 0; index < length; index += 1) {
    const name = names[index];
    assertEqual(typeof Frame[name], "function", name);
    assertEqual(Frame[name].length, arities[name], name);
  }
};

const compileMakeFrameNode =
  (makeNode) =>
  (
    { createFrame, harvestFrameHeader, harvestFramePrelude },
    options,
    makeStatementArray,
  ) => {
    const frame = createFrame(options);
    const statements = makeStatementArray(frame);
    return makeNode(
      harvestFrameHeader(frame),
      concat(harvestFramePrelude(frame), statements),
    );
  };

export const makeFrameBlock = compileMakeFrameNode(partialx__(makeBlock, []));

export const makeFrameScript = compileMakeFrameNode(makeScriptProgram);
