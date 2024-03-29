import { AranTypeError } from "../../../../error.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { listImpureEffect } from "../../../impure.mjs";
import { makeBinaryExpression } from "../../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
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
  bindSequence,
  listenSequence,
  mapSequence,
  sequenceExpression,
  tellSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").GlobalBinding,
 * ) => unbuild.Variable[]}
 */
export const listAlienBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listAlienBindingDeclareEffect = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return listDeclareAlienStatement({ path }, context, {
      situ: "global",
      kind: "var",
      variable,
    });
  } else if (kind === "let" || kind === "const") {
    return [
      ...listDeclareAlienStatement({ path }, context, {
        situ: "global",
        kind: "let",
        variable,
      }),
      ...listWriteAlienEffect({ path }, context, {
        situ: "global",
        variable,
        right: makeIntrinsicExpression("aran.deadzone", path),
      }),
    ];
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
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
      ? listWriteAlienEffect({ path }, context, {
          situ: "global",
          variable,
          right,
        })
      : [];
  } else if (kind === "let" || kind === "const") {
    return listWriteAlienEffect({ path }, context, {
      situ: "global",
      variable,
      right:
        right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : right,
    });
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
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
    return makeReadAlienExpression({ path }, context, {
      situ: "global",
      variable,
    });
  } else if (kind === "let" || kind === "const") {
    return sequenceExpression(
      mapSequence(
        cacheConstant(
          meta,
          makeReadAlienExpression({ path }, context, {
            situ: "global",
            variable,
          }),
          path,
        ),
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
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeAlienBindingTypeofExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return makeTypeofAlienExpression({ path }, context, {
      situ: "global",
      variable,
    });
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadAlienExpression({ path }, context, {
          situ: "global",
          variable,
        }),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeTypeofAlienExpression({ path }, context, {
        situ: "global",
        variable,
      }),
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
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
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
    return makeDiscardAlienExpression({ path }, context, {
      situ: "global",
      variable,
    });
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").GlobalBinding,
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
  if (kind === "var") {
    return listWriteAlienEffect({ path }, context, {
      situ: "global",
      variable,
      right,
    });
  } else if (kind === "let") {
    return listenSequence(
      bindSequence(cacheConstant(meta, right, path), (right) =>
        tellSequence([
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadAlienExpression({ path }, context, {
                situ: "global",
                variable,
              }),
              makeIntrinsicExpression("aran.deadzone", path),
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, path),
                path,
              ),
            ],
            listWriteAlienEffect({ path }, context, {
              situ: "global",
              variable,
              right: makeReadCacheExpression(right, path),
            }),
            path,
          ),
        ]),
      ),
    );
  } else if (kind === "const") {
    return [
      ...listImpureEffect(right, path),
      makeConditionalEffect(
        makeBinaryExpression(
          "===",
          makeReadAlienExpression({ path }, context, {
            situ: "global",
            variable,
          }),
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
