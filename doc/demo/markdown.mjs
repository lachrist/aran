import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

/**
 * @type {{name: string, title: string}[]}
 */
const demos = [];
for (const name of await readdir(new URL("cases", import.meta.url))) {
  demos.push({
    name,
    title: (
      await readFile(
        new URL(`cases/${name}/title.txt`, import.meta.url),
        "utf8",
      )
    ).trim(),
  });
}

await mkdir(new URL(`../src/demo`, import.meta.url), { recursive: true });

for (const { name, title } of demos) {
  await writeFile(
    new URL(`../src/demo/${name}.md`, import.meta.url),
    [
      "---",
      "layout: default-title",
      `title: ${title}`,
      "---",
      `<script type='module' src='./${name}.mjs' defer></script>`,
      "",
    ].join("\n"),
    "utf8",
  );
}

await writeFile(
  new URL(`../src/demo.md`, import.meta.url),
  [
    "---",
    "layout: default-title",
    "title: Live Demo",
    "---",
    "",
    ...demos.map(({ name, title }) => `- [${title}](/demo/${name}.html)`),
    "",
  ].join("\n"),
  "utf8",
);
