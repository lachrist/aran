import { formatEstree } from "./format.mjs";

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
