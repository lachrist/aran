import { mapIndex } from "../../util/index.mjs";
import {
  makeArrayExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import {
  makePrimitiveExpression,
  makeEffectStatement,
  makeWriteEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
} from "../node.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").TemplateElement<import("../hash.d.ts").HashProp>,
 *   options: {
 *     cooked: boolean,
 *   },
 * ) => import("../atom.d.ts").Expression}
 */
const transQuasi = (node, { cooked }) => {
  const { _hash: hash } = node;
  if (cooked) {
    if (node.value.cooked == null) {
      return makeIntrinsicExpression("undefined", hash);
    } else {
      return makePrimitiveExpression(node.value.cooked, hash);
    }
  } else {
    return makePrimitiveExpression(node.value.raw, hash);
  }
};

/**
 * @type {(
 *   template: import("./template.d.ts").Template,
 * ) => import("../atom.d.ts").Statement}
 */
export const makePreludeTemplateStatement = ({ variable, value: node }) => {
  const { _hash: hash } = node;
  return makeEffectStatement(
    makeWriteEffect(
      variable,
      makeApplyExpression(
        makeIntrinsicExpression("Object.freeze", hash),
        makeIntrinsicExpression("undefined", hash),
        [
          makeApplyExpression(
            makeIntrinsicExpression("Object.defineProperty", hash),
            makeIntrinsicExpression("undefined", hash),
            [
              makeArrayExpression(
                mapIndex(node.quasi.quasis.length, (index) =>
                  transQuasi(node.quasi.quasis[index], { cooked: true }),
                ),
                hash,
              ),
              makePrimitiveExpression("raw", hash),
              makeDataDescriptorExpression(
                {
                  value: makeApplyExpression(
                    makeIntrinsicExpression("Object.freeze", hash),
                    makeIntrinsicExpression("undefined", hash),
                    [
                      makeArrayExpression(
                        mapIndex(node.quasi.quasis.length, (index) =>
                          transQuasi(node.quasi.quasis[index], {
                            cooked: false,
                          }),
                        ),
                        hash,
                      ),
                    ],
                    hash,
                  ),
                  writable: false,
                  enumerable: false,
                  configurable: false,
                },
                hash,
              ),
            ],
            hash,
          ),
        ],
        hash,
      ),
      hash,
    ),
    hash,
  );
};

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | [
 *   import("../variable.d.ts").MetaVariable,
 *   import("../../lang/syntax.d.ts").Intrinsic,
 * ]}
 */
export const getPreludeTemplateBinding = (prelude) =>
  prelude.type === "template"
    ? [prelude.data.variable, "aran.deadzone_symbol"]
    : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("../atom.d.ts").Statement}
 */
export const getPreludeTemplateStatement = (prelude) =>
  prelude.type === "template"
    ? makePreludeTemplateStatement(prelude.data)
    : null;
