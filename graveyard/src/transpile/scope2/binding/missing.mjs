import { assert } from "../../../util/index.mjs";

import {
  makeSequenceEffect,
  makeExpressionEffect,
  makeLiteralExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
} from "../../../ast/index.mjs";

import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDeleteExpression,
} from "../../../intrinsic.mjs";

import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";

const { Error } = globalThis;

// export const makeBinding = ({}) => ({ type: "missing" });

const makePresentObjectLookupExpression = (strict, variable, lookup) => {
  if (lookup.type === "read") {
    return makeGetExpression(
      makeIntrinsicExpression("aran.global.object"),
      makeLiteralExpression(variable),
    );
  } else if (lookup.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(
        makeIntrinsicExpression("aran.global.object"),
        makeLiteralExpression(variable),
      ),
    );
  } else if (lookup.type === "discard") {
    return makeDeleteExpression(
      strict,
      makeIntrinsicExpression("aran.global.object"),
      makeLiteralExpression(variable),
    );
  } else if (lookup.type === "write") {
    return makeSetExpression(
      strict,
      makeIntrinsicExpression("aran.global.object"),
      makeLiteralExpression(variable),
      lookup.right,
    );
  } else {
    throw new Error("invalid lookup type");
  }
};

const makeMissingObjectLookupExpression = (strict, variable, lookup) => {
  if (lookup.type === "read") {
    return makeThrowMissingExpression(variable);
  } else if (lookup.type === "typeof") {
    return makeLiteralExpression("undefined");
  } else if (lookup.type === "discard") {
    return makeLiteralExpression(true);
  } else if (lookup.type === "write") {
    if (strict) {
      const expression = makeThrowMissingExpression(variable);
      return lookup.pure
        ? expression
        : makeSequenceEffect(
            makeExpressionEffect(lookup.right),
            makeExpressionEffect(expression),
          );
    } else {
      return makeSetExpression(
        false,
        makeIntrinsicExpression("aran.global.object"),
        makeLiteralExpression(variable),
        lookup.right,
      );
    }
  } else {
    throw new Error("invalid lookup type");
  }
};

const makeObjectLookupExpression = (strict, variable, lookup) => {
  if (
    lookup.type === "typeof" ||
    lookup.type === "discard" ||
    (lookup.type === "write" && !strict)
  ) {
    return makePresentObjectLookupExpression(strict, variable, lookup);
  }
  return makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makeLiteralExpression(variable),
      makeIntrinsicExpression("aran.global.object"),
    ),
    makePresentObjectLookupExpression(strict, variable, lookup),
    makeMissingObjectLookupExpression(strict, variable, lookup),
  );
};

const makeLiveRecordLookupExpression = (strict, variable, lookup) => {
  if (lookup.type === "read") {
    return makeGetExpression(
      makeIntrinsicExpression("aran.global.record.value"),
      makeLiteralExpression(variable),
    );
  } else if (lookup.type === "typeof") {
    return makeUnaryExpression(
      "typeof",
      makeGetExpression(
        makeIntrinsicExpression("aran.global.record.value"),
        makeLiteralExpression(variable),
      ),
    );
  } else if (lookup.type === "discard") {
    return makeDeleteExpression(
      strict,
      makeIntrinsicExpression("aran.global.record.value"),
      makeLiteralExpression(variable),
    );
  } else if (lookup.type === "write") {
    assert(
      lookup.pure,
      "makeLiveRecordLookupExpression does not support impure writes",
    );
    return makeConditionalExpression(
      makeGetExpression(
        makeIntrinsicExpression("aran.global.record.variables"),
        makeLiteralExpression(variable),
      ),
      makeSetExpression(
        strict,
        makeIntrinsicExpression("aran.global.record.value"),
        makeLiteralExpression(variable),
        lookup.right,
      ),
      makeThrowConstantExpression(variable),
    );
  } else {
    throw new Error("invalid lookup type");
  }
};

export const makeDeadRecordLookupExpression = (_strict, variable, lookup) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  } else {
    return makeThrowDeadzoneExpression(variable);
  }
};

export const makeRecordLookupExpression = (strict, variable, lookup) => {
  if (lookup.type === "discard") {
    return makeLiteralExpression(false);
  }
  return makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makeLiteralExpression(variable),
      makeIntrinsicExpression("aran.global.record.values"),
    ),
    makeLiveRecordLookupExpression(strict, variable, lookup),
    makeDeadRecordLookupExpression(strict, variable, lookup),
  );
};

export const makeBindingLookupExpression = (
  strict,
  _binding,
  variable,
  _escaped,
  lookup,
) => {
  if (lookup.type === "write" && !lookup.pure) {
    return null;
  } else {
    return makeConditionalExpression(
      makeBinaryExpression(
        "in",
        makeLiteralExpression(variable),
        makeIntrinsicExpression("aran.global.record.variables"),
      ),
      makeRecordLookupExpression(strict, variable, lookup),
      makeObjectLookupExpression(strict, variable, lookup),
    );
  }
};
