import { SyntaxAranError } from "../error.mjs";
import { makeGetExpression, makeSetExpression } from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeReadExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
} from "./node.mjs";

/**
 * @type {(
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
 *   origin: unbuild.Path,
 * ) =>  aran.Expression<unbuild.Atom>}
 */
export const makeThisExpression = (context, origin) => {
  switch (context.record.this) {
    case ".illegal":
      throw new SyntaxAranError("illegal this access", null);
    case ".undefined":
      return makePrimitiveExpression({ undefined: null }, origin);
    case ".global":
      return makeIntrinsicExpression("globalThis", origin);
    default:
      return makeReadExpression(context.record.this, origin);
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "import.meta":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportMetaExpression = (context, origin) => {
  switch (context.record["import.meta"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta access", null);
    default:
      return makeReadExpression(context.record["import.meta"], origin);
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "new.target":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNewTargetExpression = (context, origin) => {
  switch (context.record["new.target"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal new.target access", null);
    default:
      return makeReadExpression(context.record["new.target"], origin);
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "super.prototype":
 *         | ".illegal"
 *         | ".enclave"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = (context, key, origin) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.get", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [key],
        origin,
      );
    default:
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", origin),
          makePrimitiveExpression({ undefined: null }, origin),
          [makeReadExpression(context.record["super.prototype"], origin)],
          origin,
        ),
        key,
        origin,
      );
  }
};

/**
 * @type {(
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
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (context, key, value, origin) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.set", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [key, value],
        origin,
      );
    default:
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", origin),
          makePrimitiveExpression({ undefined: null }, origin),
          [makeReadExpression(context.record["super.prototype"], origin)],
          origin,
        ),
        key,
        value,
        origin,
      );
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "new.target":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *       "super.field":
 *         | ".illegal"
 *         | ".none"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   this_: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFieldSuperExpression = (context, this_, origin) => {
  switch (context.record["super.field"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super field", null);
    case ".none":
      return this_;
    default:
      return makeApplyExpression(
        makeReadExpression(context.record["super.field"], origin),
        this_,
        [],
        origin,
      );
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "super.constructor":
 *         | ".illegal"
 *         | ".enclave"
 *         | ".default"
 *         | aran.Parameter
 *         | unbuild.Variable
 *       "new.target":
 *         | ".illegal"
 *         | aran.Parameter
 *         | unbuild.Variable
 *       "super.field":
 *         | ".illegal"
 *         | ".none"
 *         | aran.Parameter
 *         | unbuild.Variable,
 *     },
 *   },
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = (context, arguments_, origin) => {
  switch (context.record["super.constructor"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super call", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.call", origin),
        makePrimitiveExpression({ undefined: null }, origin),
        [arguments_],
        origin,
      );
    default:
      return makeFieldSuperExpression(
        context,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", origin),
          makePrimitiveExpression({ undefined: null }, origin),
          [
            context.record["super.constructor"] === ".default"
              ? makeIntrinsicExpression("Object", origin)
              : makeReadExpression(context.record["super.constructor"], origin),
            arguments_,
            makeNewTargetExpression(context, origin),
          ],
          origin,
        ),
        origin,
      );
  }
};
