import { mapIndex } from "../util/index.mjs";
import {
  makeArrayExpression,
  makeDataDescriptorExpression,
} from "./intrinsic.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import {
  makePrimitiveExpression,
  makeEffectStatement,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
} from "./node.mjs";
import { drillVeryDeepSite } from "./site.mjs";

/**
 * @type {(
 *   site: import("./site").Site<import("../estree").TemplateElement>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("./atom").Expression}
 */
export const unbuildQuasi = ({ node, path }, { cooked }) => {
  if (cooked) {
    if (node.value.cooked == null) {
      return makeIntrinsicExpression("undefined", path);
    } else {
      return makePrimitiveExpression(node.value.cooked, path);
    }
  } else {
    return makePrimitiveExpression(node.value.raw, path);
  }
};

/**
 * @type {(
 *   template: import("./template").Template,
 * ) => import("./atom").Statement}
 */
export const unbuildTemplate = ({ variable, value: { node, path, meta } }) =>
  makeEffectStatement(
    makeWriteEffect(
      variable,
      makeApplyExpression(
        makeIntrinsicExpression("Object.freeze", path),
        makeIntrinsicExpression("undefined", path),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object.defineProperty", path),
            makeIntrinsicExpression("undefined", path),
            [
              makeArrayExpression(
                mapIndex(node.quasi.quasis.length, (index) =>
                  unbuildQuasi(
                    drillVeryDeepSite(
                      node,
                      path,
                      forkMeta((meta = nextMeta(meta))),
                      "quasi",
                      "quasis",
                      index,
                    ),
                    { cooked: true },
                  ),
                ),
                path,
              ),
              makePrimitiveExpression("raw", path),
              makeDataDescriptorExpression(
                {
                  value: makeApplyExpression(
                    makeIntrinsicExpression("Object.freeze", path),
                    makeIntrinsicExpression("undefined", path),
                    [
                      makeArrayExpression(
                        mapIndex(node.quasi.quasis.length, (index) =>
                          unbuildQuasi(
                            drillVeryDeepSite(
                              node,
                              path,
                              forkMeta((meta = nextMeta(meta))),
                              "quasi",
                              "quasis",
                              index,
                            ),
                            { cooked: false },
                          ),
                        ),
                        path,
                      ),
                    ],
                    path,
                  ),
                  writable: false,
                  enumerable: false,
                  configurable: false,
                },
                path,
              ),
            ],
            path,
          ),
        ],
        path,
      ),
      path,
    ),
    path,
  );
