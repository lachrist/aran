import { AranTypeError, guard, mapMaybe } from "../util/index.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import { splitMeta } from "./mangle.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
  makeWriteParameterEffect,
} from "./node.mjs";
import { makeSyntaxErrorExpression } from "./report.mjs";

// Before, this file use @type{any} because ts does not infer conditional types.
// https://github.com/microsoft/TypeScript/issues/30152
//
// I tried function overloading, but that is not safer.
// /** @type {{(x: number) => string; (x: string) => number}} */
// https://github.com/microsoft/TypeScript/issues/25590

/**
 * @typedef {{
 *   type: "closure",
 *   kind: "arrow",
 *   proto: null,
 *   self: null,
 *   super: null,
 *   field: null,
 * } | {
 *   type: "closure",
 *   kind: "function",
 *   proto: null,
 *   self: null,
 *   super: null,
 *   field: null,
 * } | {
 *   type: "closure",
 *   kind: "method",
 *   proto: import("./cache.mjs").Cache,
 *   self: null,
 *   super: null,
 *   field: null,
 * } | {
 *   type: "closure",
 *   kind: "constructor",
 *   proto: null,
 *   self: import("./cache.mjs").Cache,
 *   super: import("./cache.mjs").Cache | null,
 *   field: import("./cache.mjs").Cache | null,
 * }} ClosureParam
 */

/**
 * @typedef {{
 *   type: "program",
 *   kind: "script",
 *   site: "global",
 *   enclave: boolean,
 * } | {
 *   type: "program",
 *   kind: "module",
 *   site: "global",
 *   enclave: boolean,
 * } | {
 *   type: "closure",
 *   kind: "method",
 *   proto: import("./cache.mjs").ConstantCache,
 *   self: null,
 *   super: null,
 *   field: null,
 * } | {
 *   type: "program",
 *   kind: "eval",
 *   site: "global" | "local",
 *   enclave: boolean,
 * }} ProgramParam
 */

/**
 * @typedef {{
 *   type: "block",
 *   this: null | import("./cache.mjs").ConstantCache,
 *   catch: boolean,
 * }} BlockParam
 */

/**
 * @typedef {ProgramParam | ClosureParam | BlockParam} Param
 */

/**
 * @type {(
 *   param: Param & { type: "closure" },
 * ) => param is Param & {
 *   type: "closure",
 *   kind: "function" | "method" | "constructor",
 * }}
 */
const isNotArrowClosureParam = (param) => param.kind !== "arrow";

/**
 * @type {(
 *   param: ClosureParam & { kind: "method" | "constructor" },
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSuperExpression = (param, path) => {
  switch (param.kind) {
    case "method": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makeReadCacheExpression(param.proto, path)],
        path,
      );
    }
    case "constructor": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.getPrototypeOf", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeGetExpression(
            makeReadCacheExpression(param.self, path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
        ],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid superable param", param);
    }
  }
};

////////////
// import //
////////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeImportExpression = (param, _path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local" && !param.enclave
      ? null
      : makeReadParameterExpression("import", _path);
  } else if (param.type === "closure" || param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

/////////////////
// import.meta //
/////////////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeImportMetaExpression = (param, _path) => {
  if (param.type === "program") {
    if (param.kind === "module") {
      return makeReadParameterExpression("import.meta", _path);
    } else if (
      param.kind === "eval" &&
      param.site === "local" &&
      !param.enclave
    ) {
      return null;
    } else {
      return makeSyntaxErrorExpression("Illegal 'import.meta' read", _path);
    }
  } else if (param.type === "closure" || param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

////////////////////////
// function.arguments //
////////////////////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeFunctionArgumentsExpression = (param, path) => {
  if (param.type === "program") {
    return makeSyntaxErrorExpression("Illegal 'function.arguments' read", path);
  } else if (param.type === "closure") {
    return makeReadParameterExpression("function.arguments", path);
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

/////////////////
// catch.error //
/////////////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeCatchErrorExpression = (param, path) => {
  if (param.type === "program") {
    return makeSyntaxErrorExpression("Illegal 'catch.error' read", path);
  } else if (param.type === "closure") {
    return null;
  } else if (param.type === "block") {
    return param.catch
      ? makeReadParameterExpression("catch.error", path)
      : null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

//////////
// this //
//////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeThisExpression = (param, path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local" && !param.enclave
      ? null
      : makeReadParameterExpression("this", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "constructor") {
      return param.super === null
        ? makeReadParameterExpression("this", path)
        : makeConditionalExpression(
            makeReadParameterExpression("this", path),
            makeReadParameterExpression("this", path),
            makeThrowErrorExpression(
              "ReferenceError",
              "Illegal 'this' read before calling 'super'",
              path,
            ),
            path,
          );
    } else if (param.kind === "method" || param.kind === "function") {
      return makeReadParameterExpression("this", path);
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return param.this === null
      ? null
      : makeReadCacheExpression(param.this, path);
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

////////////////
// new.target //
////////////////

/**
 * @type {(
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeNewTargetExpression = (param, path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local" && !param.enclave
      ? null
      : makeSyntaxErrorExpression("Illegal 'new.target' read", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (
      param.kind === "function" ||
      param.kind === "method" ||
      param.kind === "constructor"
    ) {
      return makeReadParameterExpression("new.target", path);
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

///////////////
// super.get //
///////////////

/**
 * @type {(
 *   param: Param,
 *   key: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeGetSuperExpression = (param, key, path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local"
      ? param.enclave
        ? makeApplyExpression(
            makeReadParameterExpression("super.get", path),
            makePrimitiveExpression({ undefined: null }, path),
            [key],
            path,
          )
        : null
      : makeSyntaxErrorExpression("Illegal 'super' get", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "function") {
      return makeSyntaxErrorExpression("Illegal 'super' get", path);
    } else if (param.kind === "method" || param.kind === "constructor") {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeSuperExpression(param, path),
          key,
          makeReadParameterExpression("this", path),
        ],
        path,
      );
    } else {
      throw new AranTypeError("invalid closure param", param);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

///////////////
// super.set //
///////////////

/**
 * @type {(
 *   param: Param & { type: "program" },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
const makeProgramSetSuperExpression = (param, key, value, path) =>
  param.kind === "eval" && param.site === "local"
    ? param.enclave
      ? makeApplyExpression(
          makeReadParameterExpression("super.set", path),
          makePrimitiveExpression({ undefined: null }, path),
          [key, value],
          path,
        )
      : null
    : makeSyntaxErrorExpression("Illegal 'super' set", path);

/**
 * @type {(
 *   strict: boolean,
 *   param: Param & {
 *     type: "closure",
 *     kind: "function" | "method" | "constructor",
 *   },
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listClosureSetSuperEffect = (strict, param, key, value, path) => {
  if (param.kind === "function") {
    return [
      makeExpressionEffect(
        makeSyntaxErrorExpression("Illegal 'super' set", path),
        path,
      ),
    ];
  } else if (param.kind === "method" || param.kind === "constructor") {
    return [
      makeExpressionEffect(
        guard(
          strict,
          (node) =>
            makeConditionalExpression(
              node,
              makeThrowErrorExpression(
                "TypeError",
                "Cannot assign object property",
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeSuperExpression(param, path),
              key,
              value,
              makeReadParameterExpression("this", path),
            ],
            path,
          ),
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid non-arrow closure param kind", param);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   param: Param,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listSetSuperEffect = (strict, param, key, value, path) => {
  if (param.type === "program") {
    return mapMaybe(
      makeProgramSetSuperExpression(param, key, value, path),
      (expression) => [makeExpressionEffect(expression, path)],
    );
  } else if (param.type === "closure") {
    return isNotArrowClosureParam(param)
      ? listClosureSetSuperEffect(strict, param, key, value, path)
      : null;
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   param: Param,
 *   key: aran.Expression<unbuild.Atom>,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeSetSuperExpression = (
  strict,
  param,
  key,
  value,
  path,
  meta,
) => {
  if (param.type === "program") {
    return makeProgramSetSuperExpression(param, key, value, path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "function") {
      return makeSyntaxErrorExpression("Illegal 'super' set", path);
    } else if (param.kind === "method" || param.kind === "constructor") {
      const metas = splitMeta(meta, ["key", "value"]);
      return isNotArrowClosureParam(param)
        ? makeInitCacheExpression(
            "constant",
            key,
            { path, meta: metas.key },
            (key) =>
              makeInitCacheExpression(
                "constant",
                value,
                { path, meta: metas.value },
                (value) =>
                  makeLongSequenceExpression(
                    listClosureSetSuperEffect(
                      strict,
                      param,
                      makeReadCacheExpression(key, path),
                      makeReadCacheExpression(value, path),
                      path,
                    ),
                    makeReadCacheExpression(value, path),
                    path,
                  ),
              ),
          )
        : null;
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

/////////////
// super() //
/////////////

/**
 * @type {(
 *   param: Param,
 *   arguments_: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeCallSuperExpression = (param, arguments_, path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local"
      ? param.enclave
        ? makeApplyExpression(
            makeReadParameterExpression("super.call", path),
            makePrimitiveExpression({ undefined: null }, path),
            [arguments_],
            path,
          )
        : null
      : makeSyntaxErrorExpression("Illegal 'super' call", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "function" || param.kind === "method") {
      return makeSyntaxErrorExpression("Illegal 'super' call", path);
    } else if (param.kind === "constructor") {
      return param.super === null
        ? makeSyntaxErrorExpression("Illegal 'super' call", path)
        : makeConditionalExpression(
            makeReadParameterExpression("this", path),
            makeThrowErrorExpression(
              "ReferenceError",
              "Super constructor can only be called once",
              path,
            ),
            makeLongSequenceExpression(
              [
                makeWriteParameterEffect(
                  "this",
                  makeApplyExpression(
                    makeIntrinsicExpression("Reflect.construct", path),
                    makePrimitiveExpression({ undefined: null }, path),
                    [
                      makeReadCacheExpression(param.super, path),
                      arguments_,
                      makeReadParameterExpression("new.target", path),
                    ],
                    path,
                  ),
                  path,
                ),
                ...(param.field === null
                  ? []
                  : [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadCacheExpression(param.field, path),
                          makeReadParameterExpression("this", path),
                          [],
                          path,
                        ),
                        path,
                      ),
                    ]),
              ],
              makeReadParameterExpression("this", path),
              path,
            ),
            path,
          );
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

/////////////////
// listPrelude //
/////////////////

/** @type {(path: unbuild.Path) => aran.Expression<unbuild.Atom>} */
const makePrototypeExpression = (path) =>
  makeConditionalExpression(
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeGetExpression(
            makeReadParameterExpression("new.target", path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          path,
        ),
        makePrimitiveExpression("object", path),
        path,
      ),
      makeBinaryExpression(
        "!==",
        makeGetExpression(
          makeReadParameterExpression("new.target", path),
          makePrimitiveExpression("prototype", path),
          path,
        ),
        makePrimitiveExpression(null, path),
        path,
      ),
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeGetExpression(
            makeReadParameterExpression("new.target", path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          path,
        ),
        makePrimitiveExpression("function", path),
        path,
      ),
      path,
    ),
    makeGetExpression(
      makeReadParameterExpression("new.target", path),
      makePrimitiveExpression("prototype", path),
      path,
    ),
    makeIntrinsicExpression("Object.prototype", path),
    path,
  );

/**
 * @type {(
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSloppyThisExpression = (path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "==",
      makeReadParameterExpression("this", path),
      makePrimitiveExpression(null, path),
      path,
    ),
    makeIntrinsicExpression("globalThis", path),
    makeApplyExpression(
      makeIntrinsicExpression("Object", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadParameterExpression("this", path)],
      path,
    ),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   param: Param,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listPreludeEffect = (strict, param, path) => {
  if (param.type === "program") {
    if (param.kind === "module") {
      return [];
    } else if (param.kind === "script") {
      return [
        makeWriteParameterEffect(
          "this",
          makeIntrinsicExpression("globalThis", path),
          path,
        ),
      ];
    } else if (param.kind === "eval") {
      if (param.site === "global") {
        return [
          makeWriteParameterEffect(
            "this",
            makeIntrinsicExpression("globalThis", path),
            path,
          ),
        ];
      } else if (param.site === "local") {
        return [];
      } else {
        throw new AranTypeError("invalid program param site", param.site);
      }
    } else {
      throw new AranTypeError("invalid program param kind", param);
    }
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return [];
    } else if (param.kind === "method") {
      return [
        makeConditionalEffect(
          makeReadParameterExpression("new.target", path),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Methods cannot be constructed",
                path,
              ),
              path,
            ),
          ],
          strict
            ? []
            : [
                makeWriteParameterEffect(
                  "this",
                  makeSloppyThisExpression(path),
                  path,
                ),
              ],
          path,
        ),
      ];
    } else if (param.kind === "function") {
      return [
        makeConditionalEffect(
          makeReadParameterExpression("new.target", path),
          [
            makeWriteParameterEffect(
              "this",
              makeObjectExpression(makePrototypeExpression(path), [], path),
              path,
            ),
          ],
          strict
            ? []
            : [
                makeWriteParameterEffect(
                  "this",
                  makeSloppyThisExpression(path),
                  path,
                ),
              ],
          path,
        ),
      ];
    } else if (param.kind === "constructor") {
      return [
        makeConditionalEffect(
          makeReadParameterExpression("new.target", path),
          param.super === null
            ? [
                makeWriteParameterEffect(
                  "this",
                  makeObjectExpression(makePrototypeExpression(path), [], path),
                  path,
                ),
              ]
            : [],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Constructors cannot be applied",
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ];
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return [];
  } else {
    throw new AranTypeError("invalid param", param);
  }
};

////////////
// result //
////////////

/**
 * @type {(
 *   result: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeIsProperObjectExpression = (result, path, meta) =>
  makeInitCacheExpression("constant", result, { path, meta }, (result) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeReadCacheExpression(result, path),
          path,
        ),
        makePrimitiveExpression("object", path),
        path,
      ),
      makeBinaryExpression(
        "!==",
        makeReadCacheExpression(result, path),
        makePrimitiveExpression(null, path),
        path,
      ),
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeReadCacheExpression(result, path),
          path,
        ),
        makePrimitiveExpression("function", path),
        path,
      ),
      path,
    ),
  );

/**
 * @type {(
 *   param: Param,
 *   result: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeResultExpression = (param, result, path, meta) => {
  if (param.type === "program") {
    return makeSyntaxErrorExpression("Illegal 'return' statement", path);
  } else if (param.type === "closure") {
    if (param.kind === "constructor") {
      if (result === null) {
        return param.super === null
          ? makeReadParameterExpression("this", path)
          : makeConditionalExpression(
              makeReadParameterExpression("this", path),
              makeReadParameterExpression("this", path),
              makeThrowErrorExpression(
                "ReferenceError",
                "Illegal completion before calling 'super'",
                path,
              ),
              path,
            );
      } else {
        const metas = splitMeta(meta, ["result", "proper"]);
        return makeInitCacheExpression(
          "constant",
          result,
          { path, meta: metas.result },
          (result) =>
            param.super === null
              ? makeConditionalExpression(
                  makeIsProperObjectExpression(
                    makeReadCacheExpression(result, path),
                    path,
                    metas.proper,
                  ),
                  makeReadCacheExpression(result, path),
                  makeReadParameterExpression("this", path),
                  path,
                )
              : makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeReadCacheExpression(result, path),
                    makePrimitiveExpression({ undefined: null }, path),
                    path,
                  ),
                  makeConditionalExpression(
                    makeReadParameterExpression("this", path),
                    makeReadParameterExpression("this", path),
                    makeThrowErrorExpression(
                      "ReferenceError",
                      "Illegal 'return' statement before calling 'super'",
                      path,
                    ),
                    path,
                  ),
                  makeConditionalExpression(
                    makeIsProperObjectExpression(
                      makeReadCacheExpression(result, path),
                      path,
                      metas.proper,
                    ),
                    makeReadCacheExpression(result, path),
                    makeThrowErrorExpression(
                      "TypeError",
                      "Derived constructors may only return object or undefined",
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
        );
      }
    } else if (param.kind === "function") {
      if (result === null) {
        return makeConditionalExpression(
          makeReadParameterExpression("new.target", path),
          makeReadParameterExpression("this", path),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        );
      } else {
        const metas = splitMeta(meta, ["result", "proper"]);
        return makeInitCacheExpression(
          "constant",
          result,
          { path, meta: metas.result },
          (result) =>
            makeConditionalExpression(
              makeReadParameterExpression("new.target", path),
              makeConditionalExpression(
                makeIsProperObjectExpression(
                  makeReadCacheExpression(result, path),
                  path,
                  metas.proper,
                ),
                makeReadCacheExpression(result, path),
                makeReadParameterExpression("this", path),
                path,
              ),
              makeReadCacheExpression(result, path),
              path,
            ),
        );
      }
    } else if (param.kind === "arrow" || param.kind === "method") {
      return result === null
        ? makePrimitiveExpression({ undefined: null }, path)
        : result;
    } else {
      throw new AranTypeError("invalid closure param kind", param);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};
