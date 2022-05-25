import {assertEqual} from "../__fixture__.mjs";

import {add, multiply, devides, append, equals} from "./operation.mjs";

assertEqual(add(2, 3), 5);

assertEqual(multiply(2, 3), 6);

assertEqual(devides(4, 2), true);
assertEqual(devides(4, 3), false);

assertEqual(append("foo", "bar"), "foobar");

assertEqual(equals("foo", "bar"), false);
assertEqual(equals("foo", "foo"), true);
