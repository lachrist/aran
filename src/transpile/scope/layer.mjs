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
} from "./frame.mjs";

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

const declareMetaGeneric = (
  { strict, scope, counter },
  kind,
  info,
  options,
) => {
  const meta = makeMetaVariable(info, incrementCounter(counter));
  declareScope(strict, scope, kind, meta, options);
  return meta;
};

export const declareMeta = partial_x_x(declareMetaGeneric, "define", null);

export const declareMetaMacro = (scoping, info, expression) =>
  declareMetaGeneric(scoping, "macro", info, {
    macro: expression,
  });

export const makeMetaReadExpression = ({ strict, scope }, meta) =>
  makeScopeReadExpression(strict, scope, meta);

export const makeMetaWriteEffect = ({ strict, scope }, meta, expression) =>
  makeOptimisticWriteEffect(strict, scope, meta, expression);

export const makeMetaInitializeEffect = makeMetaWriteEffect;

//////////
// spec //
//////////

export const declareSpecMacro = ({ strict, scope }, spec, macro) => {
  declareScope(strict, scope, "macro", spec, { macro });
};

export const declareSpecIllegal = ({ strict, scope }, spec) => {
  declareScope(strict, scope, "illegal", spec, null);
};

export const declareSpec = ({ strict, scope }, spec) => {
  declareScope(strict, scope, "define", spec, null);
};

export const makeSpecInitializeEffect = ({ strict, scope }, spec, expression) =>
  makeOptimisticWriteEffect(strict, scope, spec, expression);

export const makeSpecReadExpression = ({ strict, scope }, spec) =>
  makeScopeReadExpression(strict, scope, spec);

//////////
// base //
//////////

export const declareBaseImport = (
  { strict, scope },
  base,
  source,
  specifier,
) => {
  declareScope(strict, scope, "import", base, { source, specifier });
};

export const declareBase = ({ strict, scope }, kind, base, specifiers) => {
  declareScope(strict, scope, kind, base, { exports: specifiers });
};

export const makeBaseInitializeStatementArray = (
  { strict, scope },
  kind,
  base,
  expression,
) => makeScopeInitializeStatementArray(strict, scope, kind, base, expression);

export const makeBaseReadExpression = ({ strict, scope }, base) =>
  makeScopeReadExpression(strict, scope, base);

export const makeBaseTypeofExpression = ({ strict, scope }, base) =>
  makeScopeTypeofExpression(strict, scope, base);

export const makeBaseDiscardExpression = ({ strict, scope }, base) =>
  makeScopeDiscardExpression(strict, scope, base);

export const makeBaseMacroWriteEffect = ({ strict, scope }, base, macro) =>
  makeScopeWriteEffect(strict, scope, base, {
    expression: macro,
    counter: createCounter(0),
  });

export const makeBaseWriteEffect = (scoping, base, expression) => {
  const { strict, scope } = scoping;
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
    const meta = declareMeta(scoping, "right");
    return makeSequenceEffect(
      makeMetaWriteEffect(scoping, meta, expression),
      makeBaseMacroWriteEffect(
        scoping,
        base,
        makeMetaReadExpression(scoping, meta),
      ),
    );
  }
};
