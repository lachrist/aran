import { map } from "../util/index.mjs";
import { makeArbitraryIntrinsicExpression } from "./intrinsic.mjs";
import { mangleVariable } from "./mangle.mjs";

/**
 * @type {(
 *   bindings: [
 *     import("./atom.d.ts").Variable,
 *     import("../lang/syntax.d.ts").Intrinsic,
 *   ][],
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("../util/tree.d.ts").Tree<import("estree-sentry").Statement<{}>>}
 */
export const listDeclaration = (bindings, config) =>
  bindings.length === 0
    ? null
    : {
        type: "VariableDeclaration",
        kind: "let",
        declarations: map(bindings, ([variable, intrinsic]) => ({
          type: "VariableDeclarator",
          id: mangleVariable(variable, config),
          init:
            intrinsic === "undefined"
              ? null
              : makeArbitraryIntrinsicExpression(intrinsic, config),
        })),
      };
