import { parse as parseYaml } from "yaml";
import { readFile } from "node:fs/promises";

// Sorting
//
// import {readFile as readFileAsync} from "fs/promises";
// const removeComment = (line) => {
//   if (line[0] === "#") {
//     if (line[1] !== " ") {
//       throw new Error("missing space");
//     }
//     return line.substring(2);
//   }
//   return line;
// };
// console.log(
//   (await readFileAsync("./yo.yml", "utf8"))
//   .split("\n")
//   .sort((line1, line2) =>
//     removeComment(line1).localeCompare(removeComment(line2))
//   ).join("\n")
// );

/**
 * @type {import("eslint").Linter.RulesRecord}
 */
export default parseYaml(
  await readFile(new URL("./rules.yaml", import.meta.url), "utf8"),
);
