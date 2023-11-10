// TODO use lib/unbuild/param/enclave instead

import { AranTypeError, guard_ } from "../../../../util/index.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeDeclareGlobalStatement,
  makeWriteGlobalEffect,
  makeReadGlobalExpression,
  makeTypeofGlobalExpression,
  makeEffectStatement,
  makeReadParameterExpression,
} from "../../../node.mjs";
import { logEnclaveLimitation } from "../../../report.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     situ: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listEnclaveBindingVariable = (_context, _binding, _variable) => [];

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     situ: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingDeclareStatement = (
  { mode },
  binding,
  variable,
  path,
) =>
  binding.kind === "var"
    ? [
        guard_(
          mode === "sloppy",
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
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding & {
 *     situ: "global",
 *     kind: "let" | "const" | "var",
 *   },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listEnclaveBindingInitializeStatement = (
  _context,
  binding,
  variable,
  right,
  path,
) =>
  binding.kind === "var"
    ? [makeEffectStatement(makeWriteGlobalEffect(variable, right, path), path)]
    : [makeDeclareGlobalStatement(binding.kind, variable, right, path)];

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingReadExpression = (
  _context,
  { situ },
  variable,
  path,
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.read", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeReadGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingTypeofExpression = (
  _context,
  { situ },
  variable,
  path,
) => {
  switch (situ) {
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("scope.typeof", path),
        makePrimitiveExpression({ undefined: null }, path),
        [makePrimitiveExpression(variable, path)],
        path,
      );
    }
    case "global": {
      return makeTypeofGlobalExpression(variable, path);
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeEnclaveBindingDiscardExpression = (
  _context,
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
 *   context: {},
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>}
 */
const listWriteEffect = (_context, { situ }, variable, right, path) => {
  switch (situ) {
    case "local": {
      return makeExpressionEffect(
        makeApplyExpression(
          makeReadParameterExpression("scope.write", path),
          makePrimitiveExpression({ undefined: null }, path),
          [makePrimitiveExpression(variable, path), right],
          path,
        ),
        path,
      );
    }
    case "global": {
      return makeWriteGlobalEffect(variable, right, path);
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};

/**
 * @type {(
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   binding: import("./binding.d.ts").EnclaveBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listEnclaveBindingWriteEffect = (
  { mode },
  binding,
  variable,
  right,
  path,
) => [
  guard_(
    mode === "sloppy",
    logEnclaveLimitation,
    listWriteEffect(mode, binding, variable, right, path),
    `turning strict sloppy variable assignment ${stringifyJSON(variable)}`,
  ),
];
