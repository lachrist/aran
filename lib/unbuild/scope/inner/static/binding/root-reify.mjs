import {
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeApplyExpression,
  makeConditionalEffect,
  makeEffectStatement,
} from "../../../../node.mjs";
import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeDeleteExpression,
  makeLongSequenceExpression,
} from "../../../../intrinsic.mjs";
import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../../error.mjs";
import {
  listImpureEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "../../../../cache.mjs";
import { splitMeta } from "../../../../mangle.mjs";
import { AranTypeError } from "../../../../../error.mjs";
import { guard } from "../../../../../util/index.mjs";

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeReadHiddenExpression = (variable, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeReadGlobalExpression = (variable, path) =>
  makeGetExpression(
    makeIntrinsicExpression("aran.global", path),
    makePrimitiveExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeWriteHiddenExpression = (writable, variable, right, path, meta) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    writable === null
      ? makeInitCacheExpression("constant", right, { path, meta }, (right) =>
          makeConditionalExpression(
            makeGetExpression(
              makeIntrinsicExpression("aran.record.variables", path),
              makePrimitiveExpression(variable, path),
              path,
            ),
            makeSetExpression(
              "strict",
              makeIntrinsicExpression("aran.record.values", path),
              makePrimitiveExpression(variable, path),
              makeReadCacheExpression(right, path),
              path,
            ),
            makeThrowConstantExpression(variable, path),
            path,
          ),
        )
      : writable
      ? makeSetExpression(
          "strict",
          makeIntrinsicExpression("aran.record.values", path),
          makePrimitiveExpression(variable, path),
          right,
          path,
        )
      : makeLongSequenceExpression(
          listImpureEffect(right, path),
          makeThrowConstantExpression(variable, path),
          path,
        ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeWriteGlobalExpression = (mode, variable, right, path) =>
  makeSetExpression(
    mode,
    makeIntrinsicExpression("aran.global", path),
    makePrimitiveExpression(variable, path),
    right,
    path,
  );

/***
 * @type {(
 *   context: {
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 * ) => unbuild.Variable[]}
 */
export const listReifyBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listReifyBindingDeclareStatement = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return [
      makeEffectStatement(
        makeConditionalEffect(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, path),
            makeIntrinsicExpression("aran.record.variables", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDuplicateExpression(variable, path),
              path,
            ),
          ],
          [
            makeExpressionEffect(
              makeConditionalExpression(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeIntrinsicExpression("aran.global", path),
                    makePrimitiveExpression(variable, path),
                    makeDataDescriptorExpression(
                      {
                        value: makePrimitiveExpression(
                          { undefined: null },
                          path,
                        ),
                        writable: true,
                        enumerable: true,
                        configurable: false,
                      },
                      path,
                    ),
                  ],
                  path,
                ),
                makePrimitiveExpression({ undefined: null }, path),
                makeThrowConstantExpression(variable, path),
                path,
              ),
              path,
            ),
          ],
          path,
        ),
        path,
      ),
    ];
  } else if (kind === "let" || kind === "const") {
    return [
      makeEffectStatement(
        makeConditionalEffect(
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable, path),
              makeIntrinsicExpression("aran.record.variables", path),
              path,
            ),
            makePrimitiveExpression(false, path),
            makeConditionalExpression(
              makeApplyExpression(
                makeIntrinsicExpression("Object.hasOwn", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeIntrinsicExpression("aran.global", path),
                  makePrimitiveExpression(variable, path),
                ],
                path,
              ),
              makeGetExpression(
                makeApplyExpression(
                  makeIntrinsicExpression(
                    "Reflect.getOwnPropertyDescriptor",
                    path,
                  ),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeIntrinsicExpression("aran.global", path),
                    makePrimitiveExpression(variable, path),
                  ],
                  path,
                ),
                makePrimitiveExpression("configurable", path),
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            path,
          ),
          [
            makeExpressionEffect(
              makeSetExpression(
                "strict",
                makeIntrinsicExpression("aran.record.variables", path),
                makePrimitiveExpression(variable, path),
                makePrimitiveExpression(kind !== "const", path),
                path,
              ),
              path,
            ),
          ],
          [
            makeExpressionEffect(
              makeThrowDuplicateExpression(variable, path),
              path,
            ),
          ],
          path,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReifyBindingInitializeEffect = (
  _context,
  { kind, variable },
  right,
  path,
) => {
  if (kind === "var") {
    return right === null ? [] : [];
  } else if (kind === "let" || kind === "const") {
    return [
      makeExpressionEffect(
        makeSetExpression(
          "strict",
          makeIntrinsicExpression("aran.record.values", path),
          makePrimitiveExpression(variable, path),
          right ?? makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingReadExpression = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "missing") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, path),
        makeIntrinsicExpression("aran.record.variables", path),
        path,
      ),
      makeReadHiddenExpression(variable, path),
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, path),
          makeIntrinsicExpression("aran.global", path),
          path,
        ),
        makeReadGlobalExpression(variable, path),
        makeThrowMissingExpression(variable, path),
        path,
      ),
      path,
    );
  } else if (kind === "var") {
    return makeReadGlobalExpression(variable, path);
  } else if (kind === "let" || kind === "const") {
    return makeReadHiddenExpression(variable, path);
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingTypeofExpression = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "missing") {
    return makeUnaryExpression(
      "typeof",
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, path),
          makeIntrinsicExpression("aran.record.variables", path),
          path,
        ),
        makeReadHiddenExpression(variable, path),
        makeReadGlobalExpression(variable, path),
        path,
      ),
      path,
    );
  } else if (kind === "var") {
    return makeUnaryExpression(
      "typeof",
      makeReadGlobalExpression(variable, path),
      path,
    );
  } else if (kind === "let" || kind === "const") {
    return makeUnaryExpression(
      "typeof",
      makeReadHiddenExpression(variable, path),
      path,
    );
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingDiscardExpression = (
  { mode },
  { kind, variable },
  path,
) => {
  if (kind === "missing") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makePrimitiveExpression(variable, path),
        makeIntrinsicExpression("aran.record.variables", path),
        path,
      ),
      makePrimitiveExpression(false, path),
      makeDeleteExpression(
        mode,
        makeIntrinsicExpression("aran.global", path),
        makePrimitiveExpression(variable, path),
        path,
      ),
      path,
    );
  } else if (kind === "var" || kind === "let" || kind === "const") {
    return makePrimitiveExpression(false, path);
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../../program.js").RootProgram
 *       & import("../../../../program.js").GlobalProgram
 *       & import("../../../../program.js").ReifyProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReifyBindingWriteEffect = (
  context,
  { kind, variable },
  right,
  { path, meta },
) => {
  if (kind === "missing") {
    const metas = splitMeta(meta, ["right", "write"]);
    return [
      makeExpressionEffect(
        makeInitCacheExpression(
          "constant",
          right,
          { path, meta: metas.right },
          (right) =>
            makeConditionalExpression(
              makeBinaryExpression(
                "in",
                makePrimitiveExpression(variable, path),
                makeIntrinsicExpression("aran.record.variables", path),
                path,
              ),
              makeWriteHiddenExpression(
                null,
                variable,
                makeReadCacheExpression(right, path),
                path,
                metas.write,
              ),
              guard(
                context.mode === "strict",
                (write) =>
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "in",
                      makePrimitiveExpression(variable, path),
                      makeIntrinsicExpression("aran.global", path),
                      path,
                    ),
                    write,
                    makeThrowMissingExpression(variable, path),
                    path,
                  ),
                makeSetExpression(
                  "strict",
                  makeIntrinsicExpression("aran.record.values", path),
                  makePrimitiveExpression(variable, path),
                  makeReadCacheExpression(right, path),
                  path,
                ),
              ),
              path,
            ),
        ),
        path,
      ),
    ];
  } else if (kind === "var") {
    return [
      makeExpressionEffect(
        makeWriteGlobalExpression(context.mode, variable, right, path),
        path,
      ),
    ];
  } else if (kind === "let" || kind === "const") {
    return [
      makeExpressionEffect(
        makeWriteHiddenExpression(
          kind !== "const",
          variable,
          right,
          path,
          meta,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};
