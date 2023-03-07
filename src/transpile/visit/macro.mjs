import { map } from "array-lite";
import { reduceReverse, partial_x } from "../../util/index.mjs";
import { annotateNode, makeSequenceExpression } from "../../ast/index.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";

export const annotateNodeArray = (nodes, serial) =>
  map(nodes, partial_x(annotateNode, serial));

export const annotateMacro = (
  { setup: effects, value: expression },
  serial,
) => ({
  setup: annotateNodeArray(effects, serial),
  value: annotateNode(expression, serial),
});

export const makeMacro = (context, info, expression) => {
  const variable = declareScopeMeta(context, info);
  return {
    setup: makeScopeMetaWriteEffectArray(context, variable, expression),
    value: makeScopeMetaReadExpression(context, variable),
  };
};

export const makeMacroSelf = (context, info, makeExpression) => {
  const variable = declareScopeMeta(context, info);
  const expression = makeScopeMetaReadExpression(context, variable);
  return {
    setup: makeScopeMetaWriteEffectArray(
      context,
      variable,
      makeExpression(expression),
    ),
    value: expression,
  };
};

export const toMacroExpression = ({ setup: effects, value: expression }) =>
  reduceReverse(effects, makeSequenceExpression, expression);
