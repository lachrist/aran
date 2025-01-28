import resolve from "@rollup/plugin-node-resolve";
import { string } from "rollup-plugin-string";

export default [
  {
    input: "./demo/index.mjs",
    output: {
      file: "./page/demo/index.mjs",
      format: "module",
    },
    plugins: [
      resolve(),
      string({
        include: ["**/*.txt.mjs"],
      }),
    ],
  },
  {
    input: "./demo/worker.mjs",
    output: {
      file: "./page/demo/worker.mjs",
      format: "module",
    },
    plugins: [resolve()],
  },
];
