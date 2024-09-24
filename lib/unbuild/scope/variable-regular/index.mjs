import { EMPTY, hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { flatSequence, liftSequenceX } from "../../../sequence.mjs";
import {
  listBindingSaveEffect,
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
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   bindings: import("../../annotation/hoisting-public").Binding[],
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
export const setupProgramFrame = (hash, meta, bindings, links) =>
  liftSequenceX(
    toRegularFrame,
    flatSequence(
      map(bindings, (binding) =>
        setupBinding(hash, forkMeta((meta = nextMeta(meta))), binding, links),
      ),
    ),
  );

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   bindings: import("../../annotation/hoisting-public").Binding[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").RegularFrame
 * >}
 */
export const setupRegularFrame = (hash, meta, bindings) =>
  setupProgramFrame(hash, meta, bindings, EMPTY);

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").RegularFrame
 * >}
 */
export const makeRegularLoadExpression = (
  hash,
  meta,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (
    (operation.type === "read" ||
      operation.type === "typeof" ||
      operation.type === "discard" ||
      operation.type === "read-ambient-this") &&
    hasOwn(frame.record, operation.variable)
  ) {
    return makeBindingLoadExpression(
      hash,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").RegularFrame
 * >}
 */
export const listRegularSaveEffect = (
  hash,
  meta,
  frame,
  operation,
  listAlternateEffect,
  context,
) => {
  if (
    (operation.type === "late-declare" ||
      operation.type === "initialize" ||
      operation.type === "write" ||
      operation.type === "write-sloppy-function") &&
    hasOwn(frame.record, operation.variable)
  ) {
    return listBindingSaveEffect(
      hash,
      meta,
      frame.record[operation.variable],
      operation,
      listAlternateEffect,
      context,
    );
  } else {
    return listAlternateEffect(hash, meta, context, operation);
  }
};
