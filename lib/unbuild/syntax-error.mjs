import { makeThrowErrorExpression } from "./intrinsic.mjs";
import { tellLog } from "./node.mjs";

/**
 * @type {(
 *   message: string,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSyntaxErrorExpression = (message, path) =>
  tellLog(makeThrowErrorExpression("SyntaxError", message, path), {
    name: "SyntaxError",
    message,
  });
