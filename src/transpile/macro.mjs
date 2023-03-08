import { reduceReverse } from "../util/index.mjs";
import { makeSequenceExpression } from "../ast/index.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
} from "./scope/index.mjs";

export const makeMacro = (context, info, expression) => {
  const variable = declareScopeMeta(context, info);
  return {
    setup: makeScopeMetaWriteEffectArray(context, variable, expression),
    pure: makeScopeMetaReadExpression(context, variable),
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
    pure: expression,
  };
};

export const toMacroExpression = ({ setup: effects, pure: expression }) =>
  reduceReverse(effects, makeSequenceExpression, expression);
