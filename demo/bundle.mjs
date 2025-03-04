import { readFile, writeFile } from "node:fs/promises";
import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

/**
 * @type {(
 *   name: string,
 * ) => Promise<void>}
 */
const expand = async (name) => {
  const aspect = await readFile(
    new URL(`../test/aspects/${name}.mjs`, import.meta.url),
    "utf8",
  );
  const template = await readFile(
    new URL(`meta/${name}-template.mjs`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`meta/${name}.mjs`, import.meta.url),
    template
      .replace("/* ASPECT */", aspect.replaceAll("export const ", "const "))
      .replaceAll(/\n\n\n+/gu, "\n\n"),
  );
};

/**
 * @type {(
 *   name: string,
 * ) => Promise<void>}
 */
const sourceify = async (name) => {
  const code = await readFile(new URL(`${name}.mjs`, import.meta.url), "utf8");
  await writeFile(
    new URL(`${name}-source.mjs`, import.meta.url),
    `export default ${JSON.stringify(code)};\n`,
  );
};

/**
 * @type {(
 *   name: string,
 * ) => Promise<void>}
 */
const bundle = async (name) => {
  const bundle = await rollup({
    input: `./demo/${name}.mjs`,
    plugins: [resolve(), terser()],
  });
  await bundle.write({
    file: `./demo/${name}-bundle.mjs`,
    format: "module",
  });
};

/**
 * @type {(
 *   name: string,
 * ) => Promise<void>}
 */
const pageify = async (name) => {
  const main = await readFile(
    new URL(`${name}-bundle.mjs`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`${name}.html`, import.meta.url),
    `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <title>Aran Demo</title>
        </head>
        <body></body>
        <script>${main}</script>
      </html>
    `,
    "utf8",
  );
};

await bundle("worker");
await sourceify("worker-bundle");

await sourceify("base/fac");
await sourceify("meta/apply");
await bundle("case/apply");
await pageify("case/apply");

await expand("trace");
await sourceify("base/fac");
await sourceify("meta/trace");
await bundle("case/trace");
await pageify("case/trace");

await sourceify("base/provenance");
await sourceify("meta/provenance");
await bundle("case/provenance");
await pageify("case/provenance");
