import { runTest } from "./test.mjs";
import { cwd, argv } from "node:process";
import { pathToFileURL } from "node:url";

const url = new URL(argv[2], pathToFileURL(`${cwd()}/`));

let root = url;

while (!root.href.endsWith("test262/")) {
  root = new URL("../", root);
}

// eslint-disable-next-line no-console
console.dir(await runTest(url, root, (_feature) => false));
