import {
  EMPTY,
  findTree,
  map,
  flatSequence,
  liftSequence_X,
} from "../../../../util/index.mjs";
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
 *   schrodinger: boolean,
 *   bindings: import("../../../../util/tree").Tree<import(".").Binding>,
 * ) => import(".").RegularFrame}
 */
const makeRegularFrame = (schrodinger, bindings) => ({
  type: "regular",
  schrodinger,
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
const setupRegularFrame = (hash, meta, { schrodinger, bindings, links }) =>
  liftSequence_X(
    makeRegularFrame,
    schrodinger,
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding, links),
      ),
    ),
  );

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
const rebind = ({ bindings, schrodinger }, { 0: value, 1: binding }) => [
  value,
  {
    type: "regular",
    schrodinger,
    bindings: [
      schrodinger && binding.type === "regular"
        ? { ...binding, status: "schrodinger" }
        : binding,
      bindings,
    ],
  },
];

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
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
 *   data: import("../../../../util/sequence").Sequence<
 *     never,
 *     import("../../../../util/tree").Tree<import("../../../atom").Effect>,
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
