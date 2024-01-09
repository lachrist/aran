const DECLARE = {
  "declare.var": /** @type {"var"} */ ("var"),
  "declare.let": /** @type {"var"} */ ("let"),
};

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 * ) => estree.Statement}
 */
export const makeDeclaration = ({ type, variable }) => ({
  type: "VariableDeclaration",
  kind: DECLARE[type],
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
