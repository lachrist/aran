import { AranError, AranTypeError } from "../error.mjs";
import { hasDirectEvalCall } from "../unbuild/query/eval.mjs";
import { mangleParameter } from "./mangle.mjs";
import { hasParameter } from "./query.mjs";

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: {
 *     root: aran.Program<rebuild.Atom>,
 *     config: import("./config").Config,
 *     hints: import("../hint").Hint[],
 *     has_direct_eval_call: boolean,
 *   },
 * ) => estree.Statement[]}
 */
export const makeParameterDeclarator = (
  parameter,
  { config, hints, has_direct_eval_call, root },
) => {
  switch (parameter) {
    case "import.meta": {
      switch (root.sort.kind) {
        case "module": {
          if (hasParameter(root, "import.meta") || has_direct_eval_call) {
            return [
              {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: mangleParameter("import.meta", config),
                    init: {
                      type: "MetaProperty",
                      meta: {
                        type: "Identifier",
                        name: "import",
                      },
                      property: {
                        type: "Identifier",
                        name: "meta",
                      },
                    },
                  },
                ],
              },
            ];
          } else {
            return [];
          }
        }
        case "script": {
          if (hasParameter(root, "import.meta")) {
            throw new AranError(
              "Illegal access to import.meta in script program",
            );
          } else {
            return [];
          }
        }
        case "eval": {
          switch (root.sort.situ) {
            case "global": {
              if (hasParameter(root, "import.meta")) {
                throw new AranError(
                  "Illegal access to import.meta in global eval program",
                );
              } else {
                return [];
              }
            }
            case "local.internal": {
              if (hasParameter(root, "import.meta")) {
                return [
                  {
                    type: "ExpressionStatement",
                    expression: {
                      type: "MetaProperty",
                      meta: {
                        type: "Identifier",
                        name: "import",
                      },
                      property: {
                        type: "Identifier",
                        name: "meta",
                      },
                    },
                  },
                ];
              } else {
                return [];
              }
            }
            case "local.external": {
            }
            default: {
              throw new AranTypeError(root.sort.situ);
            }
          }
        }
        default: {
          throw new AranTypeError(root.sort);
        }
      }
    }
    default: {
      throw new AranTypeError(parameter);
    }
  }
};
