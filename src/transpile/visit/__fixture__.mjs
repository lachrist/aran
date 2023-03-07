import { map, slice, flatMap } from "array-lite";
import { assertSuccess } from "../../__fixture__.mjs";
import { partial_xx } from "../../util/index.mjs";
import { parseBabel } from "../../babel.mjs";
import {
  annotateNode,
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { createInitialContext, visit, annotateNodeArray } from "./context.mjs";

export default {
  Program: {
    __ANNOTATE__: annotateNode,
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
            partial_xx(visit, context2, { ...site, type: "Statement" }),
          ),
        );
      } else {
        return makeScopeTestBlock(context1, (context2) =>
          flatMap(
            node.body,
            partial_xx(visit, context2, { ...site, type: "Statement" }),
          ),
        );
      }
    },
  },
  Statement: {
    __ANNOTATE__: annotateNodeArray,
    ExpressionStatement: (node, context, site) =>
      map(
        visit(node.expression, context, { ...site, type: "Effect" }),
        makeEffectStatement,
      ),
    [DEFAULT_CLAUSE]: (node, _context, _site) => [
      makeEffectStatement(
        makeExpressionEffect(makeLiteralExpression(node.type)),
      ),
    ],
  },
  Effect: {
    __ANNOTATE__: annotateNodeArray,
    [DEFAULT_CLAUSE]: (node, context, site) => [
      makeExpressionEffect(
        visit(node, context, { ...site, type: "Expression" }),
      ),
    ],
  },
  Expression: {
    __ANNOTATE__: annotateNode,
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    [DEFAULT_CLAUSE]: (node, _context, _site) =>
      makeLiteralExpression(node.type),
  },
};

export const test = (input, context, site, output) => {
  assertSuccess(
    allignBlock(
      visit(
        parseBabel(input),
        {
          ...createInitialContext(),
          ...context,
        },
        { ...site, type: "Program" },
      ),
      output,
    ),
  );
};
