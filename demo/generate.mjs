import { readFile, writeFile } from "node:fs/promises";

/**
 * @type {(
 *   name: "trace",
 * ) => Promise<void>}
 */
const generateTraceAnalysis = async (name) => {
  const aspect = await readFile(
    new URL(`../test/aspects/${name}.mjs`, import.meta.url),
    "utf8",
  );
  const template = await readFile(
    new URL(`${name}-template.mjs`, import.meta.url),
    "utf8",
  );
  await writeFile(
    new URL(`${name}.mjs`, import.meta.url),
    template
      .replace("/* ASPECT */", aspect.replaceAll("export const ", "const "))
      .replaceAll(/\n\n\n+/gu, "\n\n"),
  );
};

/**
 * @type {(
 *   name: "apply" | "trace" | "target",
 * ) => Promise<void>}
 */
const exportSource = async (name) => {
  const code = await readFile(new URL(`${name}.mjs`, import.meta.url), "utf8");
  await writeFile(
    new URL(`${name}-source.mjs`, import.meta.url),
    `export default ${JSON.stringify(code)};\n`,
  );
};

await generateTraceAnalysis("trace");
await exportSource("target");
await exportSource("apply");
await exportSource("trace");
