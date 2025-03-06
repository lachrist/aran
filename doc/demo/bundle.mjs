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
    input: new URL(`${name}.mjs`, import.meta.url).href,
    plugins: [resolve(), terser()],
  });
  await bundle.write({
    file: new URL(`../src/demo/${name}.mjs`, import.meta.url).href,
    format: "module",
  });
};

/**
 * @type {(
 *   name: "apply" | "trace" | "track",
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
  const title = await readFile(
    new URL(`cases/${name}/title.txt`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`../src/demo/${name}.md`, import.meta.url),
    [
      "---",
      "layout: default",
      `title: ${title}`,
      "---",
      "<script type='module'>",
      "import { createDemo } from './demo.mjs';",
      `const title = ${JSON.stringify(title.trim())};`,
      "const worker = './worker.mjs';",
      `const meta = ${JSON.stringify(meta)};`,
      `const base = ${JSON.stringify(base)};`,
      "const config = { title, worker, meta, base };",
      "document.body.appendChild(createDemo(config));",
      "</script>",
    ].join("\n"),
    "utf8",
  );
};

await expand("trace");
await mkdir(new URL(""), { recursive: true });
await bundle("demo");
await bundle("worker");
/** @type {["apply", "trace", "track"]} */
const names = ["apply", "trace", "track"];
for (const name of names) {
  await compile(name);
}

{
  const content = ["---", "layout: default", "title: Aran Demo", "---"];
  for (const name of names) {
    const title = await readFile(
      new URL(`cases/${name}/title.txt`, import.meta.url),
      "utf8",
    );
    content.push(`- [${name}](/demo/${name}.html): ${title}.`);
  }
  await writeFile(
    new URL(`../src/demo/index.md`, import.meta.url),
    content.join("\n"),
    "utf8",
  );
}
