import { map } from "../util/index.mjs";
import { mangleExternal } from "./mangle.mjs";

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const makeDeclaration = ({ kind, variable }, config) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleExternal(variable, config),
      init: null,
    },
  ],
});

/**
 * @type {(
 *   head: import("../header").DeclareHeader[],
 *   config: import("./config").Config,
 * ) => estree.Statement[]}
 */
export const listDeclaration = (head, config) =>
  map(head, (variable) => makeDeclaration(variable, config));
