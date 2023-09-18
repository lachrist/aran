import { assertEqual, assertMatch } from "../test.fixture.mjs";
import { escapeDot, unescapeDot } from "./string.mjs";

assertEqual(unescapeDot(escapeDot("foo.bar")), "foo.bar");

assertEqual(unescapeDot(escapeDot("foo_bar")), "foo_bar");

assertEqual(unescapeDot(escapeDot("foo__bar")), "foo__bar");

assertMatch(escapeDot("foo.bar"), /^[^.]*$/u);
