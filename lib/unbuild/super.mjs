import { DynamicSyntaxAranError } from "../error.mjs";
import { StaticError } from "../util/error.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeReadExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
} from "./node.mjs";

/**
 * @typedef {{
 *   type: "external",
 * } | {
 *   type: "internal",
 *   prototype: unbuild.Variable | null,
 *   constructor: "Object" | unbuild.Variable | null,
 * }} Super
 */

/**
 * @type {<S>(
 *   context: { super: Super },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetSuperExpression = (context, key, serial) => {
  switch (context.super.type) {
    case "internal":
      if (context.super.prototype === null) {
        throw new DynamicSyntaxAranError("illegal super get expression");
      }
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.super.prototype, serial)],
          serial,
        ),
        key,
        serial,
      );
    case "external":
      return makeApplyExpression(
        makeReadExpression("super.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key],
        serial,
      );
    default:
      throw new StaticError("invalid super", context.super);
  }
};

/**
 * @type {<S>(
 *   context: { strict: boolean, super: Super },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetSuperExpression = (context, key, value, serial) => {
  switch (context.super.type) {
    case "internal":
      if (context.super.prototype === null) {
        throw new DynamicSyntaxAranError("illegal super set expression");
      }
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.super.prototype, serial)],
          serial,
        ),
        key,
        value,
        serial,
      );
    case "external":
      return makeApplyExpression(
        makeReadExpression("super.set", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key, value],
        serial,
      );
    default:
      throw new StaticError("invalid super", context.super);
  }
};

/**
 * @type {<S>(
 *   context: { super: Super },
 *   arguments_: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSuperCallExpression = (context, arguments_, serial) => {
  switch (context.super.type) {
    case "internal":
      if (context.super.constructor === null) {
        throw new DynamicSyntaxAranError("illegal super call expression");
      }
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.construct", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          context.super.constructor === "Object"
            ? makeIntrinsicExpression("Object", serial)
            : makeReadExpression(context.super.constructor, serial),
          arguments_,
          makeReadExpression("new.target", serial),
        ],
        serial,
      );
    case "external":
      return makeApplyExpression(
        makeReadExpression("super.call", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [arguments_],
        serial,
      );
    default:
      throw new StaticError("invalid super", context.super);
  }
};
