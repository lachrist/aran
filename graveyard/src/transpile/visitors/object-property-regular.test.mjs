import { map } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import { makeLiteralExpression } from "../../ast/index.mjs";
import { makeObjectExpression } from "../../intrinsic.mjs";
import { OBJECT_PROPERTY_REGULAR } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import ObjectValue from "./object-value.mjs";
import ObjectPropertyRegular from "./object-property-regular.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ObjectPropertyRegular,
  ObjectValue,
  Expression: {
    ...Expression,
    ObjectExpression: (node, context, _site) =>
      makeObjectExpression(
        makeLiteralExpression(null),
        map(
          node.properties,
          partial_xx(visit, context, OBJECT_PROPERTY_REGULAR),
        ),
      ),
  },
});

test(
  `({[123]:456});`,
  `
    {
      void intrinsic.aran.createObject(
        null,
        123, 456,
      );
    }
  `,
);

done();
