import { reduceReverse } from "../../util/index.mjs";
import { makeSequenceExpression } from "../../ast/index.mjs";
import { KEY_MEMO } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import KeyMemo from "./key-memo.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  KeyMemo,
  Expression: {
    __ANNOTATE__: (node, _serial) => node,
    __DEFAULT__: (node, context, _site) => {
      const memo = visit(node, context, KEY_MEMO);
      return reduceReverse(memo.setup, makeSequenceExpression, memo.pure);
    },
  },
});

test(`key;`, `{ void "key"; }`);

test(`"key"`, `{ void "key"; }`);

done();
