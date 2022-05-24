import {assertEqual} from "../__fixture__.mjs";

import {incrementCounter, createCounter} from "./counter.mjs";

assertEqual(incrementCounter(createCounter(0)), 1);
