import { AranTypeError } from "../util/index.mjs";
import { makeBinaryExpression } from "./intrinsic.mjs";
import { makePrimitiveExpression, makeReadExpression } from "./node.mjs";

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
 *   base: unbuild.Variable,
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
            makeReadExpression(name.base, path),
            path,
          )
        : makeReadExpression(name.base, path);
    }
    default: {
      throw new AranTypeError("invalid name type", name);
    }
  }
};
