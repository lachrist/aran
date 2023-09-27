import { constant___, return__x, deadcode_____ } from "../../../util/index.mjs";

import * as ExternalBinding from "./external.mjs";
import * as GlobalBinding from "./global.mjs";
import * as HiddenBinding from "./hidden.mjs";
import * as ImportBinding from "./import.mjs";
import * as MissingBinding from "./missing.mjs";
import * as RegularBinding from "./regular.mjs";

const DefaultBinding = {
  listBindingStaticVariable: constant___([]),
  generateBindingDeclareStatement: constant___([]),
  initializeBinding: return__x,
  generateBindingInitializeStatement: constant___([]),
  makeBindingLookupNode: deadcode_____(
    "missing makeBindingLookupNode implementation",
  ),
};

const Binding = {
  external: { ...DefaultBinding, ...ExternalBinding },
  global: { ...DefaultBinding, ...GlobalBinding },
  hidden: { ...DefaultBinding, ...HiddenBinding },
  import: { ...DefaultBinding, ...ImportBinding },
  missing: { ...DefaultBinding, ...MissingBinding },
  regular: { ...DefaultBinding, ...RegularBinding },
};

// export const makeBinding = (type, options) => ({
//   type,
//   ...options,
// });

const compileBindingMethod =
  (name) => (strict, binding, variable, optional1, optional2) => {
    const { [name]: method } = Binding[binding.type];
    return method(strict, binding, variable, optional1, optional2);
  };

export const listBindingStaticVariable = compileBindingMethod(
  "listBindingStaticVariable",
);

export const genarateBindingDeclareStatement = compileBindingMethod(
  "generateBindingDeclareStatement",
);

export const initializeBinding = compileBindingMethod("initializeBinding");

export const generateBindingInitializeStatement = compileBindingMethod(
  "generateBindingInitializeStatement",
);

export const makeBindingLookupNode = compileBindingMethod(
  "makeBindingLookupNode",
);
