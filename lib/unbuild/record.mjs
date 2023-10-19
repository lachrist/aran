import { makeSyntaxErrorExpression } from "./report.mjs";
import {
  makeGetExpression,
  makeLongSequenceExpression,
  makeSetExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeReadExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeWriteEffect,
} from "./node.mjs";

/**
 * @type {(
 *   context: {
 *     record: {
 *       "this": import("./context.d.ts").ThisRecord,
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
    case ".derived": {
      return makeConditionalExpression(
        makeReadExpression("this", path),
        makeReadExpression("this", path),
        makeThrowErrorExpression(
          "ReferenceError",
          "Must call super constructor in derived class before accessing 'this'",
          path,
        ),
        path,
      );
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
 *       "import.meta": import("./context.d.ts").ImportMetaRecord,
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
 *       "new.target": import("./context.d.ts").NewTargetRecord,
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
 *       "super.prototype": import("./context.d.ts").SuperPrototypeRecord,
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
 *       "super.prototype": import("./context.d.ts").SuperPrototypeRecord,
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
 *       "class.field": import("./context.d.ts").ClassFieldRecord,
 *     },
 *   },
 *   this_: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClassFieldEffect = (context, this_, path) => {
  switch (context.record["class.field"]) {
    case ".illegal": {
      return [
        makeExpressionEffect(
          makeSyntaxErrorExpression("illegal access to 'class.field'", path),
          path,
        ),
      ];
    }
    case ".none": {
      return [];
    }
    default: {
      return [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression(context.record["class.field"], path),
            this_,
            [],
            path,
          ),
          path,
        ),
      ];
    }
  }
};

/**
 * @type {(
 *   context: {
 *     record: {
 *       "super.constructor": import("./context.d.ts").SuperConstructorRecord,
 *       "new.target": import("./context.d.ts").NewTargetRecord,
 *       "class.field": import("./context.d.ts").ClassFieldRecord,
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
      // Directly accessing 'this' instead of makeThisExpression is kinda messy.
      return makeConditionalExpression(
        makeReadExpression("this", path),
        makeThrowErrorExpression(
          "ReferenceError",
          "Super constructor may only be called once",
          path,
        ),
        makeLongSequenceExpression(
          [
            makeWriteEffect(
              "this",
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.construct", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadExpression(context.record["super.constructor"], path),
                  arguments_,
                  makeNewTargetExpression(context, path),
                ],
                path,
              ),
              false,
              path,
            ),
            ...listClassFieldEffect(
              context,
              makeReadExpression("this", path),
              path,
            ),
          ],
          makeReadExpression("this", path),
          path,
        ),
        path,
      );
    }
  }
};
