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
 *   type: "class",
 *   constructor: unbuild.Variable,
 * } | {
 *  type: "object",
 *  self: unbuild.Variable,
 * } | {
 *   type: "external",
 * } | {
 *   type: "none",
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
    case "class":
      return makeGetExpression(
        makeGetExpression(
          makeReadExpression(context.super.constructor, serial),
          makePrimitiveExpression("prototype", serial),
          serial,
        ),
        key,
        serial,
      );
    case "object":
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.super.self, serial)],
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
    case "none":
      throw new DynamicSyntaxAranError("illegal super access");
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
    case "class":
      return makeSetExpression(
        context.strict,
        makeGetExpression(
          makeReadExpression(context.super.constructor, serial),
          makePrimitiveExpression("prototype", serial),
          serial,
        ),
        key,
        value,
        serial,
      );
    case "object":
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.super.self, serial)],
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
    case "none":
      throw new DynamicSyntaxAranError("illegal super access");
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
    case "class":
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.construct", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(context.super.constructor, serial),
          arguments_,
          makeReadExpression("new.target", serial),
        ],
        serial,
      );
    case "object":
      throw new DynamicSyntaxAranError("illegal super call");
    case "external":
      return makeApplyExpression(
        makeReadExpression("super.call", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [arguments_],
        serial,
      );
    case "none":
      throw new DynamicSyntaxAranError("illegal super call");
    default:
      throw new StaticError("invalid super", context.super);
  }
};
