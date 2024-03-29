import { assertEqual } from "../../__fixture__.mjs";
import { annotate } from "../annotate.mjs";
import { QUASI_RAW } from "../site.mjs";
import { visit } from "../context.mjs";
import { Program, Statement, Effect, compileTest } from "./__fixture__.mjs";
import QuasiRaw from "./quasi-raw.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Expression: {
    __ANNOTATE__: annotate,
    TemplateLiteral: (node, context, _site) => {
      assertEqual(node.quasis.length, 1);
      return visit(node.quasis[0], context, QUASI_RAW);
    },
  },
  QuasiRaw,
});

test("`foo\\bar`;", `{ void "foo\\\\bar"; }`);

done();
