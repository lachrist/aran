import { flatMapIndex } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { unbuildPattern } from "./pattern.mjs";
import {
  listSaveUpdateEffect,
  makeLoadUpdateExpression,
  unbuildUpdateLeft,
} from "./update.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  makeConvertNumberExpression,
  makeOneExpression,
  toAssignmentBinaryOperator,
  toUpdateBinaryOperator,
} from "../update.mjs";
import { bindSequence, mapSequence, sequenceEffect } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").EffectSequence}
 */
export const unbuildEffect = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: /** @type {estree.Variable} */ (node.left.name),
            }
          : { type: "anonymous" };
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return [
            ...unbuildEffect(
              /** @type {import("../site").Site<estree.Expression>} */ (
                drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left")
              ),
              scope,
              null,
            ),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
                path,
              ),
              path,
            ),
          ];
        } else {
          return sequenceEffect(
            mapSequence(
              cacheConstant(
                forkMeta((meta = nextMeta(meta))),
                unbuildNameExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  { name },
                ),
                path,
              ),
              (right) =>
                unbuildPattern(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  { kind: null, right },
                ),
            ),
            path,
          );
        }
      } else {
        return sequenceEffect(
          mapSequence(
            unbuildUpdateLeft(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
              scope,
              null,
            ),
            (update) => {
              /**
               * @type {() => aran.Expression<unbuild.Atom>}
               */
              const load = () =>
                makeLoadUpdateExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  { update },
                );
              /**
               * @type {() => aran.Expression<unbuild.Atom>}
               */
              const increment = () =>
                unbuildNameExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "right",
                  ),
                  scope,
                  { name },
                );
              /**
               * @type {(
               *   node: aran.Expression<unbuild.Atom>,
               * ) => aran.Effect<unbuild.Atom>[]}
               */
              const save = (node) =>
                sequenceEffect(
                  mapSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      node,
                      path,
                    ),
                    (new_value) =>
                      listSaveUpdateEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        { update, new_value },
                      ),
                  ),
                  path,
                );
              switch (node.operator) {
                case "??=": {
                  return [
                    makeConditionalEffect(
                      makeBinaryExpression(
                        "==",
                        load(),
                        makePrimitiveExpression(null, path),
                        path,
                      ),
                      save(increment()),
                      [],
                      path,
                    ),
                  ];
                }
                case "||=": {
                  return [
                    makeConditionalEffect(load(), [], save(increment()), path),
                  ];
                }
                case "&&=": {
                  return [
                    makeConditionalEffect(load(), save(increment()), [], path),
                  ];
                }
                default: {
                  return save(
                    makeBinaryExpression(
                      toAssignmentBinaryOperator(node.operator),
                      load(),
                      unbuildExpression(
                        drillSite(
                          node,
                          path,
                          forkMeta((meta = nextMeta(meta))),
                          "right",
                        ),
                        scope,
                        null,
                      ),
                      path,
                    ),
                  );
                }
              }
            },
          ),
          path,
        );
      }
    }
    case "UpdateExpression": {
      return sequenceEffect(
        mapSequence(
          unbuildUpdateLeft(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            scope,
            null,
          ),
          (update) =>
            sequenceEffect(
              bindSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeLoadUpdateExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { update },
                  ),
                  path,
                ),
                (raw_old_value) =>
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      makeConvertNumberExpression(raw_old_value, path),
                      path,
                    ),
                    (old_value) =>
                      mapSequence(
                        cacheConstant(
                          forkMeta((meta = nextMeta(meta))),
                          makeBinaryExpression(
                            toUpdateBinaryOperator(node.operator),
                            makeReadCacheExpression(old_value, path),
                            makeOneExpression(
                              makeReadCacheExpression(old_value, path),
                              path,
                            ),
                            path,
                          ),
                          path,
                        ),
                        (new_value) =>
                          listSaveUpdateEffect(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            scope,
                            {
                              update,
                              new_value,
                            },
                          ),
                      ),
                  ),
              ),
              path,
            ),
        ),
        path,
      );
    }
    case "SequenceExpression": {
      return flatMapIndex(node.expressions.length, (index) =>
        unbuildEffect(
          drillDeepSite(
            node,
            path,
            forkMeta((meta = nextMeta(meta))),
            "expressions",
            index,
          ),
          scope,
          null,
        ),
      );
    }
    case "ConditionalExpression": {
      return [
        makeConditionalEffect(
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
            scope,
            null,
          ),
          unbuildEffect(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "consequent",
            ),
            scope,
            null,
          ),
          unbuildEffect(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "alternate",
            ),
            scope,
            null,
          ),
          path,
        ),
      ];
    }
    case "LogicalExpression": {
      switch (node.operator) {
        case "&&": {
          return [
            makeConditionalEffect(
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "left",
                ),
                scope,
                null,
              ),
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              [],
              path,
            ),
          ];
        }
        case "||": {
          return [
            makeConditionalEffect(
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "left",
                ),
                scope,
                null,
              ),
              [],
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              path,
            ),
          ];
        }
        case "??": {
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                makePrimitiveExpression(null, path),
                path,
              ),
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              [],
              path,
            ),
          ];
        }
        default: {
          throw new AranTypeError(node);
        }
      }
    }
    default: {
      return [
        makeExpressionEffect(
          unbuildExpression({ node, path, meta }, scope, null),
          path,
        ),
      ];
    }
  }
};
