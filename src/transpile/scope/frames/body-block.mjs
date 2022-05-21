
import {includes} from "array-lite";

import {SyntaxAranError} from "../../../util.mjs";

import {
  BASE_KIND,
  LOOSE_KIND,
} from "../kind.mjs";

import {
  isReadRight,
  isTypeofRight,
  isDeleteRight,
  getRightExpression,
} from "../right.mjs";

const {
  Reflect: {ownKeys},
} = globalThis;

const kinds = ["var", "function"];

export const create = () => ({});

export const harvestHeader = ownKeys;

export const harvestPrelude = constant_([]);

export const makeDeclareStatementArray = (frame, kind, variable, import_, exports_) => {
  if (includes(kinds, kind)) {
    assert(import_ === null, "unexpected imported variable");
    assert(exports_.length === 0, "unexpected exported variable");

  } else if (includes(frame, variable)) {
    throw new AranSyntaxError("Duplicate variable declaration");
  } else {
    return null;
  }
};

  assert(isBaseVariable(variable), "expected base variable");

    if (!hasOwnProperty(frame, variable)) {

    };
    return [];
  } else if (hasOwnProperty(frame, variable)) {
    assert(isBaseVariable(variable), "expected base variable");
    throw new SyntaxAranError(`Duplicate variable declaration: ${variable}`);
  } else {
    return null;
  }
};

export const makeInitializeEffect = (frame, kind, variable, expression) => {
  if (scopesKind(kind)) {
    return makeWriteEffect(variable, expression);
  } else {

  }
  assert(includes(frame, variable), "missing variable for initialization");

};

export const makeLookupNode = (frame, _escaped, variable, right) => {
  if (includes(frame, variable)) {
    if (isReadRight(right)) {
      return makeReadExpression(variable);
    } else if (isTypeofRight(right)) {
      return makeUnaryExpression(
        "typeof",
        makeReadExpression(variable),
      );
    } else if (isDeleteRight(right)) {
      return makeLiteralExpression(true);
    } else {
      return makeWriteEffect(variable, getRightExpression(right));
    }
  } else {
    return next();
  }
};
