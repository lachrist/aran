import { formatPrettier } from "../../../lib/language/prettier.mjs";

formatPrettier({
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
