import { assertEqual } from "../../__fixture__.mjs";
import { makeObjectExpression } from "../../intrinsic.mjs";
import { OBJECT_PROPERTY_PROTOTYPE } from "../site.mjs";
import { visit } from "../context.mjs";
import {
  Program,
  Statement,
  Effect,
  Expression,
  compileTest,
} from "./__fixture__.mjs";
import ObjectPrototype from "./object-prototype.mjs";
import ObjectPropertyPrototype from "./object-property-prototype.mjs";

const { test, done } = compileTest({
  Program,
  Statement,
  Effect,
  ObjectPrototype,
  ObjectPropertyPrototype,
  Expression: {
    ...Expression,
    ObjectExpression: (node, context, _site) => {
      assertEqual(node.properties.length, 1);
      return makeObjectExpression(
        visit(node.properties[0], context, OBJECT_PROPERTY_PROTOTYPE),
        [],
      );
    },
  },
});

test(`({__proto__:null});`, `{ void intrinsic.aran.createObject(null); }`);

done();
