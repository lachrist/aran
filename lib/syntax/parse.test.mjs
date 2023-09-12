import { assertEqual, drill } from "../test.fixture.mjs";
import { parseEstree } from "./parse.mjs";

assertEqual(
  drill(parseEstree("return 123;"), ["body", 0, "type"]),
  "ReturnStatement",
);

assertEqual(
  drill(parseEstree("break foo;"), ["body", "0", "type"]),
  "BreakStatement",
);

assertEqual(
  drill(parseEstree("yield 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  drill(parseEstree("yield* 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  drill(parseEstree("await 123;"), ["body", "0", "expression", "type"]),
  "AwaitExpression",
);

assertEqual(
  drill(parseEstree("super.get;"), [
    "body",
    "0",
    "expression",
    "object",
    "type",
  ]),
  "Super",
);

assertEqual(
  drill(parseEstree("new.target;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  drill(parseEstree("import.meta;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  drill(parseEstree("import.dynamic;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);
