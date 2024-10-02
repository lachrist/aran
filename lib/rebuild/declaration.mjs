import { map } from "../util/index.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleVariable } from "./mangle.mjs";

/**
 * @type {(
 *   bindings: [
 *     import("./atom").Variable,
 *     import("../lang").Intrinsic,
 *   ][],
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Statement<{}>[]}
 */
export const listDeclaration = (bindings, config) =>
  bindings.length === 0
    ? []
    : [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: map(bindings, ([variable, intrinsic]) => ({
            type: "VariableDeclarator",
            id: mangleVariable(variable, config),
            init:
              intrinsic === "undefined"
                ? null
                : makeIntrinsicExpression(intrinsic, config),
          })),
        },
      ];
