import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeObjectAssignExpression,
  makeReflectDefinePropertyExpression,
  makeReflectSetPrototypeOfExpression,
  makeDataDescriptorExpression,
  makeAccessorDescriptorExpression,
} from "../../intrinsic.mjs";
import { isPrototypeProperty } from "../../query/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { makeSyntaxPropertyError } from "../report.mjs";
import { EXPRESSION, OBJECT_VALUE, OBJECT_PROTOTYPE } from "../site.mjs";
import { visit } from "../context.mjs";

const makeDescriptor = (node, expression) => {
  if (node.kind === "init") {
    return makeDataDescriptorExpression(
      expression,
      makeLiteralExpression(true),
      makeLiteralExpression(true),
      makeLiteralExpression(true),
    );
  } else if (node.kind === "get") {
    return makeAccessorDescriptorExpression(
      expression,
      null,
      makeLiteralExpression(true),
      makeLiteralExpression(true),
    );
  } else if (node.kind === "set") {
    return makeAccessorDescriptorExpression(
      null,
      expression,
      makeLiteralExpression(true),
      makeLiteralExpression(true),
    );
  } /* c8 ignore start */ else {
    throw makeSyntaxPropertyError(node, ["kind"]);
  } /* c8 ignore stop */
};

export default {
  __ANNOTATE__: annotateArray,
  Property: (node, context, site) => {
    if (isPrototypeProperty(node)) {
      return [
        makeExpressionEffect(
          makeReflectSetPrototypeOfExpression(
            site.self,
            visit(node.value, context, OBJECT_PROTOTYPE),
          ),
        ),
      ];
    } else {
      const property = visit(node.value, context, {
        ...OBJECT_VALUE,
        self: site.self,
        kind: node.kind,
        computed: node.computed,
        method: node.method,
        key: node.key,
      });
      return [
        makeExpressionEffect(
          makeReflectDefinePropertyExpression(
            site.self,
            property.key,
            makeDescriptor(node, property.value),
          ),
        ),
      ];
    }
  },
  SpreadElement: (node, context, site) => [
    makeExpressionEffect(
      makeObjectAssignExpression(
        site.self,
        visit(node.argument, context, EXPRESSION),
      ),
    ),
  ],
};
