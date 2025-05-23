import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

/**
 * @type {{name: string, title: string, order: number, description: string }[]}
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

for (const { name, title, order, description } of demos) {
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
      "Once you click the play button, the target program (top) is provided as a string to the instrumenter (bottom).",
      "The instrumenter is responsible for transforming and then executing it.",
      "",
      description,
      "",
    ].join("\n"),
    "utf8",
  );
}
