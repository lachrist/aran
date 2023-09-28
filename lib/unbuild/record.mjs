import { SyntaxAranError } from "../error.mjs";
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
 *       "this":
 *         | ".illegal"
 *         | ".undefined"
 *         | ".global"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   options: {
 *     serial: S,
 *     origin: estree.Node
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeThisExpression = (context, { serial, origin }) => {
  switch (context.record.this) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta", origin);
    case ".undefined":
      return makePrimitiveExpression({ undefined: null }, serial);
    case ".global":
      return makeIntrinsicExpression("globalThis", serial);
    default:
      return makeReadExpression(context.record.this, serial);
  }
};

/**
 * @type {<S>(
 *   context: {
 *     record: {
 *       "import.meta":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   options: {
 *     serial: S,
 *     origin: estree.Node,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeImportMetaExpression = (context, { serial, origin }) => {
  switch (context.record["import.meta"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta", origin);
    default:
      return makeReadExpression(context.record["import.meta"], serial);
  }
};

/**
 * @type {<S>(
 *   context: {
 *     record: {
 *       "new.target":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   options: {
 *     serial: S,
 *     origin: estree.Node,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeNewTargetExpression = (context, { serial, origin }) => {
  switch (context.record["new.target"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal new.target", origin);
    default:
      return makeReadExpression(context.record["new.target"], serial);
  }
};

/**
 * @type {<S>(
 *   context: {
 *     record: {
 *       "super.prototype":
 *         | ".illegal"
 *         | ".enclave"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   options: {
 *     serial: S,
 *     origin: estree.Node,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetSuperExpression = (context, key, { serial, origin }) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key],
        serial,
      );
    default:
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.record["super.prototype"], serial)],
          serial,
        ),
        key,
        serial,
      );
  }
};

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     record: {
 *       "super.prototype":
 *         | ".illegal"
 *         | ".enclave"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   options: {
 *     serial: S,
 *     origin: estree.Node,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetSuperExpression = (
  context,
  key,
  value,
  { serial, origin },
) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.set", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [key, value],
        serial,
      );
    default:
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [makeReadExpression(context.record["super.prototype"], serial)],
          serial,
        ),
        key,
        value,
        serial,
      );
  }
};

/**
 * @type {<S>(
 *   context: {
 *     strict: boolean,
 *     record: {
 *       "new.target":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *       "super.constructor":
 *         | ".illegal"
 *         | ".enclave"
 *         | ".default"
 *         | aran.Parameter
 *         | unbuild.Variable
 *       "super.post":
 *         | ".none"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   arguments_: aran.Expression<unbuild.Atom<S>>,
 *   options: {
 *     serial: S,
 *     origin: estree.Node,
 *   },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeCallSuperExpression = (
  context,
  arguments_,
  { serial, origin },
) => {
  switch (context.record["super.constructor"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super call", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.call", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [arguments_],
        serial,
      );
    default: {
      const this_ = makeApplyExpression(
        makeIntrinsicExpression("Reflect.construct", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          context.record["super.constructor"] === ".default"
            ? makeIntrinsicExpression("Object", serial)
            : makeReadExpression(context.record["super.constructor"], serial),
          arguments_,
          makeNewTargetExpression(context, { serial, origin }),
        ],
        serial,
      );
      return context.record["super.post"] === ".none"
        ? this_
        : makeApplyExpression(
            makeReadExpression(context.record["super.post"], serial),
            this_,
            [],
            serial,
          );
    }
  }
};
