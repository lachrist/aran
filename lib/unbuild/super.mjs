import {
  makeArrayExpression,
  makeGetExpression,
  makeSetExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeReadExpression,
  makePrimitiveExpression,
} from "./node.mjs";

/**
 * @type {<S>(
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   context: { super: null | unbuild.Variable },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetSuperExpression = (key, context, serial) =>
  context.super === null
    ? makeApplyExpression(
        makeReadExpression("super.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key],
        serial,
      )
    : makeGetExpression(makeReadExpression(context.super, serial), key, serial);

/**
 * @type {<S>(
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   context: { strict: boolean, super: null | unbuild.Variable },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetSuperExpression = (key, value, context, serial) =>
  context.super === null
    ? makeApplyExpression(
        makeReadExpression("super.set", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key, value],
        serial,
      )
    : makeSetExpression(
        context.strict,
        makeReadExpression(context.super, serial),
        key,
        value,
        serial,
      );

/**
 * @type {<S>(
 *   args: aran.Expression<unbuild.Atom<S>>[],
 *   context: { super_constructor: null | unbuild.Variable },
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeCallSuperExpression = (args, context, serial) =>
  context.super_constructor === null
    ? makeApplyExpression(
        makeReadExpression("super.call", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makeArrayExpression(args, serial)],
        serial,
      )
    : makeApplyExpression(
        makeReadExpression(context.super_constructor, serial),
        makePrimitiveExpression({ undefined: null }, serial),
        args,
        serial,
      );
