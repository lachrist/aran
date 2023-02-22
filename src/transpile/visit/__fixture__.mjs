/* c8 ignore start */
import { flatMap } from "array-lite";
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertSuccess,
} from "../../__fixture__.mjs";
import { createCounter, hasOwn, partial_xx } from "../../util/index.mjs";
import { parseBabel } from "../../babel.mjs";
import {
  makeReturnStatement,
  makeBlock,
  makeClosureExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { allignBlock } from "../../allign/index.mjs";
import {
  makeScopeTestBlock,
  makeBaseWriteEffect,
  makeBaseInitializeStatementArray,
} from "../scope/index.mjs";
import {
  createContext,
  getContextScoping,
  setContextScope,
  visitBlock,
  visitStatement,
  visitExpression,
} from "./context.mjs";

const parseBlock = (code) => {
  const node = parseBabel(code);
  assertEqual(node.body.length, 1);
  return node.body[0];
};

const test_visitor_object = {
  Block: {
    BlockStatement: (node, context, _specific) =>
      makeScopeTestBlock(getContextScoping(context), (scope) =>
        flatMap(
          node.body,
          partial_xx(visitStatement, setContextScope(context, scope), {}),
        ),
      ),
  },
  Closure: (node, _context, specific) => {
    assertEqual(node.params.length, 0);
    assertEqual(node.body.type, "BlockStatement");
    assertEqual(node.body.body.length, 1);
    assertEqual(node.body.body[0].type, "ReturnStatement");
    assertNotEqual(node.body.body[1].argument, null);
    assertEqual(node.body.body[1].argument.type, "Identifier");
    assertEqual(node.body.body[1].argument.name, "undefined");
    assert(hasOwn(specific, "kind"));
    return makeClosureExpression(
      specific.kind,
      node.async,
      node.generator,
      makeBlock([], [], [makeReturnStatement({ undefined: null })]),
    );
  },
  Pattern: {
    Identifier: (node, context, specific) => {
      assert(hasOwn(specific, "right"));
      assert(hasOwn(specific, "kind"));
      if (specific.kind === null) {
        return makeBaseWriteEffect(
          getContextScoping(context),
          node.name,
          specific.right,
        );
      } else {
        return makeBaseInitializeStatementArray(
          getContextScoping(context),
          node.name,
          specific.kind,
          specific.right,
        );
      }
    },
  },
  Statement: {
    ExpressionStatement: (node, context, _specific) => [
      makeEffectStatement(
        makeExpressionEffect(visitExpression(node.expression, context, {})),
      ),
    ],
  },
  Expression: {
    Literal: ({ value }, _context, _specific) => makeLiteralExpression(value),
  },
};

export const testBlock = (code1, code2, root, visit) => {
  assertSuccess(
    allignBlock(
      visitBlock(
        parseBlock(code1),
        createContext(
          {
            counter: createCounter(0),
            nodes: [],
            evals: {},
            ...root,
          },
          {
            ...test_visitor_object,
            ...visit,
          },
        ),
        {},
      ),
      code2,
    ),
  );
};
