import { assertEqual } from "../../__fixture__.mjs";
import { visit } from "./context.mjs";
import TestVisitor, { test } from "./__fixture__.mjs";
import KeyVisitor from "./key.mjs";
import DeleteVisitor from "./delete.mjs";

const Visitor = {
  ...TestVisitor,
  ...DeleteVisitor,
  Expression: {
    ...TestVisitor.Expression,
    UnaryExpression: (node, context, _site) => {
      assertEqual(node.operator, "delete");
      return visit(node.argument, context, { type: "Delete" });
    },
  },
  ...KeyVisitor,
};

const testDelete = (input, output) => {
  test(input, { visitors: Visitor }, null, output);
};

testDelete(`delete 123;`, `{ void (void 123, true); }`);

testDelete(
  `delete (123)[456];`,
  `{ void intrinsic.aran.deleteSloppy(123, 456); }`,
);

testDelete(
  `delete (123)?.[456];`,
  `
    {
      let object;
      void (
        object = 123,
        (
          (
            intrinsic.aran.binary("===", object, null) ?
            true :
            intrinsic.aran.binary("===", object, undefined)
          ) ?
          true :
          intrinsic.aran.deleteSloppy(object, 456)
        )
      );
    }
  `,
);
