import { AranTypeError } from "../../../../error.mjs";
import { guard, map } from "../../../../util/index.mjs";
import {
  listImpureEffect,
  listInitCacheEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeDataDescriptorExpression,
} from "../../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import {
  listDeclareAlienStatement,
  listWriteAlienEffect,
  makeDiscardAlienExpression,
  makeReadAlienExpression,
  makeTypeofAlienExpression,
} from "../../../param/index.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 * ) => unbuild.Variable[]}
 */
export const listAlienBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").GlobalProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listAlienBindingDeclareStatement = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return listDeclareAlienStatement(context, "var", variable, { path });
  } else if (kind === "let" || kind === "const") {
    return [
      ...listDeclareAlienStatement(context, "let", variable, { path }),
      ...map(
        listWriteAlienEffect(
          context,
          variable,
          makeIntrinsicExpression("aran.deadzone", path),
          { path },
        ),
        (node) => makeEffectStatement(node, path),
      ),
    ];
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").GlobalProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding & {
 *     kind: "let" | "const" | "var",
 *   },
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienBindingInitializeEffect = (
  context,
  { kind, variable },
  right,
  path,
) => {
  if (kind === "var") {
    return right
      ? listWriteAlienEffect(context, variable, right, { path })
      : [];
  } else if (kind === "let" || kind === "const") {
    return listWriteAlienEffect(
      context,
      variable,
      right === null
        ? makePrimitiveExpression({ undefined: null }, path)
        : right,
      { path },
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
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingReadExpression = (
  context,
  { kind, variable },
  { path, meta },
) => {
  if (kind === "var") {
    return makeReadAlienExpression(context, variable, { path });
  } else if (kind === "let" || kind === "const" || kind === "missing") {
    return makeInitCacheExpression(
      "constant",
      makeReadAlienExpression(context, variable, { path }),
      { path, meta },
      (value) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(value, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(variable, path),
          makeReadCacheExpression(value, path),
          path,
        ),
    );
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingTypeofExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return makeTypeofAlienExpression(context, variable, { path });
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadAlienExpression(context, variable, { path }),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeTypeofAlienExpression(context, variable, { path }),
      path,
    );
  } else if (kind === "missing") {
    // Hard to avoid triggering global accessors multiple times here.
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeTypeofAlienExpression(context, variable, { path }),
        makePrimitiveExpression("undefined", path),
        path,
      ),
      makePrimitiveExpression("undefined", path),
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadAlienExpression(context, variable, { path }),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(variable, path),
        makeTypeofAlienExpression(context, variable, { path }),
        path,
      ),
      path,
    );
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
 *     ),
 *   },
 *   binding: import("./binding.js").RootBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingDiscardExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var" || kind === "let" || kind === "const") {
    return makePrimitiveExpression(false, path);
  } else if (kind === "missing") {
    return makeDiscardAlienExpression(context, variable, { path });
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: (
 *       & import("../../../program.js").RootProgram
 *       & import("../../../program.js").AlienProgram
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
export const listAlienBindingWriteEffect = (
  context,
  { kind, variable },
  right,
  { path, meta },
) => {
  if (kind === "missing") {
    // Hard to avoid triggering global accessors multiple times here.
    return listInitCacheEffect("constant", right, { path, meta }, (right) =>
      guard(
        context.mode === "sloppy",
        (write_strict) => [
          makeConditionalEffect(
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
              makePrimitiveExpression(false, path),
              makeBinaryExpression(
                "===",
                makeTypeofAlienExpression(context, variable, { path }),
                makePrimitiveExpression("undefined", path),
                path,
              ),
              path,
            ),
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("Reflect.defineProperty", path),
                  makePrimitiveExpression({ undefined: null }, path),
                  [
                    makeIntrinsicExpression("aran.global", path),
                    makePrimitiveExpression(variable, path),
                    makeDataDescriptorExpression(
                      {
                        value: makeReadCacheExpression(right, path),
                        writable: true,
                        configurable: true,
                        enumerable: true,
                      },
                      path,
                    ),
                  ],
                  path,
                ),
                path,
              ),
            ],
            write_strict,
            path,
          ),
        ],
        [
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadAlienExpression(context, variable, { path }),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, path),
                path,
              ),
            ],
            listWriteAlienEffect(
              context,
              variable,
              makeReadCacheExpression(right, path),
              { path },
            ),
            path,
          ),
        ],
      ),
    );
  } else if (kind === "var") {
    return listWriteAlienEffect(context, variable, right, { path });
  } else if (kind === "let") {
    return listInitCacheEffect("constant", right, { path, meta }, (right) => [
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadAlienExpression(context, variable, { path }),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowDeadzoneExpression(variable, path),
            path,
          ),
        ],
        listWriteAlienEffect(
          context,
          variable,
          makeReadCacheExpression(right, path),
          { path },
        ),
        path,
      ),
    ]);
  } else if (kind === "const") {
    return [
      ...listImpureEffect(right, path),
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadAlienExpression(context, variable, { path }),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowDeadzoneExpression(variable, path),
            path,
          ),
        ],
        [
          makeExpressionEffect(
            makeThrowConstantExpression(variable, path),
            path,
          ),
        ],
        path,
      ),
    ];
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};
