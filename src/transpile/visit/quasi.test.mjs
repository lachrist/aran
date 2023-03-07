import { assertEqual } from "../../__fixture__.mjs";
import { annotateNode } from "../../ast/index.mjs";
import { visit, QUASI } from "./context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import Quasi from "./quasi.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotateNode,
    TemplateLiteral: (node, context, _site) => {
      assertEqual(node.quasis.length, 1);
      return visit(node.quasis[0], context, QUASI);
    },
  },
  Quasi,
});

test("`foo\\bar`;", `{ void "foo\\bar"; }`);

done();
