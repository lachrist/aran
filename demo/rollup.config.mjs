import resolve from "@rollup/plugin-node-resolve";

export default [
  {
    input: "./demo/index.mjs",
    output: {
      file: "./page/demo/index.mjs",
      format: "module",
    },
    plugins: [resolve()],
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
