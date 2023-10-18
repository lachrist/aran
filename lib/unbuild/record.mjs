import { makeSyntaxErrorExpression } from "./report.mjs";
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
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'this'", path);
    }
    case ".undefined": {
      return makePrimitiveExpression({ undefined: null }, path);
    }
    case ".global": {
      return makeIntrinsicExpression("globalThis", path);
    }
    default: {
      return makeReadExpression(context.record.this, path);
    }
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
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'import.meta'", path);
    }
    default: {
      return makeReadExpression(context.record["import.meta"], path);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "new.target":
 *         | ".illegal"
 *         | ".undefined"
 *         | aran.Parameter
 *         | unbuild.Variable
 *     },
 *   },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNewTargetExpression = (context, path) => {
  switch (context.record["new.target"]) {
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'new.target'", path);
    }
    case ".undefined": {
      return makePrimitiveExpression({ undefined: null }, path);
    }
    default: {
      return makeReadExpression(context.record["new.target"], path);
    }
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
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal get from 'super'", path);
    }
    case ".enclave": {
      return makeApplyExpression(
        makeReadExpression("super.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [key],
        path,
      );
    }
    default: {
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
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal set to 'super'", path);
    }
    case ".enclave": {
      return makeApplyExpression(
        makeReadExpression("super.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [key, value],
        path,
      );
    }
    default: {
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
 *       "class.field":
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
const makeClassFieldExpression = (context, this_, path) => {
  switch (context.record["class.field"]) {
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'class.field'", path);
    }
    case ".none": {
      return this_;
    }
    default: {
      return makeApplyExpression(
        makeReadExpression(context.record["class.field"], path),
        this_,
        [],
        path,
      );
    }
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
 *       "class.field":
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
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal call to 'super'", path);
    }
    case ".enclave": {
      return makeApplyExpression(
        makeReadExpression("super.call", path),
        makePrimitiveExpression({ undefined: null }, path),
        [arguments_],
        path,
      );
    }
    default: {
      return makeClassFieldExpression(
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
  }
};
