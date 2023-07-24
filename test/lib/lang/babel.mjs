import { assertEqual } from "../../fixture.mjs";
import { parseBabel } from "../../../lib/lang/babel.mjs";

assertEqual(parseBabel("return 123;").body[0].type, "ReturnStatement");

assertEqual(parseBabel("break foo;").body[0].type, "BreakStatement");

assertEqual(
  // @ts-ignore
  parseBabel("yield 123;").body[0].expression.type,
  "YieldExpression",
);

assertEqual(
  // @ts-ignore
  parseBabel("yield* 123;").body[0].expression.type,
  "YieldExpression",
);

assertEqual(
  // @ts-ignore
  parseBabel("await 123;").body[0].expression.type,
  "AwaitExpression",
);

// @ts-ignore
assertEqual(parseBabel("super.get;").body[0].expression.object.type, "Super");

// @ts-ignore
assertEqual(parseBabel("new.target;").body[0].expression.type, "MetaProperty");

// @ts-ignore
assertEqual(parseBabel("import.meta;").body[0].expression.type, "MetaProperty");

assertEqual(
  // @ts-ignore
  parseBabel("import.dynamic;").body[0].expression.type,
  "MetaProperty",
);
