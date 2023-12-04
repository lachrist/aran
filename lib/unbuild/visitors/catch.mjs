import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import { extendStaticScope } from "../scope/index.mjs";
import { makeBlockStatement, makeEffectStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildInitializePatternEffect } from "./pattern.mjs";
import { drill } from "../site.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { makeReadCatchErrorExpression } from "../param/index.mjs";
import {
  bindSequence,
  sequenceControlBlock,
  tellSequence,
} from "../sequence.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.CatchClause>,
 *   context1: import("../context.js").Context,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement.d.ts").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildCatch = (
  { node, path, meta },
  context,
  { labels, completion, loop },
) => {
  const sites = drill({ node, path, meta }, ["param", "body"]);
  if (isNotNullishSite(sites.param)) {
    const TS_NARROW = sites.param;
    return sequenceControlBlock(
      bindSequence(
        extendStaticScope(
          { path },
          { ...context, catch: true },
          {
            frame: {
              situ: "local",
              link: null,
              kinds: reduceEntry(
                map(listPatternVariable(sites.param.node), makeLetEntry),
              ),
            },
          },
        ),
        (context) =>
          tellSequence([
            ...map(
              unbuildInitializePatternEffect(TS_NARROW, context, {
                right: makeReadCatchErrorExpression({ path }, context),
              }),
              (node) => makeEffectStatement(node, path),
            ),
            makeBlockStatement(
              unbuildControlBody(sites.body, context, {
                labels,
                loop,
                completion,
              }),
              path,
            ),
          ]),
      ),
      labels,
      path,
    );
  } else {
    return unbuildControlBody(sites.body, context, {
      labels,
      completion,
      loop,
    });
  }
};
