import { drill, drillAll, drillArray, drillOne } from "../../drill.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeEffectStatement } from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPatternEffect, unbuildPatternStatement } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildInit = ({ node, path }, context) => {
  switch (node.type) {
    case "VariableDeclaration":
      return unbuildStatement({ node, path }, context, {
        labels: [],
        completion: null,
        loop: {
          break: null,
          continue: null,
        },
      });
    default:
      return map(unbuildEffect({ node, path }, context), (effect) =>
        makeEffectStatement(effect),
      );
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildLeftInit = ({ node, path }, context) => {
  switch (node.type) {
    case "VariableDeclaration":
      return flatMap(
        drillAll(drillArray({ node, path }, "declarations")),
        ({ node, path }) =>
          hasInit(node)
            ? unbuildEffect(drill({ node, path }, "init"), context)
            : [],
      );
    default:
      return [];
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     right: unbuild.Variable,
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildLeftBody = ({ node, path }, context, { right }) => {
  switch (node.type) {
    case "VariableDeclaration":
      return unbuildPatternStatement(
        drill(drillOne(drillArray({ node, path }, "declarations"), 0), "id"),
        context,
        { right },
      );
    default:
      return map(
        unbuildPatternEffect({ node, path }, context, { right }),
        (effect) => makeEffectStatement(effect),
      );
  }
};
