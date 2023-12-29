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
 * ) => import("../../sequence").EffectSequence<import(".").TemplateFrame>}
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
 *   operation: import("..").LoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
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
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").TemplateFrame,
 *   operation: import("..").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const makeTemplateSaveExpression = ({ path }, frame, operation) => {
  if (operation.type === "set-template") {
    return [
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
      ),
    ];
  } else {
    return null;
  }
};
