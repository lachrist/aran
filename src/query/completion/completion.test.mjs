import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  isFreeCompletion,
  isBoundedCompletion,
  makeFreeCompletion,
  makeBoundedCompletion,
  generateReleaseCompletion,
  generateCaptureCompletion,
  getCompletionNode,
} from "./completion.mjs";

const node = { type: "DebuggerStatement" };

assertEqual(isFreeCompletion(makeFreeCompletion(node)), true);

assertEqual(isBoundedCompletion(makeBoundedCompletion(node, "label")), true);

assertDeepEqual(
  generateReleaseCompletion("label")(makeBoundedCompletion(node, "label")),
  makeFreeCompletion(node),
);

assertDeepEqual(
  generateReleaseCompletion("label1")(makeBoundedCompletion(node, "label2")),
  makeBoundedCompletion(node, "label2"),
);

assertDeepEqual(
  generateCaptureCompletion("label")(makeFreeCompletion(node)),
  makeBoundedCompletion(node, "label"),
);

assertDeepEqual(
  generateCaptureCompletion("label1")(makeBoundedCompletion(node, "label2")),
  makeBoundedCompletion(node, "label2"),
);

assertDeepEqual(getCompletionNode(makeFreeCompletion(node)), node);
