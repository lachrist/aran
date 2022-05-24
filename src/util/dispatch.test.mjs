import {assertEqual, assertDeepEqual} from "../__fixture__.mjs";

import {dispatch0, dispatch1, dispatch2} from "./dispatch.mjs";

assertEqual(
  dispatch0(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);

assertEqual(
  dispatch1(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "arg1"]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);

assertEqual(
  dispatch2(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "arg1", "arg2"]);
        return "result";
      },
    },
    {type: "type"},
    "arg1",
    "arg2",
  ),
  "result",
);
