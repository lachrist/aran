import { assertEqual } from "./__fixture__.mjs";
import { parseBabel } from "./babel.mjs";

assertEqual(parseBabel("return 123;").body[0].type, "ReturnStatement");

assertEqual(parseBabel("break foo;").body[0].type, "BreakStatement");

assertEqual(
  parseBabel("yield 123;").body[0].expression.type,
  "YieldExpression",
);

assertEqual(
  parseBabel("yield* 123;").body[0].expression.type,
  "YieldExpression",
);

assertEqual(
  parseBabel("await 123;").body[0].expression.type,
  "AwaitExpression",
);

assertEqual(parseBabel("super.get;").body[0].expression.object.type, "Super");

assertEqual(parseBabel("new.target;").body[0].expression.type, "MetaProperty");

assertEqual(parseBabel("import.meta;").body[0].expression.type, "MetaProperty");

assertEqual(
  parseBabel("import.dynamic;").body[0].expression.type,
  "MetaProperty",
);
