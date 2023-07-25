import { assertEqual } from "../fixture.mjs";
import { getDeep } from "../util/index.mjs";
import { parseBabel } from "./babel.mjs";

assertEqual(
  getDeep(parseBabel("return 123;"), ["body", "0", "type"]),
  "ReturnStatement",
);

assertEqual(
  getDeep(parseBabel("break foo;"), ["body", "0", "type"]),
  "BreakStatement",
);

assertEqual(
  getDeep(parseBabel("yield 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  getDeep(parseBabel("yield* 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  getDeep(parseBabel("await 123;"), ["body", "0", "expression", "type"]),
  "AwaitExpression",
);

assertEqual(
  getDeep(parseBabel("super.get;"), [
    "body",
    "0",
    "expression",
    "object",
    "type",
  ]),
  "Super",
);

assertEqual(
  getDeep(parseBabel("new.target;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  getDeep(parseBabel("import.meta;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  getDeep(parseBabel("import.dynamic;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);
