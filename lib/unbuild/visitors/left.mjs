import { drill, drillAll, drillArray, drillOne } from "../../drill.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeEffectStatement } from "../node.mjs";
import { hasInit } from "../predicate.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildPatternEffect, unbuildPatternStatement } from "./pattern.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context<S>,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildInit = ({ node, path }, context) => {
  const { serialize } = context;
  const serial = serialize(node, path);
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
        makeEffectStatement(effect, serial),
      );
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context<S>,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
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
 * @type {<S>(
 *   pair: {
 *     node: estree.VariableDeclaration | estree.Pattern,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context<S>,
 *   options: {
 *     right: unbuild.Variable,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildLeftBody = ({ node, path }, context, { right }) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "VariableDeclaration":
      return unbuildPatternStatement(
        drill(drillOne(drillArray({ node, path }, "declarations"), 0), "id"),
        context,
        right,
      );
    default:
      return map(
        unbuildPatternEffect({ node, path }, context, right),
        (effect) => makeEffectStatement(effect, serial),
      );
  }
};
