import {
  incrementCounter,
  createCounter,
  gaugeCounter,
  assert,
  partial_x_x,
} from "../../util/index.mjs";

import { makeSequenceEffect, makeExpressionEffect } from "../../ast/index.mjs";

import { makeMetaVariable } from "./variable.mjs";

import {
  makeScopeEvalExpression as makeScopeEvalExpression_,
  declareScope,
  makeScopeInitializeStatementArray,
  makeScopeReadExpression,
  makeScopeTypeofExpression,
  makeScopeDiscardExpression,
  makeScopeWriteEffect,
} from "./scope.mjs";

const makeOptimisticWriteEffect = (strict, scope, variable, expression) => {
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(strict, scope, variable, {
    expression,
    counter,
  });
  assert(gaugeCounter(counter) === 1, "expected single write access");
  return effect;
};

//////////
// Eval //
//////////

export const makeScopeEvalExpression = ({ strict, scope }, expression) =>
  makeScopeEvalExpression_(strict, scope, expression);

//////////
// meta //
//////////

const declareScopeMetaGeneric = (
  { strict, scope, root: { counter } },
  kind,
  info,
  options,
) => {
  const meta = makeMetaVariable(info, incrementCounter(counter));
  declareScope(strict, scope, kind, meta, options);
  return meta;
};

export const declareScopeMeta = partial_x_x(
  declareScopeMetaGeneric,
  "define",
  null,
);

export const declareScopeMetaMacro = (context, info, expression) =>
  declareScopeMetaGeneric(context, "macro", info, {
    macro: expression,
  });

export const makeScopeMetaReadExpression = ({ strict, scope }, meta) =>
  makeScopeReadExpression(strict, scope, meta);

export const makeScopeMetaWriteEffect = ({ strict, scope }, meta, expression) =>
  makeOptimisticWriteEffect(strict, scope, meta, expression);

export const makeScopeMetaInitializeEffect = makeScopeMetaWriteEffect;

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

export const makeScopeSpecInitializeEffect = (
  { strict, scope },
  spec,
  expression,
) => makeOptimisticWriteEffect(strict, scope, spec, expression);

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

export const makeScopeBaseMacroWriteEffect = ({ strict, scope }, base, macro) =>
  makeScopeWriteEffect(strict, scope, base, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeScopeBaseWriteEffect = (context, base, expression) => {
  const { strict, scope } = context;
  const counter = createCounter(0);
  const effect = makeScopeWriteEffect(strict, scope, base, {
    expression,
    counter,
  });
  if (gaugeCounter(counter) === 0) {
    return makeSequenceEffect(makeExpressionEffect(expression), effect);
  } else if (gaugeCounter(counter) === 1) {
    return effect;
  } else {
    const meta = declareScopeMeta(context, "right");
    return makeSequenceEffect(
      makeScopeMetaWriteEffect(context, meta, expression),
      makeScopeBaseMacroWriteEffect(
        context,
        base,
        makeScopeMetaReadExpression(context, meta),
      ),
    );
  }
};
