import {
  makeBlock,
  makeReadExpression,
  makeSequenceEffect,
  makeWriteEffect,
} from "../../ast/index.mjs";

import {
  makeFrame,
  listFrameVariable,
  generateFrameDeclareStatement,
  generateFrameInitializeStatement,
  makeFrameLookupNode,
} from "./frame.mjs";

////////////////////
// makeScopeBlock //
////////////////////

const makeScopeBlock = (
  strict,
  scope,
  options,
  labels,
  kinds,
  generateStatement,
) => {
  const frame = makeFrame(strict, kinds, options);
  const statements = generateStatement({
    car: frame,
    cdr: scope,
  });
  return makeBlock(
    labels,
    listFrameVariable(strict, frame),
    concat(makeFrameDeclareStatementArray(strict, frame), statements),
  );
};

////////////////////////////
// generateScopeStatement //
////////////////////////////

export const generateScopeStatement = (
  strict,
  scope,
  options,
  kinds,
  generateStatement,
) => {
  const frame = makeFrame(strict, kinds, options);
  const variables = listFrameVariable(strict, frame);
  assert(variables.length === 0, "unexpected variable");
  return concat(
    makeFrameDeclareStatementArray(strict, frame),
    generateStatement({ car: frame, cdr: scope }),
  );
};

/////////////////////////
// makeScopeLookupNode //
/////////////////////////

const makeScopeLookupNode = (
  strict,
  { car: frame, cdr: scope },
  variable,
  escaped1,
  lookup,
) =>
  makeFrameLookupNode(strict, frame, variable, escaped1, lookup, (escaped2) =>
    makeScopeLookupNode(strict, scope, variable, escaped2, lookup),
  );

const compileMakeScopeLookupExpression =
  (lookup) => (strict, scope, variable) =>
    makeScopeLookupNode(strict, scope, variable, false, lookup);

export const makeScopeReadExpression = compileMakeScopeLookupExpression({
  type: "read",
});

export const makeScopeTypeofExpression = compileMakeScopeLookupExpression({
  type: "typeof",
});

export const makeScopeDiscardExpression = compileMakeScopeLookupExpression({
  type: "discard",
});

export const makeScopeWriteEffect = (strict, scope, variable, expression) => {
  const maybe_effect = makeScopeLookupNode(strict, scope, variable, false, {
    type: "write",
    right: expression,
    pure: false,
  });
  if (maybe_effect === null) {
  } else {
    return maybe_effect;
  }
};

////////////
// Extend //
////////////

export const makeScriptScope = (enclave) => ({
  car: makeFrame("script", { enclave }),
  cdr: null,
});

export const makeScopeBlock = (scope, labels, kind, options, callback) => {
  const {
    scope: { car: frame },
    statements,
  } = callback({
    car: makeFrame(kind, options),
    cdr: scope,
  });
  return makeBlock(labels, harvestFrame(frame), statements);
};

/////////////
// Declare //
/////////////

export const declare = (
  strict,
  { car: frame, cdr: scope },
  variable,
  binding,
) => {
  const { frame: new_frame, statements } = declareFrame(
    strict,
    frame,
    variable,
    binding,
  );
  return {
    scope: {
      car: new_frame,
      cdr: scope,
    },
    statements,
  };
};

////////////////
// Initialize //
////////////////

export const initialize = (
  strict,
  { car: frame, cdr: scope },
  variable,
  expression,
) => {
  const { new_frame, statements } = initializeFrame(
    strict,
    frame,
    variable,
    expression,
  );
  return {
    scope: {
      car: new_frame,
      cdr: scope,
    },
    statements,
  };
};

///////////////////////////////
// Read && Typeof && Discard //
///////////////////////////////

const loopLookup = (
  makeFrameLookupExpression,
  strict,
  { car: frame, cdr: scope },
  escaped1,
  variable,
) =>
  makeFrameLookupExpression(strict, frame, escaped1, variable, (escaped2) =>
    loopLookup(makeFrameLookupExpression, strict, scope, escaped2, variable),
  );

const compileMakeLookupExpression =
  (makeFrameLookupExpression) => (strict, scope, variable) =>
    loopLookup(makeFrameLookupExpression, strict, scope, false, variable);

export const makeScopeReadExpression = compileMakeLookupExpression(
  makeFrameReadExpression,
);

export const makeScopeTypeofExpression = compileMakeLookupExpression(
  makeFrameTypeofExpression,
);

export const makeScopeDiscardExpression = compileMakeLookupExpression(
  makeFrameDiscardExpression,
);

///////////
// Write //
///////////

const loopWrite = (
  strict,
  { car: frame, cdr: scope },
  escaped1,
  variable,
  optimist,
  expression,
) =>
  makeFrameWriteEffect(
    strict,
    frame,
    escaped1,
    variable,
    optimist,
    expression,
    (escaped2) =>
      loopWrite(strict, scope, escaped2, variable, optimist, expression),
  );

export const makeScopeWriteEffect = (
  strict,
  scope,
  variable,
  expression,
  meta,
) => {
  const maybe_effect = loopWrite(
    strict,
    scope,
    false,
    variable,
    true,
    expression,
  );
  if (maybe_effect === null) {
    return makeSequenceEffect(
      makeWriteEffect(meta, expression),
      loopWrite(
        strict,
        scope,
        false,
        variable,
        false,
        makeReadExpression(meta),
      ),
    );
  } else {
    return maybe_effect;
  }
};

//////////
// Meta //
//////////

export const makeSaveEffect = ({ car: frame }, variable, expression) =>
  makeFrameSaveEffect(frame, variable, expression);

export const makeLoadExpression = ({ car: frame }, variable) =>
  makeFrameLoadExpression(frame, variable);
