import { assertEqual } from "../../__fixture__.mjs";
import { DELETE } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  ExpressionMacro,
  compileTest,
} from "./__fixture__.mjs";
import Delete from "./delete.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  Delete,
  Expression: {
    ...Expression,
    UnaryExpression: (node, context, _site) => {
      assertEqual(node.operator, "delete");
      return visit(node.argument, context, DELETE);
    },
  },
  ExpressionMacro,
});

test(`delete 123;`, `{ void (void 123, true); }`);

test(`delete (123)[456];`, `{ void intrinsic.aran.deleteSloppy(123, 456); }`);

test(
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

done();
