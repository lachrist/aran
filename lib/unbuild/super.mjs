import { hasOwn } from "../util/index.mjs";
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
 *   context: {
 *     record: {super?: unbuild.Variable},
 *   },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetSuperExpression = ({ record }, key, serial) =>
  hasOwn(record, "super") && "super" in record
    ? makeGetExpression(makeReadExpression(record.super, serial), key, serial)
    : makeApplyExpression(
        makeReadExpression("super.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key],
        serial,
      );

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     record: {super?: unbuild.Variable},
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
) =>
  hasOwn(record, "super") && "super" in record
    ? makeSetExpression(
        strict,
        makeReadExpression(record.super, serial),
        key,
        value,
        serial,
      )
    : makeApplyExpression(
        makeReadExpression("super.set", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key, value],
        serial,
      );

/**
 * @type {<S>(
 *   context: {
 *     record: { "super.constructor"?: unbuild.Variable },
 *   },
 *   args: aran.Expression<unbuild.Atom<S>>[],
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeCallSuperExpression = ({ record }, args, serial) =>
  hasOwn(record, "super.constructor") && "super.constructor" in record
    ? makeApplyExpression(
        makeReadExpression(record["super.constructor"], serial),
        makePrimitiveExpression({ undefined: null }, serial),
        args,
        serial,
      )
    : makeApplyExpression(
        makeReadExpression("super.call", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [makeArrayExpression(args, serial)],
        serial,
      );
