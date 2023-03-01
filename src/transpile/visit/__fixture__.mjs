/* c8 ignore start */
import { map, slice, flatMap } from "array-lite";
import { assertSuccess } from "../../__fixture__.mjs";
import { partialx_xx } from "../../util/index.mjs";
import { parseBabel } from "../../babel.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { createInitialContext, visit, visitMany } from "./context.mjs";

export default {
  Program: {
    Program: (node, context1, site) => {
      if (
        node.body.length > 0 &&
        node.body[0].type === "ExpressionStatement" &&
        node.body[0].expression.type === "Literal" &&
        node.body[0].expression.value === "use strict"
      ) {
        return makeScopeTestBlock({ ...context1, strict: true }, (context2) =>
          flatMap(
            slice(node.body, 1, node.body.length),
            partialx_xx(visitMany, "Statement", context2, site),
          ),
        );
      } else {
        return makeScopeTestBlock(context1, (context2) =>
          flatMap(
            node.body,
            partialx_xx(visitMany, "Statement", context2, site),
          ),
        );
      }
    },
  },
  Statement: {
    ExpressionStatement: (node, context, site) =>
      map(
        visitMany("Effect", node.expression, context, site),
        makeEffectStatement,
      ),
    [DEFAULT_CLAUSE]: (node, _context, _site) => [
      makeEffectStatement(
        makeExpressionEffect(makeLiteralExpression(node.type)),
      ),
    ],
  },
  Effect: {
    [DEFAULT_CLAUSE]: (node, context, site) => [
      makeExpressionEffect(visit("Expression", node, context, site)),
    ],
  },
  Expression: {
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    [DEFAULT_CLAUSE]: (node, _context, _site) =>
      makeLiteralExpression(node.type),
  },
};

export const test = (input, context, site, output) => {
  assertSuccess(
    allignBlock(
      visit(
        "Program",
        parseBabel(input),
        {
          ...createInitialContext(),
          ...context,
        },
        site,
      ),
      output,
    ),
  );
};
