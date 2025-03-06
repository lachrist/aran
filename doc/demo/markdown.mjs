import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

await mkdir(new URL(`../src/demo`, import.meta.url), { recursive: true });
const content = [
  "---",
  "layout: default",
  "title: Live Demo",
  "---",
  "# Live Demo",
];
for (const name of await readdir(new URL("cases", import.meta.url))) {
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
      `# ${title}`,
      `<script type='module' src='./${name}.mjs' defer></script>`,
      "",
    ].join("\n"),
    "utf8",
  );
  content.push(`- [${name}](/demo/${name}.html): ${title}.`);
}
content.push("");
await writeFile(
  new URL(`../src/demo.md`, import.meta.url),
  content.join("\n"),
  "utf8",
);
