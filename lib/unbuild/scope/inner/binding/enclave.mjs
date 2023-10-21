import { AranTypeError, guard_ } from "../../../../util/index.mjs";
import { makeCacheTakeExpression } from "../../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeDeclareGlobalStatement,
  makeWriteGlobalEffect,
  makeReadGlobalExpression,
  makeTypeofGlobalExpression,
  makeEffectStatement,
} from "../../../node.mjs";
import { logEnclaveLimitation } from "../../../report.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     site: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     site: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  strict,
  binding,
  variable,
  path,
) =>
  binding.kind === "var"
    ? [
        guard_(
          strict,
          logEnclaveLimitation,
          makeDeclareGlobalStatement(
            "var",
            variable,
            makePrimitiveExpression({ undefined: null }, path),
            path,
          ),
          `turning strict sloppy variable declaration ${stringifyJSON(
            variable,
          )}`,
        ),
      ]
    : [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     site: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   right: import("../../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  binding,
  variable,
  right,
  path,
) =>
  binding.kind === "var"
    ? [
        makeEffectStatement(
          makeWriteGlobalEffect(
            variable,
            makeCacheTakeExpression(right, path),
            path,
          ),
          path,
        ),
      ]
    : [
        makeDeclareGlobalStatement(
          binding.kind,
          variable,
          makeCacheTakeExpression(right, path),
          path,
        ),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  _strict,
  { site },
  variable,
  path,
) => {
  switch (site) {
    case "local": {
      return makeApplyExpression(
        makeReadExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeReadGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid site", site);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _strict,
  { site },
  variable,
  path,
) => {
  switch (site) {
    case "local": {
      return makeApplyExpression(
        makeReadExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeTypeofGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid site", site);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _strict,
  _binding,
  variable,
  path,
) =>
  logEnclaveLimitation(
    makePrimitiveExpression(false, path),
    `ignoring external variable deletion ${stringifyJSON(variable)}`,
  );

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   right: import("../../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
const listWriteEffect = (_strict, { site }, variable, right, path) => {
  switch (site) {
    case "local": {
      return makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("scope.write", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(variable, path),
            makeCacheTakeExpression(right, path),
          ],
          path,
        ),
        path,
      );
    }
    case "global": {
      return makeWriteGlobalEffect(
        variable,
        makeCacheTakeExpression(right, path),
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid site", site);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   right: import("../../../cache.mjs").Cache,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  path,
) => [
  guard_(
    strict,
    logEnclaveLimitation,
    listWriteEffect(strict, binding, variable, right, path),
    `turning strict sloppy variable assignment ${stringifyJSON(variable)}`,
  ),
];
