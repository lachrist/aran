import { AranTypeError } from "../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeThrowErrorExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  makePrimitiveExpression,
  makeConditionalExpression,
} from "../../node.mjs";
import { mapSequence, sequenceExpression } from "../../sequence.mjs";
import { makeSyntaxErrorExpression } from "../../syntax-error.mjs";
import { makeReadNewTargetExpression } from "./new-target.mjs";
import { makeReadThisExpression } from "./this.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: import("./closure").Closure,
 *   },
 *   options: {
 *     argument: aran.Expression<unbuild.Atom> | null,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReturnArgumentExpression = (
  { path, meta },
  context,
  { argument },
) => {
  switch (context.closure.arrow) {
    case "eval": {
      return makeSyntaxErrorExpression("Illegal 'return' statement", path);
    }
    case "arrow": {
      return argument ?? makePrimitiveExpression({ undefined: null }, path);
    }
    case "none": {
      switch (context.closure.type) {
        case "none": {
          return makeSyntaxErrorExpression("Illegal 'return' statement", path);
        }
        case "method": {
          return argument ?? makePrimitiveExpression({ undefined: null }, path);
        }
        case "function": {
          if (argument === null) {
            return makeConditionalExpression(
              makeReadNewTargetExpression({ path }, context),
              makeReadThisExpression({ path }, context),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            );
          } else {
            return sequenceExpression(
              mapSequence(cacheConstant(meta, argument, path), (argument) =>
                makeConditionalExpression(
                  makeReadNewTargetExpression({ path }, context),
                  makeConditionalExpression(
                    makeIsProperObjectExpression({ path }, { value: argument }),
                    makeReadCacheExpression(argument, path),
                    makeReadThisExpression({ path }, context),
                    path,
                  ),
                  makeReadCacheExpression(argument, path),
                  path,
                ),
              ),
              path,
            );
          }
        }
        case "constructor": {
          if (argument === null) {
            return makeReadThisExpression({ path }, context);
          } else {
            if (context.closure.derived) {
              return sequenceExpression(
                mapSequence(cacheConstant(meta, argument, path), (argument) =>
                  makeConditionalExpression(
                    makeIsProperObjectExpression({ path }, { value: argument }),
                    makeReadCacheExpression(argument, path),
                    makeConditionalExpression(
                      makeBinaryExpression(
                        "===",
                        makeReadCacheExpression(argument, path),
                        makePrimitiveExpression({ undefined: null }, path),
                        path,
                      ),
                      makeReadThisExpression({ path }, context),
                      makeThrowErrorExpression(
                        "TypeError",
                        "Derived constructors may only return object or undefined",
                        path,
                      ),
                      path,
                    ),
                    path,
                  ),
                ),
                path,
              );
            } else {
              return sequenceExpression(
                mapSequence(cacheConstant(meta, argument, path), (argument) =>
                  makeConditionalExpression(
                    makeIsProperObjectExpression({ path }, { value: argument }),
                    makeReadCacheExpression(argument, path),
                    makeReadThisExpression({ path }, context),
                    path,
                  ),
                ),
                path,
              );
            }
          }
        }
        default: {
          throw new AranTypeError("invalid context.closure", context.closure);
        }
      }
    }
    default: {
      throw new AranTypeError(
        "invalid context.closure.arrow",
        context.closure.arrow,
      );
    }
  }
};
