import { concat_, hasOwn } from "../../../util/index.mjs";
import { makeExpressionEffect } from "../../node.mjs";
import { liftSequenceX, liftSequenceX_ } from "../../../sequence.mjs";
import { initSyntaxErrorExpression } from "../../prelude/index.mjs";

/**
 * @type {(
 *   record: {[k in import("../../../estree").Variable]?: string},
 * ) => import(".").IllegalFrame}
 */
export const makeIllegalFrame = (record) => ({
  type: "illegal",
  record,
});

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").IllegalFrame
 * >}
 */
export const makeIllegalLoadExpression = (
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
      operation.type === "discard") &&
    hasOwn(frame.record, operation.variable)
  ) {
    return initSyntaxErrorExpression(
      `Variable '${operation.variable}' is illegal in ${
        frame.record[operation.variable]
      }`,
      hash,
    );
  } else {
    return makeAlternateExpression(hash, meta, context, operation);
  }
};

/**
 * @type {import("../operation").ListFrameEffect<
 *   import(".").IllegalFrame
 * >}
 */
export const listIllegalSaveEffect = (
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
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        initSyntaxErrorExpression(
          `Variable '${operation.variable}' is illegal in ${
            frame.record[operation.variable]
          }`,
          hash,
        ),
        hash,
      ),
    );
  } else {
    return listAlternateEffect(hash, meta, context, operation);
  }
};
