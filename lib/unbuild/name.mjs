import { AranTypeError } from "../error.mjs";
import { guard } from "../util/index.mjs";
import { cacheConstant, makeReadCacheExpression } from "./cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "./intrinsic.mjs";
import { convertKey } from "./key.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { bindSequence, prefixExpression } from "./sequence.mjs";

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
 *   site: import("./site").LeafSite,
 *   name: import("./name").Name,
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeNameExpression = ({ meta, path }, name) => {
  if (name.type === "assignment") {
    return makePrimitiveExpression(name.variable, path);
  } else if (name.type === "anonymous") {
    return makePrimitiveExpression("", path);
  } else if (name.type === "default") {
    return makePrimitiveExpression("default", path);
  } else if (name.type === "property") {
    const key = convertKey({ path }, name.key);
    if (key.computed) {
      return prefixExpression(
        bindSequence(cacheConstant(meta, key.data, path), (key) =>
          guard(
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
                  makeReadCacheExpression(key, path),
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
                    makeReadCacheExpression(key, path),
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
                      makeReadCacheExpression(key, path),
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
              makeReadCacheExpression(key, path),
              path,
            ),
          ),
        ),
      );
    } else {
      return makePrimitiveExpression(
        `${KIND_PREFIX[name.kind]}${ACCESS_PREFIX[key.access]}${key.data}`,
        path,
      );
    }
  } else {
    throw new AranTypeError(name);
  }
};
