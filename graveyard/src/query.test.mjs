import { forEach } from "array-lite";
import { assertSuccess } from "./__fixture__.mjs";
import { parse } from "./lang/index.mjs";
import { allign } from "./allign/index.mjs";
import { getChildren } from "./query.mjs";

const test = (snippet, snippets) => {
  const [input_type, input_code] = snippet;
  forEach(getChildren(parse(input_type, input_code)), (node, index) => {
    const [output_type, output_code] = snippets[index];
    assertSuccess(allign(output_type, node, output_code));
  });
};

/////////////
// Program //
/////////////

test(
  ["program", `"script"; void 123; void 456;`],
  [
    ["statement", "void 123;"],
    ["statement", "void 456;"],
  ],
);

test(
  ["program", `"module"; export { specifier }; { void 123; }`],
  [
    ["link", "export { specifier };"],
    ["block", "{ void 123; }"],
  ],
);

test(["program", `"eval"; { void 123; }`], [["block", "{ void 123; }"]]);

///////////
// Block //
///////////

test(
  ["block", `{ let x, y; void 123; void 456; }`],
  [
    ["statement", "void 123;"],
    ["statement", "void 456;"],
  ],
);

///////////////
// Statement //
///////////////

test(["statement", `x = 123;`], [["effect", `x = 123;`]]);

test(["statement", `return 123;`], [["expression", `123`]]);

test(["statement", `var [x] = 123;`], [["expression", `123`]]);

test(["statement", `{ void 123; }`], [["block", `{ void 123; }`]]);

test(
  ["statement", `if (123) { void 456; } else { void 789; }`],
  [
    ["expression", `123`],
    ["block", `{ void 456; }`],
    ["block", `{ void 789; }`],
  ],
);

test(
  ["statement", `while (123) { void 456; }`],
  [
    ["expression", `123`],
    ["block", `{ void 456; }`],
  ],
);

test(
  ["statement", `try { void 123; } catch { void 456; } finally { void 789; }`],
  [
    ["block", `{ void 123; }`],
    ["block", `{ void 456; }`],
    ["block", `{ void 789; }`],
  ],
);

////////////
// Effect //
////////////

test(["effect", `x = 123;`], [["expression", `123`]]);

test(["effect", `[x] = 123;`], [["expression", `123`]]);

test(["effect", `specifier << 123;`], [["expression", `123`]]);

test(
  ["effect", `1 ? (void 2, void 3) : (void 4, void 5);`],
  [
    ["expression", `1`],
    ["effect", `void 2`],
    ["effect", `void 3`],
    ["effect", `void 4`],
    ["effect", `void 5`],
  ],
);

test(["effect", `void 123;`], [["expression", `123`]]);

////////////////
// Expression //
////////////////

test(["expression", `() => { void 123; }`], [["block", `{ void 123; }`]]);

test(["expression", `await 123;`], [["expression", `123`]]);

test(["expression", `yield 123;`], [["expression", `123`]]);

test(
  ["expression", `(void 123, 456);`],
  [
    ["effect", `void 123`],
    ["expression", `456`],
  ],
);

test(
  ["expression", `123 ? 456 : 789;`],
  [
    ["expression", `123`],
    ["expression", `456`],
    ["expression", `789`],
  ],
);

test(["expression", `eval(123);`], [["expression", `123`]]);

test(
  ["expression", `123(!456, 789);`],
  [
    ["expression", `123`],
    ["expression", `456`],
    ["expression", "789"],
  ],
);

test(
  ["expression", `new 123(456, 789);`],
  [
    ["expression", `123`],
    ["expression", `456`],
    ["expression", "789"],
  ],
);
