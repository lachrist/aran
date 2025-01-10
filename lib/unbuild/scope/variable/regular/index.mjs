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
 * @type {import("../../api").Setup<
 *   {
 *     links: import("../../../query/link").Link[],
 *     bindings: import("../../../annotation/hoisting").Binding[],
 *   },
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupModuleRegularFrame = (hash, meta, { links, bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: false, bindings, links });

/**
 * @type {import("../../api").Setup<
 *   {
 *     bindings: import("../../../annotation/hoisting").Binding[],
 *   },
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupSwitchRegularFrame = (hash, meta, { bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: true, bindings, links: EMPTY });

/**
 * @type {import("../../api").Setup<
 *   {
 *     bindings: import("../../../annotation/hoisting").Binding[],
 *   },
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupNormalRegularFrame = (hash, meta, { bindings }) =>
  setupRegularFrame(hash, meta, { schrodinger: false, bindings, links: EMPTY });

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
 *   W,
 *   X,
 * >(
 *   perform: import("../../api").PerformMaybe<import(".").Binding, O, W, X>,
 * ) => import("../../api").PerformMaybe<import(".").RegularFrame, O, W, X>}
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
 *   frame: import(".").RegularFrame,
 *   pair: [X, import(".").Binding],
 * ) => [
 *   X,
 *   import(".").RegularFrame
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
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   frame: import(".").RegularFrame,
 *   operation: import("..").InitializeVariableOperation,
 * ) => null | import("../../../../util/sequence").Sequence<
 *   never,
 *   [
 *     import("../../../../util/tree").Tree<import("../../../atom").Effect>,
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
      initializeFrame,
      frame,
      listBindingInitializeEffect(hash, meta, binding, operation),
    );
  }
};
