/* c8 ignore start */
import { flatMap, reduce } from "array-lite";
import { assert, assertSuccess } from "../../__fixture__.mjs";
import { createCounter, hasOwn, partialx_xx } from "../../util/index.mjs";
import { parseBabel } from "../../babel.mjs";
import {
  makeEffectStatement,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  allignProgram,
  allignBlock,
  allignExpression,
} from "../../allign/index.mjs";
import { makeScopeTestBlock } from "../scope/index.mjs";
import { createContext, setContextScope, visit } from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

const splitPath = (path) => (path === null ? [] : apply(split, path, ["/"]));

const get = (node, property) => {
  assert(hasOwn(node, property));
  return node[property];
};

const parseInput = (code, path) => {
  const node = parseBabel(code);
  return reduce(splitPath(path), get, node);
};

const basic_visitor_object = {
  block: {
    BlockStatement: (node, context, _site) =>
      makeScopeTestBlock(context, (scope) =>
        flatMap(
          node.body,
          partialx_xx(visit, "statement", setContextScope(context, scope), {}),
        ),
      ),
  },
  statement: {
    ExpressionStatement: (node, context, _site) => [
      makeEffectStatement(
        makeExpressionEffect(visit("expression", node.expression, context, {})),
      ),
    ],
  },
  expression: {
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  },
};

const compileTestNode =
  (allignNode) => (name, input, path, visitors, root, site, output) => {
    // console.log({name, input, path, visitors, root, site, output});
    assertSuccess(
      allignNode(
        visit(
          name,
          parseInput(input, path),
          createContext(
            { ...basic_visitor_object, ...visitors },
            {
              counter: createCounter(0),
              nodes: [],
              evals: {},
              ...root,
            },
          ),
          site,
        ),
        output,
      ),
    );
  };

export const testProgram = compileTestNode(allignProgram);

export const testBlock = compileTestNode(allignBlock);

export const testExpression = compileTestNode(allignExpression);

// const parseBlock = partial_x(parse, ["body", 0]);
//
// const parseStatement = partial_x(parse, ["body", 0]);
//
// const parseExpression = partial_x(parse, ["body", 0, "expression"]);
//
// const test_visitor_object = {

// };
//
//
//
//
//
//
//
// export const testExpression = (code1, code2, ) => {
//   assertSuccess(
//     allignExpression(
//       dispatchNode2(visitor, node, createContext(root, visit), )
// };
//
// export const testBlock = (code1, code2, root, visit) => {
//   assertSuccess(
//     allignBlock(
//       visitBlock(
//         parseBlock(code1),
//         createContext(
//           {
//             counter: createCounter(0),
//             nodes: [],
//             evals: {},
//             ...root,
//           },
//           {
//             ...test_visitor_object,
//             ...visit,
//           },
//         ),
//         {},
//       ),
//       code2,
//     ),
//   );
// };
