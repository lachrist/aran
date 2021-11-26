import {concat, slice} from "array-lite";
import {assert} from "../../util.mjs";

const {
  Array: {isArray},
  Reflect: {apply},
  undefined,
} = globalThis;

export const matchNode = (context, value, match) => {
  if (typeof match === "function") {
    return match(context, value);
  }
  if (isArray(value) && isArray(match) && value.length === match.length) {
    const {length} = value;
    for (let index = 0; index < length; index += 1) {
      if (!matchNode(context, value[index], match[index])) {
        return false;
      }
    }
    return true;
  }
  return value === match;
};

// Allign is only used for testing so we don't care about performance and use reflection.
export const allignNode = (
  context,
  node1,
  node2,
  callbacks,
  default_callback,
) => {
  const type1 = node1[0];
  const type2 = node2[0];
  if (type1 === type2 && type1 in callbacks) {
    const callback = callbacks[type1];
    assert(
      callback.length === 1 + node1.length + node2.length,
      "wrong callback arity",
    );
    return apply(
      callback,
      undefined,
      concat(
        [context, node1, node2],
        slice(node1, 1, node1.length),
        slice(node2, 1, node2.length),
      ),
    );
  }
  return default_callback(context, node1, node2);
};
