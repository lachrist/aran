import { drill, drillAll, drillArray, drillOne } from "../../drill.mjs";
import { flatMap, map, zip } from "../../util/index.mjs";
import { enumMeta, forkMeta } from "../mangle.mjs";
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
 *   options: {
 *     meta: unbuild.RootMeta,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildInit = ({ node, path }, context, { meta }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildStatement({ node, path }, context, {
        meta,
        labels: [],
        completion: null,
        loop: {
          break: null,
          continue: null,
        },
      });
    }
    default: {
      return map(unbuildEffect({ node, path }, context, { meta }), (effect) =>
        makeEffectStatement(effect, path),
      );
    }
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
 *     meta: unbuild.RootMeta,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildLeftInit = ({ node, path }, context, { meta }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      switch (node.kind) {
        case "var": {
          return unbuildStatement({ node, path }, context, {
            meta,
            labels: [],
            completion: null,
            loop: {
              break: null,
              continue: null,
            },
          });
        }
        default: {
          return map(
            flatMap(
              zip(
                enumMeta(meta, node.declarations.length),
                drillAll(drillArray({ node, path }, "declarations")),
              ),
              ([meta, { node, path }]) =>
                hasInit(node)
                  ? unbuildEffect(drill({ node, path }, "init"), context, {
                      meta: forkMeta(meta),
                    })
                  : [],
            ),
            (node) => makeEffectStatement(node, path),
          );
        }
      }
    }
    default: {
      return [];
    }
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
 *     meta: unbuild.RootMeta,
 *     right: aran.Expression<unbuild.Atom>,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildLeftBody = ({ node, path }, context, { meta, right }) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return unbuildPatternStatement(
        drill(drillOne(drillArray({ node, path }, "declarations"), 0), "id"),
        context,
        { meta, right },
      );
    }
    default: {
      return map(
        unbuildPatternEffect({ node, path }, context, { meta, right }),
        (effect) => makeEffectStatement(effect, path),
      );
    }
  }
};
