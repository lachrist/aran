import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { report } from "./node.mjs";

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSyntaxErrorExpression = (message, path) =>
  report(makeThrowErrorExpression("SyntaxError", message, path), {
    name: "SyntaxError",
    message,
  });
