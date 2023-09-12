import { drill, assertEqual } from "../../fixture.mjs";

import { parseScript } from "../../fixture-parse.mjs";

import {
  isPrototypeProperty,
  isMethodProperty,
  isAccessorProperty,
  isSuperProperty,
} from "../../../lib/estree/object.mjs";

/** @type {(code: string) => estree.Node} */
export const parseProperty = (code) =>
  /** @type {estree.Node} */ (
    drill(parseScript(`({${code}});`), [
      "body",
      0,
      "expression",
      "properties",
      0,
    ])
  );

/////////////////////////
// isPrototypeProperty //
/////////////////////////

assertEqual(isPrototypeProperty(parseProperty(`__proto__:null`)), true);

assertEqual(isPrototypeProperty(parseProperty(`"__proto__":null`)), true);

assertEqual(isPrototypeProperty(parseProperty(`["__proto__"]:null`)), false);

assertEqual(isPrototypeProperty(parseProperty(`__proto__ () {}`)), false);

/////////////////////
// isMethodProperty //
/////////////////////

assertEqual(
  isMethodProperty(parseProperty(`m () { return super.m(); }`)),
  true,
);

assertEqual(
  isMethodProperty(parseProperty(`get x () { return super.x; }`)),
  false,
);

assertEqual(
  isMethodProperty(parseProperty(`set x (y) { super.x = y; }`)),
  false,
);

assertEqual(isMethodProperty(parseProperty(`foo: 123`)), false);

////////////////////////
// isAccessorProperty //
////////////////////////

assertEqual(
  isAccessorProperty(parseProperty(`m () { return super.m(); }`)),
  false,
);

assertEqual(
  isAccessorProperty(parseProperty(`get x () { return super.x; }`)),
  true,
);

assertEqual(
  isAccessorProperty(parseProperty(`set x (y) { super.x = y; }`)),
  true,
);

assertEqual(isAccessorProperty(parseProperty(`foo: 123`)), false);

/////////////////////
// isSuperProperty //
/////////////////////

assertEqual(isSuperProperty(parseProperty(`m () { return super.m(); }`)), true);

assertEqual(
  isSuperProperty(parseProperty(`get x () { return super.x; }`)),
  true,
);

assertEqual(isSuperProperty(parseProperty(`set x (y) { super.x = y; }`)), true);

assertEqual(isSuperProperty(parseProperty(`foo: 123`)), false);
