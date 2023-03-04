import { assertEqual } from "../../__fixture__.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import QuasiVisitor from "./quasi.mjs";

const Visitor = {
  ...TestVisitor,
  Expression: {
    ...TestVisitor.Expression,
    TemplateLiteral: (node, context, site) => {
      assertEqual(node.quasis.length, 1);
      return visit(node.quasis[0], context, { ...site, type: "Quasi" });
    },
  },
  ...QuasiVisitor,
};

const testQuasi = (site, input, output) => {
  test(input, { visitors: Visitor }, site, output);
};

testQuasi({ cooked: true }, "`foo\\bar`;", `{ void "foo\\bar"; }`);

testQuasi({ cooked: false }, "`foo\\bar`;", `{ void "foo\\\\bar"; }`);
