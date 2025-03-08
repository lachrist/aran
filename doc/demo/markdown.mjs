import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

/**
 * @type {{name: string, title: string, order: number}[]}
 */
const demos = [];
for (const name of await readdir(new URL("cases", import.meta.url))) {
  demos.push({
    name,
    ...JSON.parse(
      await readFile(
        new URL(`cases/${name}/info.json`, import.meta.url),
        "utf8",
      ),
    ),
  });
}

await mkdir(new URL(`../src/_demos`, import.meta.url), { recursive: true });

for (const { name, title, order } of demos) {
  await writeFile(
    new URL(`../src/_demos/${name}.md`, import.meta.url),
    [
      "---",
      "layout: default-title",
      `title: ${title}`,
      `order: ${order}`,
      "---",
      `<script type='module' src='./${name}.mjs' defer></script>`,
      "",
    ].join("\n"),
    "utf8",
  );
}
