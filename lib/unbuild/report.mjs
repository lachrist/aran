import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { log } from "./node.mjs";

export const DUMMY_PRIMITIVE = /** @type {string} */ (
  "__ARAN_DUMMY_PRIMITIVE__"
);

export const DUMMY_KEY = /** @type {estree.Key} */ ("__ARAN_DUMMY_KEY_");

export const DUMMY_VARIABLE = /** @type {estree.Variable} */ (
  "__ARAN_DUMMY_VARIABLE__"
);

export const DUMMY_SOURCE = /** @type {estree.Source} */ (
  "__ARAN_DUMMY_SOURCE__"
);

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   message: string,
 * ) => N}
 */
export const logSyntaxError = (node, message) =>
  log(node, {
    name: "SyntaxError",
    message,
  });

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSyntaxErrorExpression = (message, path) =>
  logSyntaxError(
    makeThrowErrorExpression("SyntaxError", message, path),
    message,
  );

/**
 * @type {<N extends aran.Node<unbuild.Atom>>(
 *   node: N,
 *   message: string,
 * ) => N}
 */
export const logEnclaveLimitation = (node, message) =>
  log(node, {
    name: "EnclaveLimitation",
    message,
  });
