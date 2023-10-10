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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThisExpression = (context, origin) => {
  switch (context.record.this) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta", origin);
    case ".undefined":
      return makePrimitiveExpression({ undefined: null });
    case ".global":
      return makeIntrinsicExpression("globalThis");
    default:
      return makeReadExpression(context.record.this);
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportMetaExpression = (context, origin) => {
  switch (context.record["import.meta"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal import.meta", origin);
    default:
      return makeReadExpression(context.record["import.meta"]);
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNewTargetExpression = (context, origin) => {
  switch (context.record["new.target"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal new.target", origin);
    default:
      return makeReadExpression(context.record["new.target"]);
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = (context, key, origin) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.get"),
        makePrimitiveExpression({ undefined: null }),
        [key],
      );
    default:
      return makeGetExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf"),
          makePrimitiveExpression({ undefined: null }),
          [makeReadExpression(context.record["super.prototype"])],
        ),
        key,
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (context, key, value, origin) => {
  switch (context.record["super.prototype"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super access", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.set"),
        makePrimitiveExpression({ undefined: null }),
        [key, value],
      );
    default:
      return makeSetExpression(
        context.strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf"),
          makePrimitiveExpression({ undefined: null }),
          [makeReadExpression(context.record["super.prototype"])],
        ),
        key,
        value,
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFieldSuperExpression = (context, this_, origin) => {
  switch (context.record["super.field"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super field", origin);
    case ".none":
      return this_;
    default:
      return makeApplyExpression(
        makeReadExpression(context.record["super.field"]),
        this_,
        [],
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
 *   origin: estree.Node,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = (context, arguments_, origin) => {
  switch (context.record["super.constructor"]) {
    case ".illegal":
      throw new SyntaxAranError("illegal super call", origin);
    case ".enclave":
      return makeApplyExpression(
        makeReadExpression("super.call"),
        makePrimitiveExpression({ undefined: null }),
        [arguments_],
      );
    default:
      return makeFieldSuperExpression(
        context,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct"),
          makePrimitiveExpression({ undefined: null }),
          [
            context.record["super.constructor"] === ".default"
              ? makeIntrinsicExpression("Object")
              : makeReadExpression(context.record["super.constructor"]),
            arguments_,
            makeNewTargetExpression(context, origin),
          ],
        ),
        origin,
      );
  }
};
