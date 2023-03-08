import { reduceReverse } from "../../util/index.mjs";
import { makeSequenceExpression } from "../../ast/index.mjs";
import { KEY_MACRO } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import KeyMacro from "./key-macro.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  KeyMacro,
  Expression: {
    __ANNOTATE__: (node, _serial) => node,
    __DEFAULT__: (node, context, _site) => {
      const macro = visit(node, context, KEY_MACRO);
      return reduceReverse(macro.setup, makeSequenceExpression, macro.pure);
    },
  },
});

test(`key;`, `{ void "key"; }`);

test(`"key"`, `{ void "key"; }`);

done();
