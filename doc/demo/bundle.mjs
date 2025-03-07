import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { fileURLToPath } from "node:url";

const version = "0.0.0";

/**
 * @type {(
 *   name: "trace",
 * ) => Promise<void>}
 */
const expand = async (name) => {
  const aspect = await readFile(
    new URL(`../../test/aspects/${name}.mjs`, import.meta.url),
    "utf8",
  );
  const template = await readFile(
    new URL(`cases/${name}/meta-template.mjs`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`cases/${name}/meta.mjs`, import.meta.url),
    template
      .replace("/* ASPECT */", aspect.replaceAll("export const ", "const "))
      .replaceAll(/\n\n\n+/gu, "\n\n"),
  );
};

/**
 * @type {(
 *   name: "demo" | "worker",
 * ) => Promise<void>}
 */
const bundle = async (name) => {
  const bundle = await rollup({
    input: fileURLToPath(new URL(`${name}.mjs`, import.meta.url).href),
    plugins: [resolve(), terser()],
  });
  await bundle.write({
    file: fileURLToPath(
      new URL(`../out/demo/${name}.mjs`, import.meta.url).href,
    ),
    format: "module",
  });
};

/**
 * @type {(
 *   name: string,
 * ) => Promise<void>}
 */
const compile = async (name) => {
  const meta = await readFile(
    new URL(`cases/${name}/meta.mjs`, import.meta.url),
    "utf8",
  );
  const base = await readFile(
    new URL(`cases/${name}/base.mjs`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`../out/demo/${name}.mjs`, import.meta.url),
    [
      "import { createDemo } from './demo.mjs';",
      "const content = document.getElementsByClassName('page-content')[0];",
      "content.appendChild(createDemo({",
      "  location: globalThis.location",
      `  version: ${JSON.stringify(version)},`,
      `  base: ${JSON.stringify(atob(base))}`,
      `  meta: ${JSON.stringify(atob(meta))}`,
      "  worker: './worker.mjs'",
      "  header_class: 'wrapper'",
      "}));",
      "",
    ].join("\n"),
    "utf8",
  );
};

await expand("trace");
await mkdir(new URL("../out/demo", import.meta.url), { recursive: true });
await bundle("demo");
// await bundle("worker");
for (const name of await readdir(new URL("cases", import.meta.url))) {
  await compile(name);
}
