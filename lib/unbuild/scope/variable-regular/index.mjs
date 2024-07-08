import { EMPTY, hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { flatSequence, liftSequenceX } from "../../../sequence.mjs";
import {
  listBindingSaveEffect,
  listBindingWriteFunctionEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   entries: [
 *     import("../../../estree").Variable,
 *     import(".").Binding,
 *   ][],
 * ) => import(".").RegularFrame}
 */
const toRegularFrame = (entries) => ({
  type: "regular",
  record: reduceEntry(entries),
});

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   bindings: import("../../query/hoist-public").Binding[],
 *   links: import("../../query/link").Link[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupProgramFrame = ({ path, meta }, bindings, links) =>
  liftSequenceX(
    toRegularFrame,
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          binding,
          links,
        ),
      ),
    ),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   bindings: import("../../query/hoist-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = (site, bindings) =>
  setupProgramFrame(site, bindings, EMPTY);

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeRegularLoadExpression = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeBindingLoadExpression(
      site,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").RegularFrame,
 *   operation: Exclude<
 *     import("../operation").VariableSaveOperation,
 *     import("../operation").WriteSloppyFunctionOperation
 *   >,
 * ) => null | import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listRegularSaveEffect = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingSaveEffect(
      site,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").RegularFrame,
 *   operation: import("../operation").WriteSloppyFunctionOperation,
 *   makeAlternate: (
 *     operation: import("../operation").WriteSloppyFunctionOperation,
 *   ) => import("../../../sequence").Sequence<
 *     import("../../prelude").BodyPrelude,
 *     import("../../atom").Effect[]
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[]
 * >}
 */
export const listRegularWriteSloppyFunctionEffect = (
  site,
  frame,
  operation,
  makeAlternate,
) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingWriteFunctionEffect(
      site,
      frame.record[operation.variable],
      operation,
      makeAlternate,
    );
  } else {
    return makeAlternate(operation);
  }
};
