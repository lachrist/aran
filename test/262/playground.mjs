import { runTest } from "./test.mjs";
import { argv } from "node:process";

const { URL } = globalThis;

const test262 = new URL("../../../test262/", import.meta.url);

const relative = argv[2];

// eslint-disable-next-line no-console
console.dir(
  await runTest({
    relative,
    test262,
    instrumenter: {
      setup: "",
      globals: [],
      instrument: (code, _kind) => code,
    },
  }),
);
