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
    `./demo/cases/${name}/meta.mjs`,
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
  const meta = await readFile(`./demo/cases/${name}/meta.mjs`, "utf8");
  const base = await readFile(`./demo/cases/${name}/base.mjs`, "utf8");
  const title = await readFile(`./demo/cases/${name}/title.txt`, "utf8");
  await writeFile(
    `./page/demo/${name}.html`,
    [
      "<!DOCTYPE html>",
      "<html lang='en'>",
      "<head><meta charset='utf-8'/><title>Aran Demo</title></head>",
      "<body></body>",
      "<script type='module'>",
      "import { createDemo } from './demo.mjs';",
      `const title = ${JSON.stringify(title.trim())};`,
      "const worker = './worker.mjs';",
      `const meta = ${JSON.stringify(meta)};`,
      `const base = ${JSON.stringify(base)};`,
      "const config = { title, worker, meta, base };",
      "document.body.appendChild(createDemo(config));",
      "</script>",
      "</html>",
    ].join("\n"),
    "utf8",
  );
};

/**
 * @type {(
 *   name: string,
 * ) => string}
 */
const toListItem = (name) => `<li><a href='./${name}.html'>${name}</a></li>`;

await expand("trace");
await mkdir("./page/demo", { recursive: true });
await bundle("demo");
await bundle("worker");
/** @type {["apply", "trace", "track"]} */
const names = ["apply", "trace", "track"];
for (const name of names) {
  await compile(name);
}
await writeFile(
  `./page/demo/index.html`,
  [
    "<!DOCTYPE html>",
    "<html lang='en'>",
    "<head><meta charset='utf-8'/><title>Aran Demo</title></head>",
    "<body>",
    "<h1>Aran Demo</h1>",
    "<ul>",
    ...names.map(toListItem),
    "</ul>",
    "</body>",
    "</html>",
  ].join("\n"),
  "utf8",
);
