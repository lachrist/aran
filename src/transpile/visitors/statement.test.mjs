import { flatMap } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import { makeScopeTestBlock, declareScopeMeta } from "../scope/index.mjs";
import { STATEMENT } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Effect, Expression, compileTest } from "./__fixture__.mjs";
import Block from "./block.mjs";
import Statement from "./statement.mjs";

{
  const { test, done } = compileTest({
    Program: {
      __ANNOTATE__: (node, _serial) => node,
      Program: (node, context1, _site) =>
        makeScopeTestBlock(context1, (context2) => {
          const meta = declareScopeMeta(context2, "completion");
          return flatMap(
            node.body,
            partial_xx(visit, context2, {
              ...STATEMENT,
              completion: { meta, nodes: node.body },
            }),
          );
        }),
    },
    Statement,
    Expression,
  });
  test(
    `123;`,
    `
      {
        let _completion;
        _completion = 123;
      }
    `,
  );
  done();
}

const { test, done } = compileTest({
  Program,
  Block,
  Statement,
  Effect,
  Expression,
});

// DebuggerStatement //
test(`debugger;`, `{ debugger; }`);

// EmptyStatement //
test(`;`, `{}`);

// ExpressionStatement //
test(`123; `, `{ void 123; }`);

// LabeledStatement //
test(`k: 123;`, `{ void 123; }`);

// BlockStatement //
test(`k: l: { 123; }`, `{ k: l: { void 123; } }`);

// IfStatement //
test(
  `l: if (123) { 456; } else { 789; }`,
  `{ if (123) l: { void 456; } else l: { void 789; } }`,
);
test(`l: if (123) { 456; }`, `{ if (123) l: { void 456; } else l: {} }`);

done();
