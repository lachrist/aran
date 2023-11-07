import { AranTypeError } from "../util/index.mjs";
import { makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";

/**
 * @typedef {{
 *   type: "anonymous",
 * } | {
 *   type: "static",
 *   kind:
 *     | "scope"
 *     | "field"
 *     | "init"
 *     | "method"
 *     | "constructor"
 *     | "get"
 *     | "set",
 *   base:
 *     | estree.Key
 *     | estree.Variable
 *     | estree.Specifier
 * } | {
 *   type: "dynamic",
 *   kind:
 *     | "field"
 *     | "init"
 *     | "method"
 *     | "get"
 *     | "set",
 *   base: import("./cache.mjs").Cache,
 * }} Name
 */

/**  @type {Name} */
export const ANONYMOUS = { type: "anonymous" };

/**
 * @type {(
 *   name: Name,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNameExpression = (name, path) => {
  switch (name.type) {
    case "anonymous": {
      return makePrimitiveExpression("", path);
    }
    case "static": {
      return makePrimitiveExpression(
        `${name.kind === "get" ? "get " : name.kind === "set" ? "set " : ""}${
          name.base
        }`,
        path,
      );
    }
    case "dynamic": {
      return name.kind === "get" || name.kind === "set"
        ? makeBinaryExpression(
            "+",
            makePrimitiveExpression(`${name.kind}`, path),
            makeApplyExpression(
              makeIntrinsicExpression("String", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadCacheExpression(name.base, path)],
              path,
            ),
            path,
          )
        : makeApplyExpression(
            makeIntrinsicExpression("String", path),
            makePrimitiveExpression({ undefined: null }, path),
            [makeReadCacheExpression(name.base, path)],
            path,
          );
    }
    default: {
      throw new AranTypeError("invalid name type", name);
    }
  }
};
