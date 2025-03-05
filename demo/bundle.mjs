import { readFile, writeFile, mkdir } from "node:fs/promises";
import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

/**
 * @type {(
 *   name: "trace",
 * ) => Promise<void>}
 */
const expand = async (name) => {
  const aspect = await readFile(`./test/aspects/${name}.mjs`, "utf8");
  const template = await readFile(
    `./demo/cases/${name}/meta-template.mjs`,
    "utf8",
  );
  await writeFile(
    new URL(`./demo/cases/${name}/meta.mjs`, import.meta.url),
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
    input: `./demo/${name}.mjs`,
    plugins: [resolve(), terser()],
  });
  await bundle.write({
    file: `./page/demo/${name}.mjs`,
    format: "module",
  });
};

/**
 * @type {(
 *   name: "apply" | "trace" | "track",
 * ) => Promise<void>}
 */
const compile = async (name) => {
  const meta = `./demo/cases/${name}/meta.mjs`;
  const base = `./demo/cases/${name}/base.mjs`;
  await writeFile(
    `./page/demo/${name}.html`,
    [
      "<!DOCTYPE html>",
      '<html lang="en">',
      '<head><meta charset="utf-8"/><title>Aran Demo</title></head>',
      "<body></body>",
      "<script>",
      'import { createDemo } from "./demo.mjs";',
      `const meta = ${JSON.stringify(await readFile(meta, "utf8"))};`,
      `const base = ${JSON.stringify(await readFile(base, "utf8"))};`,
      "document.body.appendChild(createDemo(meta, base));",
      "</script>",
      "</html>",
    ].join("\n"),
    "utf8",
  );
};

await expand("trace");
await mkdir(new URL("./page/demo", import.meta.url), { recursive: true });
await bundle("demo");
await bundle("worker");
await compile("apply");
await compile("trace");
await compile("track");
