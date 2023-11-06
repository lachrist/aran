import { AranTypeError, guard, mapMaybe } from "../../../util/index.mjs";
import {
  makeCacheExpression,
  makeRecordCacheExpression,
} from "../../cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeLongSequenceExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../../intrinsic.mjs";
import { splitMeta } from "../../mangle.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
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

/**
 * @type {(
 *   param: Param & { type: "closure" },
 * ) => param is Param & {
 *   type: "closure",
 *   kind: "function" | "method" | "constructor",
 * }}
 */
const isNotArrowClosureParam = (param) => param.kind !== "arrow";

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
          makeReadExpression("super.set", path),
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
              value,
              makeReadExpression("this", path),
            ],
            path,
          ),
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid non-arrow closure param kind", param.kind);
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
      return isNotArrowClosureParam(param)
        ? makeRecordCacheExpression(
            { key, value },
            path,
            meta,
            ({ key, value }) =>
              makeLongSequenceExpression(
                listClosureSetSuperEffect(strict, param, key, value, path),
                value,
                path,
              ),
          )
        : null;
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

/** @type {(path: unbuild.Path) => aran.Expression<unbuild.Atom>} */
const makePrototypeExpression = (path) =>
  makeConditionalExpression(
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeGetExpression(
            makeReadExpression("new.target", path),
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
          makeReadExpression("new.target", path),
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
            makeReadExpression("new.target", path),
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
      makeReadExpression("new.target", path),
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
              makeObjectExpression(makePrototypeExpression(path), [], path),
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
                  makeObjectExpression(makePrototypeExpression(path), [], path),
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
 *   result: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeIsProperObjectExpression = (result, path, meta) =>
  makeCacheExpression(result, path, meta, (result) =>
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeUnaryExpression("typeof", result, path),
        makePrimitiveExpression("object", path),
        path,
      ),
      makeBinaryExpression(
        "!==",
        result,
        makePrimitiveExpression(null, path),
        path,
      ),
      makeBinaryExpression(
        "===",
        makeUnaryExpression("typeof", result, path),
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
            );
      } else {
        const metas = splitMeta(meta, ["result", "proper"]);
        return makeCacheExpression(result, path, metas.result, (result) =>
          param.super === null
            ? makeConditionalExpression(
                makeIsProperObjectExpression(result, path, metas.proper),
                result,
                makeReadExpression("this", path),
                path,
              )
            : makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  result,
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
                  makeIsProperObjectExpression(result, path, metas.proper),
                  result,
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
          makeReadExpression("new.target", path),
          makeReadExpression("this", path),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        );
      } else {
        const metas = splitMeta(meta, ["result", "proper"]);
        return makeCacheExpression(result, path, metas.result, (result) =>
          makeConditionalExpression(
            makeReadExpression("new.target", path),
            makeConditionalExpression(
              makeIsProperObjectExpression(result, path, metas.proper),
              result,
              makeReadExpression("this", path),
              path,
            ),
            result,
            path,
          ),
        );
      }
    } else if (param.kind === "arrow" || param.kind === "method") {
      return result === null
        ? makePrimitiveExpression({ undefined: null }, path)
        : result;
    } else {
      throw new AranTypeError("invalid closure param kind", param.kind);
    }
  } else if (param.type === "block") {
    return null;
  } else {
    throw new AranTypeError("invalid param", param);
  }
};
