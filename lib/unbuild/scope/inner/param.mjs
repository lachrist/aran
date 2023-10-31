import { AranTypeError, guard } from "../../../util/index.mjs";
import {
  makeCacheLoadExpression,
  makeCacheSaveExpression,
  makeCacheTakeExpression,
} from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../../node.mjs";
import { makeSyntaxErrorExpression } from "../../report.mjs";

// Before, this file use @type{any} because ts does not infer conditional types.
// https://github.com/microsoft/TypeScript/issues/30152
//
// I tried function overloading, but that is not safer.
// /** @type {{(x: number) => string; (x: string) => number}} */
// https://github.com/microsoft/TypeScript/issues/25590

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @typedef {Omit<import("./frame.mjs").ProgramFrame, "kinds" | "import" | "export">} ProgramParam
 */

/**
 * @typedef {Omit<import("./frame.mjs").ClosureFrame, "kinds">} ClosureParam
 */

/**
 * @typedef {Omit<import("./frame.mjs").BlockFrame, "kinds">} BlockParam
 */

/**
 * @typedef {ProgramParam | ClosureParam | BlockParam} Param
 */

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
      : makeReadExpression("import", _path);
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
      return makeReadExpression("import.meta", _path);
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
    return makeReadExpression("function.arguments", path);
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
    return param.catch ? makeReadExpression("catch.error", path) : null;
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
      : makeReadExpression("this", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "constructor") {
      return param.super === null
        ? makeReadExpression("this", path)
        : makeConditionalExpression(
            makeReadExpression("this", path),
            makeReadExpression("this", path),
            makeThrowErrorExpression(
              "ReferenceError",
              "Illegal 'this' read before calling 'super'",
              path,
            ),
            path,
          );
    } else if (param.kind === "method" || param.kind === "function") {
      return makeReadExpression("this", path);
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
    }
  } else if (param.type === "block") {
    return param.this === null ? null : makeReadExpression(param.this, path);
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
      return makeReadExpression("new.target", path);
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
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
            makeReadExpression("super.get", path),
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
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.getPrototypeOf", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeReadExpression(
                /** @type {unbuild.Variable} */ (param.self),
                path,
              ),
            ],
            path,
          ),
          key,
          makeReadExpression("this", path),
        ],
        path,
      );
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
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
 *   strict: boolean,
 *   param: Param,
 *   key: Cache,
 *   value: Cache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeSetSuperExpression = (strict, param, key, value, path) => {
  if (param.type === "program") {
    return param.kind === "eval" && param.site === "local"
      ? param.enclave
        ? makeApplyExpression(
            makeReadExpression("super.set", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeCacheTakeExpression(key, path),
              makeCacheTakeExpression(value, path),
            ],
            path,
          )
        : null
      : makeSyntaxErrorExpression("Illegal 'super' set", path);
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return null;
    } else if (param.kind === "function") {
      return makeSyntaxErrorExpression("Illegal 'super' set", path);
    } else if (param.kind === "method" || param.kind === "constructor") {
      return makeCacheSaveExpression(key, path, (key) =>
        makeCacheSaveExpression(value, path, (value) =>
          makeSequenceExpression(
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
                    makeApplyExpression(
                      makeIntrinsicExpression("Reflect.getPrototypeOf", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [
                        makeReadExpression(
                          /** @type {unbuild.Variable} */ (param.self),
                          path,
                        ),
                      ],
                      path,
                    ),
                    makeCacheLoadExpression(key, path),
                    makeCacheLoadExpression(value, path),
                    makeReadExpression("this", path),
                  ],
                  path,
                ),
              ),
              path,
            ),
            makeCacheLoadExpression(value, path),
            path,
          ),
        ),
      );
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
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
            makeReadExpression("super.call", path),
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
            makeReadExpression("this", path),
            makeThrowErrorExpression(
              "ReferenceError",
              "Super constructor can only be called once",
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
                      makeReadExpression(param.super, path),
                      arguments_,
                      makeReadExpression("new.target", path),
                    ],
                    path,
                  ),
                  false,
                  path,
                ),
                ...(param.field === null
                  ? []
                  : [
                      makeExpressionEffect(
                        makeApplyExpression(
                          makeReadExpression(param.field, path),
                          makeReadExpression("this", path),
                          [],
                          path,
                        ),
                        path,
                      ),
                    ]),
              ],
              makeReadExpression("this", path),
              path,
            ),
            path,
          );
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
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

/**
 * @type {(
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeSloppyThisExpression = (path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "==",
      makeReadExpression("this", path),
      makePrimitiveExpression(null, path),
      path,
    ),
    makeIntrinsicExpression("globalThis", path),
    makeApplyExpression(
      makeIntrinsicExpression("Object", path),
      makePrimitiveExpression({ undefined: null }, path),
      [makeReadExpression("this", path)],
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
        makeWriteEffect(
          "this",
          makeIntrinsicExpression("globalThis", path),
          false,
          path,
        ),
      ];
    } else if (param.kind === "eval") {
      if (param.site === "global") {
        return [
          makeWriteEffect(
            "this",
            makeIntrinsicExpression("globalThis", path),
            false,
            path,
          ),
        ];
      } else if (param.site === "local") {
        return [];
      } else {
        throw new AranTypeError("invalid program param site", param.site);
      }
    } else {
      throw new AranTypeError("invalid program param kind", param.kind);
    }
  } else if (param.type === "closure") {
    if (param.kind === "arrow") {
      return [];
    } else if (param.kind === "method") {
      return [
        makeConditionalEffect(
          makeReadExpression("new.target", path),
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
                makeWriteEffect(
                  "this",
                  makeSloppyThisExpression(path),
                  false,
                  path,
                ),
              ],
          path,
        ),
      ];
    } else if (param.kind === "function") {
      return [
        makeConditionalEffect(
          makeReadExpression("new.target", path),
          [
            makeWriteEffect(
              "this",
              makeObjectExpression(
                makeGetExpression(
                  makeReadExpression("new.target", path),
                  makePrimitiveExpression("prototype", path),
                  path,
                ),
                [],
                path,
              ),
              false,
              path,
            ),
          ],
          strict
            ? []
            : [
                makeWriteEffect(
                  "this",
                  makeSloppyThisExpression(path),
                  false,
                  path,
                ),
              ],
          path,
        ),
      ];
    } else if (param.kind === "constructor") {
      return [
        makeConditionalEffect(
          makeReadExpression("new.target", path),
          param.super === null
            ? [
                makeWriteEffect(
                  "this",
                  makeObjectExpression(
                    makeGetExpression(
                      makeReadExpression("new.target", path),
                      makePrimitiveExpression("prototype", path),
                      path,
                    ),
                    [],
                    path,
                  ),
                  false,
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
      throw new AranTypeError("invalid closure param kind", param.kind);
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
 *   cache: import("../../cache.mjs").SavedCache,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeIsProperObjectExpression = (cache, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeCacheLoadExpression(cache, path), path),
      makePrimitiveExpression("object", path),
      path,
    ),
    makeBinaryExpression(
      "!==",
      makeCacheLoadExpression(cache, path),
      makePrimitiveExpression(null, path),
      path,
    ),
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeCacheLoadExpression(cache, path), path),
      makePrimitiveExpression("function", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   param: Param,
 *   result: Cache | null,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeResultExpression = (param, result, path) => {
  if (param.type === "program") {
    return makeSyntaxErrorExpression("Illegal 'return' statement", path);
  } else if (param.type === "closure") {
    if (param.kind === "constructor") {
      return result === null
        ? param.super === null
          ? makeReadExpression("this", path)
          : makeConditionalExpression(
              makeReadExpression("this", path),
              makeReadExpression("this", path),
              makeThrowErrorExpression(
                "ReferenceError",
                "Illegal completion before calling 'super'",
                path,
              ),
              path,
            )
        : makeCacheSaveExpression(result, path, (result) =>
            param.super === null
              ? makeConditionalExpression(
                  makeIsProperObjectExpression(result, path),
                  makeCacheLoadExpression(result, path),
                  makeReadExpression("this", path),
                  path,
                )
              : makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeCacheLoadExpression(result, path),
                    makePrimitiveExpression({ undefined: null }, path),
                    path,
                  ),
                  makeConditionalExpression(
                    makeReadExpression("this", path),
                    makeReadExpression("this", path),
                    makeThrowErrorExpression(
                      "ReferenceError",
                      "Illegal 'return' statement before calling 'super'",
                      path,
                    ),
                    path,
                  ),
                  makeConditionalExpression(
                    makeIsProperObjectExpression(result, path),
                    makeCacheLoadExpression(result, path),
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
    } else if (param.kind === "function") {
      return result === null
        ? makeConditionalExpression(
            makeReadExpression("new.target", path),
            makeReadExpression("this", path),
            makePrimitiveExpression({ undefined: null }, path),
            path,
          )
        : makeCacheSaveExpression(result, path, (result) =>
            makeConditionalExpression(
              makeReadExpression("new.target", path),
              makeConditionalExpression(
                makeIsProperObjectExpression(result, path),
                makeCacheLoadExpression(result, path),
                makeReadExpression("this", path),
                path,
              ),
              makeCacheLoadExpression(result, path),
              path,
            ),
          );
    } else if (param.kind === "arrow" || param.kind === "method") {
      return result === null
        ? makePrimitiveExpression({ undefined: null }, path)
        : makeCacheTakeExpression(result, path);
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};
