import {
  makeGetExpression,
  makeUnaryExpression,
  makeDeleteExpression,
  makeSetExpression,
} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

export const makeDynamicLookupExpression = (strict, object, key, right) => {
  if (isRead(right)) {
    return makeGetExpression(object, key);
  } else if (isTypeof(right)) {
    return makeUnaryExpression("typeof", makeGetExpression(object, key));
  } else if (isDiscard(right)) {
    return makeDeleteExpression(strict, object, key);
  } else {
    return makeSetExpression(strict, object, key, accessWrite(right));
  }
};
