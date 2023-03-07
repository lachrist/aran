import { concat } from "array-lite";

import {
  incrementCounter,
  createCounter,
  gaugeCounter,
  assert,
} from "../../util/index.mjs";

import { makeExpressionEffect } from "../../ast/index.mjs";

import { makeMetaVariable } from "./variable.mjs";

import {
  makeScopeEvalExpression as makeScopeEvalExpression_,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  makeScopeWriteEffectArray,
} from "./scope.mjs";

const makeOptimisticWriteEffectArray = (
  strict,
  scope,
  variable,
  expression,
) => {
  const counter = createCounter(0);
  const effects = makeScopeWriteEffectArray(strict, scope, variable, {
    expression,
    counter,
  });
  assert(gaugeCounter(counter) === 1, "expected single write access");
  return effects;
};

//////////
// Eval //
//////////

export const makeScopeEvalExpression = ({ strict, scope }, expression) =>
  makeScopeEvalExpression_(strict, scope, expression);

//////////
// meta //
//////////

export const declareScopeMeta = (
  { strict, scope, counter },
  info,
  expression,
) => {
  const meta = makeMetaVariable(info, incrementCounter(counter));
  declareScope(strict, scope, "define", meta, null);
  return {
    setup: makeOptimisticWriteEffectArray(strict, scope, meta, expression),
    value: makeScopeReadExpression(strict, scope, meta),
  };
};

//////////
// spec //
//////////

export const declareScopeSpecMacro = ({ strict, scope }, spec, macro) => {
  declareScope(strict, scope, "macro", spec, { macro });
};

export const declareScopeSpecIllegal = ({ strict, scope }, spec) => {
  declareScope(strict, scope, "illegal", spec, null);
};

export const declareScopeSpec = ({ strict, scope }, spec) => {
  declareScope(strict, scope, "define", spec, null);
};

export const makeScopeSpecInitializeEffectArray = (
  { strict, scope },
  spec,
  expression,
) => makeOptimisticWriteEffectArray(strict, scope, spec, expression);

export const makeScopeSpecReadExpression = ({ strict, scope }, spec) =>
  makeScopeReadExpression(strict, scope, spec);

//////////
// base //
//////////

export const declareScopeBaseImport = (
  { strict, scope },
  base,
  source,
  specifier,
) => {
  declareScope(strict, scope, "import", base, { source, specifier });
};

export const declareScopeBase = ({ strict, scope }, kind, base, specifiers) => {
  declareScope(strict, scope, kind, base, { exports: specifiers });
};

export const makeScopeBaseInitializeStatementArray = (
  { strict, scope },
  kind,
  base,
  expression,
) => makeScopeInitializeStatementArray(strict, scope, kind, base, expression);

export const makeScopeBaseReadExpression = ({ strict, scope }, base) =>
  makeScopeReadExpression(strict, scope, base);

export const makeScopeBaseTypeofExpression = ({ strict, scope }, base) =>
  makeScopeTypeofExpression(strict, scope, base);

export const makeScopeBaseDiscardExpression = ({ strict, scope }, base) =>
  makeScopeDiscardExpression(strict, scope, base);

export const makeScopeBaseMacroWriteEffectArray = (
  { strict, scope },
  base,
  macro,
) =>
  makeScopeWriteEffectArray(strict, scope, base, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeScopeBaseWriteEffectArray = (context, base, expression) => {
  const { strict, scope } = context;
  const counter = createCounter(0);
  const effects = makeScopeWriteEffectArray(strict, scope, base, {
    expression,
    counter,
  });
  if (gaugeCounter(counter) === 0) {
    return concat([makeExpressionEffect(expression)], effects);
  } else if (gaugeCounter(counter) === 1) {
    return effects;
  } else {
    const macro = declareScopeMeta(context, "right", expression);
    return concat(
      macro.setup,
      makeScopeBaseMacroWriteEffectArray(context, base, macro.value),
    );
  }
};
