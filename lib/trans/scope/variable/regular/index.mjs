import {
  EMPTY,
  findTree,
  map,
  flatSequence,
  liftSequence_X,
  liftSequenceX,
} from "../../../../util/index.mjs";
import {
  listBindingInitializeEffect,
  listBindingLateDeclareEffect,
  listBindingWriteEffect,
  listBindingWriteSloppyFunctionEffect,
  makeBindingDiscardExpression,
  makeBindingReadAmbientThisExpression,
  makeBindingReadExpression,
  makeBindingTypeofExpression,
  setupBinding,
} from "./binding.mjs";
import { forkMeta, nextMeta } from "../../../meta.mjs";

/**
 * @type {(
 *   bindings: import("../../../../util/tree.d.ts").Tree<import("./index.d.ts").Binding>,
 * ) => import("./index.d.ts").RegularFrame}
 */
const makeRegularFrame = (bindings) => ({
  type: "regular",
  bindings,
});

/**
 * @type {import("../../api.d.ts").Setup<
 *   import("./index.d.ts").RawRegularFrame,
 *   (
 *     | import("../../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").BaseDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").RegularFrame
 * >}
 */
const setupRegularFrame = (hash, meta, { schrodinger, bindings, links }) => {
  const options = { schrodinger, links };
  return liftSequenceX(
    makeRegularFrame,
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding, options),
      ),
    ),
  );
};

/**
 * @type {import("../../api.d.ts").Setup<
 *   {
 *     links: import("../../../query/link.d.ts").Link[],
 *     bindings: [
 *       import("estree-sentry").VariableName,
 *       import("../../../annotation/hoisting.d.ts").Kind[],
 *     ][],
 *   },
 *   (
 *     | import("../../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").BaseDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").RegularFrame
 * >}
 */
export const setupModuleRegularFrame = (hash, meta, { links, bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: false, bindings, links });

/**
 * @type {import("../../api.d.ts").Setup<
 *   {
 *     bindings: [
 *       import("estree-sentry").VariableName,
 *       import("../../../annotation/hoisting.d.ts").Kind[],
 *     ][],
 *   },
 *   (
 *     | import("../../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").BaseDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").RegularFrame
 * >}
 */
export const setupSwitchRegularFrame = (hash, meta, { bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: true, bindings, links: EMPTY });

/**
 * @type {import("../../api.d.ts").Setup<
 *   {
 *     bindings: [
 *       import("estree-sentry").VariableName,
 *       import("../../../annotation/hoisting.d.ts").Kind[],
 *     ][],
 *   },
 *   (
 *     | import("../../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").BaseDeclarationPrelude
 *     | import("../../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").RegularFrame
 * >}
 */
export const setupNormalRegularFrame = (hash, meta, { bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: false, bindings, links: EMPTY });

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 * ) => (
 *   binding: import("./index.d.ts").Binding,
 * ) => boolean}
 */
const compileMatch =
  (variable1) =>
  ({ variable: variable2 }) =>
    variable1 === variable2;

/**
 * @type {<
 *   O extends { variable: import("estree-sentry").VariableName },
 *   W,
 *   X,
 * >(
 *   perform: import("../../api.d.ts").PerformMaybe<import("./index.d.ts").Binding, O, W, X>,
 * ) => import("../../api.d.ts").PerformMaybe<import("./index.d.ts").RegularFrame, O, W, X>}
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
  makeBindingTypeofExpression,
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

export const listRegularWriteSloppyFunctionEffect = compileRegularOperation(
  listBindingWriteSloppyFunctionEffect,
);

/**
 * @type {<X>(
 *   frame: import("./index.d.ts").RegularFrame,
 *   pair: [X, import("./index.d.ts").Binding],
 * ) => [
 *   X,
 *   import("./index.d.ts").RegularFrame
 * ]}
 */
const initializeFrame = ({ bindings }, [value, state]) => [
  value,
  {
    type: "regular",
    bindings: [state, bindings],
  },
];

/**
 * @type {(
 *   hash: import("../../../hash.d.ts").Hash,
 *   meta: import("../../../meta.d.ts").Meta,
 *   frame: import("./index.d.ts").RegularFrame,
 *   operation: import("../index.d.ts").InitializeVariableOperation,
 * ) => null | import("../../../../util/sequence.d.ts").Sequence<
 *   never,
 *   [
 *     import("../../../../util/tree.d.ts").Tree<import("../../../atom.d.ts").Effect>,
 *     import("./index.d.ts").RegularFrame,
 *   ],
 * >}
 */
export const listRegularInitializeEffect = (hash, meta, frame, operation) => {
  const binding = findTree(frame.bindings, compileMatch(operation.variable));
  if (binding === null) {
    return null;
  } else {
    return liftSequence_X(
      initializeFrame,
      frame,
      listBindingInitializeEffect(hash, meta, binding, operation),
    );
  }
};
