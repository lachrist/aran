import { annotateNode } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import Key from "./key.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotateNode,
    __DEFAULT__: (node, context, _site) =>
      visit(node, context, { type: "Key" }),
  },
  Key,
});

test(`"key";`, `{ void "key"; }`);

test(`key;`, `{ void "key"; }`);

done();
