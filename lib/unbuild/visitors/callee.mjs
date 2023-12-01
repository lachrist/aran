import { makePrimitiveExpression } from "../node.mjs";
import { makeReadThisExpression } from "../param/index.mjs";
import { unbuildChainMember } from "./member.mjs";
import { unbuildChainElement } from "./chain.mjs";
import { drill } from "../site.mjs";
import { mapSequence, zeroSequence } from "../sequence.mjs";

/**
 * @typedef {{
 *   type: "super",
 * } | {
 *   type: "normal",
 *   function: aran.Expression<unbuild.Atom>,
 *   this: aran.Expression<unbuild.Atom>,
 * }} Callee
 */

/**
 * @template X
 * @typedef {import("../sequence.js").EffectSequence<X>} EffectSequence
 */

/**
 * @template X
 * @typedef {import("../sequence.js").ConditionSequence<X>} ConditionSequence
 */

// We used to have a method to unbuild callee that return an EffectSequence.
// Returning a ConditionSequence is overkill for callsite in expression visitor.
// But callee can themselves be ChainElements. That requires to transform a
// ConditionSequence<Callee> to a EffectSequence<Callee>. I could not figure
// out how to do that so there is now but a single unbuild callee.

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.Super,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => ConditionSequence<Callee>}
 */
export const unbuildCallee = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "Super": {
      return zeroSequence({ type: "super" });
    }
    case "ChainExpression": {
      // Not sure if nested chain expression are legal.
      // But it is easy to support here.
      return unbuildCallee(
        drill({ node, path, meta }, ["expression"]).expression,
        context,
        {},
      );
    }
    case "MemberExpression": {
      return mapSequence(
        unbuildChainMember({ node, path, meta }, context, { object: true }),
        ({ object, member }) => ({
          type: "normal",
          function: member,
          this:
            object === "super"
              ? makeReadThisExpression({ path }, context)
              : object,
        }),
      );
    }
    default: {
      return mapSequence(
        unbuildChainElement({ node, path, meta }, context, {}),
        (result) => ({
          type: "normal",
          function: result,
          this: makePrimitiveExpression({ undefined: null }, path),
        }),
      );
    }
  }
};
