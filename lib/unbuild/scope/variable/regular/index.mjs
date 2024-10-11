import { findTree, map } from "../../../../util/index.mjs";
import {
  flatSequence,
  liftSequence_X,
  liftSequenceX,
} from "../../../../sequence.mjs";
import {
  initializeBinding,
  listBindingLateDeclareEffect,
  listBindingWriteEffect,
  listBindingWriteSloppyFunctionEffect,
  makeBindingDiscardExpression,
  makeBindingReadAmbientThisExpression,
  makeBindingReadExpression,
  setupBinding,
} from "./binding.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";

/**
 * @type {(
 *   bindings: import("../../../../util/tree").Tree<import(".").Binding>,
 * ) => import(".").RegularFrame}
 */
const makeRegularFrame = (bindings) => ({
  type: "regular",
  bindings,
});

/**
 * @type {import("../../api").Setup<
 *   import(".").RawRegularFrame,
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = (hash, meta, { bindings, links }) =>
  liftSequenceX(
    makeRegularFrame,
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding, links),
      ),
    ),
  );

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => (
 *   binding: import(".").Binding,
 * ) => boolean}
 */
const compileMatch =
  (variable1) =>
  ({ variable: variable2 }) =>
    variable1 === variable2;

/**
 * @type {<
 *   O extends { variable: import("estree-sentry").VariableName },
 *   X,
 * >(
 *   perform: (
 *     hash: import("../../../../hash").Hash,
 *     meta: import("../../../meta").Meta,
 *     binding: import(".").Binding,
 *     operation: O,
 *   ) => null | X,
 * ) => (
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   frame: import(".").RegularFrame,
 *   operation: O,
 * ) => null | X}
 */
const compileRegularOperation =
  (perform) =>
  (hash, meta, { bindings }, operation) => {
    const binding = findTree(bindings, compileMatch(operation.variable));
    return binding === null ? null : perform(hash, meta, binding, operation);
  };

export const makeRegularReadExpression = compileRegularOperation(
  makeBindingReadExpression,
);

export const makeRegularTypeofExpression = compileRegularOperation(
  makeBindingReadExpression,
);

export const makeRegularDiscardExpression = compileRegularOperation(
  makeBindingDiscardExpression,
);

export const listRegularLateDeclareEffect = compileRegularOperation(
  listBindingLateDeclareEffect,
);

export const makeRegularReadAmbientThisExpression = compileRegularOperation(
  makeBindingReadAmbientThisExpression,
);

export const listRegularWriteEffect = compileRegularOperation(
  listBindingWriteEffect,
);

/**
 * @type {<X>(
 *   frame: import(".").RegularFrame,
 *   pair: [
 *     X,
 *     import(".").Binding,
 *   ],
 * ) => [
 *   X,
 *   import(".").RegularFrame
 * ]}
 */
const rebind = ({ bindings }, { 0: value, 1: state }) => [
  value,
  {
    type: "regular",
    bindings: [state, bindings],
  },
];

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   frame: import(".").RegularFrame,
 *   operation: import("..").InitializeVariableOperation,
 * ) => null | import("../../../../sequence").Sequence<
 *   never,
 *   [
 *     import("../../../atom").Effect[],
 *     import(".").RegularFrame,
 *   ],
 * >}
 */
export const listRegularInitializeEffect = (hash, meta, frame, operation) => {
  const binding = findTree(frame.bindings, compileMatch(operation.variable));
  if (binding === null) {
    return null;
  } else {
    return liftSequence_X(
      rebind,
      frame,
      initializeBinding(hash, meta, binding, operation),
    );
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   frame: import(".").RegularFrame,
 *   operation: import("..").WriteSloppyFunctionVariableOperation,
 * ) => {
 *   type: "stop",
 *   data: import("../../../../sequence").Sequence<
 *     never,
 *     import("../../../atom").Effect[]
 *   >,
 * } | {
 *   type: "pass",
 *   data: import("..").WriteSloppyFunctionVariableOperation,
 * }}
 */
export const listRegularWriteSloppyFunctionEffect = (
  hash,
  meta,
  { bindings },
  operation,
) => {
  const binding = findTree(bindings, compileMatch(operation.variable));
  if (binding === null) {
    return { type: "pass", data: operation };
  } else {
    return listBindingWriteSloppyFunctionEffect(hash, meta, binding, operation);
  }
};
