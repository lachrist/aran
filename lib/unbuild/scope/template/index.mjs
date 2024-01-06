import { AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { mapSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").TemplateFrame,
 * >}
 */
export const setupTemplateFrame = ({ path, meta }) =>
  mapSequence(
    cacheConstant(
      meta,
      makeConstructExpression(
        makeIntrinsicExpression("Map", path),
        [makePrimitiveExpression(null, path)],
        path,
      ),
      path,
    ),
    (record) => ({
      type: "template",
      record,
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").TemplateFrame,
 *   operation: import("..").TemplateLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeTemplateLoadExpression = ({ path }, frame, operation) => {
  if (operation.type === "has-template") {
    return makeApplyExpression(
      makeIntrinsicExpression("Map.prototype.has", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(frame.record, path),
        makePrimitiveExpression(operation.path, path),
      ],
      path,
    );
  } else if (operation.type === "get-template") {
    return makeApplyExpression(
      makeIntrinsicExpression("Map.prototype.get", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(frame.record, path),
        makePrimitiveExpression(operation.path, path),
      ],
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").TemplateFrame,
 *   operation: import("..").TemplateSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listTemplateSaveEffect = ({ path }, frame, operation) =>
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("Map.prototype.set", path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makeReadCacheExpression(frame.record, path),
        makePrimitiveExpression(operation.path, path),
        makeReadCacheExpression(operation.template, path),
      ],
      path,
    ),
    path,
  );