import {assert} from "../../util.mjs";

const {undefined} = globalThis;

export const makeBoundedCompletion = (node, label) => ({node, label});

export const makeFreeCompletion = (node) => ({
  node,
  label: undefined,
});

export const isFreeCompletion = ({label}) => label === undefined;

export const isBoundedCompletion = ({label}) => label !== undefined;

export const generateReleaseCompletion = (label) => (completion) =>
  completion.label === label
    ? {node: completion.node, label: undefined}
    : completion;

export const generateCaptureCompletion = (label) => (completion) =>
  completion.label === undefined ? {node: completion.node, label} : completion;

export const getCompletionNode = ({node, label}) => {
  assert(
    label === undefined,
    "only node from free completion can be extracted",
  );
  return node;
};
