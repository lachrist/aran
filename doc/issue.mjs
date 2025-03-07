import { readdir, writeFile } from "node:fs/promises";

await writeFile(
  new URL(`src/issues.md`, import.meta.url),
  [
    "---",
    "layout: default",
    "title: Issues",
    "---",
    "",
    "# Known Issues",
    "",
    "Beside performance overhead, Aran has some known issues that may cause instrumented programs to no behave as their pre-instrumented version. Most of these issues requires fairly convoluted code to arise.",
    "",
    ...(await readdir(new URL("src/issues", import.meta.url))).map((name) => {
      const base = name.split(".")[0];
      return `- [${base}](/issues/${base}.html)`;
    }),
    "",
  ].join("\n"),
  "utf8",
);
