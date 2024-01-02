import { AranTypeError } from "../error.mjs";
import { guard } from "../util/index.mjs";
import { makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";

const KIND_PREFIX = {
  init: "",
  env: "",
  get: "get ",
  set: "set ",
};

const ACCESS_PREFIX = {
  public: "",
  private: "#",
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   name: import("./name").Name,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNameExpression = ({ path }, name) => {
  if (name.type === "assignment") {
    return makePrimitiveExpression(name.variable, path);
  } else if (name.type === "anonymous") {
    return makePrimitiveExpression("", path);
  } else if (name.type === "default") {
    return makePrimitiveExpression("default", path);
  } else if (name.type === "property") {
    if (name.key.computed) {
      return guard(
        KIND_PREFIX[name.kind] !== "",
        (node) =>
          makeBinaryExpression(
            "+",
            makePrimitiveExpression(KIND_PREFIX[name.kind], path),
            node,
            path,
          ),
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(name.key.value, path),
              path,
            ),
            makePrimitiveExpression("symbol", path),
            path,
          ),
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeApplyExpression(
                makeIntrinsicExpression(
                  "Symbol.prototype.description@get",
                  path,
                ),
                makeReadCacheExpression(name.key.value, path),
                [],
                path,
              ),
              makePrimitiveExpression(null, path),
              path,
            ),
            makePrimitiveExpression("", path),
            makeBinaryExpression(
              "+",
              makeBinaryExpression(
                "+",
                makePrimitiveExpression("[", path),
                makeApplyExpression(
                  makeIntrinsicExpression(
                    "Symbol.prototype.description@get",
                    path,
                  ),
                  makeReadCacheExpression(name.key.value, path),
                  [],
                  path,
                ),
                path,
              ),
              makePrimitiveExpression("]", path),
              path,
            ),
            path,
          ),
          makeReadCacheExpression(name.key.value, path),
          path,
        ),
      );
    } else {
      return makePrimitiveExpression(
        `${KIND_PREFIX[name.kind]}${ACCESS_PREFIX[name.key.access]}${
          name.key.value
        }`,
        path,
      );
    }
  } else {
    throw new AranTypeError(name);
  }
};
