import { map } from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeEffectStatement,
  makeIntrinsicExpression,
} from "../../../node.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../../error.mjs";
import { mangleBaseVariable } from "../../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { listImpureEffect } from "../../../impure.mjs";
import { AranTypeError } from "../../../../error.mjs";
import {
  bindSequence,
  listenSequence,
  tellSequence,
} from "../../../sequence.mjs";

/**
 * @typedef {import("./binding.js").RegularBinding} RegularBinding
 */

/**
 * @type {(
 *   context: {},
 *   binding: RegularBinding,
 * ) => unbuild.Variable[]}
 */
export const listRegularBindingVariable = (_context, { variable }) => [
  mangleBaseVariable(variable),
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     kind: "var" | "let" | "const" | "callee",
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeInitialExpression = ({ path }, _context, { kind }) => {
  if (kind === "var" || kind === "callee") {
    return makePrimitiveExpression({ undefined: null }, path);
  } else if (kind === "let" || kind === "const") {
    return makeIntrinsicExpression("aran.deadzone", path);
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};

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
) => [
  makeEffectStatement(
    makeWriteBaseEffect(
      mangleBaseVariable(variable),
      makeInitialExpression({ path }, _context, { kind }),
      path,
    ),
    path,
  ),
];

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
        : [makeWriteBaseEffect(mangleBaseVariable(variable), right, path)]),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          path,
        ),
      ),
    ];
  } else if (kind === "let" || kind === "const") {
    return [
      makeWriteBaseEffect(
        mangleBaseVariable(variable),
        right ?? makePrimitiveExpression({ undefined: null }, path),
        path,
      ),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseVariable(variable), path),
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
    return makeReadBaseExpression(mangleBaseVariable(variable), path);
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadBaseExpression(mangleBaseVariable(variable), path),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeReadBaseExpression(mangleBaseVariable(variable), path),
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
      makeReadBaseExpression(mangleBaseVariable(variable), path),
      path,
    );
  } else if (kind === "let" || kind === "const") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadBaseExpression(mangleBaseVariable(variable), path),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makeThrowDeadzoneExpression(variable, path),
      makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseVariable(variable), path),
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
      makeWriteBaseEffect(mangleBaseVariable(variable), right, path),
      ...map(exports, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadBaseExpression(mangleBaseVariable(variable), path),
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
        makeBinaryExpression(
          "===",
          makeReadBaseExpression(mangleBaseVariable(variable), path),
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
  } else if (kind === "let") {
    return listenSequence(
      bindSequence(cacheConstant(meta, right, path), (right) =>
        tellSequence([
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadBaseExpression(mangleBaseVariable(variable), path),
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
              makeWriteBaseEffect(
                mangleBaseVariable(variable),
                makeReadCacheExpression(right, path),
                path,
              ),
              ...map(exports, (specifier) =>
                makeExportEffect(
                  specifier,
                  makeReadBaseExpression(mangleBaseVariable(variable), path),
                  path,
                ),
              ),
            ],
            path,
          ),
        ]),
      ),
    );
  } else {
    throw new AranTypeError(`invalid binding kind: ${kind}`);
  }
};
