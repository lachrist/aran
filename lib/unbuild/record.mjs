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
  makeConditionalEffect,
} from "./node.mjs";

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   path: unbuild.Path,
 * ) =>  aran.Expression<unbuild.Atom>}
 */
export const makeFunctionArgumentsExpression = (record, path) => {
  switch (record["function.arguments"]) {
    case ".illegal": {
      return makeSyntaxErrorExpression(
        "illegal access to 'function.arguments'",
        path,
      );
    }
    default: {
      return makeReadExpression("function.arguments", path);
    }
  }
};

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   path: unbuild.Path,
 * ) =>  aran.Expression<unbuild.Atom>}
 */
export const makeThisExpression = (record, path) => {
  switch (record.this) {
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
      return makeReadExpression(record.this, path);
    }
  }
};

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) =>  aran.Effect<unbuild.Atom>[]}
 */
export const listThisWriteEffect = (record, right, path) => {
  if (
    record.this === ".illegal" ||
    record.this === ".global" ||
    record.this === ".undefined"
  ) {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression("illegal write to 'this'", path),
        path,
      ),
    ];
  } else if (record.this === ".derived") {
    return [
      makeConditionalEffect(
        makeReadExpression("this", path),
        [makeWriteEffect("this", right, false, path)],
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "ReferenceError",
              "Super constructor can only be called once",
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ];
  } else {
    return [makeWriteEffect(record.this, right, false, path)];
  }
};

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportMetaExpression = (record, path) => {
  switch (record["import.meta"]) {
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'import.meta'", path);
    }
    default: {
      return makeReadExpression(record["import.meta"], path);
    }
  }
};

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeNewTargetExpression = (record, path) => {
  switch (record["new.target"]) {
    case ".illegal": {
      return makeSyntaxErrorExpression("illegal access to 'new.target'", path);
    }
    default: {
      return makeReadExpression(record["new.target"], path);
    }
  }
};

/**
 * @type {(
 *   record: import("./context.d.ts").Record,
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetSuperExpression = (record, key, path) => {
  switch (record["super.prototype"]) {
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
          [makeReadExpression(record["super.prototype"], path)],
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
 *   strict: boolean,
 *   record: import("./context.d.ts").Record,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetSuperExpression = (strict, record, key, value, path) => {
  switch (record["super.prototype"]) {
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
        strict,
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.getPrototypeOf", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makeReadExpression(record["super.prototype"], path)],
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
 *   record: import("./context.d.ts").Record,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClassFieldEffect = (record, path) => {
  switch (record["class.field"]) {
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
            makeReadExpression(record["class.field"], path),
            makeThisExpression(record, path),
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
 *   record: import("./context.d.ts").Record,
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeCallSuperExpression = (record, arguments_, path) => {
  switch (record["super.constructor"]) {
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
      return record.this === ".derived"
        ? makeLongSequenceExpression(
            [
              ...listThisWriteEffect(
                record,
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.construct", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeReadExpression(record["super.constructor"], path),
                    arguments_,
                    makeNewTargetExpression(record, path),
                  ],
                  path,
                ),
                path,
              ),
              ...listClassFieldEffect({ ...record, this: "this" }, path),
            ],
            makeThisExpression({ ...record, this: "this" }, path),
            path,
          )
        : makeSyntaxErrorExpression("illegal call to 'super'", path);
    }
  }
};
