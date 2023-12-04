import {
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeEffectStatement,
} from "../../../node.mjs";
import {
  makeUnaryExpression,
  makeThrowErrorExpression,
} from "../../../intrinsic.mjs";
import { makeThrowDuplicateExpression } from "../../error.mjs";
import { AranTypeError } from "../../../../error.mjs";
import {
  makeDefineGlobalObjectExpression,
  makeClashGlobalObjectExpression,
  makeReadGlobalObjectExpression,
  listWriteGlobalObjectEffect,
} from "../../global-object.mjs";
import {
  makeExistGlobalRecordExpression,
  listDeclareGlobalRecordEffect,
  listInitializeGlobalRecordEffect,
  makeReadGlobalRecordExpression,
  listWriteGlobalRecordEffect,
} from "../../global-record.mjs";

/***
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").GlobalBinding,
 * ) => unbuild.Variable[]}
 */
export const listReifyBindingVariable = (_context, _binding) => [];

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").GlobalBinding,
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
          makeExistGlobalRecordExpression({ path }, context, { variable }),
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
            makeExistGlobalRecordExpression({ path }, context, { variable }),
            makePrimitiveExpression(false, path),
            makeClashGlobalObjectExpression({ path }, context, {
              variable,
            }),
            path,
          ),
          listDeclareGlobalRecordEffect({ path }, context, {
            writable: kind !== "const",
            variable,
          }),
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
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReifyBindingInitializeEffect = (
  context,
  { kind, variable },
  right,
  path,
) => {
  if (kind === "var") {
    return right === null ? [] : [];
  } else if (kind === "let" || kind === "const") {
    return listInitializeGlobalRecordEffect({ path }, context, {
      variable,
      right: right ?? makePrimitiveExpression({ undefined: null }, path),
    });
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeReifyBindingReadExpression = (
  context,
  { kind, variable },
  path,
) => {
  if (kind === "var") {
    return makeReadGlobalObjectExpression({ path }, context, { variable });
  } else if (kind === "let" || kind === "const") {
    return makeReadGlobalRecordExpression({ path }, context, { variable });
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").GlobalBinding,
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
      makeReadGlobalObjectExpression({ path }, context, { variable }),
      path,
    );
  } else if (kind === "let" || kind === "const") {
    return makeUnaryExpression(
      "typeof",
      makeReadGlobalRecordExpression({ path }, context, { variable }),
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
 *   binding: import("./binding.d.ts").GlobalBinding,
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
 *   binding: import("./binding.d.ts").GlobalBinding,
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
    return listWriteGlobalObjectEffect({ path }, context, { variable, right });
  } else if (kind === "let" || kind === "const") {
    return listWriteGlobalRecordEffect({ path, meta }, context, {
      writable: kind !== "const",
      variable,
      right,
    });
  } else {
    throw new AranTypeError("invalid present kind", kind);
  }
};
