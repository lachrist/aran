import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeReadExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
} from "./node.mjs";

/**
 * @type {<S>(
 *   context: {
 *     record: {
 *       self: unbuild.Variable | null,
 *       super: unbuild.Variable | null,
 *     },
 *   },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetSuperExpression = ({ record }, key, serial) => {
  if (record.self !== null) {
    return makeGetExpression(
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makeReadExpression(record.self, serial)],
        serial,
      ),
      key,
      serial,
    );
  } else if (record.super !== null) {
    return makeGetExpression(
      makeReadExpression(record.super, serial),
      key,
      serial,
    );
  } else {
    return makeApplyExpression(
      makeReadExpression("super.get", serial),
      makePrimitiveExpression({ undefined: null }, serial),
      [key],
      serial,
    );
  }
};

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     record: {
 *       self: unbuild.Variable | null,
 *       super: unbuild.Variable | null,
 *     },
 *   },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetSuperExpression = (
  { strict, record },
  key,
  value,
  serial,
) => {
  if (record.self !== null) {
    return makeSetExpression(
      strict,
      makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makeReadExpression(record.self, serial)],
        serial,
      ),
      key,
      value,
      serial,
    );
  } else if (record.super !== null) {
    return makeSetExpression(
      strict,
      makeReadExpression(record.super, serial),
      key,
      value,
      serial,
    );
  } else {
    return makeApplyExpression(
      makeReadExpression("super.set", serial),
      makePrimitiveExpression({ undefined: null }, serial),
      [key, value],
      serial,
    );
  }
};

// /**
//  * @type {<S>(
//  *   context: {
//  *     record: { "super.constructor"?: unbuild.Variable },
//  *   },
//  *   args: aran.Expression<unbuild.Atom<S>>[],
//  *   serial: S,
//  * ) => aran.Expression<unbuild.Atom<S>>}
//  */
// export const makeCallSuperExpression = ({ record }, args, serial) =>
//   hasOwn(record, "super.constructor") && "super.constructor" in record
//     ? makeApplyExpression(
//         makeReadExpression(record["super.constructor"], serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         args,
//         serial,
//       )
//     : makeApplyExpression(
//         makeReadExpression("super.call", serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         [makeArrayExpression(args, serial)],
//         serial,
//       );
