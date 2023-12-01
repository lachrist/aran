import { AranTypeError } from "../../../error.mjs";
import { isAlienProgram, isReifyGlobalProgram } from "../../program.mjs";
import {
  makeAlienReadExpression,
  makeAlienTypeofExpression,
  makeAlienDiscardExpression,
  listAlienWriteEffect,
} from "./alien.mjs";

import {
  makeReifyReadExpression,
  makeReifyTypeofExpression,
  makeReifyDiscardExpression,
  listReifyWriteEffect,
} from "./reify.mjs";

/**
 * @typedef {import("../../program.js").RootProgram} RootProgram
 */

/**
 * @typedef {import("../../program.js").AlienProgram} AlienProgram
 */

/**
 * @typedef {import("../../program.js").ReifyProgram} ReifyProgram
 */

/**
 * @typedef {import("../../program.js").GlobalProgram} GlobalProgram
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootReadExpression = (site, context, { variable }) => {
  if (isAlienProgram(context.root)) {
    return makeAlienReadExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else if (isReifyGlobalProgram(context.root)) {
    return makeReifyReadExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else {
    throw new AranTypeError("invalid context.root", context.root);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootTypeofExpression = (site, context, { variable }) => {
  if (isAlienProgram(context.root)) {
    return makeAlienTypeofExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else if (isReifyGlobalProgram(context.root)) {
    return makeReifyTypeofExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else {
    throw new AranTypeError("invalid context.root", context.root);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootDiscardExpression = (site, context, { variable }) => {
  if (isAlienProgram(context.root)) {
    return makeAlienDiscardExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else if (isReifyGlobalProgram(context.root)) {
    return makeReifyDiscardExpression(site, context, {
      situ: context.root.situ,
      variable,
    });
  } else {
    throw new AranTypeError("invalid context.root", context.root);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: RootProgram,
 *   },
 *   options: {
 *     variable: estree.Variable,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRootWriteEffect = (site, context, { variable, right }) => {
  if (isAlienProgram(context.root)) {
    return listAlienWriteEffect(site, context, {
      situ: context.root.situ,
      variable,
      right,
    });
  } else if (isReifyGlobalProgram(context.root)) {
    return listReifyWriteEffect(site, context, {
      situ: context.root.situ,
      variable,
      right,
    });
  } else {
    throw new AranTypeError("invalid context.root", context.root);
  }
};
