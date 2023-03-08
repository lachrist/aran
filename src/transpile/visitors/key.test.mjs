import { annotate } from "../annotate.mjs";
import { KEY } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import Key from "./key.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotate,
    __DEFAULT__: (node, context, _site) => visit(node, context, KEY),
  },
  Key,
});

test(`"key";`, `{ void "key"; }`);

test(`key;`, `{ void "key"; }`);

done();
