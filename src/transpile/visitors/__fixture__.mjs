import { join, map, slice, flatMap } from "array-lite";
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
import { annotateArray, annotateMacro } from "../annotate.mjs";
import { makeMacro } from "../macro.mjs";
import { PROGRAM, STATEMENT, EFFECT, EXPRESSION } from "../site.mjs";
import { createInitialContext, visit } from "../context.mjs";

const {
  Error,
  Set,
  Proxy,
  Array: { from: toArray },
  Set: {
    prototype: { delete: deleteSet },
  },
  Reflect: { get, apply, ownKeys },
} = globalThis;

export const Program = {
  __ANNOTATE__: annotateNode,
  Program: (node, context1, _site) => {
    if (
      node.body.length > 0 &&
      node.body[0].type === "ExpressionStatement" &&
      node.body[0].expression.type === "Literal" &&
      node.body[0].expression.value === "use strict"
    ) {
      return makeScopeTestBlock({ ...context1, strict: true }, (context2) =>
        flatMap(
          slice(node.body, 1, node.body.length),
          partial_xx(visit, context2, STATEMENT),
        ),
      );
    } else {
      return makeScopeTestBlock(context1, (context2) =>
        flatMap(node.body, partial_xx(visit, context2, STATEMENT)),
      );
    }
  },
};

export const Statement = {
  __ANNOTATE__: annotateArray,
  ExpressionStatement: (node, context, _site) =>
    map(visit(node.expression, context, EFFECT), makeEffectStatement),
  __DEFAULT__: (node, _context, _site) => [
    makeEffectStatement(makeExpressionEffect(makeLiteralExpression(node.type))),
  ],
};

export const Effect = {
  __ANNOTATE__: annotateArray,
  __DEFAULT__: (node, context, _site) => [
    makeExpressionEffect(visit(node, context, EXPRESSION)),
  ],
};

export const Expression = {
  __ANNOTATE__: annotateNode,
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  __DEFAULT__: (node, _context, _site) => makeLiteralExpression(node.type),
};

export const ExpressionMacro = {
  __ANNOTATE__: annotateMacro,
  __DEFAULT__: (node, context, site) =>
    makeMacro(context, site.info, visit(node, context, EXPRESSION)),
};

export const compileTest = (visitors) => {
  const remain = new Set(ownKeys(visitors));
  visitors = new Proxy(visitors, {
    get: (obj, key, rec) => {
      apply(deleteSet, remain, [key]);
      return get(obj, key, rec);
    },
  });
  return {
    test: (input, output) => {
      assertSuccess(
        allignBlock(
          visit(
            parseBabel(input),
            {
              ...createInitialContext(),
              visitors,
            },
            PROGRAM,
          ),
          output,
        ),
      );
    },
    done: () => {
      if (remain.size > 0) {
        throw new Error(
          `superfluous visitors >> ${join(toArray(remain), ", ")}`,
        );
      }
    },
  };
};
