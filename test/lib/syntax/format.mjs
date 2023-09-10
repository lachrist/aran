import { formatEstree } from "../../../lib/syntax/format.mjs";

formatEstree({
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
