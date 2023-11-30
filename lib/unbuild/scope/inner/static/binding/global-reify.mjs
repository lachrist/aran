import {
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeConditionalEffect,
  makeEffectStatement,
  makeSequenceExpression,
} from "../../../../node.mjs";
import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeThrowErrorExpression,
} from "../../../../intrinsic.mjs";
import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../../error.mjs";
import {
  listImpureEffect,
  makeInitCacheExpression,
  makeReadCacheExpression,
} from "../../../../cache.mjs";
import { AranTypeError } from "../../../../../error.mjs";
import {
  listSetGlobalObjectEffect,
  makeDefineGlobalObjectExpression,
  makeHasNonConfigurableGlobalObjectExpression,
  makeGetGlobalObjectExpression,
} from "../../global-object.mjs";

/**
 * @typedef {import("./binding.js").GlobalBinding} GlobalBinding
 */

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
      : makeSequenceExpression(
          listImpureEffect(right, path),
          makeThrowConstantExpression(variable, path),
          path,
        ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/***
 * @type {(
 *   context: {},
 *   binding: GlobalBinding,
 * ) => unbuild.Variable[]}
 */
export const listReifyBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {},
 *   binding: GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listReifyBindingDeclareStatement = (
  context,
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
          makeDefineGlobalObjectExpression({ path }, context, {
            variable,
          }),
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
            makeHasNonConfigurableGlobalObjectExpression({ path }, context, {
              variable,
            }),
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
 *   context: {},
 *   binding: GlobalBinding,
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
 *   context: {},
 *   binding: GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingReadExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return makeGetGlobalObjectExpression({ path }, context, { variable });
  } else if (kind === "let" || kind === "const") {
    return makeReadHiddenExpression(variable, path);
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingTypeofExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return makeUnaryExpression(
      "typeof",
      makeGetGlobalObjectExpression({ path }, context, { variable }),
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
 *     mode: "strict" | "sloppy"
 *   },
 *   binding: GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingDiscardExpression = (
  context,
  { variable },
  path,
) => {
  switch (context.mode) {
    // delete variable is illegal in strict mode.
    // So this should never happen.
    // However it is left for consistency.
    case "strict": {
      return makeThrowErrorExpression(
        "TypeError",
        `Cannot delete binding ${variable}`,
        path,
      );
    }
    case "sloppy": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError("invalid context.mode", context.mode);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: GlobalBinding,
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
  if (kind === "var") {
    return listSetGlobalObjectEffect({ path }, context, { variable, right });
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
