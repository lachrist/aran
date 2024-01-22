import { AranTypeError } from "../error.mjs";
import { guard } from "../util/index.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "./intrinsic.mjs";
import { makeKeyExpression } from "./key.mjs";
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
 *   site: import("./site").VoidSite,
 *   name: import("./name").Name,
 * ) => import("./sequence").ExpressionSequence}
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
              makeKeyExpression({ path }, name.key),
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
                makeKeyExpression({ path }, name.key),
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
                  makeKeyExpression({ path }, name.key),
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
          makeKeyExpression({ path }, name.key),
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
