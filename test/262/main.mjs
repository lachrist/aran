import { spawn } from "node:child_process";
import { stdout, stderr } from "node:process";
import { cpus } from "node:os";

const {
  Math: { floor },
  undefined,
  Promise,
  Error,
} = globalThis;

/**
 * @type {(argv: string[]) => Promise<void>}
 */
const exec = (argv) =>
  new Promise((resolve, reject) => {
    const name = argv.join(" ");
    const child = spawn(
      "node",
      [
        "--experimental-vm-modules",
        "--expose-gc",
        "test/262/exec.mjs",
        ...argv,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal === null) {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`code: ${code}`));
        }
      } else {
        reject(new Error(`signal: ${signal}`));
      }
    });
    child.stdout.on("data", (data) => stdout.write(`${name} >> ${data}`));
    child.stderr.on("data", (data) => stderr.write(`${name} >> ${data}`));
  });

/**
 * @type {(
 *   stage: "bare" | "forward",
 *   membrane: "basic" | "weave" | "patch",
 * ) => string[][]}
 */
const split = (stage, membrane) => {
  const base = [
    stage,
    "--membrane",
    membrane,
    "--global-declarative-record",
    membrane === "basic" ? "builtin" : "emulate",
  ];
  return [
    [...base, "--weaving", "flexible"],
    [...base, "--weaving", "standard"],
  ];
};

/**
 * @type {string[][][]}
 */
const suite = [
  [["identity"]],
  [["parsing"]],
  [
    ...split("bare", "basic"),
    ...split("bare", "weave"),
    ...split("bare", "patch"),
  ],
  [
    ...split("forward", "basic"),
    ...split("forward", "weave"),
    ...split("forward", "patch"),
  ],
];

const CONCURRENCY = floor(cpus().length / 2);

/**
 * @type {(inputs: string[][]) => Promise<void>}
 */
const execute = (inputs) =>
  new Promise((resolve, reject) => {
    let concurrent = 0;
    let index = 0;
    const kick = () => {
      if (index < inputs.length - 1) {
        const argv = inputs[index];
        index += 1;
        if (concurrent < CONCURRENCY) {
          concurrent += 1;
          exec(argv).then(() => {
            concurrent -= 1;
            kick();
          }, reject);
          kick();
        }
      } else {
        resolve(undefined);
      }
    };
    kick();
  });

for (const inputs of suite) {
  await execute(inputs);
}
