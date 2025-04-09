import { build, formatMessages } from "esbuild";
import { fileURLToPath } from "node:url";
import { warn } from "node:console";
import { writeFile } from "node:fs/promises";
import { argv } from "node:process";

const { URL, Error } = globalThis;

/**
 * @type {(
 *   entry: URL,
 * ) => Promise<string>}
 */
const bundle = async (entry) => {
  const result = await build({
    entryPoints: [fileURLToPath(entry)],
    bundle: true,
    write: false,
    format: "esm",
    minify: false,
    sourcemap: false,
    platform: "node",
  });
  if (result.errors.length > 0) {
    const messages = await formatMessages(result.errors, {
      kind: "error",
      color: true,
    });
    throw new Error(messages.join("\n"));
  }
  if (result.warnings.length > 0) {
    const messages = await formatMessages(result.warnings, {
      kind: "warning",
      color: true,
    });
    warn(messages.join("\n"));
  }
  return result.outputFiles[0].text;
};

/**
 * @type {(
 *   meta: string,
 *   base: string,
 * ) => Promise<void>}
 */
const deploy = async (meta, base) => {
  /** @type {import("./transform").Transform} */
  const { transformBase, transformMeta } = (
    await import(`./meta/${meta}/transform.mjs`)
  ).default;
  await writeFile(
    new URL(`out/${meta}-${base}-base.mjs`, import.meta.url),
    transformBase(await bundle(new URL(`base/${base}.mjs`, import.meta.url))),
    "utf8",
  );
  await writeFile(
    new URL(`out/${meta}-${base}-meta.mjs`, import.meta.url),
    transformMeta(
      await bundle(new URL(`meta/${meta}/meta.mjs`, import.meta.url)),
    ),
    "utf8",
  );
  await writeFile(
    new URL(`out/${meta}-${base}-setup.mjs`, import.meta.url),
    await bundle(new URL(`meta/${meta}/setup.mjs`, import.meta.url)),
    "utf8",
  );
  await writeFile(
    new URL(`out/${meta}-${base}-main.mjs`, import.meta.url),
    [
      `await import('./${meta}-${base}-setup.mjs');`,
      `await import('./${meta}-${base}-meta.mjs');`,
      `await import('./${meta}-${base}-base.mjs');`,
      "",
    ].join("\n"),
    "utf8",
  );
};

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async ([meta, base]) => {
  await deploy(meta, base);
  await import(`./out/${meta}-${base}-main.mjs`);
};

await main(argv.slice(2));
