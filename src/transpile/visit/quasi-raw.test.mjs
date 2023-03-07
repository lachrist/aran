import { assertEqual } from "../../__fixture__.mjs";
import { annotateNode } from "../../ast/index.mjs";
import { visit } from "./context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import QuasiRaw from "./quasi-raw.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotateNode,
    TemplateLiteral: (node, context, _site) => {
      assertEqual(node.quasis.length, 1);
      return visit(node.quasis[0], context, { type: "QuasiRaw" });
    },
  },
  QuasiRaw,
});

test("`foo\\bar`;", `{ void "foo\\\\bar"; }`);

done();
