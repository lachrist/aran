import { stringifyPrettier } from "./prettier.mjs";

stringifyPrettier({
  type: "Program",
  sourceType: "script",
  body: [
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo",
      },
    },
  ],
});
