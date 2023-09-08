import { assertEqual, drill } from "../../fixture.mjs";
import { parseBabel } from "../../../lib/language/babel.mjs";

assertEqual(
  drill(parseBabel("return 123;"), ["body", 0, "type"]),
  "ReturnStatement",
);

assertEqual(
  drill(parseBabel("break foo;"), ["body", "0", "type"]),
  "BreakStatement",
);

assertEqual(
  drill(parseBabel("yield 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  drill(parseBabel("yield* 123;"), ["body", "0", "expression", "type"]),
  "YieldExpression",
);

assertEqual(
  drill(parseBabel("await 123;"), ["body", "0", "expression", "type"]),
  "AwaitExpression",
);

assertEqual(
  drill(parseBabel("super.get;"), [
    "body",
    "0",
    "expression",
    "object",
    "type",
  ]),
  "Super",
);

assertEqual(
  drill(parseBabel("new.target;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  drill(parseBabel("import.meta;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);

assertEqual(
  drill(parseBabel("import.dynamic;"), ["body", "0", "expression", "type"]),
  "MetaProperty",
);
