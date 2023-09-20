import { TypeSyntaxAranError } from "../../error.mjs";
import { flatMap } from "../../util/index.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeControlBlock } from "../scope/block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildStatement } from "./statement.mjs";

const BASENAME = /** @basename */ "case";

/**
 * @type {<S>(
 *   node: estree.SwitchCase,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     discriminant: unbuild.Variable,
 *     matched: unbuild.Variable,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildCase = (node, context, { discriminant, matched }) => {
  const { serialize } = context;
  const serial = serialize(node);
  switch (node.type) {
    case "SwitchCase": {
      if (node.test == null) {
        return [
          makeEffectStatement(
            makeWriteEffect(
              matched,
              makePrimitiveExpression(true, serial),
              serial,
              false,
            ),
            serial,
          ),
          ...flatMap(node.consequent, (child) =>
            unbuildStatement(child, context, []),
          ),
        ];
      } else {
        return [
          makeIfStatement(
            makeConditionalExpression(
              makeReadExpression(matched, serial),
              makePrimitiveExpression(true, serial),
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeReadExpression(discriminant, serial),
                  unbuildExpression(node.test, context, null),
                  serial,
                ),
                makeSequenceExpression(
                  makeWriteEffect(
                    matched,
                    makePrimitiveExpression(true, serial),
                    serial,
                    false,
                  ),
                  makePrimitiveExpression(true, serial),
                  serial,
                ),
                makePrimitiveExpression(false, serial),
                serial,
              ),
              serial,
            ),
            makeScopeControlBlock(
              context,
              {
                type: "block",
                kinds: {},
                with: null,
              },
              [],
              // eslint-disable-next-line no-shadow
              (context) =>
                flatMap(node.consequent, (child) =>
                  unbuildStatement(child, context, []),
                ),
              serial,
            ),
            makeScopeControlBlock(
              context,
              {
                type: "block",
                kinds: {},
                with: null,
              },
              [],
              (_context) => [],
              serial,
            ),
            serial,
          ),
        ];
      }
    }
    default: {
      throw new TypeSyntaxAranError(BASENAME, node);
    }
  }
};
