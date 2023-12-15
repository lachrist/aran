import { AranError } from "../../../error.mjs";
import { makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makeImportExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeThrowConstantExpression } from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import("./import.d.ts").ImportBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeImportLoadExpression = (
  { path },
  _context,
  { operation, binding: { source, specifier } },
) => {
  switch (operation) {
    case "read": {
      return makeImportExpression(source, specifier, path);
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeImportExpression(source, specifier, path),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranError("invalid load operation", operation);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import("./import.d.ts").ImportBinding,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listImportSaveEffect = (
  { path },
  _context,
  { operation, variable },
) => {
  switch (operation) {
    case "initialize": {
      throw new AranError("import variable should not be initialized", {
        variable,
      });
    }
    case "write": {
      return [
        makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
      ];
    }
    default: {
      throw new AranError("invalid save operation", operation);
    }
  }
};
