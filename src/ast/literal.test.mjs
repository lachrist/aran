import {assertEqual, assertThrow} from "../__fixture__.mjs";

import {isLiteral, toLiteral, fromLiteral} from "./literal.mjs";

const {undefined} = globalThis;

assertEqual(isLiteral(123), true);
assertEqual(fromLiteral(toLiteral(123)), 123);

assertEqual(isLiteral(undefined), false);
assertEqual(isLiteral(toLiteral(undefined)), true);
assertEqual(fromLiteral(toLiteral(undefined)), undefined);

assertEqual(isLiteral(123n), false);
assertEqual(isLiteral(toLiteral(123n)), true);
assertEqual(fromLiteral(toLiteral(123n)), 123n);

assertThrow(() => fromLiteral({foo: "bar"}));
