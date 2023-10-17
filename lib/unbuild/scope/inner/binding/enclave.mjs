import { StaticError } from "../../../../util/index.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeDeclareGlobalStatement,
  makeWriteGlobalEffect,
  makeReadGlobalExpression,
  makeTypeofGlobalExpression,
} from "../../../node.mjs";
import { logEnclaveLimitation } from "../../../report.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  _strict,
  _binding,
  _variable,
  _path,
) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding & { site: "global", kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  path,
) => [
  makeDeclareGlobalStatement(
    kind,
    variable,
    makeReadExpression(right, path),
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
      throw new StaticError("invalid site", site);
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
      throw new StaticError("invalid site", site);
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
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
export const listWriteEffect = (_strict, { site }, variable, right, path) => {
  switch (site) {
    case "local": {
      return makeExpressionEffect(
        makeApplyExpression(
          makeReadExpression("scope.write", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makePrimitiveExpression(variable, path),
            makeReadExpression(right, path),
          ],
          path,
        ),
        path,
      );
    }
    case "global": {
      return makeWriteGlobalEffect(
        variable,
        makeReadExpression(right, path),
        path,
      );
    }
    default: {
      throw new StaticError("invalid site", site);
    }
  }
};

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  strict,
  binding,
  variable,
  right,
  path,
) => {
  const effect = listWriteEffect(strict, binding, variable, right, path);
  return [
    strict
      ? effect
      : logEnclaveLimitation(
          effect,
          `turning strict sloppy variable assignment ${stringifyJSON(
            variable,
          )}`,
        ),
  ];
};
