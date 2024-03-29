import { assertEqual } from "../../__fixture__.mjs";
import { annotate } from "../annotate.mjs";
import { QUASI } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import Quasi from "./quasi.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotate,
    TemplateLiteral: (node, context, _site) => {
      assertEqual(node.quasis.length, 1);
      return visit(node.quasis[0], context, QUASI);
    },
  },
  Quasi,
});

test("`foo\\bar`;", `{ void "foo\\bar"; }`);

done();
