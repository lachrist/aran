import { AranTypeError } from "../error.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @type {(
 *   variable: estree.Variable,
 *   config: {
 *     escape: estree.Variable,
 *     intrinsic: estree.Variable,
 *   }
 * ) => null | import("./clash").Clash}
 */
export const clash = (variable, { escape, intrinsic }) => {
  if (apply(startsWith, variable, [escape])) {
    return {
      type: "escape",
      variable,
      escape,
    };
  } else if (variable === intrinsic) {
    return {
      type: "intrinsic",
      variable,
    };
  } else {
    return null;
  }
};

/**
 * @type {(
 *   clash: import("./clash").Clash,
 * ) => string}
 */
export const reportClash = (clash) => {
  if (clash.type === "intrinsic") {
    return `External variable '${clash.variable}' clashes with intrinsic variable`;
  } else if (clash.type === "escape") {
    return `External variable '${clash.variable}' clashes with escape variable '${clash.escape}'`;
  } else {
    throw new AranTypeError(clash);
  }
};
