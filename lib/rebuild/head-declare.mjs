/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 * ) => estree.Statement}
 */
export const makeDeclaration = ({ kind, variable }) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: variable,
      },
      init: null,
    },
  ],
});
