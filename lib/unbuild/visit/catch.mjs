import { listPatternVariable } from "../../estree/hoist.mjs";
import { map } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { makeBlockStatement } from "../node.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {<S>(
 *   node: estree.CatchClause,
 *   context1: import("./context.js").Context<S>,
 *   options: { labels: unbuild.Label[] },
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const unbuildCatch = (node, context1, { labels }) => {
  const { serialize } = context1;
  const serial = serialize(node);
  if (node.param === null) {
    return unbuildControlBlock(node.body, context1, {
      labels,
      kinds: {},
      with: null,
    });
  } else {
    return makeScopeControlBlock(
      context1,
      {
        type: "block",
        kinds: reduceEntry(map(listPatternVariable(node.param), makeLetEntry)),
        with: null,
      },
      labels,
      (context2) => [
        ...unbuildPatternStatement(
          /** @type {estree.Pattern} */ (node.param),
          context2,
          "catch.error",
        ),
        makeBlockStatement(
          unbuildControlBlock(node.body, context2, {
            labels,
            kinds: {},
            with: null,
          }),
          serial,
        ),
      ],
      serial,
    );
  }
};
