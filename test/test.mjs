import { ordering } from "./ordering.mjs";
import { stdout } from "node:process";

const { URL, String } = globalThis;

for (const path of ordering) {
  stdout.write(`${path}...\n`, "utf8");
  await import(String(new URL(`../lib/${path}.test.mjs`, import.meta.url)));
}
