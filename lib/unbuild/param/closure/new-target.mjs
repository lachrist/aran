import { AranTypeError } from "../../../error.mjs";
import { makeThrowErrorExpression } from "../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeExpressionEffect,
  makeReadParameterExpression,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: import("./closure.d.ts").Closure,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReadNewTargetExpression = ({ path }, context) =>
  context.closure.type === "none" && context.root.situ === "global"
    ? makeSyntaxErrorExpression("Illegal 'new.target' read", path)
    : makeReadParameterExpression("new.target", path);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: import("./closure.d.ts").Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupNewTargetEffect = ({ path }, context) => {
  if (context.closure.arrow === "none") {
    switch (context.closure.type) {
      case "method": {
        return [
          makeConditionalEffect(
            makeReadParameterExpression("new.target", path),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "method cannot be called as a constructor",
                  path,
                ),
                path,
              ),
            ],
            [],
            path,
          ),
        ];
      }
      case "constructor": {
        return [
          makeConditionalEffect(
            makeReadParameterExpression("new.target", path),
            [],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "constructor cannot be called as a method",
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ];
      }
      case "function": {
        return [];
      }
      case "none": {
        return [];
      }
      default: {
        throw new AranTypeError("invalid context.closure", context.closure);
      }
    }
  } else {
    return [];
  }
};
