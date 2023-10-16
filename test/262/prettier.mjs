import { format } from "prettier";
import { stdin, stdout, stderr } from "node:process";

const { process } = globalThis;

stdin.setEncoding("utf8");

let input = "";

stdin.on("data", (chunk) => {
  input += chunk;
});

stdin.on("end", () => {
  format(input, {
    parser: "acorn",
  }).then(
    (output) => {
      stdout.write(output, "utf8");
    },
    (error) => {
      stderr.write(error.message, "utf8");
      process.exitCode = 1;
    },
  );
});
