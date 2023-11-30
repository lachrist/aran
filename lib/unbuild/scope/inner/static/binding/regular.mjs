import { map } from "../../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeEffectStatement,
} from "../../../../node.mjs";
import { makeUnaryExpression } from "../../../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../../error.mjs";
import {
  mangleBaseDeadzoneVariable,
  mangleBaseOriginalVariable,
} from "../../../../mangle.mjs";
import {
  listImpureEffect,
  listInitCacheEffect,
  makeReadCacheExpression,
} from "../../../../cache.mjs";
import { AranTypeError } from "../../../../../error.mjs";

/**
 * @typedef {import("./binding.d.ts").RegularBinding} RegularBinding
 */

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 * ) => unbuild.Variable[]}
 */
export const listRegularBindingVariable = (_context, { kind, variable }) =>
  kind === "var" || kind === "callee"
    ? [mangleBaseOriginalVariable(variable)]
    : [
        mangleBaseDeadzoneVariable(variable),
        mangleBaseOriginalVariable(variable),
      ];

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingDeclareStatement = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "var" || kind === "callee") {
    return [
      makeEffectStatement(
        makeWriteBaseEffect(
          mangleBaseOriginalVariable(variable),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        path,
      ),
    ];
  } else if (kind === "let" || kind === "const") {
    return [
      makeEffectStatement(
        makeWriteBaseEffect(
          mangleBaseDeadzoneVariable(variable),
          makePrimitiveExpression(true, path),
          path,
        ),
        path,
      ),
    ];
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 *   right: aran.Expression<unbuild.Atom> | null,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeEffect = (
  _context,
  { kind, variable, exports },
  right,
  path,
) => {
  if (kind === "var" || kind === "callee") {
    return [
      ...(right === null
        ? []
        : [
            makeWriteBaseEffect(
              mangleBaseOriginalVariable(variable),
              right,
              path,
            ),
          ]),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
          path,
        ),
      ),
    ];
  } else if (kind === "let" || kind === "const") {
    return [
      makeWriteBaseEffect(
        mangleBaseOriginalVariable(variable),
        right ?? makePrimitiveExpression({ undefined: null }, path),
        path,
      ),
      makeWriteBaseEffect(
        mangleBaseDeadzoneVariable(variable),
        makePrimitiveExpression(false, path),
        path,
      ),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
          path,
        ),
      ),
    ];
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingReadExpression = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "var" || kind === "callee") {
    return makeReadBaseExpression(mangleBaseOriginalVariable(variable), path);
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
      makeThrowDeadzoneExpression(variable, path),
      makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
      path,
    );
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingTypeofExpression = (
  _context,
  { kind, variable },
  path,
) => {
  if (kind === "var" || kind === "callee") {
    return makeUnaryExpression(
      "typeof",
      makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
      path,
    );
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
      makeThrowDeadzoneExpression(variable, path),
      makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
        path,
      ),
      path,
    );
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingDiscardExpression = (_context, _binding, path) =>
  makePrimitiveExpression(false, path);

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: RegularBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  { mode },
  { kind, exports, variable },
  right,
  { path, meta },
) => {
  if (kind === "var") {
    return [
      makeWriteBaseEffect(mangleBaseOriginalVariable(variable), right, path),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
          path,
        ),
      ),
    ];
  } else if (kind === "callee") {
    return [
      ...listImpureEffect(right, path),
      ...(mode === "sloppy"
        ? []
        : [
            makeExpressionEffect(
              makeThrowConstantExpression(variable, path),
              path,
            ),
          ]),
    ];
  } else if (kind === "const") {
    return [
      ...listImpureEffect(right, path),
      makeConditionalEffect(
        makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
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
  } else if (kind === "let") {
    return listInitCacheEffect("constant", right, { path, meta }, (right) => [
      makeConditionalEffect(
        makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
        [
          makeExpressionEffect(
            makeThrowDeadzoneExpression(variable, path),
            path,
          ),
        ],
        [
          makeWriteBaseEffect(
            mangleBaseOriginalVariable(variable),
            makeReadCacheExpression(right, path),
            path,
          ),
          ...map(exports, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadBaseExpression(
                mangleBaseOriginalVariable(variable),
                path,
              ),
              path,
            ),
          ),
        ],
        path,
      ),
    ]);
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};
