import { partial__xx } from "../../util/index.mjs";
import { testBlock } from "./__fixture__.mjs";
import visitor from "./expression.mjs";

const testExpressionBlock = partial__xx(testBlock, {}, { Expression: visitor });

testExpressionBlock(`{ 123; }`, `{ void 123; }`);

testExpressionBlock(`{ await 123; }`, `{ void await 123; }`);

testExpressionBlock(`{ yield* 123; }`, `{ void (yield* 123); }`);

testExpressionBlock(`{ yield; }`, `{ void (yield undefined); }`);
