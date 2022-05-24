import {assertEqual} from "../__fixture__.mjs";

import {append} from "./string.mjs";

assertEqual(append("foo", "bar"), "foobar");
