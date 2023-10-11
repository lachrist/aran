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
 *   path: unbuild.Path,
 * ) =>  aran.Expression<unbuild.Atom>}
 */
export const makeThisExpression = (context, path) => {
  switch (context.record.this) {
    case ".illegal":
      throw new SyntaxAranError("illegal this access", null);
    case ".undefined":
      return makePrimitiveExpression({ undefined: null }, path);
    case ".global":
      return makeIntrinsicExpression("globalThis", path);
    default:
      return makeReadExpression(context.record.this, path);
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportMetaExpression = (context, path) => {
  switch (context.record["import.meta"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta access", null);
    default:
      return makeReadExpression(context.record["import.meta"], path);
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNewTargetExpression = (context, path) => {
  switch (context.record["new.target"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal new.target access", null);
    default:
      return makeReadExpression(context.record["new.target"], path);
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = (context, key, path) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [key],
        path,
      );
    default:
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadExpression(context.record["super.prototype"], path)],
          path,
        ),
        key,
        path,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (context, key, value, path) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [key, value],
        path,
      );
    default:
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadExpression(context.record["super.prototype"], path)],
          path,
        ),
        key,
        value,
        path,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFieldSuperExpression = (context, this_, path) => {
  switch (context.record["super.field"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super field", null);
    case ".none":
      return this_;
    default:
      return makeApplyExpression(
        makeReadExpression(context.record["super.field"], path),
        this_,
        [],
        path,
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
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = (context, arguments_, path) => {
  switch (context.record["super.constructor"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super call", null);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.call", path),
        makePrimitiveExpression({ undefined: null }, path),
        [arguments_],
        path,
      );
    default:
      return makeFieldSuperExpression(
        context,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            context.record["super.constructor"] === ".default"
              ? makeIntrinsicExpression("Object", path)
              : makeReadExpression(context.record["super.constructor"], path),
            arguments_,
            makeNewTargetExpression(context, path),
          ],
          path,
        ),
        path,
      );
  }
};
