import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
} from "./scope/index.mjs";

export const memoize = (context, info, expression) => {
  const variable = declareScopeMeta(context, info);
  return {
    setup: makeScopeMetaWriteEffectArray(context, variable, expression),
    pure: makeScopeMetaReadExpression(context, variable),
  };
};

export const memoizeSelf = (context, info, makeRightExpression) => {
  const variable = declareScopeMeta(context, info);
  const pure = makeScopeMetaReadExpression(context, variable);
  return {
    setup: makeScopeMetaWriteEffectArray(
      context,
      variable,
      makeRightExpression(pure),
    ),
    pure,
  };
};
