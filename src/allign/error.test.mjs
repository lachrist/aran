import {assertEqual, assertDeepEqual} from "../__fixture__.mjs";

import {
  makeRootError,
  appendErrorSegment,
  setErrorAnnotationPair,
  setErrorMessage,
  setErrorValuePair,
  getErrorLeft,
  getErrorRight,
  getErrorMessage,
} from "./error.mjs";

assertEqual(
  getErrorMessage(
    setErrorMessage(appendErrorSegment(makeRootError(), "segment"), "message"),
  ),
  "message at segment",
);

{
  const error = setErrorValuePair(
    setErrorAnnotationPair(makeRootError(), "annotation1", "annotation2"),
    "value1",
    "value2",
  );
  assertDeepEqual(getErrorLeft(error), {
    annotation: "annotation1",
    value: "value1",
  });
  assertDeepEqual(getErrorRight(error), {
    annotation: "annotation2",
    value: "value2",
  });
}
